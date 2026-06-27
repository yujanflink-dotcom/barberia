import { Booking, Review } from "./types";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client if environment variables are available
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (supabase) {
  console.log("Supabase client initialized successfully. Connected to: ", supabaseUrl);
} else {
  console.log("Supabase environment variables not found. Using local server/localStorage as fallback.");
}

const API_URL = "/api/bookings";
const REVIEWS_API_URL = "/api/reviews";

// Safely attempts to fetch bookings from the Express server or Supabase.
export async function fetchAllBookings(): Promise<Booking[]> {
  // If Supabase is configured, use it directly (ideal for static hosts like Netlify)
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) throw error;
      if (data) {
        // Map any snake_case fields or ensure fields are aligned with Booking interface
        const bookings: Booking[] = data.map((b: any) => ({
          id: b.id,
          name: b.name,
          phone: b.phone,
          date: b.date,
          time: b.time,
          services: b.services || [],
          notes: b.notes || "",
          totalPrice: Number(b.totalPrice),
          totalDuration: Number(b.totalDuration),
          createdAt: Number(b.createdAt)
        }));
        localStorage.setItem("elbastrioui_bookings", JSON.stringify(bookings));
        return bookings;
      }
    } catch (err) {
      console.error("Error fetching bookings from Supabase:", err);
    }
  }

  // Read local bookings
  let localBookings: Booking[] = [];
  try {
    const local = localStorage.getItem("elbastrioui_bookings");
    if (local) {
      localBookings = JSON.parse(local);
    }
  } catch (e) {
    console.error("Local storage read error for sync:", e);
  }

  // Read locally deleted IDs to avoid restoring things that were intentionally deleted
  let deletedIds: string[] = [];
  try {
    const delStr = localStorage.getItem("elbastrioui_deleted_ids");
    if (delStr) {
      deletedIds = JSON.parse(delStr);
    }
  } catch (e) {
    console.error("Error reading deleted ids:", e);
  }

  try {
    const response = await fetch(`${API_URL}?t=${Date.now()}`);
    if (response.ok) {
      const serverBookings: Booking[] = await response.json();

      // Ensure localBookings are valid items and were not intentionally deleted
      const activeLocal = localBookings.filter(
        (b) => b && b.id && !deletedIds.includes(b.id)
      );

      // Find any active local bookings that are missing from the server (e.g. after server container restart)
      const missingOnServer = activeLocal.filter(
        (lb) => !serverBookings.some((sb) => sb.id === lb.id)
      );

      if (missingOnServer.length > 0) {
        console.log(`Syncing ${missingOnServer.length} bookings back to the server...`);
        await Promise.all(
          missingOnServer.map(async (booking) => {
            try {
              await fetch(API_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(booking),
              });
            } catch (err) {
              console.error("Failed to sync booking:", booking.id, err);
            }
          })
        );

        // Refetch updated list from the server now that they are restored
        const refetchRes = await fetch(`${API_URL}?t=${Date.now()}`);
        if (refetchRes.ok) {
          const finalData = await refetchRes.json();
          localStorage.setItem("elbastrioui_bookings", JSON.stringify(finalData));
          return finalData;
        }
      }

      // Sync local storage with latest server copy
      localStorage.setItem("elbastrioui_bookings", JSON.stringify(serverBookings));
      return serverBookings;
    }
  } catch (err) {
    console.warn("Backend API not reachable. Falling back to local storage...", err);
  }

  // Local storage fallback (filtering out any locally deleted bookings)
  return localBookings.filter((b) => b && b.id && !deletedIds.includes(b.id));
}

