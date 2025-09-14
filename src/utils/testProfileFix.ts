import { profileService } from '@/services/api/profileService';
import { supabase } from '@/config/supabase';

/**
 * Test the profile fetching fix
 * This will help verify that the PGRST116 error is resolved
 */
export async function testProfileFix(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('🧪 Testing profile fetching fix...');

    // Test 1: Try to get a profile that doesn't exist
    console.log('Test 1: Fetching non-existent profile...');
    const nonExistentProfile = await profileService.getProfile('00000000-0000-0000-0000-000000000000');
    
    if (nonExistentProfile === null) {
      console.log('✅ Test 1 PASSED: Non-existent profile returns null (no error)');
    } else {
      console.log('❌ Test 1 FAILED: Expected null but got:', nonExistentProfile);
      return {
        success: false,
        message: 'Non-existent profile should return null',
        details: { result: nonExistentProfile }
      };
    }

    // Test 2: Check if we have any profiles in the database
    console.log('Test 2: Checking existing profiles...');
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.log('❌ Test 2 FAILED: Error fetching profiles:', profilesError);
      return {
        success: false,
        message: 'Failed to fetch profiles',
        details: { error: profilesError }
      };
    }

    console.log(`✅ Test 2 PASSED: Found ${allProfiles?.length || 0} profiles in database`);

    // Test 3: If we have profiles, test fetching an existing one
    if (allProfiles && allProfiles.length > 0) {
      const existingProfileId = allProfiles[0].id;
      console.log(`Test 3: Fetching existing profile (${existingProfileId})...`);
      
      const existingProfile = await profileService.getProfile(existingProfileId);
      
      if (existingProfile) {
        console.log('✅ Test 3 PASSED: Existing profile fetched successfully');
        console.log(`   Profile: ${existingProfile.display_name}`);
      } else {
        console.log('❌ Test 3 FAILED: Existing profile returned null');
        return {
          success: false,
          message: 'Existing profile should not return null',
          details: { profileId: existingProfileId }
        };
      }
    } else {
      console.log('⏭️ Test 3 SKIPPED: No existing profiles to test');
    }

    // Test 4: Test getOrCreateProfile with non-existent user
    console.log('Test 4: Testing getOrCreateProfile with non-existent user...');
    try {
      const newProfile = await profileService.getOrCreateProfile('test-user-123', 'test@example.com');
      console.log('✅ Test 4 PASSED: getOrCreateProfile created new profile');
      console.log(`   Created profile: ${newProfile.display_name}`);
      
      // Clean up the test profile
      await profileService.deleteProfile('test-user-123');
      console.log('   Test profile cleaned up');
    } catch (createError) {
      console.log('❌ Test 4 FAILED: getOrCreateProfile failed:', createError);
      return {
        success: false,
        message: 'getOrCreateProfile should work for new users',
        details: { error: createError }
      };
    }

    console.log('🎉 All profile tests passed! The PGRST116 error should be fixed.');
    
    return {
      success: true,
      message: 'All profile tests passed successfully',
      details: {
        nonExistentProfileHandled: true,
        existingProfilesCount: allProfiles?.length || 0,
        getOrCreateProfileWorking: true
      }
    };

  } catch (error) {
    console.error('❌ Profile test failed:', error);
    return {
      success: false,
      message: 'Profile test failed with error',
      details: { error: error.message }
    };
  }
}

/**
 * Quick test to verify the fix without creating test data
 */
export async function quickProfileTest(): Promise<boolean> {
  try {
    // Just test that we can call getProfile without errors
    const result = await profileService.getProfile('00000000-0000-0000-0000-000000000000');
    return result === null; // Should return null, not throw error
  } catch (error) {
    console.error('Quick profile test failed:', error);
    return false;
  }
}
