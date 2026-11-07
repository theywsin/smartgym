import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import { requestLogger } from "./server/middleware/logger";
import { errorHandler } from "./server/middleware/error";
import apiRouter from "./server/routes/api";

dotenv.config();

const app = express();
const PORT = 3000;

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Essential to allow preview frame in AI Studio
    crossOriginEmbedderPolicy: false,
  })
);
// The SPA is served from the same origin, so cross-origin API calls are off unless
// CORS_ORIGIN lists the allowed origins (comma-separated).
const corsOrigins = (process.env.CORS_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean);
if (corsOrigins.length > 0) {
  app.use(cors({ origin: corsOrigins }));
}

// Behind cPanel/Passenger or Nginx: trust the first proxy so rate limits see the client IP.
app.set("trust proxy", 1);

// Request Parsing (logos and blog images are sent as data URLs, hence the 10 MB cap)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Liveness check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Request Logger
app.use(requestLogger);

// API Routes
app.use("/api", apiRouter);

// Serve Static or Dev server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode (Vite Middleware enabled)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Centralized Error Handler (must be registered last)
  app.use(errorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartGym Server is running on http://localhost:${PORT}`);
  });
}

startServer();
