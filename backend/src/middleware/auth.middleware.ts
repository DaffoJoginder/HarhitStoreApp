import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import prisma from '../utils/prisma';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & {
        businessId?: string;
        businessStatus?: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        b2bBusiness: true
      }
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: 'User not found or inactive'
      });
    }

    // For B2B users, check if account is approved
    if (user.accountType === 'b2b') {
      if (!user.b2bBusiness) {
        return res.status(401).json({
          status: 'error',
          message: 'Business account not found'
        });
      }
      
      if (user.b2bBusiness.accountStatus !== 'approved') {
        return res.status(403).json({
          status: 'error',
          message: `Business account is ${user.b2bBusiness.accountStatus}. Cannot access.`
        });
      }
    }

    req.user = {
      ...decoded,
      businessId: user.b2bBusiness?.id,
      businessStatus: user.b2bBusiness?.accountStatus
    };

    next();
  } catch (error: any) {
    return res.status(401).json({
      status: 'error',
      message: error.message || 'Invalid token'
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.accountType !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  next();
};

export const requireB2B = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.accountType !== 'b2b') {
    return res.status(403).json({
      status: 'error',
      message: 'B2B account required'
    });
  }
  next();
};

export const requireB2C = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.accountType !== 'b2c') {
    return res.status(403).json({
      status: 'error',
      message: 'B2C account required'
    });
  }
  next();
};

