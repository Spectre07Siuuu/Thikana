const fs = require('fs');
const config = require('../config/identityVerification');
const { normalizeNid } = require('../utils/kycCrypto');

let tesseract = null;
try {
  tesseract = require('tesseract.js');
} catch (_err) {
  tesseract = null;
}

const KEYWORDS = [
  '\u099c\u09be\u09a4\u09c0\u09af\u09bc \u09aa\u09b0\u09bf\u099a\u09af\u09bc\u09aa\u09a4\u09cd\u09b0',
  'national id card',
  'nid',
  'date of birth',
  'dob',
];

const BANGLA_TO_ENGLISH_DIGITS = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

function normalizeOcrDigits(text) {
  return String(text || '').replace(/[০-৯]/g, char => BANGLA_TO_ENGLISH_DIGITS[char] || char);
}

function hasBangladeshNidKeyword(text) {
  const normalized = normalizeOcrDigits(text).toLowerCase();
  return KEYWORDS.some(keyword => normalized.includes(keyword.toLowerCase()));
}

function extractNidNumber(text, submittedNid) {
  const normalizedSubmitted = normalizeNid(submittedNid);
  const normalizedText = normalizeOcrDigits(text);
  const directMatches = normalizedText.match(/\b\d{10}\b|\b\d{13}\b|\b\d{17}\b/g) || [];

  const segmentedMatches = (normalizedText.match(/(?:\d[\s\-./]*){10,17}/g) || [])
    .map(part => normalizeNid(part))
    .filter(part => /^\d{10}$|^\d{13}$|^\d{17}$/.test(part));

  const matches = [...directMatches, ...segmentedMatches]
    .map(candidate => normalizeNid(candidate))
    .filter(candidate => /^\d{10}$|^\d{13}$|^\d{17}$/.test(candidate));

  if (normalizedSubmitted && matches.includes(normalizedSubmitted)) return normalizedSubmitted;
  return matches[0] || normalizedSubmitted || '';
}

function extractDob(text) {
  const source = String(text || '');
  const dateMatch = source.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/);
  if (!dateMatch) return null;
  const [, dd, mm, yyyy] = dateMatch;
  const iso = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

function extractName(text) {
  const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const nameLine = lines.find(line => /^name\s*[:\-]/i.test(line));
  if (!nameLine) return null;
  return nameLine.replace(/^name\s*[:\-]\s*/i, '').slice(0, 120) || null;
}

function heuristicConfidence(metadata, submittedNid) {
  let confidence = 15;
  if (metadata.width && metadata.height) {
    const ratio = metadata.width / metadata.height;
    if (ratio >= 1.35 && ratio <= 1.8) confidence += 25;
    if (metadata.width >= 700 && metadata.height >= 400) confidence += 15;
  }
  if (/^\d{10}$|^\d{13}$|^\d{17}$/.test(normalizeNid(submittedNid))) confidence += 15;
  return Math.min(confidence, config.allowHeuristicApproval ? 65 : 55);
}

async function runOcr({ imagePath, metadata, submittedNid }) {
  console.log(`[ocrService] Starting OCR for image: ${imagePath}`);
  
  if (!tesseract) {
    console.warn(`[ocrService] Tesseract not available, using heuristic mode`);
    return {
      provider: 'heuristic',
      text: '',
      confidence: heuristicConfidence(metadata || {}, submittedNid),
      layoutDetected: false,
      extracted: {
        nidNumber: normalizeNid(submittedNid),
        fullName: null,
        dob: null,
      },
      warnings: ['OCR_ENGINE_NOT_INSTALLED'],
    };
  }

  console.log(`[ocrService] Creating tesseract worker...`);
  const worker = await tesseract.createWorker('eng+ben');
  try {
    console.log(`[ocrService] Running recognition on image...`);
    const result = await worker.recognize(fs.readFileSync(imagePath));
    const text = result?.data?.text || '';
    const confidence = Math.max(0, Math.min(100, Number(result?.data?.confidence) || 0));
    console.log(`[ocrService] OCR completed - confidence: ${confidence}, text length: ${text.length}`);
    
    return {
      provider: 'tesseract.js',
      text,
      confidence,
      layoutDetected: hasBangladeshNidKeyword(text),
      extracted: {
        nidNumber: extractNidNumber(text, submittedNid),
        fullName: extractName(text),
        dob: extractDob(text),
      },
      warnings: confidence < config.minOcrConfidence ? ['LOW_OCR_CONFIDENCE'] : [],
    };
  } finally {
    await worker.terminate();
  }
}

module.exports = {
  runOcr,
  hasBangladeshNidKeyword,
};
