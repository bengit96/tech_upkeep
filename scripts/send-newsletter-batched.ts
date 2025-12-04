/**
 * Batched Newsletter Sending Script
 *
 * This script sends newsletters in batches to avoid API timeouts.
 * It will keep calling the API until all users have received the newsletter.
 *
 * Usage:
 *   npx tsx scripts/send-newsletter-batched.ts
 *
 * With draft ID:
 *   npx tsx scripts/send-newsletter-batched.ts --draftId=123
 *
 * With custom batch size:
 *   npx tsx scripts/send-newsletter-batched.ts --batchSize=50
 */

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const BATCH_SIZE = 20; // Send to 20 users per batch
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds between batches

interface SendResponse {
  success: boolean;
  message: string;
  sent: number;
  failed: number;
  remaining?: number;
  isComplete?: boolean;
  error?: string;
}

async function getAuthToken(): Promise<string> {
  // In production, you would use proper authentication
  // For now, assuming you have a JWT token stored somewhere
  const token = process.env.ADMIN_JWT_TOKEN;
  if (!token) {
    throw new Error('ADMIN_JWT_TOKEN environment variable not set');
  }
  return token;
}

async function sendBatch(draftId?: number, batchSize: number = BATCH_SIZE): Promise<SendResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/api/admin/send-newsletter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`,
    },
    body: JSON.stringify({
      draftId,
      batchSize,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API error: ${error.error || response.statusText}`);
  }

  return response.json();
}

async function sendAllBatches(draftId?: number, batchSize: number = BATCH_SIZE) {
  console.log('🚀 Starting batched newsletter sending...');
  if (draftId) {
    console.log(`📧 Draft ID: ${draftId}`);
  }
  console.log(`📦 Batch size: ${batchSize} users per batch\n`);

  let totalSent = 0;
  let totalFailed = 0;
  let batchNumber = 1;
  let isComplete = false;

  while (!isComplete) {
    try {
      console.log(`\n📨 Sending batch #${batchNumber}...`);

      const result = await sendBatch(draftId, batchSize);

      totalSent += result.sent;
      totalFailed += result.failed;

      console.log(`✅ Batch #${batchNumber} complete:`);
      console.log(`   - Sent: ${result.sent}`);
      console.log(`   - Failed: ${result.failed}`);
      console.log(`   - Remaining: ${result.remaining || 0}`);
      console.log(`   - Total sent so far: ${totalSent}`);
      console.log(`   - Total failed so far: ${totalFailed}`);

      isComplete = result.isComplete || false;

      if (!isComplete) {
        console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        batchNumber++;
      }
    } catch (error) {
      console.error(`\n❌ Error in batch #${batchNumber}:`, error);
      throw error;
    }
  }

  console.log('\n\n🎉 All batches complete!');
  console.log('═══════════════════════════════════');
  console.log(`✅ Total sent: ${totalSent}`);
  console.log(`❌ Total failed: ${totalFailed}`);
  console.log('═══════════════════════════════════\n');
}

// Parse command line arguments
const args = process.argv.slice(2);
const draftIdArg = args.find(arg => arg.startsWith('--draftId='));
const batchSizeArg = args.find(arg => arg.startsWith('--batchSize='));

const draftId = draftIdArg ? parseInt(draftIdArg.split('=')[1]) : undefined;
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : BATCH_SIZE;

// Run the script
sendAllBatches(draftId, batchSize)
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
