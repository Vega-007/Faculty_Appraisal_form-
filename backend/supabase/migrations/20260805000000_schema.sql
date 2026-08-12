-- ====================================================================
-- SRM FACULTY PERFORMANCE APPRAISAL SYSTEM 2025/2026
-- COMPLETE SUPABASE POSTGRESQL SCHEMA MIGRATION & RLS POLICIES
-- ====================================================================

-- 1. PROFILES TABLE (User Accounts & Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  emp_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'TEACHER',
  department VARCHAR(255) NOT NULL,
  institution VARCHAR(255) DEFAULT 'SRM IST',
  campus VARCHAR(255) DEFAULT 'SRM Ramapuram Campus',
  designation VARCHAR(100) NOT NULL DEFAULT 'Assistant Professor',
  appraisal_access_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MONTHLY SUBMISSION WINDOWS TABLE
CREATE TABLE IF NOT EXISTS public.monthly_windows (
  month_year VARCHAR(50) PRIMARY KEY, -- e.g. "January 2026"
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ NULL
);

-- 3. APPRAISAL RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.appraisals (
  id VARCHAR(100) PRIMARY KEY,
  faculty_id VARCHAR(50) NOT NULL,
  emp_id VARCHAR(50) NOT NULL,
  faculty_name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  institution VARCHAR(255) DEFAULT 'SRM IST',
  campus VARCHAR(255) DEFAULT 'SRM Ramapuram Campus',
  designation VARCHAR(100) NOT NULL DEFAULT 'Assistant Professor',
  month_year VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  
  -- Structured API 2025 JSON Data
  general_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  cat1 JSONB NOT NULL DEFAULT '{}'::jsonb,
  cat2 JSONB NOT NULL DEFAULT '{}'::jsonb,
  cat3 JSONB NOT NULL DEFAULT '{}'::jsonb,
  duties JSONB NOT NULL DEFAULT '{}'::jsonb,
  undertaking JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Scores & Verification
  self_score_total NUMERIC(5,1) NOT NULL DEFAULT 0.0,
  hod_score_total NUMERIC(5,1) NOT NULL DEFAULT 0.0,
  hoi_score_total NUMERIC(5,1) NOT NULL DEFAULT 0.0,
  grade VARCHAR(50) NOT NULL DEFAULT 'Grade C',
  hod_remarks TEXT NULL,
  hoi_remarks TEXT NULL,

  -- Revision & Governance
  revision_flags JSONB DEFAULT '[]'::jsonb,
  revision_remarks TEXT NULL,
  appraisal_access_enabled BOOLEAN DEFAULT TRUE,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add missing columns to public.appraisals if the table already exists
ALTER TABLE public.appraisals ADD COLUMN IF NOT EXISTS institution VARCHAR(255) DEFAULT 'SRM IST';
ALTER TABLE public.appraisals ADD COLUMN IF NOT EXISTS campus VARCHAR(255) DEFAULT 'SRM Ramapuram Campus';
ALTER TABLE public.appraisals ADD COLUMN IF NOT EXISTS revision_flags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.appraisals ADD COLUMN IF NOT EXISTS revision_remarks TEXT NULL;
ALTER TABLE public.appraisals ADD COLUMN IF NOT EXISTS appraisal_access_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.appraisals ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- 4. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NOT NULL
);

-- 5. INDEXES FOR HIGH-PERFORMANCE ANALYTICS
CREATE INDEX IF NOT EXISTS idx_appraisals_dept ON public.appraisals(department);
CREATE INDEX IF NOT EXISTS idx_appraisals_campus ON public.appraisals(campus);
CREATE INDEX IF NOT EXISTS idx_appraisals_inst ON public.appraisals(institution);
CREATE INDEX IF NOT EXISTS idx_appraisals_status ON public.appraisals(status);
CREATE INDEX IF NOT EXISTS idx_appraisals_month ON public.appraisals(month_year);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_logs(timestamp DESC);

-- 6. ENABLE ROW LEVEL SECURITY (RLS) & ADD PERMISSIVE POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Disable strict policy restrictions for anon/authenticated roles to allow smooth API operations
DROP POLICY IF EXISTS "Allow public full access on profiles" ON public.profiles;
CREATE POLICY "Allow public full access on profiles" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public full access on monthly_windows" ON public.monthly_windows;
CREATE POLICY "Allow public full access on monthly_windows" ON public.monthly_windows FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public full access on appraisals" ON public.appraisals;
CREATE POLICY "Allow public full access on appraisals" ON public.appraisals FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public full access on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow public full access on audit_logs" ON public.audit_logs FOR ALL USING (true);

-- 7. SEED INITIAL SUBMISSION WINDOWS
INSERT INTO public.monthly_windows (month_year, is_open)
VALUES 
  ('January 2026', true),
  ('February 2026', true),
  ('March 2026', true)
ON CONFLICT (month_year) DO NOTHING;
