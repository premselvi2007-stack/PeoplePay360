import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware';
import { payrunsService } from '../services';

const router = Router();

const PAYROLL_ROLES = ['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
const PAYROLL_MANAGER_ROLES = ['HR_PAYROLL_MANAGER', 'ADMIN'];

// GET /api/payruns
router.get('/', authenticateJWT, requireRoles(...PAYROLL_ROLES), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const list = await payrunsService.findAll(req.query.status as string | undefined);
    return res.status(200).json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/payruns/eligible-employees
router.get('/eligible-employees', authenticateJWT, requireRoles(...PAYROLL_ROLES), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await payrunsService.getEligibleEmployees(req.query as any);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/payruns/:id
router.get('/:id', authenticateJWT, requireRoles(...PAYROLL_ROLES), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payrun = await payrunsService.findOne(req.params.id);
    return res.status(200).json(payrun);
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/create-batch
router.post('/create-batch', authenticateJWT, requireRoles(...PAYROLL_ROLES), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await payrunsService.createBatch(req.body, req.user?.id);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/:id/compute
router.post('/:id/compute', authenticateJWT, requireRoles(...PAYROLL_ROLES), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await payrunsService.computePayrun(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/:id/validate
router.post('/:id/validate', authenticateJWT, requireRoles(...PAYROLL_ROLES), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await payrunsService.validatePayrun(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/:id/mark-paid
router.post('/:id/mark-paid', authenticateJWT, requireRoles(...PAYROLL_MANAGER_ROLES), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await payrunsService.markPaid(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/:id/send-payslips
router.post('/:id/send-payslips', authenticateJWT, requireRoles(...PAYROLL_MANAGER_ROLES), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await payrunsService.sendPayslips(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/payruns/:id
router.delete('/:id', authenticateJWT, requireRoles(...PAYROLL_MANAGER_ROLES), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await payrunsService.remove(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
