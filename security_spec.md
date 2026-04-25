# Security Specification for PoetiCraft AI

## Hosting Model
- Frontend: Vite React single-page app hosted on Vercel.
- Data: Supabase Postgres with Row Level Security enabled.
- Teacher auth: Supabase email OTP. Teacher emails must end with `@ri.edu.sg`.
- Student access: currently selected client-side; the future LMS flow will use `/?id=${Canvas.user.loginId}` and remain client-only.
- AI calls: Vercel `/api/gemini` function. `GEMINI_API_KEY` must not be exposed to the browser.

## Data Invariants
1. A `skill` must reference an existing `work`.
2. An `exercise` must reference an existing `work` and `skill`.
3. Deleting a `work` cascades to its `skills`, `exercises`, and related `submissions`.
4. Deleting a `skill` cascades to its `exercises` and related `submissions`.
5. Public users can read `works`, `skills`, and `exercises`.
6. Only authenticated `@ri.edu.sg` teachers can create, update, or delete `works`, `skills`, and `exercises`.
7. Anonymous/student clients can create `submissions`, because student identity is provided by the LMS query parameter rather than Supabase Auth.
8. Only authenticated `@ri.edu.sg` teachers can read `submissions`.

## Required Environment Variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

## Supabase Setup
Run `supabase-schema.sql` in the Supabase SQL editor before deploying the app.

## Known Tradeoff
The planned LMS `?id=` access flow is client-only by requirement. That identifies students for UX and submission tracking, but it is not cryptographic authentication. Do not treat student-submitted identity as proof of identity unless the LMS link is later signed and verified server-side.
