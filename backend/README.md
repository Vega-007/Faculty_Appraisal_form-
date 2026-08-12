# SRM Faculty Appraisal — Supabase Backend Guide

This folder contains the complete database migrations, seed data, and Row Level Security (RLS) policies for connecting the Faculty Performance Appraisal Platform to **Supabase** (PostgreSQL + Auth + API).

---

## 🚀 Quick Setup Instructions

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and log in.
2. Click **"New Project"**.
3. Set project name to `Faculty-Appraisal-2025` and set a strong database password.

---

### Step 2: Run Database Migrations
1. In your Supabase Dashboard, navigate to the **SQL Editor** (left sidebar).
2. Click **"New Query"**.
3. Copy the contents of [`backend/supabase/migrations/20260805000000_schema.sql`](file:///Users/vishalyadav/Projects/FACULTY_APPRAISAL_FORM%20/backend/supabase/migrations/20260805000000_schema.sql) and paste into the editor.
4. Click **"Run"** to create all tables, enums, JSONB fields, indexes, triggers, and RLS policies.

---

### Step 3: Insert Initial Seed Data
1. In the Supabase SQL Editor, click **"New Query"**.
2. Copy the contents of [`backend/supabase/seed.sql`](file:///Users/vishalyadav/Projects/FACULTY_APPRAISAL_FORM%20/backend/supabase/seed.sql) and paste.
3. Click **"Run"**.

---

### Step 4: Connect the Frontend
1. In your Supabase Dashboard, go to **Project Settings → API**.
2. Copy your **Project URL** and **`anon` Public Key**.
3. Open `frontend/.env.local` (or create it from `frontend/.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_USE_MOCK_DATA=false
```

4. Restart your frontend server:
```bash
cd frontend
npm run dev
```

---

## 📊 Database Schema Summary

- **`profiles`**: Stores faculty credentials, roles (`TEACHER`, `HOD`, `ADMIN_CHAIRMAN`), departments, and designations.
- **`monthly_windows`**: Controls submission lock states per month (e.g., `January 2026`).
- **`appraisals`**: Main record table containing detailed JSONB structures for Categories I, II, III, Duties, and Undertakings.
- **`audit_logs`**: System audit trail tracking all submission, approval, and window lock actions.
