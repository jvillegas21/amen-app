#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🔧 Setting up Amenity environment variables...\n');

  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', 'env.example');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('❌ Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('📝 Please provide your Supabase credentials:');
  console.log('   You can find these in your Supabase project dashboard under Settings > API\n');

  const supabaseUrl = await question('🔗 Supabase URL: ');
  const supabaseAnonKey = await question('🔑 Supabase Anon Key: ');

  console.log('\n📝 Optional: OpenAI API Key (for AI features):');
  const openaiKey = await question('🤖 OpenAI API Key (optional): ');

  console.log('\n📝 App Configuration:');
  const appUrl = await question('🌐 App URL (default: https://your-app-domain.com): ') || 'https://your-app-domain.com';
  const appName = await question('📱 App Name (default: Amenity): ') || 'Amenity';

  // Create .env content
  const envContent = `# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}

# OpenAI Configuration
EXPO_PUBLIC_OPENAI_API_KEY=${openaiKey}

# App Configuration
EXPO_PUBLIC_APP_URL=${appUrl}
EXPO_PUBLIC_APP_NAME=${appName}

# Development
NODE_ENV=development
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Environment variables saved to .env file!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run your database schema: Copy and paste the content from database/complete_schema.sql into your Supabase SQL editor');
    console.log('   2. Run RLS policies: Copy and paste the content from database/rls_policies.sql into your Supabase SQL editor');
    console.log('   3. Start your app: npm start or expo start');
    console.log('   4. Test the connection: Navigate to the Supabase Test screen in your app');
  } catch (error) {
    console.error('❌ Error writing .env file:', error.message);
  }

  rl.close();
}

setupEnvironment().catch(console.error);
