# PoetiCraft AI

PoetiCraft AI is a Vite React app for Chinese poetry analysis practice. It is designed for GitHub + Vercel hosting with Supabase as the data store and teacher OTP auth provider.

## Stack

- Vite + React
- Supabase Postgres + Row Level Security using one table: `CL_JIAYU_POETICRAFT`
- Supabase email OTP for teachers with `@ri.edu.sg` email addresses
- Vercel `/api/gemini` function for Gemini calls
- Student access via LMS URL parameter: `/?id=${Canvas.user.loginId}`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the Supabase table and RLS policies:
   - Open the Supabase SQL editor.
   - Run `supabase-schema.sql`.
   - This script uses your existing `public.CL_JIAYU_POETICRAFT` table and adds the app columns/policies.

3. Configure environment variables:
   ```bash
   VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
   VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   ```

4. For teacher OTP:
   - In Supabase Auth, enable Email provider.
   - Configure the email template to include `{{ .Token }}` so teachers receive the six-digit OTP code.

5. Run locally:
   ```bash
   npm run dev
   ```

For local testing of `/api/gemini`, use Vercel's local runtime (`vercel dev`) or deploy to Vercel, because the Gemini endpoint is a Vercel Function.

## LMS Access

Student links must include the Canvas login ID:

```txt
https://your-app.vercel.app/?id=${Canvas.user.loginId}
```

If `id` is missing, the app shows an Access Required screen and blocks student routes.
