import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectPrisma } from './prisma';

// Route imports
import authRoutes from './routes/auth.routes';
import attendanceRoutes from './routes/attendance.routes';
import contractsRoutes from './routes/contracts.routes';
import departmentsRoutes from './routes/departments.routes';
import employeesRoutes from './routes/employees.routes';
import jobPositionsRoutes from './routes/job-positions.routes';
import salaryRulesRoutes from './routes/salary-rules.routes';
import salaryStructuresRoutes from './routes/salary-structures.routes';
import schedulesRoutes from './routes/schedules.routes';
import timeOffRoutes from './routes/time-off.routes';
import payrunsRoutes from './routes/payruns.routes';
import payslipsRoutes from './routes/payslips.routes';
import reportsRoutes from './routes/reports.routes';
import dashboardRoutes from './routes/dashboard.routes';
import usersRoutes from './routes/users.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// ── Core Middleware ─────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [process.env.CORS_ORIGIN || 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/job-positions', jobPositionsRoutes);
app.use('/api/salary-rules', salaryRulesRoutes);
app.use('/api/salary-structures', salaryStructuresRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/time-off', timeOffRoutes);
app.use('/api/payruns', payrunsRoutes);
app.use('/api/payslips', payslipsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global Error Handler ────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);

  // Handle Prisma known errors
  if (err.code === 'P2025') {
    return res.status(404).json({ statusCode: 404, message: 'Record not found' });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ statusCode: 409, message: 'A record with this value already exists' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  return res.status(statusCode).json({ statusCode, message });
});

// ── Start Server ────────────────────────────────────────────────────────────
async function bootstrap() {
  await connectPrisma();
  app.listen(PORT, () => {
    console.log(`🚀 PeoplePay360 Backend (Express) running on: http://localhost:${PORT}/api`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
