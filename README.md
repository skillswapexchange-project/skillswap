# SkillSwap 🤝

**Learn. Teach. Connect. Exchange Skills.**

SkillSwap is a Python-based full-stack skill exchange platform that helps people discover others who can teach the skills they want to learn, while learning the skills they already know.

> Instead of making learning a one-way relationship between a teacher and student, SkillSwap treats peer learning as a matching problem.
> 
> You know Python and want to learn React? SkillSwap finds people who know React and want to learn Python.

---

## 📌 Quick Navigation

- [Overview](#-overview)
- [Problem & Solution](#problem-statement)
- [How It Works](#-how-skillswap-works)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Getting Started](#-installation)
- [Development Roadmap](#-development-roadmap)

---

## 🌐 Overview

### Traditional Learning Model
```
Teacher ───────────────► Student
(one-way transaction)
```

### SkillSwap Reciprocal Model
```
User A (Python → wants React)
    ↕ MATCH
User B (React → wants Python)

Both users benefit without monetary transaction
```

**Core Vision:** The long-term goal is to build an intelligent learning network capable of finding direct matches, multi-person skill exchange cycles, compatible schedules, and personalized learning opportunities.

---

## ❗ Problem Statement

People want to learn new skills but struggle to find the right person to learn from.

### Current Learning Options
- Online courses
- YouTube tutorials
- Paid tutors
- Coaching platforms
- Discord/Telegram communities
- Friends and personal networks

### The Real Problem
**The issue isn't the absence of knowledge—it's discovering compatible people.**

**Example:**
- Person A: Knows Python, wants UI/UX
- Person B: Knows UI/UX, wants Python
- → They can teach each other!

---

## 💡 Solution

SkillSwap creates a structured platform where users define:

| Component | Details |
|-----------|---------|
| **Skills I Can Teach** | Skill + Proficiency Level |
| **Skills I Want to Learn** | Skill + Target Level |
| **Availability** | Days & Time Slots + Timezone |
| **Learning Preferences** | Preferred formats & pace |

The platform then discovers and ranks potential matches.

### Simplified Matching Flow
```
User Profile
    ↓
Skill Processing
    ↓
Candidate Discovery
    ↓
Compatibility Scoring
    ↓
Match Ranking
    ↓
Connection Request
    ↓
Session
    ↓
Review & Reputation
```

---

## 🎯 Project Objectives

- ✅ Build a platform for peer-to-peer skill exchange
- ✅ Match users based on reciprocal learning opportunities
- ✅ Account for skill proficiency (not just keyword matching)
- ✅ Consider user availability when generating matches
- ✅ Build a reputation system to encourage trustworthy interactions
- ✅ Provide tools for scheduling learning sessions
- ✅ Introduce AI-assisted skill discovery and recommendations
- ✅ Explore graph-based multi-person skill exchanges
- ✅ Provide a scalable REST API architecture
- ✅ Build a production-oriented Python full-stack application

---

## 🔄 How SkillSwap Works

### Step 1: Create Account & Profile
User builds their profile with:
- Name, Bio, Location, Timezone
- Learning preferences & Availability

### Step 2: Add Skills
Users define two categories:
```
I CAN TEACH          I WANT TO LEARN
├─ Python (Adv)      ├─ React (Beginner)
├─ Django (Int)      ├─ UI/UX (Beginner)
└─ SQL (Int)         └─ Figma (Beginner)
```

### Step 3: Find Compatible Users
SkillSwap analyzes users and calculates compatibility:
```
🎯 94% Match
├─ You can teach: Python
├─ You can learn: React
├─ Availability: Saturday & Sunday, 7PM-9PM
└─ Proficiency alignment: Perfect
```

### Step 4: Connect
Send a connection request to matched users.

### Step 5: Schedule Session
```
Skill: React
Teacher: User B
Learner: You
Date: Saturday
Time: 7:00 PM – 8:00 PM
Mode: Online
```

### Step 6: Exchange Knowledge
Conduct session using preferred communication.

### Step 7: Review & Build Reputation
```
Teaching Quality    ⭐⭐⭐⭐⭐
Communication       ⭐⭐⭐⭐⭐
Knowledge           ⭐⭐⭐⭐
Punctuality         ⭐⭐⭐⭐⭐
```

---

## 🚦 Features

### Status Legend
- 🟢 **Core** — MVP/core implementation
- 🟡 **Development** — Currently being developed
- 🔵 **Planned** — Future implementation

### Feature Checklist

| Feature | Status |
|---------|--------|
| User registration & authentication | 🟢 |
| User profiles with skills | 🟢 |
| Skill catalog & categories | 🟢 |
| Teach/Learn skill management | 🟢 |
| Skill proficiency levels | 🟢 |
| Basic matching | 🟢 |
| Compatibility score | 🟡 |
| Availability matching | 🟡 |
| Connection requests | 🟡 |
| Session scheduling | 🟡 |
| Reviews & ratings | 🟡 |
| Reputation system | 🟡 |
| Notifications | 🟡 |
| Real-time chat | 🔵 |
| AI skill extraction | 🔵 |
| AI recommendations | 🔵 |
| Multi-person skill cycles | 🔵 |
| Admin dashboard | 🔵 |
| Video sessions | 🔵 |
| Payments/Mentoring | 🔵 |
| Mobile app | 🔵 |

---

## 🔥 Core Features Deep Dive

### 👤 User Profiles
Each user profile contains:
- Name, Picture, Bio
- Location & Timezone
- Skills (teach + learn)
- Skill proficiency levels
- Availability schedule
- Learning preferences
- Reputation score

### 📚 Skill Management
Skills organized by category:

```
Programming          Design           Business         Languages
├─ Python           ├─ UI/UX         ├─ Marketing      ├─ English
├─ Java             ├─ Figma         ├─ Sales          ├─ Telugu
├─ JavaScript       ├─ Photoshop     ├─ Finance        ├─ Hindi
├─ React            └─ Graphics      └─ Entrepreneurship└─ Spanish
├─ C++
└─ Go
```

**Proficiency Levels:** Beginner → Intermediate → Advanced → Expert

### 🧠 Smart Matching

The matching engine determines:
1. **Who can teach me what I want?**
2. **What can I teach them that they want?**
3. **Are we available at compatible times?**
4. **Are our proficiency levels appropriate?**

#### Compatibility Score Formula
```
Match Score = 
  (Reciprocal Skill Match × 40%) +
  (Learning Compatibility × 30%) +
  (Availability Overlap × 15%) +
  (Proficiency Compatibility × 10%) +
  (Timezone Alignment × 5%)
```

**Example Calculation:**
- Reciprocal skills: 100
- Learning compatibility: 95
- Availability: 90
- Proficiency: 85
- Timezone: 100

**→ Final Score: ~94%**

### 🔁 Multi-Person Skill Cycles
*Planned feature for discovering 3+ person exchanges:*

```
User A: Teaches Python, Wants React
User B: Teaches Photoshop, Wants Python
User C: Teaches React, Wants Photoshop

     A ─Python→ B
     ↑          ↓
     └─React─ C
     (Photoshop)
```

### ⭐ Reputation System
After sessions, users receive:
- Teaching Quality rating
- Communication rating
- Knowledge rating
- Punctuality rating

**Platform calculates:**
- Reputation Score (e.g., 4.8/5)
- Sessions Completed
- Completion Rate
- Response Rate

---

## 🏗️ Technology Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React | UI development |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| React Router | Client-side routing |
| TanStack Query | Server state management |

### Backend
| Tech | Purpose |
|------|---------|
| Python 3.11+ | Primary language |
| FastAPI | REST API framework |
| Pydantic | Data validation |
| SQLAlchemy | ORM |
| Alembic | Database migrations |
| JWT | Authentication |

### Data Layer
| Tech | Purpose |
|------|---------|
| PostgreSQL 15+ | Relational database |
| Redis 7+ | Caching & real-time |

### DevOps & Deployment
- Git & GitHub
- Docker & Docker Compose
- CI/CD pipelines
- Linux
- Cloud infrastructure

---

## 🏛️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User/Frontend                    │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  React + TypeScript │
        │     Frontend        │
        └──────────┬──────────┘
                   │ HTTP/JSON
        ┌──────────▼──────────────────────┐
        │       FastAPI Backend           │
        ├─────────────────────────────────┤
        │ ├─ Auth Service                 │
        │ ├─ Matching Engine              │
        │ ├─ Session Service              │
        │ ├─ Messaging Service            │
        │ ├─ AI Service                   │
        │ └─ Notification Service         │
        └─────────┬──────────┬────────────┘
                  │          │
         ┌────────▼─┐   ┌────▼──────┐
         │PostgreSQL│   │   Redis   │
         │    DB    │   │  Cache    │
         └──────────┘   └───────────┘
```

### Application Architecture (Layered)

```
┌──────────────────────────────────────┐
│        Frontend Client (React)       │
└─────────────────┬────────────────────┘
                  │
┌─────────────────▼────────────────────┐
│      API Router / Endpoint Layer     │
└─────────────────┬────────────────────┘
                  │
┌─────────────────▼────────────────────┐
│   Route Handler / Controller Layer   │
└─────────────────┬────────────────────┘
                  │
┌─────────────────▼────────────────────┐
│        Service Layer (Logic)         │
├─ Matching Service                    │
├─ User Service                        │
├─ Session Service                     │
└─ Notification Service                │
                  │
┌─────────────────▼────────────────────┐
│   Domain/Business Logic Layer        │
└─────────────────┬────────────────────┘
                  │
┌─────────────────▼────────────────────┐
│       Repository/Data Layer          │
├─ UserRepository                      │
├─ SkillRepository                     │
├─ MatchRepository                     │
└─ SessionRepository                   │
                  │
┌─────────────────▼────────────────────┐
│      SQLAlchemy ORM + PostgreSQL     │
└──────────────────────────────────────┘
```

### Database Schema

**Core Entities:**
- `USERS` — User profiles & reputation
- `CATEGORIES` — Skill categories
- `SKILLS` — Individual skills
- `USER_SKILLS` — User's teach/learn skills
- `AVAILABILITY` — Time slots per user
- `MATCHES` — Calculated compatibility scores
- `CONNECTION_REQUESTS` — Connection requests
- `SESSIONS` — Learning sessions
- `REVIEWS` — Post-session feedback
- `MESSAGES` — User messages
- `NOTIFICATIONS` — Platform notifications

---

## 🔌 API Architecture

### RESTful Endpoints Overview

```
/api/v1/
├── /auth                    # Authentication
├── /users                   # User management
├── /skills                  # Skill catalog
├── /matches                 # Matching results
├── /connections            # Connection requests
├── /availability           # User availability
├── /sessions               # Session scheduling
├── /reviews                # Ratings & reviews
├── /messages               # Messaging
├── /notifications          # Notifications
└── /admin                  # Admin features
```

### Key Endpoints

**Authentication:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

**Users:**
- `GET /api/v1/users/me` — Get current user
- `PATCH /api/v1/users/me` — Update profile
- `GET /api/v1/users/{user_id}` — View other user

**Skills:**
- `GET /api/v1/skills` — Browse skills
- `POST /api/v1/users/me/skills` — Add skill
- `PATCH /api/v1/users/me/skills/{skill_id}` — Update skill

**Matching:**
- `GET /api/v1/matches` — Get matches
- `POST /api/v1/matches/refresh` — Recalculate matches

**Sessions:**
- `POST /api/v1/sessions` — Create session
- `GET /api/v1/sessions` — List sessions
- `PATCH /api/v1/sessions/{session_id}` — Update session

---

## 🔐 Authentication & Security

### Authentication Flow
```
User → Login Credentials → FastAPI
                ↓
          Validate User
                ↓
    Generate JWT (Access + Refresh)
                ↓
          Return Tokens
                ↓
       Protected Requests
       (with Access Token)
```

### Security Measures
- ✅ Password hashing (Argon2 / bcrypt)
- ✅ JWT token-based auth
- ✅ Token expiration & refresh rotation
- ✅ Pydantic input validation
- ✅ Authorization checks
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ SQL injection protection (ORM)
- ✅ Secure environment variables
- ✅ User blocking & reporting

---

## 📁 Project Structure

```
skillswap/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py
│   │   │       │   ├── users.py
│   │   │       │   ├── skills.py
│   │   │       │   ├── matches.py
│   │   │       │   ├── sessions.py
│   │   │       │   └── reviews.py
│   │   │       └── dependencies.py
│   │   ├── core/
│   │   │   ├── config.py          # Configuration
│   │   │   ├── security.py        # JWT, password hashing
│   │   │   └── database.py        # DB connection
│   │   ├── models/                # SQLAlchemy models
│   │   ├── schemas/               # Pydantic schemas
│   │   ├── services/              # Business logic
│   │   │   ├── matching.py
│   │   │   ├── users.py
│   │   │   ├── sessions.py
│   │   │   └── notifications.py
│   │   ├── repositories/          # Data access
│   │   └── main.py                # App entry
│   ├── alembic/                   # Migrations
│   ├── tests/
│   │   ├── unit/
│   │   ├── api/
│   │   └── integration/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Route pages
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── services/              # API calls
│   │   ├── types/                 # TypeScript definitions
│   │   ├── utils/                 # Utilities
│   │   └── App.tsx                # Main component
│   ├── package.json
│   └── Dockerfile
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── database/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Git
- Docker (recommended)

### Backend Setup

```bash
# Clone repository
git clone https://github.com/venkata-sai-thalla/skillswap.git
cd skillswap/backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create PostgreSQL database
createdb skillswap

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

**Backend runs at:** `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

```bash
cd skillswap/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs at:** `http://localhost:5173`

### Using Docker Compose

```bash
docker compose up --build
```

**Services:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Environment Configuration

Create `.env` file:

```env
# App
APP_NAME=SkillSwap
ENVIRONMENT=development
DEBUG=true

# Database
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/skillswap

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI (optional)
AI_API_KEY=your-api-key

# Frontend
FRONTEND_URL=http://localhost:5173
```

⚠️ **Never commit `.env` to Git!** Use `.env.example` to document required variables.

---

## 🧪 Testing

### Run All Tests
```bash
pytest
```

### Unit Tests
```bash
pytest tests/unit/
```

### API Tests
```bash
pytest tests/api/
```

### Integration Tests
```bash
pytest tests/integration/
```

### Test Coverage
```bash
pytest --cov=app tests/
```

**Test Areas:**
- Matching calculations & algorithm
- User authentication & authorization
- Skill management & normalization
- Session scheduling & validation
- Review & reputation system
- Availability matching
- Database operations

---

## 🗺️ Development Roadmap

### Phase 1: MVP Foundation ✅
- Project architecture setup
- PostgreSQL database
- User registration & auth
- User profiles
- Skill catalog & categories
- Teach/Learn skills with proficiency

### Phase 2: Matching Engine 🟡
- Basic skill matching
- Reciprocal matching logic
- Compatibility score calculation
- Match ranking & filtering
- Availability time matching
- Timezone support

### Phase 3: Connections & Sessions 🟡
- Connection requests (send/receive)
- Accept/reject requests
- Session creation & scheduling
- Session cancellation
- Session history
- Reviews & ratings
- Reputation calculation

### Phase 4: Communication 🔵
- Notifications (multiple channels)
- One-to-one messaging
- WebSocket support
- Read/unread tracking
- Online status
- Block & report features

### Phase 5: AI Features 🔵
- AI skill extraction from text
- Skill normalization
- Skill recommendations
- Learning path recommendations
- Personalized matching
- AI-assisted profile creation

### Phase 6: Advanced Matching 🔵
- Graph-based matching
- 3+ person skill cycles
- Multi-person exchanges
- Advanced compatibility scoring
- Recommendation ranking
- Quality feedback loop

### Phase 7: Platform Expansion 🔵
- Integrated video sessions
- Calendar integration (Google, Outlook)
- Group learning & workshops
- Skill communities
- Paid mentoring option
- Payment integration
- Skill verification & badges
- Certificates

---

## 🔮 Future Enhancements

### 🎥 Video Sessions
Integrated video communication using WebRTC with WebSocket signaling.

### 📅 Calendar Integration
Auto-detect available slots via Google Calendar or Outlook integration.

### 💰 Hybrid Model
Support both skill exchange (free) and paid mentoring.

### 🧪 Skill Verification
- Quizzes
- Coding challenges
- Project evidence
- Peer endorsements
- Certificates

### 🏢 Enterprise Edition
Internal skill exchange networks for organizations (employee development, knowledge sharing).

### 🌐 Group Learning
Workshops, study groups, coding circles, language practice groups.

### 📈 Advanced Recommendations
ML-powered matching considering skills, goals, history, ratings, timezone, location, preferences.

---

## 📈 Scalability Architecture

### Phase 1: Monolith (Current)
```
React Frontend
    ↓
FastAPI Backend
    ↓
PostgreSQL + Redis
```

### Phase 2: Modular Monolith
Better separation of concerns within single codebase.

### Phase 3: Microservices (Future)
```
API Gateway
├── Auth Service
├── User Service
├── Skill Service
├── Matching Service
├── Session Service
├── Chat Service
├── Notification Service
└── AI Service

Shared Infrastructure:
├── PostgreSQL
├── Redis (Cache)
└── Message Queue
```

---

## 🧩 Technical Challenges & Solutions

| Challenge | Description | Solution |
|-----------|-------------|----------|
| **Reciprocal Matching** | Finding users that satisfy each other | Structured skill relationships + weighted scoring |
| **Skill Normalization** | Same skill, different descriptions ("JS" vs "JavaScript") | AI-assisted mapping + skill catalog |
| **Availability Matching** | Skills match but time slots don't align | Availability overlap scoring component |
| **Trust & Safety** | Users interact with strangers | Reviews, ratings, reputation, verification |
| **Multi-Person Cycles** | Finding 3+ person exchanges | Graph algorithms, cycle detection, optimization |

---

## 🤝 Contributing

Contributions are welcome!

### Steps
1. **Fork** the repository
2. **Clone** your fork
3. **Create branch:** `git checkout -b feature/your-feature`
4. **Make changes** following project conventions
5. **Test:** `pytest`
6. **Commit:** `git commit -m "feat: add skill matching"`
7. **Push:** `git push origin feature/your-feature`
8. **Open Pull Request** with clear description

### PR Guidelines
- Explain what changed and why
- Include testing evidence
- Document any limitations
- Follow existing code style

---

## 📜 License

This project is currently a development and portfolio project. A formal open-source license will be added when distribution policy is finalized.

---

## ⭐ Quick Summary

```
┌──────────────────────────────────────┐
│           SKILLSWAP                  │
├──────────────────────────────────────┤
│  Learn ↔ Teach                       │
│  Skills → People                     │
│  People → Skills                     │
│                                      │
│  One person's knowledge is          │
│  another person's opportunity       │
└──────────────────────────────────────┘
```

**Learn what you don't know.**  
**Teach what you do.**  
**Connect with people who complete the exchange.**

---

**Questions or Ideas?** [Open an issue](https://github.com/venkata-sai-thalla/SkillSwap/issues) or start a [discussion](https://github.com/venkata-sai-thalla/SkillSwap/discussions)!