import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-hackathon-secure-super-jwt-secret-key-2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  employeeId?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  // Extract from Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Fallback to cookie
  if (!token && req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({
      statusCode: 401,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      message: 'Unauthorized',
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: payload.sub || payload.id,
      email: payload.email,
      role: payload.role,
      employeeId: payload.employeeId,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      statusCode: 401,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      message: 'Invalid or expired token',
    });
  }
}

export function requireRoles(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Forbidden resource: insufficient permissions',
      });
    }

    next();
  };
}
