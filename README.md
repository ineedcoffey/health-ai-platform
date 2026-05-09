<div align="center">

# ⚕️ Health AI — Co-Creation & Innovation Platform

**Connecting Healthcare Professionals with Engineers to Build the Future of Health Technology**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📋 About

Health AI is a **full-stack web platform** that bridges the gap between healthcare professionals (doctors, nurses, clinical researchers) and engineers (software, biomedical, data scientists) to foster **interdisciplinary collaboration** in health technology innovation.

The platform enables users to publish project ideas, discover collaboration opportunities, request meetings with potential partners, and leverage AI-powered match insights to find the best collaborators.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Secure Authentication** | Email-based registration with JWT tokens, email verification, and password reset |
| 👤 **Role-Based Profiles** | Separate workflows for Engineers and Healthcare professionals |
| 📝 **Project Posts** | Publish, manage, and discover collaboration opportunities with rich filtering |
| 🤝 **Meeting Requests** | NDA-protected meeting workflow with 3-slot time proposal system |
| 🤖 **AI Match Insights** | Automated analysis of posts with match scoring and partner recommendations |
| 📥 **Smart Inbox** | Manage incoming/outgoing meeting requests with status tracking |
| 🛡️ **Admin Dashboard** | Full platform oversight with user management and activity logs |
| 🔒 **Security Layers** | Rate limiting, Helmet.js headers, bcrypt hashing, input validation |
| ⏰ **Background Jobs** | Automated post expiry, session cleanup via cron jobs |

---

## 🏗️ Architecture

```
health-ai-platform/
├── backend/                 # Express.js API Server
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema (PostgreSQL)
│   │   └── migrations/      # Database migrations
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, rate limiting
│   │   ├── routes/          # API route definitions
│   │   ├── utils/           # Email, validation, AI service
│   │   ├── jobs/            # Cron jobs
│   │   ├── lib/             # Prisma client
│   │   └── index.ts         # Server entry point
│   └── .env                 # Environment variables
├── frontend/                # React + Vite SPA
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Shared components
│   │   ├── App.tsx          # Router & layout
│   │   └── index.css        # Design system
│   └── index.html
├── docker-compose.yml       # Docker services
├── start.ps1                # One-click startup script
└── README.md
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, React Router 7, Axios |
| **Backend** | Node.js, Express 5, TypeScript, Prisma 7 ORM |
| **Database** | PostgreSQL 15 (Docker) |
| **Auth** | JWT, bcrypt, email verification |
| **Security** | Helmet.js, express-rate-limit, CORS |
| **Styling** | Custom CSS design system (dark theme, glassmorphism) |
| **AI Engine** | Mock AI service with optional Groq/Llama 3.3 integration |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- [Git](https://git-scm.com/)

### Option 1: One-Click Startup (Recommended)

```powershell
# Clone the repository
git clone https://github.com/ineedcoffey/health-ai-platform.git
cd health-ai-platform

# Run the startup script (starts DB + Backend + Frontend)
.\start.ps1
```

The script will:
1. ✅ Start the PostgreSQL database via Docker
2. ✅ Run database migrations
3. ✅ Start the backend server on `https://health-ai-platform-backend.onrender.com`
4. ✅ Start the frontend dev server on `http://localhost:5173`

### Option 2: Manual Setup

```bash
# 1. Start the database
docker compose up -d db

# 2. Backend setup
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx ts-node src/index.ts

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Access the Application

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:5173 |
| 🔌 Backend API | https://health-ai-platform-backend.onrender.com |
| 🗄️ Database | localhost:5433 |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/verify-email` | Verify email address |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get current user profile |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/complete-profile` | Complete profile setup |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Browse active posts (with filters) |
| GET | `/api/posts/my-posts` | Get current user's posts |
| GET | `/api/posts/:id` | Get post details |
| POST | `/api/posts` | Create a new post |
| PUT | `/api/posts/:id` | Update a post |
| PATCH | `/api/posts/:id/status` | Update post status |
| POST | `/api/posts/:id/analyze` | Trigger AI analysis |
| GET | `/api/posts/:id/ai-insight` | Get AI match insight |

### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/meetings` | Send a meeting request |
| GET | `/api/meetings/inbox` | Get meeting inbox |
| PATCH | `/api/meetings/:id/respond` | Accept/decline meeting |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/activity-logs` | View activity logs |
| PATCH | `/api/admin/users/:id/status` | Activate/deactivate user |

---

## 🗃️ Database Schema

The platform uses **6 core models** aligned with the SRS/SDD specification:

```
User ──┬── Post ──── MeetingRequest
       │     │
       │     └── AIAnalysis
       │
       ├── ActivityLog
       └── Notification
```

Key enums: `Role` (Engineer/Healthcare/Admin), `PostStatus` (Draft → Active → Partner Found), `MeetingStatus` (Pending → Accepted → Scheduled → Completed)

---

## 🤖 AI Match Insight System

The platform includes an intelligent analysis engine that evaluates posts for interdisciplinary collaboration potential:

- **Match Score (0-100)**: Evaluates domain synergy, expertise alignment, and collaboration potential
- **AI Recommendation**: 2-sentence insight on what skills an ideal partner should bring and the interdisciplinary value

**Default Mode**: Uses a built-in heuristic engine (no external API needed)

**Advanced Mode**: Optionally connect to Groq API for enhanced analysis:
```env
# Add to backend/.env
GROQ_API_KEY=your_api_key_here
```

---

## 🎨 Design System

The frontend uses a custom-built CSS design system featuring:

- **Dark mode first** — Premium dark palette with carefully tuned contrast
- **Glassmorphism** — Frosted glass effects on cards and overlays
- **Micro-animations** — Fade-in, stagger, shimmer, and pulse effects
- **Inter font family** — Clean, modern typography from Google Fonts
- **Responsive** — Mobile-friendly layouts across all pages

---

## 📂 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://healthadmin:healthpassword123@localhost:5433/health_ai` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `CLIENT_URL` | Frontend URL for CORS/emails | `http://localhost:5173` |
| `GROQ_API_KEY` | *(Optional)* Groq API key for AI | Not set (uses mock) |

---

## 👥 User Roles

| Role | Description |
|------|-------------|
| **Engineer** | Software, biomedical, or data science professionals seeking healthcare domain partners |
| **Healthcare** | Doctors, nurses, and clinical researchers seeking technical collaborators |
| **Admin** | Platform administrators with full management capabilities |

---

## 📄 License

This project is developed as part of the **SENG 384** course curriculum.

---

<div align="center">

**Built with ❤️ for interdisciplinary innovation in health technology**

</div>
