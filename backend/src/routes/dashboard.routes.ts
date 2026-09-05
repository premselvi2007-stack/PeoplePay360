import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware';
import { dashboardService } from '../services';

const router = Router();

// GET /api/dashboard/payroll
router.get(
  '/payroll',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const metrics = await dashboardService.getPayrollMetrics({
        periodStartDate: req.query.periodStartDate as string | undefined,
        periodEndDate: req.query.periodEndDate as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
      });
      return res.status(200).json(metrics);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
