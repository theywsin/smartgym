import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/auth";

// Extend Request interface to hold auth details
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: "عدم احراز هویت. توکن ورود معتبر ارسال نشده است."
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({
      success: false,
      message: "توکن نامعتبر یا منقضی شده است."
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "ابتدا باید وارد حساب کاربری خود شوید."
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "دسترسی غیرمجاز. شما سطح دسترسی مورد نیاز را ندارید."
      });
      return;
    }

    next();
  };
}
