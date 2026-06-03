import { Booking, Review } from "./types";

const API_URL = "/api/bookings";
const REVIEWS_API_URL = "/api/reviews";

// Safely attempts to fetch bookings from the Express server.
// Falls back to localStorage if the API endpoint isn't ready or fails.
export async function fetchAllBookings(): Promise<Booking[]> {
  try {
    const response = await fetch(`${API_URL}?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      // Sync local storage with latest server copy
      localStorage.setItem("elbastrioui_bookings", JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("Backend API not reachable. Falling back to local storage...", err);
  }

  // Local storage fallback
  try {
    const local = localStorage.getItem("elbastrioui_bookings");
    return local ? JSON.parse(local) : [];
  } catch (e) {
    console.error("Local storage read error:", e);
    return [];
  }
}

// Safely posts a new booking to the Express server and updates localStorage.
export async function createNewBooking(booking: Booking): Promise<Booking> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(booking),
    });

    if (response.ok) {
      const saved = await response.json();
      // Sync local storage on successful server commit
      try {
        const local = localStorage.getItem("elbastrioui_bookings");
        const bookings: Booking[] = local ? JSON.parse(local) : [];
        const updated = [saved, ...bookings.filter((b) => b.id !== saved.id)];
        localStorage.setItem("elbastrioui_bookings", JSON.stringify(updated));
      } catch (le) {
        console.error("Failed to update local storage:", le);
      }
      return saved;
    } else {
      // Decode potential JSON error message from the backend
      let msg = "Error al confirmar la reserva.";
      try {
        const errData = await response.json();
        if (errData && errData.error) {
          msg = errData.error;
        }
      } catch {}
      throw new Error(msg);
    }
  } catch (err: any) {
    // If it's a structural conflict or payload error thrown by the fetch block, bubble it up directly to UI
    if (err.message && (err.message.includes("reservado") || err.message.includes("Error") || err.message.includes("incompletos"))) {
      throw err;
    }

    // Otherwise, handle network offline/unreachable conditions gracefully with fallback
    console.warn("Could not synchronize with database server. Saved locally inside browser.", err);
    try {
      const local = localStorage.getItem("elbastrioui_bookings");
      const bookings: Booking[] = local ? JSON.parse(local) : [];
      const updated = [booking, ...bookings.filter((b) => b.id !== booking.id)];
      localStorage.setItem("elbastrioui_bookings", JSON.stringify(updated));
    } catch (e) {
      console.error("Local storage fallback write failed:", e);
    }
    return booking;
  }
}

// Safely deletes a booking from the Express server and updates localStorage.
export async function deleteBookingById(id: string): Promise<boolean> {
  let deletedLocally = false;
  try {
    const local = localStorage.getItem("elbastrioui_bookings");
    if (local) {
      const bookings: Booking[] = JSON.parse(local);
      const filtered = bookings.filter((b) => b.id !== id);
      localStorage.setItem("elbastrioui_bookings", JSON.stringify(filtered));
      deletedLocally = true;
    }
  } catch (err) {
    console.error("Local storage delete failed:", err);
  }

  // Synchronize with server
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      return true;
    }
  } catch (err) {
    console.warn("Could not synchronize cancellation with database server.", err);
  }

  return deletedLocally;
}

// Fetch all reviews from the backend server
export async function fetchAllReviews(): Promise<Review[]> {
  try {
    const response = await fetch(`${REVIEWS_API_URL}?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("elbastrioui_reviews", JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("Backend API not reachable for reviews. Falling back to local storage...", err);
  }

  try {
    const local = localStorage.getItem("elbastrioui_reviews");
    return local ? JSON.parse(local) : [];
  } catch (e) {
    return [];
  }
}

// Create a new review and send it to the backend server
export async function createNewReview(review: Review): Promise<Review> {
  try {
    const local = localStorage.getItem("elbastrioui_reviews");
    const reviews: Review[] = local ? JSON.parse(local) : [];
    const updated = [review, ...reviews.filter((r) => r.id !== review.id)];
    localStorage.setItem("elbastrioui_reviews", JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage update for reviews failed:", e);
  }

  try {
    const response = await fetch(REVIEWS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(review),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Could not save review on server. Saved locally within browser.", err);
  }

  return review;
}
