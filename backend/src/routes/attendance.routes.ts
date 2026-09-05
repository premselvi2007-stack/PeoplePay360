import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware';
import { attendanceService } from '../services';

const router = Router();

// GET /api/attendance
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const list = await attendanceService.findAll({
      employeeId: req.query.employeeId as string,
      search: req.query.search as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      status: req.query.status as string,
      userRole: req.user?.role,
      userEmployeeId: req.user?.employeeId || undefined,
    });
    return res.status(200).json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/today
router.get('/today', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.employeeId) {
      return res.status(403).json({ statusCode: 403, message: 'User is not linked to an employee profile' });
    }
    const status = await attendanceService.getTodayStatus(req.user.employeeId);
    return res.status(200).json(status);
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/check-in
router.post('/check-in', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const targetEmpId =
      req.user?.role === 'EMPLOYEE' || !req.body.employeeId ? req.user?.employeeId : req.body.employeeId;
    if (!targetEmpId) {
      return res.status(403).json({ statusCode: 403, message: 'No employee ID resolved' });
    }
    const result = await attendanceService.checkIn(targetEmpId, req.body.timestamp);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/check-out
router.post('/check-out', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const targetEmpId =
      req.user?.role === 'EMPLOYEE' || !req.body.employeeId ? req.user?.employeeId : req.body.employeeId;
    if (!targetEmpId) {
      return res.status(403).json({ statusCode: 403, message: 'No employee ID resolved' });
    }
    const result = await attendanceService.checkOut(targetEmpId, req.body.timestamp);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/manual-correction
router.post(
  '/manual-correction',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await attendanceService.manualCorrection(
        req.body.employeeId,
        req.body.correction,
        req.user!.id,
      );
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
