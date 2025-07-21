-- Clean migration: Drop existing tables and recreate properly
-- This fixes the "user_id column does not exist" error

-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS investment_funds CASCADE;
DROP TABLE IF EXISTS investment_categories CASCADE;

-- Recreate investment_categories table with all required columns
CREATE TABLE investment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL,
  user_id uuid NOT NULL,
  profile_name text NOT NULL,
  budget_period_id uuid,
  budget_year integer NOT NULL,
  budget_month integer NOT NULL,
  name text NOT NULL,
  allocation_type text NOT NULL DEFAULT 'percentage' CHECK (allocation_type IN ('percentage', 'amount')),
  allocation_value numeric NOT NULL DEFAULT 0,
  allocated_amount numeric NOT NULL DEFAULT 0,
  invested_amount numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recreate investment_funds table with all required columns
CREATE TABLE investment_funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  user_id uuid NOT NULL,
  profile_name text NOT NULL,
  budget_period_id uuid,
  budget_year integer NOT NULL,
  budget_month integer NOT NULL,
  name text NOT NULL,
  allocated_amount numeric NOT NULL DEFAULT 0,
  invested_amount numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints (only if the referenced tables exist)
DO $$
BEGIN
  -- Check if investment_portfolios table exists and add constraint
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'investment_portfolios') THEN
    ALTER TABLE investment_categories 
    ADD CONSTRAINT investment_categories_portfolio_id_fkey 
    FOREIGN KEY (portfolio_id) REFERENCES investment_portfolios(id) ON DELETE CASCADE;
  END IF;

  -- Check if profiles table exists and add constraint
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE investment_categories 
    ADD CONSTRAINT investment_categories_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

    ALTER TABLE investment_funds 
    ADD CONSTRAINT investment_funds_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- Check if budget_periods table exists and add constraint
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'budget_periods') THEN
    ALTER TABLE investment_categories 
    ADD CONSTRAINT investment_categories_budget_period_id_fkey 
    FOREIGN KEY (budget_period_id) REFERENCES budget_periods(id) ON DELETE CASCADE;

    ALTER TABLE investment_funds 
    ADD CONSTRAINT investment_funds_budget_period_id_fkey 
    FOREIGN KEY (budget_period_id) REFERENCES budget_periods(id) ON DELETE CASCADE;
  END IF;

  -- Add category_id foreign key (this should always work since we just created investment_categories)
  ALTER TABLE investment_funds 
  ADD CONSTRAINT investment_funds_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES investment_categories(id) ON DELETE CASCADE;

EXCEPTION
  WHEN OTHERS THEN 
    RAISE NOTICE 'Error adding foreign keys: %', SQLERRM;
END $$;

-- Create indexes for better performance
CREATE INDEX idx_investment_categories_portfolio_id ON investment_categories(portfolio_id);
CREATE INDEX idx_investment_categories_user_period ON investment_categories(user_id, budget_year, budget_month);
CREATE INDEX idx_investment_categories_user_id ON investment_categories(user_id);
CREATE INDEX idx_investment_funds_category_id ON investment_funds(category_id);
CREATE INDEX idx_investment_funds_user_period ON investment_funds(user_id, budget_year, budget_month);
CREATE INDEX idx_investment_funds_user_id ON investment_funds(user_id);

-- Add unique constraints
ALTER TABLE investment_categories ADD CONSTRAINT investment_categories_portfolio_name_unique UNIQUE(portfolio_id, name);
ALTER TABLE investment_funds ADD CONSTRAINT investment_funds_category_name_unique UNIQUE(category_id, name);

-- Enable Row Level Security
ALTER TABLE investment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_funds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own investment categories" ON investment_categories;
DROP POLICY IF EXISTS "Users can insert their own investment categories" ON investment_categories;
DROP POLICY IF EXISTS "Users can update their own investment categories" ON investment_categories;
DROP POLICY IF EXISTS "Users can delete their own investment categories" ON investment_categories;

DROP POLICY IF EXISTS "Users can view their own investment funds" ON investment_funds;
DROP POLICY IF EXISTS "Users can insert their own investment funds" ON investment_funds;
DROP POLICY IF EXISTS "Users can update their own investment funds" ON investment_funds;
DROP POLICY IF EXISTS "Users can delete their own investment funds" ON investment_funds;

-- Create RLS policies for investment_categories
CREATE POLICY "Users can view their own investment categories" ON investment_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment categories" ON investment_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment categories" ON investment_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment categories" ON investment_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for investment_funds
CREATE POLICY "Users can view their own investment funds" ON investment_funds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment funds" ON investment_funds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment funds" ON investment_funds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment funds" ON investment_funds
  FOR DELETE USING (auth.uid() = user_id);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_investment_categories_updated_at
    BEFORE UPDATE ON investment_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_funds_updated_at
    BEFORE UPDATE ON investment_funds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
