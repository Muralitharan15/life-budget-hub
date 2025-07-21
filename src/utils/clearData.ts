import { supabase } from '../lib/supabase';

export async function clearAllUserData(userId: string) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  console.log('Starting complete data cleanup for user:', userId);
  
  try {
    // Delete in order to avoid foreign key constraint issues
    
    // 1. Delete transaction history
    console.log('Deleting transaction history...');
    const { error: historyError } = await supabase
      .from('transaction_history')
      .delete()
      .eq('user_id', userId);
    if (historyError) console.warn('Transaction history delete error:', historyError);

    // 2. Delete transactions
    console.log('Deleting transactions...');
    const { error: transactionsError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);
    if (transactionsError) console.warn('Transactions delete error:', transactionsError);

    // 3. Delete investment funds
    console.log('Deleting investment funds...');
    const { error: fundsError } = await supabase
      .from('investment_funds')
      .delete()
      .eq('user_id', userId);
    if (fundsError) console.warn('Investment funds delete error:', fundsError);

    // 4. Delete investment categories
    console.log('Deleting investment categories...');
    const { error: categoriesError } = await supabase
      .from('investment_categories')
      .delete()
      .eq('user_id', userId);
    if (categoriesError) console.warn('Investment categories delete error:', categoriesError);

    // 5. Delete investment portfolios
    console.log('Deleting investment portfolios...');
    const { error: portfoliosError } = await supabase
      .from('investment_portfolios')
      .delete()
      .eq('user_id', userId);
    if (portfoliosError) console.warn('Investment portfolios delete error:', portfoliosError);

    // 6. Delete budget configs
    console.log('Deleting budget configs...');
    const { error: configsError } = await supabase
      .from('budget_configs')
      .delete()
      .eq('user_id', userId);
    if (configsError) console.warn('Budget configs delete error:', configsError);

    // 7. Delete budget periods (this should be last)
    console.log('Deleting budget periods...');
    const { error: periodsError } = await supabase
      .from('budget_periods')
      .delete()
      .eq('user_id', userId);
    if (periodsError) console.warn('Budget periods delete error:', periodsError);

    // 8. Delete monthly summaries if they exist
    try {
      console.log('Deleting monthly summaries...');
      const { error: summariesError } = await supabase
        .from('monthly_summaries')
        .delete()
        .eq('user_id', userId);
      if (summariesError) console.warn('Monthly summaries delete error:', summariesError);
    } catch (error) {
      console.warn('Monthly summaries table might not exist:', error);
    }

    console.log('✅ Complete data cleanup finished successfully!');
    console.log('🔄 Please refresh the page to see the clean state.');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error during complete data cleanup:', error);
    throw error;
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).clearAllUserData = clearAllUserData;
}
