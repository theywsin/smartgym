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
app.use(cors());

// Request Parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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
