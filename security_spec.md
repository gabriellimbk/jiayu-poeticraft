# Security Specification for PoetiCraft AI

## Hosting Model
- Frontend: Vite React single-page app hosted on Vercel.
- Data: Supabase Postgres with Row Level Security enabled on `public.CL_JIAYU_POETICRAFT`.
- Teacher auth: Supabase email OTP. Teacher emails must end with `@ri.edu.sg`.
- Student access: currently selected client-side; the future LMS flow will use `/?id=${Canvas.user.loginId}` and remain client-only.
- AI calls: Vercel `/api/gemini` function. `GEMINI_API_KEY` must not be exposed to the browser.

## Data Invariants
1. All app rows live in `CL_JIAYU_POETICRAFT`.
2. `record_type` identifies each row as `work`, `skill`, `exercise`, or `submission`.
3. A `skill` row stores its parent in `work_id`.
4. An `exercise` row stores its parents in `work_id` and `skill_id`.
5. A `submission` row stores its parent in `exercise_id`.
6. Public users can read learning content rows: `work`, `skill`, and `exercise`.
7. Only authenticated `@ri.edu.sg` teachers can create, update, or delete learning content rows.
8. Anonymous/student clients can create `submission` rows, because student identity is provided by the LMS query parameter rather than Supabase Auth.
9. Only authenticated `@ri.edu.sg` teachers can read `submission` rows.

## Required Environment Variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

## Supabase Setup
Create the `CL_JIAYU_POETICRAFT` table in Supabase, then run `supabase-schema.sql` in the SQL editor before deploying the app.

## Known Tradeoff
The planned LMS `?id=` access flow is client-only by requirement. That identifies students for UX and submission tracking, but it is not cryptographic authentication. Do not treat student-submitted identity as proof of identity unless the LMS link is later signed and verified server-side.
