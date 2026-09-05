import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware';
import { timeOffService } from '../services';

const router = Router();

// ================= TYPES =================
router.get('/types', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const list = await timeOffService.getTypes();
    return res.status(200).json(list);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/types',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const created = await timeOffService.createType(req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/types/:id',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await timeOffService.updateType(req.params.id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

// ================= ALLOCATIONS =================
router.get('/allocations', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const list = await timeOffService.getAllocations(
      req.query.employeeId as string,
      req.user?.role,
      req.user?.employeeId || undefined,
    );
    return res.status(200).json(list);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/allocations',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const created = await timeOffService.createAllocation(req.body, req.user!.id);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/allocations/:id/approve',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const approved = await timeOffService.approveAllocation(req.params.id, req.user!.id);
      return res.status(200).json(approved);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/allocations/:id/refuse',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const refused = await timeOffService.refuseAllocation(req.params.id);
      return res.status(200).json(refused);
    } catch (err) {
      next(err);
    }
  },
);

router.get('/balances/:employeeId', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role === 'EMPLOYEE' && req.user?.employeeId !== req.params.employeeId) {
      return res.status(403).json({ statusCode: 403, message: 'Cannot view leave balances of other employees' });
    }
    const balances = await timeOffService.getEmployeeBalances(req.params.employeeId);
    return res.status(200).json(balances);
  } catch (err) {
    next(err);
  }
});

// ================= REQUESTS =================
router.get('/requests', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const list = await timeOffService.getRequests(
      req.query.employeeId as string,
      req.query.status as string,
      req.user?.role,
      req.user?.employeeId || undefined,
    );
    return res.status(200).json(list);
  } catch (err) {
    next(err);
  }
});

router.post('/requests', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const targetEmpId =
      req.user?.role === 'EMPLOYEE' || !req.body.employeeId ? req.user?.employeeId : req.body.employeeId;
    if (!targetEmpId) {
      return res.status(403).json({ statusCode: 403, message: 'No employee ID associated' });
    }
    const created = await timeOffService.createRequest({ ...req.body, employeeId: targetEmpId });
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/requests/:id/approve',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const approved = await timeOffService.approveRequest(req.params.id, req.user!.id);
      return res.status(200).json(approved);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/requests/:id/refuse',
  authenticateJWT,
  requireRoles('HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const refused = await timeOffService.refuseRequest(req.params.id, req.body.refusalReason);
      return res.status(200).json(refused);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
