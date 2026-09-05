# PeoplePay360 - Integrated HR & Payroll Operations Platform

PeoplePay360 is a comprehensive, production-grade Human Resources and Payroll Operations platform built for the **Odoo Hackathon '26**. It seamlessly links workforce master records, working schedules, daily attendance logs, and time-off allocations to a secure salary calculation rule engine that generates validated payruns and PDF payslips.

---

## 🚀 Key Features

- **Workforce Master Data & Organizational Directory**:
  - Full Employee lifecycle management (Active, On Leave, Terminated, Draft).
  - Department and Job Position hierarchies with salary bands.
  - Contract management supporting full-time, part-time, contractor, and intern models.
- **Time & Attendance Tracking**:
  - Quick punch-in / punch-out with geostamp/timestamp capture.
  - Automatic work hours calculation, overtime tracking, and manual correction audit trails.
- **Time Off & Leave Management**:
  - Configurable leave types (Paid Vacation, Sick Leave, Unpaid Leave).
  - Leave allocation workflows, balance tracking, and manager approval gates.
- **Deterministic Payroll Rule Engine**:
  - Safe mathematical expression evaluator without `eval()` or code execution vulnerabilities.
  - Sequenced rule categories (Basic, Allowances, Gross, Deductions, Net).
  - Dynamic variable context (`WAGE`, `worked_days`, `unpaid_leave_days`, etc.).
- **Batch Payrun Lifecycle**:
  - Wizard-guided batch creation with contract validity filtering.
  - Pre-computation validation against blocking errors (e.g. missing bank accounts, unassigned contracts).
  - Multi-status transitions: `DRAFT` → `COMPUTED` → `VALIDATED` → `PAID`.
- **Automated Payslip & PDF Generation**:
  - Official A4 formatted payslips generated via PDFKit with breakdown lines and company headers.
  - Email dispatching via Nodemailer.
- **Security & Role-Based Access Control (RBAC)**:
  - Multi-tier roles: `EMPLOYEE`, `HR_MANAGER`, `HR_PAYROLL_USER`, `HR_PAYROLL_MANAGER`, `ADMIN`.
  - JWT token authentication, bcrypt password hashing, and resource-level authorization (IDOR protection).
- **Modern UI & UX**:
  - Neo-brutalist design with high contrast, responsive layouts, and full Light/Dark mode.

---

## 🛠️ Technology Stack

- **Backend**: NestJS 10.3, TypeScript, Prisma ORM, SQLite / PostgreSQL, Passport JWT, PDFKit, Nodemailer.
- **Frontend**: React 18, Vite 5, TypeScript, TailwindCSS 3, TanStack React Query, Recharts, Lucide Icons.

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/premselvi2007-stack/PeoplePay360.git
cd PeoplePay360

# Install backend dependencies
cd backend
npm install
cp .env.example .env
npx prisma db push
npm run prisma:seed
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Running Locally

```bash
# In one terminal: run backend
cd backend
npm run start:dev

# In another terminal: run frontend
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:3000/api`.

---

## 👥 Default Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@peoplepay360.com` | `password123` |
| **HR Payroll Manager** | `payroll.manager@peoplepay360.com` | `password123` |
| **HR Payroll User** | `payroll.user@peoplepay360.com` | `password123` |
| **HR Manager** | `hr.manager@peoplepay360.com` | `password123` |
| **Employee** | `marcus.vance@peoplepay360.com` | `password123` |
