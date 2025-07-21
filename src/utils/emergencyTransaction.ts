import { supabase } from '../lib/supabase';

export async function emergencyAddTransaction(transaction: any, user: any, profileName: string, month: number, year: number) {
  if (!user || !profileName) {
    throw new Error("User or profile name is required");
  }

  try {
    console.log('🚨 Using EMERGENCY transaction insertion (bypassing budget periods)...');
    
    const currentDate = new Date();
    const validMonth = month && month >= 1 && month <= 12 ? month : currentDate.getMonth() + 1;
    const validYear = year && year >= 2020 ? year : currentDate.getFullYear();
    
    // Create minimal transaction data without budget_period_id
    const emergencyTransactionData = {
      ...transaction,
      user_id: user.id,
      profile_name: profileName,
      budget_period_id: null, // Bypass budget periods entirely
      budget_month: validMonth,
      budget_year: validYear,
      transaction_date: transaction.transaction_date || new Date().toISOString().split('T')[0],
    };

    console.log('Emergency transaction data:', emergencyTransactionData);

    const { data, error } = await supabase
      .from('transactions')
      .insert(emergencyTransactionData)
      .select()
      .single();

    if (error) {
      console.error('❌ Emergency insertion failed:', error);
      throw error;
    }

    console.log('✅ Emergency transaction insertion successful:', data);
    return data;
  } catch (err) {
    console.error('❌ Emergency transaction insertion failed:', err);
    throw err;
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).emergencyAddTransaction = emergencyAddTransaction;
}
