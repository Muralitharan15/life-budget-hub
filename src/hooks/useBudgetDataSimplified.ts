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

export function useBudgetDataSimplified(month: number, year: number, profileName: string) {
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBudgetData = async () => {
    if (!user || !profileName || profileName === 'combined') {
      setBudgetConfig(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching simplified budget data for:', { user: user.id, profileName, month, year });

      // Fetch budget config from Supabase only
      const { data: budgetData, error: budgetError } = await supabase
        .from('budget_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_name', profileName)
        .eq('budget_month', month)
        .eq('budget_year', year)
        .maybeSingle();

            if (budgetError && budgetError.code !== 'PGRST116') {
        console.error('Budget config fetch error:', {
          message: budgetError.message,
          code: budgetError.code,
          details: budgetError.details,
          hint: budgetError.hint
        });
        throw budgetError;
      }

      console.log('Fetched budget config:', budgetData);
      setBudgetConfig(budgetData);

        } catch (err) {
      console.error('Fetch budget data error:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        error: err,
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveBudgetConfig = async (config: Partial<BudgetConfig>) => {
    if (!user || !profileName || profileName === 'combined') return;

    try {
      console.log('Saving budget config:', { user: user.id, profileName, month, year, config });
      
      const budgetData = {
        user_id: user.id,
        profile_name: profileName,
        budget_month: month,
        budget_year: year,
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
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('Budget config saved successfully:', data);
      setBudgetConfig(data);
      return data;
        } catch (err) {
      console.error('Save budget config error:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        error: err,
        stack: err instanceof Error ? err.stack : undefined
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [user, month, year, profileName]);

  return {
    budgetConfig,
    loading,
    error,
    saveBudgetConfig,
    refetch: fetchBudgetData
  };
}
