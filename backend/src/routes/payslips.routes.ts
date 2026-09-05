import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.middleware';
import { payslipsService } from '../services';

const router = Router();

// GET /api/payslips
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const list = await payslipsService.findAll(req.query as any, req.user?.role, req.user?.employeeId || undefined);
    return res.status(200).json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/payslips/:id
router.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payslip = await payslipsService.findOne(req.params.id, req.user?.role, req.user?.employeeId || undefined);
    return res.status(200).json(payslip);
  } catch (err) {
    next(err);
  }
});

// GET /api/payslips/:id/pdf
router.get('/:id/pdf', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pdfBuffer = await payslipsService.getPdfBuffer(req.params.id, req.user?.role, req.user?.employeeId || undefined);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="payslip-${req.params.id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

export default router;
