import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload, AuthRole } from "../utils/auth";

// Extend Request interface to hold auth details
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

function readToken(req: Request): string | null {
  const authHeader = req.headers["authorization"];
  if (!authHeader || typeof authHeader !== "string") return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

/** Attaches req.user when a valid token is present; never rejects. */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = readToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = readToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: "عدم احراز هویت. لطفاً ابتدا وارد حساب کاربری شوید.",
    });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.",
    });
  }
}

export function requireRole(allowedRoles: AuthRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "ابتدا باید وارد حساب کاربری خود شوید." });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "دسترسی غیرمجاز. شما سطح دسترسی مورد نیاز را ندارید." });
      return;
    }
    next();
  };
}
