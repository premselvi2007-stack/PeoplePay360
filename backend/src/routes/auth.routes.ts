import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-hackathon-secure-super-jwt-secret-key-2026';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ statusCode: 400, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
      include: {
        employee: {
          include: {
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ statusCode: 401, message: 'Email or password is incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ statusCode: 401, message: 'Email or password is incorrect' });
    }

    if (!user.isActive) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Your account has been deactivated. Contact HR/Admin.',
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ statusCode: 400, message: 'Email and password are required' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (existing) {
      return res.status(409).json({
        statusCode: 409,
        message: 'User with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const validRole = role || 'EMPLOYEE';

    const newUser = await prisma.user.create({
      data: {
        email: String(email).toLowerCase().trim(),
        passwordHash,
        role: validRole,
        isActive: true,
      },
      include: {
        employee: {
          include: {
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      employeeId: newUser.employeeId,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    return res.status(201).json({
      accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        employeeId: newUser.employeeId,
        employee: newUser.employee,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        employee: {
          include: {
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ statusCode: 404, message: 'User profile not found' });
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      employee: user.employee,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('jwt');
  return res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
