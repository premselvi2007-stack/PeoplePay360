import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware';
import { departmentsService } from '../services';

const router = Router();

router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const list = await departmentsService.findAll();
    return res.status(200).json(list);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const dept = await departmentsService.findOne(req.params.id);
    return res.status(200).json(dept);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const created = await departmentsService.create(req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/:id',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await departmentsService.update(req.params.id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:id',
  authenticateJWT,
  requireRoles('ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const deleted = await departmentsService.remove(req.params.id);
      return res.status(200).json(deleted);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
