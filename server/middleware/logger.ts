import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    // Production safe, elegant logging
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - ${duration}ms`);
  });
  next();
}
