import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface BudgetConfig {
  id: string;
  user_id: string;
  profile_name: string;
  budget_month: number;
  budget_year: number;
  monthly_salary: number;
  budget_percentage: number;
  allocation_need: number;
  allocation_want: number;
  allocation_savings: number;
  allocation_investments: number;
  created_at: string;
  updated_at: string;
}

export interface InvestmentPortfolio {
  id: string;
  user_id: string;
  profile_name: string;
  budget_month: number;
  budget_year: number;
  name: string;
  allocation_type: 'percentage' | 'amount';
  allocation_value: number;
  allocated_amount: number;
  invested_amount: number;
  allow_direct_investment: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: InvestmentCategory[];
}

export interface InvestmentCategory {
  id: string;
  portfolio_id: string;
  user_id: string;
  profile_name: string;
  budget_period_id: string | null;
  budget_year: number;
  budget_month: number;
  name: string;
  allocation_type: 'percentage' | 'amount';
  allocation_value: number;
  allocated_amount: number;
  invested_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  funds?: InvestmentFund[];
}

export interface InvestmentFund {
  id: string;
  category_id: string;
  user_id: string;
  profile_name: string;
  budget_period_id: string | null;
  budget_year: number;
  budget_month: number;
  name: string;
  allocated_amount: number;
  invested_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  profile_name: string;
  budget_month: number;
  budget_year: number;
  type: 'expense' | 'income' | 'refund' | 'investment' | 'savings' | 'transfer';
    category: 'need' | 'want' | 'savings' | 'investments' | 'unplanned';
  amount: number;
  description?: string;
  notes?: string;
  transaction_date: string;
  transaction_time?: string;
  payment_type?: 'cash' | 'card' | 'upi' | 'netbanking' | 'cheque' | 'other';
  spent_for?: string;
  tag?: string;
  portfolio_id?: string;
  investment_type?: string;
  refund_for?: string;
  original_transaction_id?: string;
  status: 'active' | 'cancelled' | 'refunded' | 'partial_refund';
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export function useBudgetData(month: number, year: number, profileName: string) {
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [portfolios, setPortfolios] = useState<InvestmentPortfolio[]>([]);
  const [categories, setCategories] = useState<InvestmentCategory[]>([]);
  const [funds, setFunds] = useState<InvestmentFund[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBudgetData = async () => {
        if (!user || !profileName) {
      setBudgetConfig(null);
      setPortfolios([]);
      setCategories([]);
      setFunds([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

                                                console.log('Fetching budget data for:', { user: user.id, profileName, month, year });
      console.log('✅ Error logging system active - detailed errors will show with error IDs');

            // Fetch budget config for specific profile
      // First try with profile_name column (new schema), fallback to without it (old schema)
      let budgetData = null;
      let budgetError = null;

      try {
        const { data, error } = await supabase
          .from('budget_configs')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_name', profileName)
                              .eq('budget_month', month)
          .eq('budget_year', year)
          .maybeSingle();
        budgetData = data;
        budgetError = error;
      } catch (err) {
        // Profile_name column doesn't exist yet, try without it
        console.log('Trying fallback query without profile_name column');
        const { data, error } = await supabase
          .from('budget_configs')
          .select('*')
          .eq('user_id', user.id)
                              .eq('budget_month', month)
          .eq('budget_year', year)
          .maybeSingle();
        budgetData = data;
        budgetError = error;

        // Add profile_name to the data for consistency
        if (budgetData) {
          budgetData.profile_name = profileName;
        }
      }

            if (budgetError && budgetError.code !== 'PGRST116') {
                                        console.error('Budget config fetch error:', {
          errorId: 'BUDGET_CONFIG_FETCH_001',
          source: 'useBudgetData.ts',
          timestamp: new Date().toISOString(),
          message: budgetError?.message || 'No message available',
          code: budgetError?.code || 'No code available',
          details: budgetError?.details || 'No details available',
          hint: budgetError?.hint || 'No hint available',
          rawError: budgetError,
          user: user.id,
          profileName,
          month,
          year
        });
        throw budgetError;
      }

                  console.log('Fetched budget config:', budgetData);
      setBudgetConfig(budgetData);

            // Fetch investment portfolios for specific profile
      let portfolioData = null;
      let portfolioError = null;

      try {
        const { data, error } = await supabase
          .from('investment_portfolios')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_name', profileName)
                              .eq('budget_month', month)
          .eq('budget_year', year)
          .eq('is_active', true);
        portfolioData = data;
        portfolioError = error;
      } catch (err) {
        // Profile_name column doesn't exist yet, try without it
        console.log('Trying fallback query for portfolios without profile_name column');
        const { data, error } = await supabase
          .from('investment_portfolios')
          .select('*')
          .eq('user_id', user.id)
                              .eq('budget_month', month)
          .eq('budget_year', year)
          .eq('is_active', true);
        portfolioData = data;
        portfolioError = error;

        // Add profile_name to the data for consistency
        if (portfolioData) {
          portfolioData = portfolioData.map((p: any) => ({ ...p, profile_name: profileName }));
        }
      }

                  if (portfolioError) {
                console.error('Portfolio fetch error:', {
          errorId: 'PORTFOLIO_FETCH_002',
          source: 'useBudgetData.ts',
          timestamp: new Date().toISOString(),
          message: portfolioError?.message || 'No message available',
          code: portfolioError?.code || 'No code available',
          details: portfolioError?.details || 'No details available',
          hint: portfolioError?.hint || 'No hint available',
          rawError: portfolioError,
          user: user.id,
          profileName,
          month,
          year
        });
        throw portfolioError;
      }

            console.log('Fetched portfolios:', portfolioData);
      setPortfolios(portfolioData || []);

            // Fetch investment categories
      let categoryData = null;
      let categoryError = null;

      try {
        const { data, error } = await supabase
          .from('investment_categories')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_name', profileName)
                              .eq('budget_month', month)
          .eq('budget_year', year)
          .eq('is_active', true);
        categoryData = data;
        categoryError = error;
      } catch (err) {
        console.log('Primary categories query failed, trying fallback...', err);
        try {
          const { data, error } = await supabase
            .from('investment_categories')
            .select('*')
            .eq('user_id', user.id)
                                .eq('budget_month', month)
            .eq('budget_year', year)
            .eq('is_active', true);
          categoryData = data;
          categoryError = error;

          if (categoryData) {
            categoryData = categoryData.map((c: any) => ({ ...c, profile_name: profileName }));
          }
        } catch (fallbackErr) {
          console.warn('Categories table might not exist yet:', fallbackErr);
          categoryData = [];
          categoryError = null; // Don't treat this as an error
        }
      }

            if (categoryError) {
        console.error('Category fetch error:', {
          message: categoryError.message,
          details: categoryError.details,
          hint: categoryError.hint,
          code: categoryError.code,
          full_error: categoryError
        });
        // Don't fail the whole fetch, just set empty array
        setCategories([]);
      } else {
        console.log('Fetched categories:', categoryData);
        setCategories(categoryData || []);
      }

            // Fetch investment funds
      let fundData = null;
      let fundError = null;

      try {
        const { data, error } = await supabase
          .from('investment_funds')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_name', profileName)
                              .eq('budget_month', month)
          .eq('budget_year', year)
          .eq('is_active', true);
        fundData = data;
        fundError = error;
      } catch (err) {
        console.log('Primary funds query failed, trying fallback...', err);
        try {
          const { data, error } = await supabase
            .from('investment_funds')
            .select('*')
            .eq('user_id', user.id)
                                .eq('budget_month', month)
            .eq('budget_year', year)
            .eq('is_active', true);
          fundData = data;
          fundError = error;

          if (fundData) {
            fundData = fundData.map((f: any) => ({ ...f, profile_name: profileName }));
          }
        } catch (fallbackErr) {
          console.warn('Funds table might not exist yet:', fallbackErr);
          fundData = [];
          fundError = null; // Don't treat this as an error
        }
      }

            if (fundError) {
                        console.error('Fund fetch error:', {
          source: 'useBudgetData.ts',
          timestamp: new Date().toISOString(),
          message: fundError?.message || 'No message available',
          details: fundError?.details || 'No details available',
          hint: fundError?.hint || 'No hint available',
          code: fundError?.code || 'No code available',
          rawError: fundError
        });
        // Don't fail the whole fetch, just set empty array
        setFunds([]);
      } else {
        console.log('Fetched funds:', fundData);
        setFunds(fundData || []);
      }

                  // Build nested portfolio structure
      const portfoliosWithCategories = (portfolioData || []).map((portfolio: InvestmentPortfolio) => {
        const portfolioCategories = (categoryData || [])
          .filter((cat: InvestmentCategory) => cat.portfolio_id === portfolio.id)
          .map((category: InvestmentCategory) => ({
            ...category,
            funds: (fundData || []).filter((fund: InvestmentFund) => fund.category_id === category.id)
          }));

        return {
          ...portfolio,
          categories: portfolioCategories
        };
      });

      setPortfolios(portfoliosWithCategories);

            // Fetch transactions for specific profile
      let transactionData = null;
      let transactionError = null;

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_name', profileName)
                              .eq('budget_month', month)
          .eq('budget_year', year)
          .eq('is_deleted', false)
          .order('transaction_date', { ascending: false });
        transactionData = data;
        transactionError = error;
      } catch (err) {
        // Profile_name column doesn't exist yet, try without it
        console.log('Trying fallback query for transactions without profile_name column');
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
                              .eq('budget_month', month)
          .eq('budget_year', year)
          .eq('is_deleted', false)
          .order('transaction_date', { ascending: false });
        transactionData = data;
        transactionError = error;

        // Add profile_name to the data for consistency
        if (transactionData) {
          transactionData = transactionData.map((t: any) => ({ ...t, profile_name: profileName }));
        }
      }

            if (transactionError) {
        console.error('Transaction fetch error:', {
          message: transactionError.message,
          code: transactionError.code,
          details: transactionError.details,
          user: user.id,
          profileName,
          month,
          year
        });
        throw transactionError;
      }

      console.log('Fetched transactions:', transactionData);
      setTransactions(transactionData || []);
        } catch (err) {
                        console.error('Fetch budget data error:', {
        errorId: 'FETCH_BUDGET_DATA_003',
        source: 'useBudgetData.ts',
        timestamp: new Date().toISOString(),
        message: err instanceof Error ? err.message : 'Unknown error',
        rawError: err,
        user: user?.id,
        profileName,
        month,
        year,
        stack: err instanceof Error ? err.stack : undefined,
        errorString: String(err)
      });
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveBudgetConfig = async (config: Partial<BudgetConfig>) => {
    if (!user || !profileName) return;

    try {
            console.log('Saving budget config:', { user: user.id, profileName, month, year, config });

      // First, ensure we have a budget period
      const currentDate = new Date();
      const validMonth = month && month >= 1 && month <= 12 ? month : currentDate.getMonth() + 1;
      const validYear = year && year >= 2020 ? year : currentDate.getFullYear();

      let budgetPeriodId = null;

      // Find or create budget period
      const { data: existingPeriod, error: periodError } = await supabase
        .from('budget_periods')
        .select('id')
        .eq('user_id', user.id)
        .eq('budget_month', validMonth)
        .eq('budget_year', validYear)
        .maybeSingle();

      if (periodError && periodError.code !== 'PGRST116') {
        console.error('Error finding budget period for config:', periodError);
        throw new Error(`Failed to find budget period: ${periodError.message}`);
      }

      if (existingPeriod) {
        budgetPeriodId = existingPeriod.id;
        console.log('Found existing budget period for config:', budgetPeriodId);
      } else {
        // Create new budget period
        console.log('Creating new budget period for config...');
        const { data: newPeriod, error: createError } = await supabase
          .from('budget_periods')
          .insert({
            user_id: user.id,
            budget_month: validMonth,
            budget_year: validYear,
            is_active: true,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating budget period for config:', createError);
          throw new Error(`Failed to create budget period: ${createError.message}`);
        }

        if (newPeriod) {
          budgetPeriodId = newPeriod.id;
          console.log('Created new budget period for config:', budgetPeriodId);
        } else {
          throw new Error("Budget period creation returned no data");
        }
      }
      
                        const budgetData = {
        user_id: user.id,
        profile_name: profileName,
        budget_period_id: budgetPeriodId,
                budget_month: validMonth,
        budget_year: validYear,
        monthly_salary: config.monthly_salary || 0,
        budget_percentage: config.budget_percentage || 100,
        allocation_need: config.allocation_need || 0,
        allocation_want: config.allocation_want || 0,
        allocation_savings: config.allocation_savings || 0,
        allocation_investments: config.allocation_investments || 0,
      };

      console.log('Budget data to save:', budgetData);

      const { data, error } = await supabase
        .from('budget_configs')
        .upsert(budgetData, {
          onConflict: 'user_id,profile_name,budget_year,budget_month'
        })
        .select()
        .single();

            if (error) {
        console.error('Error saving budget config:', {
          errorId: 'SAVE_BUDGET_CONFIG_004',
          source: 'useBudgetData.ts',
          timestamp: new Date().toISOString(),
          message: error?.message || 'No message available',
          code: error?.code || 'No code available',
          details: error?.details || 'No details available',
          hint: error?.hint || 'No hint available',
          rawError: error
        });
        throw error;
      }
      
      console.log('Budget config saved successfully:', data);
      setBudgetConfig(data);
      return data;
    } catch (err) {
      console.error('Save budget config error:', err);
      throw err;
    }
  };

    const saveInvestmentPortfolio = async (portfolio: Partial<InvestmentPortfolio>) => {
    if (!user || !profileName) return;

    try {
      // First, ensure we have a budget period
      const currentDate = new Date();
      const validMonth = month && month >= 1 && month <= 12 ? month : currentDate.getMonth() + 1;
      const validYear = year && year >= 2020 ? year : currentDate.getFullYear();

      let budgetPeriodId = null;

      // Find or create budget period
      const { data: existingPeriod, error: periodError } = await supabase
        .from('budget_periods')
        .select('id')
        .eq('user_id', user.id)
        .eq('budget_month', validMonth)
        .eq('budget_year', validYear)
        .maybeSingle();

      if (periodError && periodError.code !== 'PGRST116') {
        console.error('Error finding budget period for portfolio:', periodError);
        throw new Error(`Failed to find budget period: ${periodError.message}`);
      }

      if (existingPeriod) {
        budgetPeriodId = existingPeriod.id;
        console.log('Found existing budget period for portfolio:', budgetPeriodId);
      } else {
        // Create new budget period
        console.log('Creating new budget period for portfolio...');
        const { data: newPeriod, error: createError } = await supabase
          .from('budget_periods')
          .insert({
            user_id: user.id,
            budget_month: validMonth,
            budget_year: validYear,
            is_active: true,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating budget period for portfolio:', createError);
          throw new Error(`Failed to create budget period: ${createError.message}`);
        }

        if (newPeriod) {
          budgetPeriodId = newPeriod.id;
          console.log('Created new budget period for portfolio:', budgetPeriodId);
        } else {
          throw new Error("Budget period creation returned no data");
        }
      }

      const portfolioData = {
                ...portfolio,
        user_id: user.id,
        profile_name: profileName,
        budget_period_id: budgetPeriodId,
                budget_month: validMonth,
        budget_year: validYear,
      };

      const { data, error } = await supabase
        .from('investment_portfolios')
        .insert(portfolioData)
        .select()
        .single();

      if (error) throw error;
      setPortfolios(prev => [...prev, data]);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateInvestmentPortfolio = async (id: string, updates: Partial<InvestmentPortfolio>) => {
    if (!user || !profileName) return;

    try {
      const { data, error } = await supabase
        .from('investment_portfolios')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('profile_name', profileName)
        .select()
        .single();

      if (error) throw error;
      setPortfolios(prev => prev.map(p => p.id === id ? data : p));
      return data;
    } catch (err) {
      throw err;
    }
  };

  const deleteInvestmentPortfolio = async (id: string) => {
    if (!user || !profileName) return;

    try {
      const { error } = await supabase
        .from('investment_portfolios')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('profile_name', profileName);

      if (error) throw error;
      setPortfolios(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw err;
    }
  };

      const addTransaction = async (transaction: Partial<Transaction>) => {
    if (!user || !profileName) return;

        console.log('addTransaction called with:', {
      month,
      year,
      profileName,
      user: user.id,
      transaction: transaction
        });

        // Ensure we have valid month and year values, with proper validation and fallbacks
    const currentDate = new Date();

    let validMonth: number;
    let validYear: number;

    // More robust validation and fallback for month
    if (month && typeof month === 'number' && month >= 1 && month <= 12) {
      validMonth = month;
    } else {
      validMonth = currentDate.getMonth() + 1;
      console.warn('Invalid or missing month, using current month:', { originalMonth: month, validMonth });
    }

    // More robust validation and fallback for year
    if (year && typeof year === 'number' && year >= 2020 && year <= 2050) {
      validYear = year;
    } else {
      validYear = currentDate.getFullYear();
      console.warn('Invalid or missing year, using current year:', { originalYear: year, validYear });
    }

    // Final validation to ensure we have non-null values
    if (!validMonth || !validYear || typeof validMonth !== 'number' || typeof validYear !== 'number') {
      const error = new Error(`Failed to determine valid month/year: validMonth=${validMonth}, validYear=${validYear}`);
      console.error('addTransaction final validation failed:', {
        errorId: 'INVALID_MONTH_YEAR_006',
        source: 'useBudgetData.ts',
        timestamp: new Date().toISOString(),
        originalMonth: month,
        originalYear: year,
        validMonth,
        validYear,
        profileName,
        user: user.id
      });
      throw error;
    }

    // Initialize budget period ID
    let budgetPeriodId = null;

            try {
      // First, ensure we have a budget period

            console.log('Looking for budget period:', {
        user_id: user.id,
        budget_month: validMonth,
        budget_year: validYear,
        original_month: month,
        original_year: year,
        validMonth_type: typeof validMonth,
        validYear_type: typeof validYear,
        validMonth_value: validMonth,
        validYear_value: validYear
      });

      // Additional validation before database operations
      if (!user.id || !validMonth || !validYear ||
          typeof validMonth !== 'number' || typeof validYear !== 'number' ||
          validMonth < 1 || validMonth > 12 || validYear < 2020 || validYear > 2050) {
        throw new Error(`Invalid parameters for budget period: user_id=${user.id}, month=${validMonth}, year=${validYear}`);
      }

      const { data: existingPeriod, error: periodError } = await supabase
        .from('budget_periods')
        .select('id')
        .eq('user_id', user.id)
        .eq('budget_month', validMonth)
        .eq('budget_year', validYear)
        .maybeSingle();

      if (periodError && periodError.code !== 'PGRST116') {
        console.error('Error finding budget period:', periodError);
        throw new Error(`Failed to find budget period: ${periodError.message}`);
      }

      if (existingPeriod) {
        budgetPeriodId = existingPeriod.id;
        console.log('Found existing budget period:', budgetPeriodId);
            } else {
        // Create new budget period
        const budgetPeriodData = {
          user_id: user.id,
          budget_month: validMonth,
          budget_year: validYear,
          is_active: true,
        };

        console.log('Creating new budget period with data:', budgetPeriodData);

        // Final validation before insert
        if (!budgetPeriodData.user_id || !budgetPeriodData.budget_month || !budgetPeriodData.budget_year) {
          throw new Error(`Cannot create budget period with null values: ${JSON.stringify(budgetPeriodData)}`);
        }

                const { data: newPeriod, error: createError } = await supabase
          .from('budget_periods')
          .insert(budgetPeriodData)
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating budget period:', {
            createError,
            budgetPeriodData,
            user_id: user.id,
            budget_month: validMonth,
            budget_year: validYear,
            validMonth_type: typeof validMonth,
            validYear_type: typeof validYear,
            errorMessage: createError.message,
            errorCode: createError.code,
            errorDetails: createError.details,
            errorHint: createError.hint
          });
          throw new Error(`Failed to create budget period: ${createError.message}`);
        }

        if (newPeriod) {
          budgetPeriodId = newPeriod.id;
          console.log('Created new budget period:', budgetPeriodId);
        } else {
          throw new Error("Budget period creation returned no data");
                }
      }

      // Validate that we have a valid budget_period_id
      if (!budgetPeriodId) {
        throw new Error("Failed to create or find budget period - cannot insert transaction");
      }

            // Verify the budget period actually exists and has valid data
      const { data: periodCheck, error: checkError } = await supabase
        .from('budget_periods')
        .select('id, budget_year, budget_month, user_id, is_active')
        .eq('id', budgetPeriodId)
        .single();

      if (checkError || !periodCheck) {
        console.error('Budget period validation failed:', checkError);
        throw new Error(`Budget period ${budgetPeriodId} does not exist or is not accessible`);
      }

      console.log('Budget period verified:', periodCheck);

            // Check if the budget period has null budget_year or budget_month (corrupted data)
      // Also handle cases where values might be undefined, 0, or other falsy values
      const hasValidYear = periodCheck.budget_year && typeof periodCheck.budget_year === 'number' && periodCheck.budget_year > 2000;
      const hasValidMonth = periodCheck.budget_month && typeof periodCheck.budget_month === 'number' && periodCheck.budget_month >= 1 && periodCheck.budget_month <= 12;

      if (!hasValidYear || !hasValidMonth) {
        console.warn('Found corrupted budget period with invalid year/month, fixing it:', {
          id: budgetPeriodId,
          current_year: periodCheck.budget_year,
          current_month: periodCheck.budget_month,
          expected_year: validYear,
          expected_month: validMonth
        });

        // Delete and recreate the corrupted budget period to ensure clean state
        console.log('Deleting corrupted budget period and recreating...');

                // First, clean up any related data that might reference this corrupted budget period
        console.log('Cleaning up related data for corrupted budget period...');

        // Clean up any transactions that might reference this corrupted period
        try {
          await supabase
            .from('transactions')
            .delete()
            .eq('budget_period_id', budgetPeriodId);
        } catch (cleanupError) {
          console.warn('Error cleaning up transactions:', cleanupError);
        }

        // Clean up any budget configs that might reference this period
        try {
          await supabase
            .from('budget_configs')
            .delete()
            .eq('budget_period_id', budgetPeriodId);
        } catch (cleanupError) {
          console.warn('Error cleaning up budget configs:', cleanupError);
        }

        // Clean up any investment portfolios that might reference this period
        try {
          await supabase
            .from('investment_portfolios')
            .delete()
            .eq('budget_period_id', budgetPeriodId);
        } catch (cleanupError) {
          console.warn('Error cleaning up investment portfolios:', cleanupError);
        }

        // Delete the corrupted period
        const { error: deleteError } = await supabase
          .from('budget_periods')
          .delete()
          .eq('id', budgetPeriodId);

        if (deleteError) {
          console.error('Failed to delete corrupted budget period:', deleteError);
          // Don't throw here, continue to recreate
        }

        // Create a new budget period
        const { data: newPeriod, error: createError } = await supabase
          .from('budget_periods')
          .insert({
            user_id: user.id,
            budget_month: validMonth,
            budget_year: validYear,
            is_active: true,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Failed to recreate budget period:', createError);
          throw new Error(`Failed to recreate budget period: ${createError.message}`);
        }

        if (newPeriod) {
          budgetPeriodId = newPeriod.id;
          console.log('Successfully recreated budget period with new ID:', budgetPeriodId);
        } else {
          throw new Error("Budget period recreation returned no data");
        }
      } else {
        // Validate that the existing budget period matches our expected month/year
        if (periodCheck.budget_year !== validYear || periodCheck.budget_month !== validMonth) {
          console.warn('Budget period year/month mismatch, updating:', {
            expected: { month: validMonth, year: validYear },
            found: { month: periodCheck.budget_month, year: periodCheck.budget_year }
          });

          // Update the budget period to match our expected values
          const { error: updateError } = await supabase
            .from('budget_periods')
            .update({
              budget_year: validYear,
              budget_month: validMonth
            })
            .eq('id', budgetPeriodId);

          if (updateError) {
            console.error('Failed to update budget period month/year:', updateError);
            throw new Error(`Failed to update budget period: ${updateError.message}`);
          }

          console.log('Updated budget period month/year to match transaction');
        }
      }

      // Final verification that the budget period is now valid
      const { data: finalCheck, error: finalError } = await supabase
        .from('budget_periods')
        .select('id, budget_year, budget_month')
        .eq('id', budgetPeriodId)
        .single();

      if (finalError || !finalCheck || !finalCheck.budget_year || !finalCheck.budget_month) {
        throw new Error(`Budget period validation failed after repair: ${JSON.stringify(finalCheck)}`);
      }

      console.log('Budget period final verification passed:', finalCheck);

                        const transactionData = {
                ...transaction,
        user_id: user.id,
        profile_name: profileName,
        budget_period_id: budgetPeriodId,
                budget_month: validMonth,
        budget_year: validYear,
        transaction_date: transaction.transaction_date || new Date().toISOString().split('T')[0],
      };

      console.log('Transaction data to insert:', transactionData);

      // Final validation before insert
      if (!transactionData.user_id || !transactionData.budget_period_id ||
          !transactionData.budget_month || !transactionData.budget_year) {
        throw new Error(`Invalid transaction data: ${JSON.stringify({
          user_id: transactionData.user_id,
          budget_period_id: transactionData.budget_period_id,
          budget_month: transactionData.budget_month,
          budget_year: transactionData.budget_year
        })}`);
      }

            console.log('About to insert transaction with data:', JSON.stringify(transactionData, null, 2));
      console.log('Budget period being referenced:', {
        budgetPeriodId,
        validMonth,
        validYear,
        profileName,
        user_id: user.id
      });

      // Additional check: verify budget period still exists and is valid right before insert
      const { data: preInsertCheck, error: preInsertError } = await supabase
        .from('budget_periods')
        .select('id, budget_year, budget_month, user_id')
        .eq('id', budgetPeriodId)
        .single();

      if (preInsertError || !preInsertCheck) {
        throw new Error(`Budget period disappeared before transaction insert: ${preInsertError?.message}`);
      }

      if (!preInsertCheck.budget_year || !preInsertCheck.budget_month) {
        throw new Error(`Budget period still has null values: ${JSON.stringify(preInsertCheck)}`);
      }

            console.log('Pre-insert budget period check passed:', preInsertCheck);
      console.log('Inserting transaction into database...');

      // First attempt: try to insert the transaction
      let { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      console.log('Transaction insert result:', { data, error });

      // If we get a budget_periods constraint error, try to fix it and retry
      if (error && error.code === '23502' && error.message.includes('budget_periods')) {
        console.warn('Database trigger/constraint issue detected, attempting recovery...');

        // Delete and recreate the budget period to ensure clean state
        console.log('Deleting and recreating budget period due to constraint issue...');

        // Delete the problematic budget period
        await supabase
          .from('budget_periods')
          .delete()
          .eq('id', budgetPeriodId);

        // Create a completely fresh budget period
        const { data: newPeriod, error: createError } = await supabase
          .from('budget_periods')
          .insert({
            user_id: user.id,
            budget_month: validMonth,
            budget_year: validYear,
            is_active: true,
          })
          .select('id')
          .single();

        if (createError || !newPeriod) {
          throw new Error(`Failed to recreate budget period: ${createError?.message}`);
        }

        // Update transaction data with new budget period ID
        const updatedTransactionData = {
          ...transactionData,
          budget_period_id: newPeriod.id
        };

        console.log('Retrying transaction insert with new budget period:', newPeriod.id);

        // Retry the transaction insert
        const retryResult = await supabase
          .from('transactions')
          .insert(updatedTransactionData)
          .select()
          .single();

        data = retryResult.data;
        error = retryResult.error;

        console.log('Retry transaction insert result:', { data, error });
      }

            if (error) throw error;
      setTransactions(prev => [data, ...prev]);
      return data;
        } catch (err) {
      const errorDetails = {
        errorId: 'ADD_TRANSACTION_007',
        source: 'useBudgetData.ts',
        timestamp: new Date().toISOString(),
        message: err instanceof Error ? err.message : 'Unknown error',
        code: err?.code || 'No code available',
        details: err?.details || 'No details available',
        hint: err?.hint || 'No hint available',
        user: user.id,
        profileName,
        validMonth,
        validYear,
        budgetPeriodId,
        transactionData: JSON.stringify(transaction, null, 2),
        errorString: String(err),
        errorJson: JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
      };

      console.error('addTransaction error details:', errorDetails);
      console.error('Raw error object:', err);

      throw err;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user || !profileName) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('profile_name', profileName)
        .select()
        .single();

      if (error) throw error;
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      return data;
    } catch (err) {
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user || !profileName) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('profile_name', profileName);

      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const refundTransaction = async (originalTransactionId: string, refundAmount: number, reason: string) => {
    if (!user || !profileName) return;

    try {
      // Create refund transaction
      const refundData = {
                user_id: user.id,
        profile_name: profileName,
                budget_month: month,
        budget_year: year,
        type: 'refund' as const,
        category: 'need' as const, // Will be updated based on original transaction
        amount: refundAmount,
        description: `Refund: ${reason}`,
        transaction_date: new Date().toISOString().split('T')[0],
        refund_for: originalTransactionId,
        status: 'active' as const,
      };

      const { data: refundTransaction, error: refundError } = await supabase
        .from('transactions')
        .insert(refundData)
        .select()
        .single();

      if (refundError) throw refundError;

      // Update original transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: refundAmount === transactions.find(t => t.id === originalTransactionId)?.amount 
            ? 'refunded' 
            : 'partial_refund',
          original_transaction_id: refundTransaction.id
        })
        .eq('id', originalTransactionId)
        .eq('user_id', user.id)
        .eq('profile_name', profileName);

      if (updateError) throw updateError;

      // Refresh data
      await fetchBudgetData();
      return refundTransaction;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [user, month, year, profileName]);

      const deleteBudgetConfig = async () => {
    if (!user || !profileName) return;

    try {
      const { error } = await supabase
        .from('budget_configs')
        .delete()
        .eq('user_id', user.id)
        .eq('profile_name', profileName)
        .eq('budget_month', month)
        .eq('budget_year', year);

      if (error) throw error;
      setBudgetConfig(null);
    } catch (err) {
      throw err;
    }
  };

  const deleteAllInvestmentPortfolios = async () => {
    if (!user || !profileName) return;

    try {
      // Delete funds first
      await supabase
        .from('investment_funds')
        .delete()
        .eq('user_id', user.id)
        .eq('profile_name', profileName)
        .eq('budget_month', month)
        .eq('budget_year', year);

      // Delete categories
      await supabase
        .from('investment_categories')
        .delete()
        .eq('user_id', user.id)
        .eq('profile_name', profileName)
        .eq('budget_month', month)
        .eq('budget_year', year);

      // Delete portfolios
      const { error } = await supabase
        .from('investment_portfolios')
        .delete()
        .eq('user_id', user.id)
        .eq('profile_name', profileName)
        .eq('budget_month', month)
        .eq('budget_year', year);

      if (error) throw error;

      setPortfolios([]);
      setCategories([]);
      setFunds([]);
    } catch (err) {
      throw err;
    }
  };

  const deleteAllTransactions = async () => {
    if (!user || !profileName) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('profile_name', profileName)
        .eq('budget_month', month)
        .eq('budget_year', year)
        .eq('is_deleted', false);

      if (error) throw error;
      setTransactions([]);
    } catch (err) {
      throw err;
    }
  };

  return {
    budgetConfig,
    portfolios,
    categories,
    funds,
    transactions,
    loading,
    error,
    saveBudgetConfig,
    saveInvestmentPortfolio,
    updateInvestmentPortfolio,
    deleteInvestmentPortfolio,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refundTransaction,
    deleteBudgetConfig,
    deleteAllInvestmentPortfolios,
    deleteAllTransactions,
        refetch: fetchBudgetData,
    deleteAllUserData: async () => {
      if (!user) {
        throw new Error("User authentication required");
      }

      try {
        console.log('Starting complete data cleanup for user:', user.id);

        // Delete in order to avoid foreign key constraint issues

        // 1. Delete transaction history
        console.log('Deleting transaction history...');
        await supabase
          .from('transaction_history')
          .delete()
          .eq('user_id', user.id);

        // 2. Delete transactions
        console.log('Deleting transactions...');
        await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id);

        // 3. Delete investment funds
        console.log('Deleting investment funds...');
        await supabase
          .from('investment_funds')
          .delete()
          .eq('user_id', user.id);

        // 4. Delete investment categories
        console.log('Deleting investment categories...');
        await supabase
          .from('investment_categories')
          .delete()
          .eq('user_id', user.id);

        // 5. Delete investment portfolios
        console.log('Deleting investment portfolios...');
        await supabase
          .from('investment_portfolios')
          .delete()
          .eq('user_id', user.id);

        // 6. Delete budget configs
        console.log('Deleting budget configs...');
        await supabase
          .from('budget_configs')
          .delete()
          .eq('user_id', user.id);

        // 7. Delete budget periods (this should be last)
        console.log('Deleting budget periods...');
        await supabase
          .from('budget_periods')
          .delete()
          .eq('user_id', user.id);

        // 8. Delete monthly summaries if they exist
        try {
          console.log('Deleting monthly summaries...');
          await supabase
            .from('monthly_summaries')
            .delete()
            .eq('user_id', user.id);
        } catch (error) {
          console.warn('Monthly summaries table might not exist:', error);
        }

        console.log('Complete data cleanup finished successfully');

        // Reset local state
        setBudgetConfig(null);
        setPortfolios([]);
        setCategories([]);
        setFunds([]);
        setTransactions([]);

        // Refresh data
        await fetchBudgetData();

        return { success: true };
      } catch (error) {
        console.error('Error during complete data cleanup:', error);
        throw error;
      }
    }
  };
}
