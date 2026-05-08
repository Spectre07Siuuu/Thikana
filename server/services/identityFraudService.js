const config = require('../config/identityVerification');

async function collectFraudFlags(pool, { userId, nidHash, ocrResult, faceResult, imageMeta }) {
  const flags = new Set();

  for (const warning of [...(ocrResult.warnings || []), ...(faceResult.warnings || [])]) {
    flags.add(warning);
  }

  if (!ocrResult.layoutDetected && ocrResult.provider !== 'heuristic') flags.add('INVALID_DOCUMENT_STRUCTURE');
  if (ocrResult.confidence < config.minOcrConfidence) flags.add('LOW_OCR_CONFIDENCE');
  if (!ocrResult.extracted?.nidNumber) flags.add('MISSING_NID_NUMBER');
  if (!ocrResult.extracted?.fullName && ocrResult.provider !== 'heuristic') flags.add('MISSING_FULL_NAME');
  if (faceResult.score < config.minFaceMatchScore) flags.add('LOW_FACE_MATCH');

  const { rows: blocked } = await pool.query('SELECT id FROM blocked_nids WHERE nid_number_hash = $1 LIMIT 1', [nidHash]);
  if (blocked.length > 0) flags.add('BLOCKED_NID');

  const { rows: duplicates } = await pool.query(
    `SELECT id FROM identity_verifications
     WHERE nid_number_hash = $1
       AND user_id <> $2
       AND verification_status IN ('pending','processing','review','approved')
     LIMIT 1`,
    [nidHash, userId]
  );
  if (duplicates.length > 0) flags.add('DUPLICATE_NID');

  const { rows: failed } = await pool.query(
    `SELECT COUNT(*) AS count FROM identity_verifications
     WHERE user_id = $1
       AND verification_status = 'rejected'
       AND created_at > NOW() - ($2::int * INTERVAL '1 hour')`,
    [userId, config.failedAttemptWindowHours]
  );
  if (Number(failed[0]?.count || 0) >= config.maxFailedAttempts) flags.add('MULTIPLE_FAILED_ATTEMPTS');

  if (imageMeta?.nid?.width && imageMeta?.nid?.height) {
    const ratio = imageMeta.nid.width / imageMeta.nid.height;
    if (ratio < 1.15 || ratio > 2.2) flags.add('INVALID_IMAGE_DIMENSIONS');
  }

  return Array.from(flags);
}

function isHardReject(flags) {
  return flags.some(flag => [
    'BLOCKED_NID',
    'DUPLICATE_NID',
    'NO_FACE_ON_SELFIE',
    'NO_FACE_ON_NID',
    'MISSING_NID_NUMBER',
  ].includes(flag));
}

module.exports = {
  collectFraudFlags,
  isHardReject,
};
