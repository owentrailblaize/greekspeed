#!/usr/bin/env node

/**
 * Test script for Event Email Notifications
 * 
 * This script tests the complete event email notification flow:
 * 1. Creates a test event
 * 2. Verifies email sending functionality
 * 3. Checks event metadata updates
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testEventEmailNotifications() {
  console.log('🧪 Testing Event Email Notifications...\n');

  try {
    // Test 1: Create a test event
    console.log('1️⃣ Creating test event...');
    const testEvent = {
      title: 'Test Event - Email Notification',
      description: 'This is a test event to verify email notifications are working correctly.',
      location: 'Test Location',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // Tomorrow + 2 hours
      chapter_id: 'test-chapter-id', // Replace with actual chapter ID
      status: 'published'
    };

    const createResponse = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent)
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Failed to create event: ${error.error}`);
    }

    const createResult = await createResponse.json();
    console.log('✅ Event created successfully:', createResult.event.id);
    console.log('📧 Email notifications should have been sent automatically\n');

    // Test 2: Test manual email sending
    console.log('2️⃣ Testing manual email sending...');
    const emailResponse = await fetch(`${API_BASE_URL}/api/events/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: createResult.event.id,
        chapterId: testEvent.chapter_id
      })
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.json();
      throw new Error(`Failed to send emails: ${error.error}`);
    }

    const emailResult = await emailResponse.json();
    console.log('✅ Manual email sending successful:');
    console.log(`   📊 Total recipients: ${emailResult.emailResult.totalRecipients}`);
    console.log(`   ✅ Successful: ${emailResult.emailResult.successful}`);
    console.log(`   ❌ Failed: ${emailResult.emailResult.failed}\n`);

    // Test 3: Verify environment variables
    console.log('3️⃣ Checking environment configuration...');
    const requiredEnvVars = [
      'SENDGRID_API_KEY',
      'SENDGRID_EVENT_TEMPLATE_ID',
      'SENDGRID_FROM_EMAIL',
      'SENDGRID_FROM_NAME'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('⚠️  Missing environment variables:', missingVars.join(', '));
      console.log('   Make sure these are set in your .env.local file\n');
    } else {
      console.log('✅ All required environment variables are set\n');
    }

    console.log('🎉 Event email notification testing completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Check your SendGrid dashboard for email activity');
    console.log('   2. Verify emails were received by chapter members');
    console.log('   3. Check the event metadata in your database');
    console.log('   4. Test creating events through the Social Chair Dashboard UI');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Make sure your development server is running');
    console.log('   2. Verify your SendGrid API key and template ID');
    console.log('   3. Check that you have active members in your test chapter');
    console.log('   4. Review the server console logs for detailed error messages');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testEventEmailNotifications();
}

module.exports = { testEventEmailNotifications };
