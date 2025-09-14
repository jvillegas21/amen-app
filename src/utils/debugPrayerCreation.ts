import { supabase } from '@/config/supabase';
import { prayerService } from '@/services/api/prayerService';

/**
 * Debug utility to test prayer creation and identify issues
 */
export async function debugPrayerCreation(): Promise<{
  success: boolean;
  message: string;
  details: any;
}> {
  console.log('🔍 Debugging prayer creation...');
  
  try {
    // Step 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: 'User not authenticated',
        details: { authError, user }
      };
    }
    console.log('✅ User authenticated:', user.id);

    // Step 2: Check if prayers table exists and is accessible
    const { data: tableCheck, error: tableError } = await supabase
      .from('prayers')
      .select('count')
      .limit(1);
    
    if (tableError) {
      return {
        success: false,
        message: 'Prayers table not accessible',
        details: { tableError }
      };
    }
    console.log('✅ Prayers table accessible');

    // Step 3: Check RLS policies by trying to insert a test prayer
    const testPrayer = {
      text: 'This is a test prayer for debugging purposes. Please help me understand what is happening.',
      privacy_level: 'public' as const,
      location_granularity: 'hidden' as const,
      is_anonymous: false,
      tags: ['test'],
      images: [],
      status: 'open' as const,
    };

    const { data: insertData, error: insertError } = await supabase
      .from('prayers')
      .insert({
        user_id: user.id,
        ...testPrayer,
      })
      .select()
      .single();

    if (insertError) {
      return {
        success: false,
        message: 'Prayer creation failed',
        details: { 
          insertError,
          errorCode: insertError.code,
          errorMessage: insertError.message,
          errorDetails: insertError.details,
          errorHint: insertError.hint
        }
      };
    }

    console.log('✅ Test prayer created successfully:', insertData.id);

    // Step 4: Clean up test prayer
    const { error: deleteError } = await supabase
      .from('prayers')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.warn('⚠️ Failed to clean up test prayer:', deleteError);
    } else {
      console.log('✅ Test prayer cleaned up');
    }

    // Step 5: Test the prayer service
    try {
      const serviceTestPrayer = await prayerService.createPrayer({
        text: 'Service test prayer for debugging',
        privacy_level: 'public',
        is_anonymous: false,
        tags: ['service-test'],
        images: [],
      });

      console.log('✅ Prayer service test successful:', serviceTestPrayer.id);

      // Clean up service test prayer
      await prayerService.deletePrayer(serviceTestPrayer.id);
      console.log('✅ Service test prayer cleaned up');

      return {
        success: true,
        message: 'Prayer creation is working correctly',
        details: {
          directInsert: 'success',
          serviceTest: 'success',
          userId: user.id,
          userEmail: user.email
        }
      };

    } catch (serviceError: any) {
      return {
        success: false,
        message: 'Prayer service test failed',
        details: {
          directInsert: 'success',
          serviceTest: 'failed',
          serviceError: {
            message: serviceError.message,
            code: serviceError.code,
            details: serviceError.details
          }
        }
      };
    }

  } catch (error: any) {
    console.error('❌ Debug error:', error);
    return {
      success: false,
      message: 'Debug failed with unexpected error',
      details: { error: error.message }
    };
  }
}

/**
 * Check database setup status
 */
export async function checkDatabaseSetup(): Promise<{
  tablesExist: boolean;
  rlsEnabled: boolean;
  policiesExist: boolean;
  details: any;
}> {
  console.log('🔍 Checking database setup...');
  
  const requiredTables = [
    'profiles', 'prayers', 'interactions', 'studies', 'groups', 
    'group_members', 'comments', 'notifications', 'support_tickets', 
    'reports', 'user_analytics', 'follows', 'blocked_users', 'direct_messages'
  ];

  const results = {
    tablesExist: false,
    rlsEnabled: false,
    policiesExist: false,
    details: {} as any
  };

  try {
    // Check if tables exist
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        results.details[table] = error ? { exists: false, error } : { exists: true };
      } catch (err) {
        results.details[table] = { exists: false, error: err };
      }
    }

    // Check if RLS is enabled on prayers table
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .limit(1);
      
      // If we can query without RLS, it's not enabled
      results.rlsEnabled = !!error;
    } catch (err) {
      results.rlsEnabled = true; // Error likely means RLS is working
    }

    // Check if policies exist by trying to insert (should fail with RLS)
    try {
      const { error } = await supabase
        .from('prayers')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          text: 'Test',
          privacy_level: 'public',
          location_granularity: 'hidden',
          is_anonymous: false,
          tags: [],
          images: [],
          status: 'open',
        });
      
      results.policiesExist = !!error;
    } catch (err) {
      results.policiesExist = true;
    }

    results.tablesExist = Object.values(results.details).every((table: any) => table.exists);

    return results;

  } catch (error) {
    console.error('❌ Database setup check failed:', error);
    return {
      tablesExist: false,
      rlsEnabled: false,
      policiesExist: false,
      details: { error: error.message }
    };
  }
}
