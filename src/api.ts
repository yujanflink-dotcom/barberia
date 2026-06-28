import { Booking, Review } from "./types";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client if environment variables are available
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

let supabaseClient = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    // Validate basic URL format before initializing to prevent Supabase JS from throwing during load
    if (supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://")) {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      console.warn("La URL de Supabase no es válida. Debe comenzar con http:// o https://");
    }
  } catch (err) {
    console.error("Error crítico al inicializar el cliente de Supabase:", err);
  }
}

export const supabase = supabaseClient;

if (supabase) {
  console.log("Supabase client initialized successfully. Connected to: ", supabaseUrl);
} else {
  console.log("Supabase environment variables not found. Using local server/localStorage as fallback.");
}

const API_URL = "/api/bookings";
const REVIEWS_API_URL = "/api/reviews";

// Safely attempts to fetch bookings from the Express server or Supabase.
function parseServices(servicesField: any): string[] {
  if (!servicesField) return [];
  if (Array.isArray(servicesField)) return servicesField;
  if (typeof servicesField === "string") {
    const trimmed = servicesField.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    // PostgreSQL array format: {corte,barba}
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return trimmed.slice(1, -1).split(",").map(s => s.trim()).filter(Boolean);
    }
    // Simple comma-separated list
    return trimmed.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export async function fetchAllBookings(): Promise<Booking[]> {
  // If Supabase is configured, use it directly (ideal for static hosts like Netlify)
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("reservas")
        .select("*");

      if (error) throw error;
      if (data) {
        // Map any snake_case, camelCase or Spanish fields and ensure they align with the Booking interface
        const bookings: Booking[] = data.map((b: any) => {
          let createdAtVal = Date.now();
          if (b.created_at !== undefined && b.created_at !== null) {
            if (typeof b.created_at === 'string') {
              const parsedDate = new Date(b.created_at).getTime();
              createdAtVal = !isNaN(parsedDate) ? parsedDate : Date.now();
            } else if (typeof b.created_at === 'number') {
              createdAtVal = b.created_at;
            }
          } else if (b.createdAt !== undefined && b.createdAt !== null) {
            createdAtVal = Number(b.createdAt);
          }

          const rawServices = b.servicios !== undefined ? b.servicios : (b.services || []);

          return {
            id: b.id || "",
            name: b.nombre ?? b.name ?? "",
            phone: b.telefono ?? b.phone ?? "",
            date: b.fecha ?? b.date ?? "",
            time: b.hora ?? b.time ?? "",
            services: parseServices(rawServices),
            notes: b.notas ?? b.notes ?? "",
            totalPrice: Number(b.precio_total ?? b.total_price ?? b.totalPrice ?? 0),
            totalDuration: Number(b.duracion_total ?? b.total_duration ?? b.totalDuration ?? 0),
            createdAt: createdAtVal
          };
        });

        // Sort by createdAt descending in-memory to avoid DB-level column exceptions
        bookings.sort((a, b) => b.createdAt - a.createdAt);

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
        let existingBookings: any[] = [];
        let queryError: any = null;

        // Try querying using Spanish schema 'fecha' first
        try {
          const { data, error } = await supabase
            .from("reservas")
            .select("*")
            .eq("fecha", booking.date);
          if (!error && data) {
            existingBookings = data;
          } else {
            queryError = error;
          }
        } catch (e) {
          queryError = e;
        }

        // Try querying using English schema 'date' as a fallback if the first failed or returned nothing
        if (existingBookings.length === 0 || queryError) {
          try {
            const { data, error } = await supabase
              .from("reservas")
              .select("*")
              .eq("date", booking.date);
            if (!error && data) {
              existingBookings = data;
            }
          } catch {}
        }

        if (existingBookings && existingBookings.length > 0) {
          const hasConflict = existingBookings.some((b: any) => {
            const bPhone = b.telefono !== undefined ? b.telefono : b.phone;
            const bId = b.id || "";
            const bTime = b.hora !== undefined ? b.hora : b.time;
            const bDuration = b.duracion_total !== undefined ? b.duracion_total : (b.total_duration !== undefined ? b.total_duration : (b.totalDuration || 30));

            // Calculate start and end times for the client's booking
            // Treat all client bookings as taking exactly 30 minutes (1 slot/square) for conflict calculations, 
            // so we don't block adjacent hours due to service duration.
            const timeToSplit = booking.time || "00:00";
            const [h1, m1] = timeToSplit.split(":").map(Number);
            const start1 = h1 * 60 + (m1 || 0);
            const dur1 = 30; 
            const end1 = start1 + dur1;

            if (!bTime || typeof bTime !== "string") return false;
            const [h2, m2] = bTime.split(":").map(Number);
            const start2 = h2 * 60 + (m2 || 0);
            
            // If the existing booking is a blockage, it keeps its full duration (e.g., block-full, etc.), otherwise 30 minutes
            const isBForced = bPhone === "ORGANIZACIÓN" || bId.startsWith("block-");
            const dur2 = isBForced ? (bDuration || 30) : 30;
            const end2 = start2 + dur2;

            return (start1 >= start2 && start1 < end2) || (start2 >= start1 && start2 < end1);
          });

          if (hasConflict) {
            throw new Error("Este horario ya ha sido reservado. Por favor, selecciona otra hora o fecha.");
          }
        }
      }      // Try standard Spanish schema (most common for this user setup)
      let primaryError: any = null;
      let saveError: any = null;
      let savedSuccessfully = false;

      try {
        const spanishPayload: any = {
          id: booking.id,
          nombre: booking.name,
          telefono: booking.phone,
          fecha: booking.date,
          hora: booking.time,
          servicios: booking.services,
          notas: booking.notes || "",
          precio_total: booking.totalPrice,
          duracion_total: booking.totalDuration,
          created_at: new Date(booking.createdAt).toISOString()
        };

        const { error: err } = await supabase
          .from("reservas")
          .upsert([spanishPayload]);

        if (!err) {
          savedSuccessfully = true;
        } else {
          primaryError = err;
          saveError = err;
        }
      } catch (err) {
        primaryError = err;
        saveError = err;
      }

      // If that failed, try standard snake_case schema (English)
      if (!savedSuccessfully) {
        try {
          const snakePayload: any = {
            id: booking.id,
            name: booking.name,
            phone: booking.phone,
            date: booking.date,
            time: booking.time,
            services: booking.services,
            notes: booking.notes || "",
            total_price: booking.totalPrice,
            total_duration: booking.totalDuration,
            created_at: new Date(booking.createdAt).toISOString()
          };

          const { error: err } = await supabase
            .from("reservas")
            .upsert([snakePayload]);

          if (!err) {
            savedSuccessfully = true;
          } else {
            saveError = err;
          }
        } catch (err) {
          saveError = err;
        }
      }

      // If that failed, try camelCase schema (if they manually created camelCase columns)
      if (!savedSuccessfully) {
        try {
          const camelPayload: any = {
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
          };

          const { error: err } = await supabase
            .from("reservas")
            .upsert([camelPayload]);

          if (!err) {
            savedSuccessfully = true;
          } else {
            saveError = err;
          }
        } catch (err) {
          saveError = err;
        }
      }

      // If all failed, try a minimalist payload with only core fields that are guaranteed to exist
      if (!savedSuccessfully) {
        try {
          console.warn("Attempting minimalist database save fallback due to schema mismatch:", saveError);
          const minimalPayload: any = {
            id: booking.id,
            name: booking.name,
            phone: booking.phone,
            date: booking.date,
            time: booking.time,
            services: booking.services,
            notes: booking.notes || ""
          };

          const { error: err } = await supabase
            .from("reservas")
            .upsert([minimalPayload]);

          if (!err) {
            savedSuccessfully = true;
          } else {
            saveError = err;
          }
        } catch (err) {
          saveError = err;
        }
      }

      // If all database attempts failed, throw the primary error (Spanish schema) or the last received error
      if (!savedSuccessfully) {
        const finalError = primaryError || saveError;
        if (finalError) {
          // If it is a uuid parsing error, make it user-friendly
          if (finalError.message && finalError.message.includes("uuid")) {
            throw new Error("Error de base de datos: El identificador de la reserva no coincide con el tipo UUID de la tabla. Por favor, asegúrate de recrear la tabla utilizando TEXT como tipo para la columna ID.");
          }
          throw finalError;
        }
      }

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
        .select("*");

      if (error) throw error;
      if (data) {
        const reviews: Review[] = data.map((r: any) => ({
          id: r.id || Math.random().toString(36).substring(2, 9),
          author: r.author !== undefined && r.author !== null ? r.author : (r.autor !== undefined && r.autor !== null ? r.autor : (r.nombre !== undefined && r.nombre !== null ? r.nombre : "Anónimo")),
          rating: Number(r.rating !== undefined && r.rating !== null ? r.rating : (r.puntuacion !== undefined && r.puntuacion !== null ? r.puntuacion : (r.valoracion !== undefined && r.valoracion !== null ? r.valoracion : 5))),
          comment: r.comment !== undefined && r.comment !== null ? r.comment : (r.comentario !== undefined && r.comentario !== null ? r.comentario : (r.mensaje !== undefined && r.mensaje !== null ? r.mensaje : "")),
          date: r.date !== undefined && r.date !== null ? r.date : (r.fecha !== undefined && r.fecha !== null ? r.fecha : "")
        }));

        // Sort by date descending in-memory
        reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
