-- Simple script to create investment tables without complex constraints
-- Use this if the previous migration failed

-- Check if tables exist and create basic versions
CREATE TABLE IF NOT EXISTS investment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid,
  user_id uuid,
  profile_name text,
  budget_period_id uuid,
  budget_year integer,
  budget_month integer,
  name text,
  allocation_type text DEFAULT 'percentage',
  allocation_value numeric DEFAULT 0,
  allocated_amount numeric DEFAULT 0,
  invested_amount numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investment_funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid,
  user_id uuid,
  profile_name text,
  budget_period_id uuid,
  budget_year integer,
  budget_month integer,
  name text,
  allocated_amount numeric DEFAULT 0,
  invested_amount numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add basic indexes
CREATE INDEX IF NOT EXISTS idx_investment_categories_user ON investment_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_categories_portfolio ON investment_categories(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_investment_funds_user ON investment_funds(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_funds_category ON investment_funds(category_id);

-- Enable RLS
ALTER TABLE investment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_funds ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY IF NOT EXISTS "investment_categories_user_policy" ON investment_categories
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "investment_funds_user_policy" ON investment_funds
  USING (auth.uid() = user_id);
