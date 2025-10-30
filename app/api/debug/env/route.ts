import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  // Get all environment variable keys
  const allEnvKeys = Object.keys(process.env);
  
  // Filter relevant keys
  const telnyxKeys = allEnvKeys.filter(k => k.includes('TELNYX'));
  const supabaseKeys = allEnvKeys.filter(k => k.includes('SUPABASE'));
  const nodeEnv = process.env.NODE_ENV;
  
  // Check for potential typos or case variations
  const similarKeys = allEnvKeys.filter(k => 
    k.toUpperCase().includes('TELNY') || 
    k.toUpperCase().includes('TELNYX') ||
    k.toLowerCase().includes('telnyx') ||
    k.includes('SMS') ||
    k.includes('PHONE')
  );
  
  // Try to verify .env.local file exists (for diagnostic purposes)
  let envFileInfo: any = { exists: false, error: null };
  try {
    const projectRoot = process.cwd();
    const envLocalPath = join(projectRoot, '.env.local');
    envFileInfo.exists = existsSync(envLocalPath);
    
    if (envFileInfo.exists) {
      // Try to read and parse (for verification, but don't expose contents)
      const fileContent = readFileSync(envLocalPath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      const telnyxLines = lines.filter(line => 
        line.toUpperCase().includes('TELNYX') && !line.trim().startsWith('#')
      );
      
      envFileInfo = {
        exists: true,
        totalLines: lines.length,
        telnyxLinesFound: telnyxLines.length,
        telnyxLineIndicators: telnyxLines.map(line => {
          // Show first 30 chars of each line (to help identify without exposing secrets)
          const preview = line.trim().substring(0, 30);
          return preview.includes('=') ? preview.split('=')[0] : preview;
        }),
        path: envLocalPath,
      };
    } else {
      envFileInfo.path = envLocalPath;
      envFileInfo.error = 'File not found';
    }
  } catch (error) {
    envFileInfo.error = error instanceof Error ? error.message : 'Unknown error';
  }
  
  // Check if variables have actual values (not just empty strings)
  const telnyxValues = {
    SANDBOX_MODE: {
      exists: !!process.env.TELNYX_SANDBOX_MODE,
      isEmpty: process.env.TELNYX_SANDBOX_MODE === '',
      value: process.env.TELNYX_SANDBOX_MODE || 'UNDEFINED',
    },
    PHONE_NUMBER: {
      exists: !!process.env.TELNYX_PHONE_NUMBER,
      isEmpty: process.env.TELNYX_PHONE_NUMBER === '',
      value: process.env.TELNYX_PHONE_NUMBER ? 'SET (hidden)' : 'NOT SET',
    },
    API_KEY: {
      exists: !!process.env.TELNYX_API_KEY,
      isEmpty: process.env.TELNYX_API_KEY === '',
      value: process.env.TELNYX_API_KEY ? 'SET (hidden)' : 'NOT SET',
    },
  };
  
  // Build response with detailed diagnostics
  const response: any = {
    // Environment status
    NODE_ENV: nodeEnv,
    workingDirectory: process.cwd(),
    
    // File system verification
    envFileVerification: envFileInfo,
    
    // Telnyx variables (detailed)
    TELNYX_SANDBOX_MODE: process.env.TELNYX_SANDBOX_MODE || 'UNDEFINED',
    TELNYX_PHONE_NUMBER: process.env.TELNYX_PHONE_NUMBER ? 'SET' : 'NOT SET',
    TELNYX_API_KEY: process.env.TELNYX_API_KEY ? 'SET' : 'NOT SET',
    
    // Detailed value analysis
    telnyxValueAnalysis: telnyxValues,
    
    // All Telnyx keys found
    allTelnyxKeys: telnyxKeys,
    telnyxKeysCount: telnyxKeys.length,
    
    // Similar/suspicious keys (might be typos)
    similarKeys: similarKeys,
    
    // Verify other env vars are loading (to confirm .env.local works)
    supabaseUrlLoaded: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseServiceKeyLoaded: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    allSupabaseKeys: supabaseKeys,
    
    // Total environment variables count
    totalEnvVars: allEnvKeys.length,
    
    // All env keys sorted (to help find typos) - limit to first 50
    allEnvKeysSorted: allEnvKeys.sort().slice(0, 50),
    
    // Diagnostic messages
    diagnostics: {
      envFileLoading: supabaseKeys.length > 0 ? 'SUCCESS - .env.local appears to be loading' : 'WARNING - No Supabase vars found',
      telnyxVarsFound: telnyxKeys.length > 0 ? 'SUCCESS' : 'FAILED - No TELNYX variables found',
      envFileExists: envFileInfo.exists ? 'SUCCESS - .env.local file found' : 'FAILED - .env.local file not found',
      instructions: telnyxKeys.length === 0 
        ? [
            '1. Verify .env.local exists in project root',
            '2. Add: TELNYX_SANDBOX_MODE=false',
            '3. Add: TELNYX_PHONE_NUMBER=+1234567890',
            '4. Add: TELNYX_API_KEY=your_key_here',
            '5. Restart dev server (stop and restart npm run dev)',
            '6. Check envFileVerification.telnyxLinesFound above'
          ]
        : ['TELNYX variables found successfully']
    },
    
    // Next steps recommendation
    recommendation: telnyxKeys.length === 0 && envFileInfo.exists
      ? 'Variables are in file but not loaded. Check: 1) Format (no spaces around =), 2) Restart server, 3) Check for hidden characters'
      : telnyxKeys.length === 0 && !envFileInfo.exists
      ? 'Create .env.local file in project root with TELNYX variables'
      : 'Everything looks good!'
  };
  
  return NextResponse.json(response, { status: 200 });
}