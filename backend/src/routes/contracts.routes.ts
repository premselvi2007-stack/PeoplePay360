import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware';
import { contractsService } from '../services';

const router = Router();

router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const list = await contractsService.findAll(req.query.employeeId as string, req.query.status as string);
    return res.status(200).json(list);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const contract = await contractsService.findOne(req.params.id);
    return res.status(200).json(contract);
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
      const created = await contractsService.create(req.body);
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
      const updated = await contractsService.update(req.params.id, req.body);
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
      const deleted = await contractsService.remove(req.params.id);
      return res.status(200).json(deleted);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
