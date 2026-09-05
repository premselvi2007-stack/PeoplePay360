import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware';
import { usersService } from '../services';

const router = Router();

// GET /api/users
router.get(
  '/',
  authenticateJWT,
  requireRoles('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const list = await usersService.findAll();
      return res.status(200).json(list);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/users/:id
router.get(
  '/:id',
  authenticateJWT,
  requireRoles('ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await usersService.findOne(req.params.id);
      return res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/users/:id/role
router.patch(
  '/:id/role',
  authenticateJWT,
  requireRoles('ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await usersService.updateRole(req.params.id, req.body.role);
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/users/:id/toggle-active
router.patch(
  '/:id/toggle-active',
  authenticateJWT,
  requireRoles('ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await usersService.toggleActive(req.params.id);
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
