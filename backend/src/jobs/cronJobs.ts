import cron from 'node-cron';
import prisma from '../lib/prisma';

// ============================================================================
// Background Cron Jobs — Scheduled Tasks
// SRS FR-22: Auto-expiry of posts with auto_close_enabled
// ============================================================================

/**
 * Daily Post Expiry Job
 * Runs every day at midnight (00:00).
 * Finds all posts where:
 *   - auto_close_enabled = true
 *   - expiry_date is strictly in the past
 *   - status is still ACTIVE (don't re-expire already expired posts)
 * Updates their status to EXPIRED.
 */
const schedulePostExpiryJob = () => {
  // Cron expression: '0 0 * * *' = every day at 00:00
  cron.schedule('0 0 * * *', async () => {
    const now = new Date();
    console.log(`\n⏰ [CRON] Running daily post expiry check at ${now.toISOString()}`);

    try {
      const result = await prisma.post.updateMany({
        where: {
          auto_close_enabled: true,
          expiry_date: {
            lt: now,  // Strictly in the past
          },
          status: 'ACTIVE', // Only expire currently active posts
        },
        data: {
          status: 'EXPIRED',
        },
      });

      if (result.count > 0) {
        console.log(`   ✅ Expired ${result.count} post(s) with past expiry dates.`);
      } else {
        console.log(`   ℹ️  No posts to expire.`);
      }
    } catch (error) {
      console.error('   ❌ Post expiry cron job failed:', error);
    }
  }, {
    timezone: 'UTC', // Run based on UTC time
  });

  console.log('📅 Cron Job registered: Daily post auto-expiry at 00:00 UTC');
};

/**
 * Initialize all cron jobs.
 * Call this once from the main server entry point.
 */
export const initCronJobs = () => {
  console.log('\n🔧 Initializing background cron jobs...');
  schedulePostExpiryJob();
  console.log('✅ All cron jobs initialized.\n');
};
