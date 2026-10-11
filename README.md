# Nexus LMS — Enterprise Learning & Academy Management Platform

A complete, production-ready SaaS Education Management Platform engineered with a **Light-First visual identity**, strict **Server-Side Role-Based Access Control (RBAC)**, **IDOR/BOLA protection**, and automated workflows for both **Administrators** and **Students**.

---

## 🌟 Key Platform Highlights

- **Visual Design System**: Pearl White (`#F7F8FC`), Surface (`#FFFFFF`), Indigo (`#5B5FEF`), Mint (`#20B486`), and Deep Slate (`#172033`). Zero dark mode clutter, clean 8px grid spacing, soft 12px–18px border radii, modern typography (Plus Jakarta Sans).
- **Two Distinct Portals**:
  - **Admin Portal (`/admin/*`)**: Management-first console for student onboarding, course authoring, cohort batching, live session scheduling, attendance inspection, certificate issuance, analytics, and audit logging.
  - **Student Portal (`/student/*`)**: Learning-first portal with enrolled-only courses, interactive curriculum video player, one-click live session gate with automatic attendance, certificate downloads, and progress analytics.
- **Defense-in-Depth Security**:
  - Bcrypt password hashing (10 rounds)
  - Cryptographically secure single-use activation & reset tokens stored as SHA-256 hashes
  - Strict server-side identity resolution (frontend `studentId` or `userId` is never trusted)
  - Live session join gates (enrolled batch check & join window validation)
  - Rate limiting against brute-force attacks (`express-rate-limit`)
  - Helmet HTTP security headers
  - Real-time immutable audit logging (`audit_logs`)
- **Public Certificate Verification (`/verify-certificate/:certificateNumber`)**: Public credential validation displaying authentic institutional seals, student name, track, and accredited standing.
- **Interactive Email Outbox Drawer**: Built-in visual outbox drawer allowing immediate review of dispatched activation emails, reset tokens, and notifications without requiring third-party SMTP setup in development.

---

## 🏗️ Architecture Overview

```
Plot/
├── frontend/                    # React 19 + Vite Frontend (Port 5173)
│   ├── src/
│   │   ├── components/          # Reusable UI (Header, Sidebar, Modal, StatCard, Badge, Outbox Drawer)
│   │   ├── context/             # AuthContext (JWT/cookies, strict RBAC separation), ToastContext
│   │   ├── features/
│   │   │   ├── auth/            # LoginPage, ForgotPasswordPage, ResetPasswordPage, ActivateAccountPage
│   │   │   ├── admin/           # Dashboard, Students, StudentDetail, Courses, Batches, Sessions, Analytics, Calendar, Settings
│   │   │   ├── student/         # Dashboard, Courses, CoursePlayer, LiveClasses, Calendar, Progress, Certificates, Profile, Settings
│   │   │   └── verification/    # VerifyCertificatePage (Public)
│   │   ├── services/            # API client with credentials & token management
│   │   └── index.css            # Light-First CSS Design System tokens & utilities
│   └── vite.config.js           # Vite dev proxy configuration (/api -> :5000)
├── backend/                     # Express 5 + Node.js API Backend (Port 5000)
│   ├── config/                  # Environment, database, and session configurations
│   ├── database/                # Supabase PostgreSQL Connection Pool (pg), DDL schema, seeder
│   ├── repositories/            # Data access layer (Users, Students, Courses, Sessions, Attendance, Progress, etc.)
│   ├── services/                # Business logic layer (Auth, Student, Course, Session, Attendance, Progress, Certificate, Email, Audit)
│   ├── controllers/             # HTTP controller handlers
│   ├── middleware/              # Auth JWT verification, RBAC guards, Rate limiter, Error handling
│   ├── routes/                  # Express route definitions (/api/auth, /api/admin, /api/student, /api/verify-certificate)
│   └── server.js                # App entry point
├── scripts/
│   ├── dev.js                   # Dual-process runner (npm run dev)
│   └── test_system.js           # Automated 18-step QA verification suite (18/18 PASS)
├── .env                         # Centralized environment variables (Supabase PostgreSQL URL)
└── package.json                 # Project scripts and dependencies
```

---

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 3. Running Locally
Start both backend (port 5000) and frontend (port 5173) simultaneously:
```bash
npm run dev
```

Visit the application in your browser:
- **Web App**: [http://localhost:5173](http://localhost:5173)
- **API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 4. Running the Automated QA Suite
```bash
node scripts/test_system.js
```
*Executes all 18 test cases covering authentication, student creation, activation flow, RBAC security, progress recalculation, session join authorization, and public certificate verification.*

---

## 🔒 Security & Data Integrity

1. **Role-Based Access Control (RBAC)**: All endpoints in `/api/admin/*` require `ADMIN` role. Students attempting to invoke administrative endpoints receive `403 Forbidden` with audit logging.
2. **IDOR / BOLA Prevention**: In the Student Portal, user identity is always extracted from the authenticated server-side context (`req.user.id`). Query parameter manipulation (e.g. `?studentId=...`) is strictly prohibited.
3. **Session Join Verification**: `GET /api/student/sessions/:sessionId/join` verifies that:
   - The student is in active academic standing
   - The student is enrolled in the session's specific course and cohort batch
   - The current time is within the configured join window (e.g., 15 minutes before broadcast start)
   - Verified attendance is automatically recorded on join.
4. **Account Activation Flow**: Administrators create student accounts without passwords. A cryptographically secure token is dispatched to the student's email. The student opens `/activate-account/:token` to establish their password.

---

## 📜 Public Certificate Verification
Public verification URL format:
```
http://localhost:5173/verify-certificate/:certificateNumber
```
Example test credential:
```
http://localhost:5173/verify-certificate/CERT-2026-9842
```
Displays official institutional verification with tamper-proof status, recipient name, course track, and honors standing.
