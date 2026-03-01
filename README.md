# 🧠 Social Skills Practice Platform
**Structured AI-assisted social practice for neurodivergent children**

A web platform that helps neurodivergent children (ages 7–15) practice measurable social goals independently, while supervisors retain full control over goal implementation, and progress.

> We extend therapy beyond session time.

---

## The Problem

In the field of Applied Behavior Analysis (ABA), behavior technicians implement implement social goals structured from BCBAs to neurodivergent children.
In-person behavioral sessions only occur limited times in the week. Practice between sessions is inconsistent and not guaranteed.

Reinforcement drops.
Caregivers lack structured scenarios.
Progress tracking becomes subjective.

Therapy time is limited. Mastery requires consistency.

---

## The Solution

We convert clinical goals into safe, structured, and most importantly consistent, AI-guided practice:

**Goal → Task → Response → Feedback → Progress**

Supervisors:
- Define measurable goals (structured JSON criteria)
- Generate and publish AI-assisted tasks
- Monitor performance over time

Children:
- Complete short, interactive tasks (text or voice)
- Receive supportive, non-punitive feedback
- Earn XP rewards
  - Possible themes: Pokémon

---

## Why It’s Different

Treatment tasks are centered around unique goals that are described and set up by supervisors. Each experience is
unique to every client, as neurodivergency can vary among clients. Specificity is our specialty.

Our platform does not just serve as a general leisure application that anyone can use, it is a clinical tool that
solves one of the biggest issues in ABA: maintenance. 

- Reading-level adaptation per child
- Interruption-resilient task flow
- No diagnosis language, no shame
- Supervisor-controlled publishing
- Rate-limited AI endpoints

## Architecture

```
social-skills-app/
├── apps/
│   ├── web/          # Next.js 14 (App Router, TypeScript, Tailwind, shadcn/ui)
│   └── api/          # Python FastAPI (Gemini AI, Supabase DB)
├── packages/
│   └── shared/       # Zod schemas + shared TypeScript types
├── supabase/
│   └── migrations/   # SQL migrations + RLS policies
└── scripts/          # Seed data, dev utilities
```

## Tech Stack

- Node.js 20+
- Python 3.11+
- TypeScript
- Supabase project
- Google Gemini API key
- (Optional) Upstash Redis for production rate limiting

## Features
- User Authentication and Login - Quick and convenient sign-up utilizing Supabase
- Multi-Role Authentication - Differentiable interface dependent on assigned role (Client, supervisor)
- Goal Implementation - Fully customization goal implementation from supervisor fed into Gemini API
- Task Generation - AI-generated social scenarios based on goal promptst to be presented to clients
- Client interaction - High-fidelity frontend built in TypeScript where client completes tasks, earning incentives for completion in the form of XP to maintain pets

## Quick Start

### 1. Clone and install

```bash
cd social-skills-app

# Frontend
cd apps/web && npm install && cd ../..

# Shared types
cd packages/shared && npm install && cd ../..

# Backend
cd apps/api && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```

### 2. Environment variables

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

Fill in your Supabase URL, anon key, service role key, and Gemini API key.

### 3. Run Supabase migrations

Apply all files in `supabase/migrations/` to your Supabase project via the Supabase dashboard SQL editor or the CLI:

```bash
supabase db push
```

### 4. Seed data

```bash
cd apps/api
source .venv/bin/activate
python -m scripts.seed
```

### 5. Start development servers

```bash
# Terminal 1 — API
cd apps/api && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2 — Web
cd apps/web && npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Key Flows

1. **Supervisor creates a goal** for a linked child
2. **Supervisor generates tasks** via AI (Gemini) from the goal
3. **Supervisor edits and publishes** tasks → creates assignments
4. **Child sees today's assignments** on their home screen
5. **Child completes tasks** (text or voice input)
6. **AI provides supportive feedback** and awards XP/Pokemon rewards
7. **Supervisor reviews progress** on their dashboard

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ai/tasks/generate` | supervisor | Generate AI task drafts from a goal |
| POST | `/ai/tts` | any | Get cleaned narration text for TTS |
| POST | `/tasks/{id}/publish` | supervisor | Publish a draft task + create assignments |
| PATCH | `/tasks/{id}` | supervisor | Edit a draft task |
| GET | `/tasks/{id}` | supervisor | Get task details |
| GET | `/child/today` | child | Today's assignments + rewards + streak |
| POST | `/child/assignments/{id}/submit_text` | child | Submit text response |
| POST | `/child/assignments/{id}/submit_voice` | child | Submit voice recording |
| GET | `/child/pokemon` | child | Get Pokemon collection |
| GET | `/supervisor/children` | supervisor | List linked children |
| GET | `/supervisor/child/{id}` | supervisor | Child detail + goals + tasks |
| POST | `/supervisor/goals` | supervisor | Create a goal |
| PATCH | `/supervisor/goals/{id}` | supervisor | Update a goal |
| GET | `/supervisor/goals/{id}` | supervisor | Goal detail + tasks |
| GET | `/supervisor/child/{id}/progress` | supervisor | 7/30 day progress summary |

## Frontend Routes

### Child
- `/child/home` — Today's activities, streak, XP
- `/child/task/[assignmentId]` — Task player (social story, roleplay, modeling, calming)
- `/child/task/calming` — Quick calming exercise ("I feel upset" button)
- `/child/pokemon` — Pokemon collection + evolution progress

### Supervisor
- `/supervisor/dashboard` — List of linked children
- `/supervisor/child/[childId]` — Child goals, tasks, progress
- `/supervisor/goals/new` — Create new goal
- `/supervisor/goals/[goalId]` — Goal detail + AI task generation
- `/supervisor/tasks/[taskId]` — Edit and publish task

## Safety & Privacy

- Audio is **never stored** — transcribed in memory, then discarded
- All AI prompts enforce supportive, non-judgmental language
- No diagnosis language, no shame, no threats
- Rate limiting on all AI endpoints (10 req/min default)
- RLS policies enforce strict data isolation between children
- Supervisors can only access their linked children's data
- Audit logs capture all supervisor actions

## Linking Supervisors to Children

During development, insert a row into `supervisor_child` manually:

```sql
INSERT INTO supervisor_child (supervisor_id, child_id)
VALUES ('supervisor-uuid', 'child-uuid');
```
