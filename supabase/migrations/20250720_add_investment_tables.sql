-- Add missing investment_categories and investment_funds tables
-- These tables were in the original migration but got removed

-- Create investment_categories table
CREATE TABLE IF NOT EXISTS investment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid REFERENCES investment_portfolios(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  profile_name text NOT NULL,
  budget_period_id uuid REFERENCES budget_periods(id) ON DELETE CASCADE,
  budget_year integer NOT NULL,
  budget_month integer NOT NULL,
  name text NOT NULL,
  allocation_type text NOT NULL CHECK (allocation_type IN ('percentage', 'amount')),
  allocation_value numeric NOT NULL DEFAULT 0,
  allocated_amount numeric NOT NULL DEFAULT 0,
  invested_amount numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(portfolio_id, name)
);

-- Create investment_funds table
CREATE TABLE IF NOT EXISTS investment_funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES investment_categories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  profile_name text NOT NULL,
  budget_period_id uuid REFERENCES budget_periods(id) ON DELETE CASCADE,
  budget_year integer NOT NULL,
  budget_month integer NOT NULL,
  name text NOT NULL,
  allocated_amount numeric NOT NULL DEFAULT 0,
  invested_amount numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investment_categories_portfolio_id ON investment_categories(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_investment_categories_user_period ON investment_categories(user_id, budget_year, budget_month);
CREATE INDEX IF NOT EXISTS idx_investment_funds_category_id ON investment_funds(category_id);
CREATE INDEX IF NOT EXISTS idx_investment_funds_user_period ON investment_funds(user_id, budget_year, budget_month);

-- Update the updated_at timestamp automatically
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

-- Add RLS policies
ALTER TABLE investment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_funds ENABLE ROW LEVEL SECURITY;

-- Policies for investment_categories
CREATE POLICY "Users can view their own investment categories" ON investment_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment categories" ON investment_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment categories" ON investment_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment categories" ON investment_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for investment_funds
CREATE POLICY "Users can view their own investment funds" ON investment_funds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment funds" ON investment_funds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment funds" ON investment_funds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment funds" ON investment_funds
  FOR DELETE USING (auth.uid() = user_id);
