const config = require('../config/identityVerification');
const { normalizeNid } = require('../utils/kycCrypto');

function isValidNidFormat(value) {
  return /^\d{10}$|^\d{13}$|^\d{17}$/.test(normalizeNid(value));
}

function calculateConfidence({ ocrResult, faceResult, duplicateDetected }) {
  const parts = [];
  const scoring = config.scoring;

  if (ocrResult.layoutDetected || (ocrResult.provider === 'heuristic' && ocrResult.confidence >= 45)) {
    parts.push({ key: 'validLayout', points: scoring.validLayout });
  }

  if (ocrResult.confidence >= config.minOcrConfidence && ocrResult.extracted?.nidNumber) {
    parts.push({ key: 'ocrExtracted', points: scoring.ocrExtracted });
  }

  if (isValidNidFormat(ocrResult.extracted?.nidNumber)) {
    parts.push({ key: 'validNidFormat', points: scoring.validNidFormat });
  }

  if (faceResult.score >= config.minFaceMatchScore && faceResult.faceDetectedOnNid && faceResult.faceDetectedOnSelfie) {
    parts.push({ key: 'faceMatch', points: scoring.faceMatch });
  }

  if (!duplicateDetected) {
    parts.push({ key: 'noDuplicate', points: scoring.noDuplicate });
  }

  return {
    score: Math.max(0, Math.min(100, parts.reduce((sum, part) => sum + part.points, 0))),
    parts,
  };
}

function decide({ score, fraudFlags, hardReject }) {
  if (hardReject || score < config.reviewThreshold) return 'rejected';
  if (score >= config.autoApproveThreshold && fraudFlags.length === 0) return 'approved';
  return 'review';
}

module.exports = {
  calculateConfidence,
  decide,
  isValidNidFormat,
};
