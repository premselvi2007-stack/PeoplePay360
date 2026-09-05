import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware';
import { reportsService } from '../services';

const router = Router();

// GET /api/reports/payroll
router.get(
  '/payroll',
  authenticateJWT,
  requireRoles('HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const report = await reportsService.getPayrollSummaryReport(
        req.query.startDate as string | undefined,
        req.query.endDate as string | undefined,
      );
      return res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/reports/attendance
router.get(
  '/attendance',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const report = await reportsService.getAttendanceReport(req.query.month as string | undefined);
      return res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
