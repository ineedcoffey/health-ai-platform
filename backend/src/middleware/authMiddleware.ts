import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

// ============================================================================
// JWT Authentication Middleware
// Validates token, checks expiry (1h — SDD Section 7), and verifies account status
// ============================================================================
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized: No token provided." });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: string;
      iat: number;
      exp: number;
    };

    // Verify the user still exists and is active (handles suspended accounts)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, is_active: true }
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User no longer exists." });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Your account has been suspended. Please contact support." });
    }

    // Attach user info to request
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    return res.status(403).json({ message: "Forbidden: Invalid token." });
  }
};

// ============================================================================
// Role-Based Access Control (RBAC) Middleware
// Restricts route access to specific roles
// ============================================================================
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: You don't have the required role." });
    }
    next();
  };
};