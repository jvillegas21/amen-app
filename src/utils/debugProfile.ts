import { supabase } from '@/config/supabase';

/**
 * Debug utility to check profile existence and RLS policies
 */
export async function debugProfile(userId: string): Promise<{
  profileExists: boolean;
  profileData: any;
  error: any;
  rlsWorking: boolean;
}> {
  console.log('🔍 Debugging profile for user:', userId);
  
  try {
    // Check if profile exists with direct query
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    console.log('📊 Profile query result:', { data, error });
    
    // Check RLS policies by trying to insert a test record (this will fail but show RLS status)
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        display_name: 'Test User',
        location_granularity: 'city',
        onboarding_completed: false,
        email_notifications: true,
        push_notifications: true,
      });
    
    console.log('🔒 RLS test result:', { insertError });
    
    return {
      profileExists: !!data,
      profileData: data,
      error: error,
      rlsWorking: insertError?.code === '23505' // Duplicate key means RLS is working
    };
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return {
      profileExists: false,
      profileData: null,
      error: error,
      rlsWorking: false
    };
  }
}

/**
 * Check current user session
 */
export async function debugCurrentUser(): Promise<{
  hasSession: boolean;
  userId: string | null;
  userEmail: string | null;
}> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('👤 Current session:', { session, error });
    
    return {
      hasSession: !!session,
      userId: session?.user?.id || null,
      userEmail: session?.user?.email || null
    };
  } catch (error) {
    console.error('❌ Session debug error:', error);
    return {
      hasSession: false,
      userId: null,
      userEmail: null
    };
  }
}