// Safely posts a new booking to the Express server or Supabase.
export async function createNewBooking(booking: Booking): Promise<Booking> {
  // If Supabase is configured, save directly to it
  if (supabase) {
    try {
      // First, check if there is a conflict for this date and time (excluding force blocks/orgs)
      const isForced = booking.phone === "ORGANIZACIÓN" || booking.id.startsWith("block-");
      if (!isForced) {
        const { data: existingBookings, error: checkError } = await supabase
          .from("reservas")
          .select("*")
          .eq("date", booking.date);

        if (!checkError && existingBookings) {
          const hasConflict = existingBookings.some((b: any) => {
            if (b.phone === "ORGANIZACIÓN" || b.id.startsWith("block-")) return false;
            // Calculate start and end times
            const [h1, m1] = booking.time.split(":").map(Number);
            const start1 = h1 * 60 + m1;
            const dur1 = booking.totalDuration || 30;
            const end1 = start1 + dur1;

            const [h2, m2] = b.time.split(":").map(Number);
            const start2 = h2 * 60 + m2;
            const dur2 = b.totalDuration || 30;
            const end2 = start2 + dur2;

            return (start1 >= start2 && start1 < end2) || (start2 >= start1 && start2 < end1);
          });

          if (hasConflict) {
            throw new Error("Este horario ya ha sido reservado. Por favor, selecciona otra hora o fecha.");
          }
        }
      }

      const { data, error } = await supabase
        .from("reservas")
        .upsert([{
          id: booking.id,
          name: booking.name,
          phone: booking.phone,
          date: booking.date,
          time: booking.time,
          services: booking.services,
          notes: booking.notes || "",
          totalPrice: booking.totalPrice,
          totalDuration: booking.totalDuration,
          createdAt: booking.createdAt
        }])
        .select();

      if (error) throw error;

      // Sync local storage
      try {
        const local = localStorage.getItem("elbastrioui_bookings");
        const bookings: Booking[] = local ? JSON.parse(local) : [];
        const updated = [booking, ...bookings.filter((b) => b.id !== booking.id)];
        localStorage.setItem("elbastrioui_bookings", JSON.stringify(updated));
      } catch {}

      return booking;
    } catch (err: any) {
      console.error("Supabase create booking failed:", err);
      throw err;
    }
  }

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

// Safely deletes a booking from the Express server or Supabase.
export async function deleteBookingById(id: string): Promise<boolean> {
  // Add to locally deleted IDs so we never restore it during sync
  try {
    const delStr = localStorage.getItem("elbastrioui_deleted_ids");
    const currentDeleted: string[] = delStr ? JSON.parse(delStr) : [];
    if (!currentDeleted.includes(id)) {
      currentDeleted.push(id);
      localStorage.setItem("elbastrioui_deleted_ids", JSON.stringify(currentDeleted));
    }
  } catch (err) {
    console.error("Error updating deleted ids in localStorage:", err);
  }

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

  // If Supabase is configured, delete directly from it
  if (supabase) {
    try {
      const { error } = await supabase
        .from("reservas")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Failed to delete booking from Supabase:", err);
    }
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

// Fetch all reviews from the backend server or Supabase
export async function fetchAllReviews(): Promise<Review[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("opiniones")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      if (data) {
        const reviews: Review[] = data;
        localStorage.setItem("elbastrioui_reviews", JSON.stringify(reviews));
        return reviews;
      }
    } catch (err) {
      console.error("Error fetching reviews from Supabase:", err);
    }
  }

  let localReviews: Review[] = [];
  try {
    const local = localStorage.getItem("elbastrioui_reviews");
    if (local) {
      localReviews = JSON.parse(local);
    }
  } catch (e) {
    console.error("Local storage reviews read error:", e);
  }

  try {
    const response = await fetch(`${REVIEWS_API_URL}?t=${Date.now()}`);
    if (response.ok) {
      const serverReviews: Review[] = await response.json();

      const missingOnServer = localReviews.filter(
        (lr) => lr && lr.id && !serverReviews.some((sr) => sr.id === lr.id)
      );

      if (missingOnServer.length > 0) {
        console.log(`Syncing ${missingOnServer.length} reviews back to the server...`);
        await Promise.all(
          missingOnServer.map(async (review) => {
            try {
              await fetch(REVIEWS_API_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(review),
              });
            } catch (err) {
              console.error("Failed to sync review:", review.id, err);
            }
          })
        );

        // Refetch to get consistent combined response
        const refetchRes = await fetch(`${REVIEWS_API_URL}?t=${Date.now()}`);
        if (refetchRes.ok) {
          const finalData = await refetchRes.json();
          localStorage.setItem("elbastrioui_reviews", JSON.stringify(finalData));
          return finalData;
        }
      }

      localStorage.setItem("elbastrioui_reviews", JSON.stringify(serverReviews));
      return serverReviews;
    }
  } catch (err) {
    console.warn("Backend API not reachable for reviews. Falling back to local storage...", err);
  }

  return localReviews;
}

// Create a new review and send it to the backend server or Supabase
export async function createNewReview(review: Review): Promise<Review> {
  try {
    const local = localStorage.getItem("elbastrioui_reviews");
    const reviews: Review[] = local ? JSON.parse(local) : [];
    const updated = [review, ...reviews.filter((r) => r.id !== review.id)];
    localStorage.setItem("elbastrioui_reviews", JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage update for reviews failed:", e);
  }

  if (supabase) {
    try {
      const { error } = await supabase
        .from("opiniones")
        .upsert([review]);
      if (error) throw error;
      return review;
    } catch (err) {
      console.error("Failed to save review in Supabase:", err);
    }
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
