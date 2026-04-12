import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload { id: string }

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) { res.status(401).json({ success: false, message: 'Token user no longer exists.' }); return; }
    if (!user.isActive) { res.status(401).json({ success: false, message: 'Account deactivated.' }); return; }
    req.user = user;
    next();
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Token expired. Please refresh.' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid token.' });
    }
  }
};

export const authorize = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Role '${req.user?.role}' is not authorized for this action.`,
      });
      return;
    }
    next();
  };
