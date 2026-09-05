import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware';
import { employeesService } from '../services';

const router = Router();

// GET /api/employees
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const list = await employeesService.findAll(req.query as any, req.user?.role, req.user?.employeeId || undefined);
    return res.status(200).json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/employees/:id
router.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const employee = await employeesService.findOne(req.params.id, req.user?.role, req.user?.employeeId || undefined);
    return res.status(200).json(employee);
  } catch (err) {
    next(err);
  }
});

// POST /api/employees
router.post(
  '/',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const created = await employeesService.create(req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/employees/:id
router.patch(
  '/:id',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await employeesService.update(req.params.id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/employees/:id
router.delete(
  '/:id',
  authenticateJWT,
  requireRoles('ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await employeesService.remove(req.params.id);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
