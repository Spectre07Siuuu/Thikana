const { cleanupRejectedImages, processVerification } = require('./identityVerificationService');

const queue = [];
let active = false;

async function drain() {
  if (active) return;
  active = true;
  console.log(`[identityVerificationQueue] Starting drain with ${queue.length} jobs`);
  while (queue.length > 0) {
    const job = queue.shift();
    console.log(`[identityVerificationQueue] Processing verification #${job.verificationId} (attempt ${(job.attempts || 0) + 1})`);
    try {
      const result = await processVerification(job.verificationId);
      console.log(`[identityVerificationQueue] ✓ Verification #${job.verificationId} completed with status: ${result?.verification_status}`);
    } catch (err) {
      console.error(`[identityVerificationQueue] ✗ Verification #${job.verificationId} failed:`, err.message);
      if ((job.attempts || 0) < 2) {
        console.log(`[identityVerificationQueue] Retrying verification #${job.verificationId}...`);
        queue.push({ ...job, attempts: (job.attempts || 0) + 1 });
      }
    }
  }
  console.log(`[identityVerificationQueue] Drain complete, running cleanup...`);
  cleanupRejectedImages().catch(err => console.error('[identityVerificationCleanup]', err));
  active = false;
}

function enqueueIdentityVerification(verificationId) {
  console.log(`[identityVerificationQueue] Enqueued verification #${verificationId}`);
  queue.push({ verificationId, attempts: 0 });
  setImmediate(drain);
}

module.exports = {
  enqueueIdentityVerification,
};
