import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware';
import { salaryRulesService } from '../services';

const router = Router();

router.get(
  '/',
  authenticateJWT,
  requireRoles('HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const list = await salaryRulesService.findAll(req.query.salaryStructureId as string | undefined);
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
      const item = await salaryRulesService.findOne(req.params.id);
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
      const created = await salaryRulesService.create(req.body);
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
      const updated = await salaryRulesService.update(req.params.id, req.body);
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
      const deleted = await salaryRulesService.remove(req.params.id);
      return res.status(200).json(deleted);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/test-sandbox',
  authenticateJWT,
  requireRoles('HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await salaryRulesService.testCalculation(req.body);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
