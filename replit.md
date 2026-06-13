# CareerPilot AI

A full-stack SaaS platform that helps students and job seekers manage job applications, resumes, interviews, recruiters, and career preparation from a single dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/career-pilot run dev` — run the frontend (port 26034)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Clerk auth (auto-provisioned)
- Optional env: `OPENAI_API_KEY` — enables real AI resume analysis and cover letter generation (falls back to mock responses if not set)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (Replit-managed)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle table definitions (applications, recruiters, resumes, interviewQuestions, activityLog)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/career-pilot/src/` — React frontend (pages, components, hooks)
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod schemas for server validation (do not edit)

## Architecture decisions

- Contract-first: OpenAPI spec drives codegen for both frontend hooks and server Zod validators
- Clerk proxy auth: server proxies Clerk requests via `/api/__clerk`; frontend uses `publishableKeyFromHost` for multi-domain support
- All routes are user-scoped: every DB query filters by `userId` from Clerk session
- Activity log table auto-records application/recruiter/resume changes for the dashboard feed
- AI routes fall back to mock responses when `OPENAI_API_KEY` is not set

## Product

- **Dashboard** — stats overview (applications, interviews, offers, rejections, success rate), monthly trend chart, status breakdown, recent activity feed
- **Applications Tracker** — full CRUD with 7 statuses (Wishlist → Offer/Rejected), search and filter
- **Resume Manager** — multiple resume versions by category, set default
- **AI Resume Analyzer** — ATS score, feedback, missing keywords, skill gaps, improvement suggestions
- **AI Cover Letter Generator** — generates personalized cover letter from job description + resume; copy/download
- **Recruiter CRM** — contact management with follow-up date reminders
- **Interview Prep** — behavioral/technical/general question bank with answers and difficulty levels
- **Analytics** — monthly trend charts, conversion rates, status breakdown

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` then `pnpm run typecheck:libs`
- The `@workspace/db` lib must be rebuilt with `pnpm run typecheck:libs` after schema changes before route files can import new tables
- Date columns use `date(..., { mode: "string" })` — pass `YYYY-MM-DD` strings, not `Date` objects
- Clerk uses cookie-based auth on web — do NOT add `getToken()`/Bearer headers to browser API calls

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
