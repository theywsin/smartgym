import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "خطای غیرمنتظره در سرور رخ داده است.";
  
  console.error(`[Error Handler] ${req.method} ${req.url} - Error:`, err);
  
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors: err.errors || [err.message]
  });
}
