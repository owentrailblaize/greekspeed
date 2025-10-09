import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/emailService';

export async function GET() {
  try {
    const testEmail = 'dev.rmason@gmail.com'; // Use a real email for testing
    
    // Test 1: Check if email is suppressed (should be false initially)
    const isInitiallySuppressed = await EmailService.isSuppressed(testEmail);
    console.log(`📧 Is ${testEmail} initially suppressed:`, isInitiallySuppressed);
    
    // Test 2: Add email to suppression list
    const addResult = await EmailService.addToSuppressionList(testEmail);
    console.log(`📧 Add to suppression result:`, addResult);
    
    // Test 3: Check if email is now suppressed (should be true)
    const isNowSuppressed = await EmailService.isSuppressed(testEmail);
    console.log(`📧 Is ${testEmail} now suppressed:`, isNowSuppressed);
    
    // Test 4: Remove email from suppression list
    const removeResult = await EmailService.removeFromSuppressionList(testEmail);
    console.log(`📧 Remove from suppression result:`, removeResult);
    
    // Test 5: Check if email is no longer suppressed (should be false)
    const isFinallySuppressed = await EmailService.isSuppressed(testEmail);
    console.log(`📧 Is ${testEmail} finally suppressed:`, isFinallySuppressed);
    
    return NextResponse.json({
      success: true,
      results: {
        initiallySuppressed: isInitiallySuppressed,
        addResult,
        nowSuppressed: isNowSuppressed,
        removeResult,
        finallySuppressed: isFinallySuppressed
      }
    });
  } catch (error) {
    console.error('❌ Suppression test error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}



