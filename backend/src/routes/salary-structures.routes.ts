import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware';
import { salaryStructuresService } from '../services';

const router = Router();

router.get(
  '/',
  authenticateJWT,
  requireRoles('HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const list = await salaryStructuresService.findAll();
      return res.status(200).json(list);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id',
  authenticateJWT,
  requireRoles('HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const item = await salaryStructuresService.findOne(req.params.id);
      return res.status(200).json(item);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/',
  authenticateJWT,
  requireRoles('HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const created = await salaryStructuresService.create(req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/:id',
  authenticateJWT,
  requireRoles('HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await salaryStructuresService.update(req.params.id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:id',
  authenticateJWT,
  requireRoles('HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const deleted = await salaryStructuresService.remove(req.params.id);
      return res.status(200).json(deleted);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
