import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.status || err.statusCode || 500;
  if (statusCode >= 500) {
    console.error(`[Error Handler] ${req.method} ${req.originalUrl} - Error:`, err);
  } else {
    console.warn(`[HTTP ${statusCode}] ${req.method} ${req.originalUrl} - ${err.message}`);
  }

  // Never leak internal error details (SQL errors, stack traces) for server errors.
  const expose = statusCode < 500 || err.expose === true;
  const message = expose && err.message ? err.message : "خطای غیرمنتظره در سرور رخ داده است.";

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors: [message],
  });
}

export class HttpError extends Error {
  status: number;
  expose = true;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
