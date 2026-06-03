import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = path.join(process.cwd(), "data-bookings.json");
const DB_REVIEWS_FILE = path.join(process.cwd(), "data-reviews.json");

// Middleware to parse helper structures
app.use(express.json());

// Helper to safely read reviews database
function readReviews(): any[] {
  try {
    if (!fs.existsSync(DB_REVIEWS_FILE)) {
      fs.writeFileSync(DB_REVIEWS_FILE, JSON.stringify([]), "utf-8");
      return [];
    }
    const data = fs.readFileSync(DB_REVIEWS_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading reviews database:", error);
    return [];
  }
}

// Helper to safely write reviews database
function writeReviews(reviews: any[]) {
  try {
    const dir = path.dirname(DB_REVIEWS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing reviews database:", error);
  }
}

// Helper to safely read database
function readBookings(): any[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([]), "utf-8");
      return [];
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading bookings database:", error);
    return [];
  }
}

// Helper to safely write database
function writeBookings(bookings: any[]) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(bookings, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing bookings database:", error);
  }
}

// Ensure database file exits on startup
readBookings();
readReviews();

const SERVICE_DURATIONS: Record<string, number> = {
  'corte-pelo': 30,
  'afeitar-navaja': 15,
  'degradado-perfilar-barba': 15,
  'combo-completo': 45,
};

function getBookingDuration(b: any): number {
  if (b.totalDuration && b.totalDuration > 0) return b.totalDuration;
  if (Array.isArray(b.services) && b.services.length > 0) {
    let sum = 0;
    for (const sId of b.services) {
      sum += SERVICE_DURATIONS[sId] || 30;
    }
    return sum > 0 ? sum : 30;
  }
  return 30;
}

// API ROUTES
app.get("/api/bookings", (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json(readBookings());
});

app.post("/api/bookings", (req, res) => {
  const newBooking = req.body;
  if (!newBooking || !newBooking.id || !newBooking.name || !newBooking.date || !newBooking.time) {
    res.status(400).json({ error: "Datos de reserva incompletos o inválidos." });
    return;
  }
  const current = readBookings();

  // Validate overlap conflict to prevent double-booking (unless admin forced/blocked)
  const isForced = newBooking.force === true || newBooking.phone === 'ORGANIZACIÓN' || (newBooking.id && newBooking.id.startsWith('block-'));
  const hasConflict = !isForced && current.some((b) => {
    if (b.id === newBooking.id) return false;
    if (b.date !== newBooking.date) return false;

    const [h1, m1] = newBooking.time.split(':').map(Number);
    const start1 = h1 * 60 + m1;
    const dur1 = getBookingDuration(newBooking);
    const end1 = start1 + dur1;

    const [h2, m2] = b.time.split(':').map(Number);
    const start2 = h2 * 60 + m2;
    const dur2 = getBookingDuration(b);
    const end2 = start2 + dur2;

    return start1 < end2 && start2 < end1;
  });

  if (hasConflict) {
    res.status(409).json({ error: "Lo sentimos, este horario ya está reservado por otro cliente. Por favor, selecciona otra hora o cambia de fecha." });
    return;
  }

  // Filter out any duplicates
  const filtered = current.filter((b) => b.id !== newBooking.id);
  const updated = [newBooking, ...filtered];
  writeBookings(updated);
  res.status(201).json(newBooking);
});

app.delete("/api/bookings/:id", (req, res) => {
  const { id } = req.params;
  const current = readBookings();
  const updated = current.filter((b) => b.id !== id);
  writeBookings(updated);
  res.json({ success: true, message: "Cita eliminada correctamente." });
});

// Reviews API Routes
app.get("/api/reviews", (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json(readReviews());
});

app.post("/api/reviews", (req, res) => {
  const newReview = req.body;
  if (!newReview || !newReview.id || !newReview.author || !newReview.rating || !newReview.comment || !newReview.date) {
    res.status(400).json({ error: "Datos de opinión incompletos." });
    return;
  }
  const current = readReviews();
  const updated = [newReview, ...current];
  writeReviews(updated);
  res.status(201).json(newReview);
});

// Vite middleware setup or Static file server
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running at http://0.0.0.0:${PORT}`);
  });
}

start();
