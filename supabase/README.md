# Supabase setup (Step 2)

## 1. Create a project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → pick org, name (`noteflow`), database password, region
3. Wait until the project is ready

## 2. Run the migration

1. Open **SQL Editor** → **New query**
2. Paste the full contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run** — you should see “Success. No rows returned”

## 3. Enable email auth (for Step 3)

1. **Authentication** → **Providers** → **Email** → ensure it is enabled
2. For local dev, you may disable **Confirm email** under **Authentication** → **Providers** → **Email** (optional, faster testing)

## 4. Frontend environment variables

Copy `.env.example` to `.env` in the project root and fill in:

| Variable | Where to find it |
|----------|------------------|
| `VITE_SUPABASE_URL` | **Project Settings** → **API** → Project URL |
| `VITE_SUPABASE_ANON_KEY` | **Project Settings** → **API** → `anon` `public` key |

Restart `npm run dev` after changing `.env`.

## 5. Verify in the app

Open the home page and click **Test Supabase connection**. You should see a green success message if the URL/key are valid and the migration ran.

## Schema reference

**`sessions`**

| Column | Type |
|--------|------|
| id | uuid (PK) |
| user_id | uuid → auth.users |
| title | text |
| full_transcript | text |
| created_at | timestamptz |
| updated_at | timestamptz |
| duration_seconds | integer |

**`notes`**

| Column | Type |
|--------|------|
| id | uuid (PK) |
| session_id | uuid → sessions |
| topic | text |
| summary | text |
| key_points | text[] |
| created_at | timestamptz |
| transcript_chunk | text |

RLS ensures each user only reads/writes their own sessions and related notes.
