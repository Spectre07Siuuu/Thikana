const pool = require('../config/db');
const { createNotification } = require('./notificationController');
const {
  manualReview,
  blockNidForVerification,
  sanitizeVerification,
  getSecureImagePath,
} = require('../services/identityVerificationService');

async function getPendingProducts(req, res) {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const { rows } = await pool.query(`
      SELECT p.*, u.full_name as seller_name, u.email as seller_email,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as main_image
      FROM products p JOIN users u ON p.seller_id = u.id
      WHERE p.status = $1 ORDER BY p.created_at DESC LIMIT $2 OFFSET $3
    `, [status, parseInt(limit), offset]);
    const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM products WHERE status = $1', [status]);
    const total = parseInt(countRows[0].total);
    return res.json({ success: true, products: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error('[admin.getPendingProducts]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function reviewProduct(req, res) {
  const { product_id, status, admin_note } = req.body;
  if (!product_id || !['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'product_id and valid status required.' });
  try {
    const { rows: prods } = await pool.query('SELECT seller_id, title FROM products WHERE id = $1', [product_id]);
    await pool.query('UPDATE products SET status = $1 WHERE id = $2', [status, product_id]);
    if (prods.length > 0) {
      const notifType = status === 'approved' ? 'product_approved' : 'product_rejected';
      createNotification(prods[0].seller_id, notifType, `Listing ${status}`, `Your listing "${prods[0].title}" has been ${status} by admin.${admin_note ? ' Note: ' + admin_note : ''}`, status === 'approved' ? `/product/${product_id}` : '/profile');
    }
    return res.json({ success: true, message: `Product marked as ${status}.` });
  } catch (err) {
    console.error('[admin.reviewProduct]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function getPendingNid(req, res) {
  try {
    const { status = 'review', page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const statuses = status === 'pending' ? ['pending', 'processing', 'review'] : [status];
    const { rows } = await pool.query(`
      SELECT n.id, n.user_id, n.nid_number, n.full_name AS extracted_full_name, n.dob,
             n.ocr_confidence, n.face_match_score, n.confidence_score, n.fraud_flags,
             n.verification_status, n.review_source, n.review_note, n.ai_result,
             n.created_at, n.updated_at, n.processed_at, n.reviewed_at,
             u.full_name, u.email, u.phone
      FROM identity_verifications n JOIN users u ON n.user_id = u.id
      WHERE n.verification_status = ANY($1)
      ORDER BY n.created_at DESC LIMIT $2 OFFSET $3
    `, [statuses, parseInt(limit), offset]);
    const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM identity_verifications WHERE verification_status = ANY($1)', [statuses]);
    const total = parseInt(countRows[0].total);
    return res.json({ success: true, submissions: rows.map(sanitizeVerification), pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error('[admin.getPendingNid]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function reviewNid(req, res) {
  const { submission_id, verification_id, status, admin_note, review_note } = req.body;
  const id = submission_id || verification_id;
  if (!id || !['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'submission_id and valid status required.' });
  try {
    await manualReview({
      verificationId: id,
      status,
      adminId: req.user.id,
      note: review_note || admin_note || null,
    });
    return res.json({ success: true, message: `NID submission marked as ${status}.` });
  } catch (err) {
    console.error('[admin.reviewNid]', err);
    return res.status(err.status || 500).json({ success: false, message: err.status ? err.message : 'Server error.' });
  }
}

async function blockNid(req, res) {
  const { submission_id, verification_id, reason } = req.body;
  const id = submission_id || verification_id;
  if (!id) return res.status(400).json({ success: false, message: 'submission_id is required.' });
  try {
    await blockNidForVerification({ verificationId: id, adminId: req.user.id, reason });
    return res.json({ success: true, message: 'NID has been blocked.' });
  } catch (err) {
    console.error('[admin.blockNid]', err);
    return res.status(err.status || 500).json({ success: false, message: err.status ? err.message : 'Server error.' });
  }
}

async function getNidImage(req, res) {
  try {
    const { id, type } = req.params;
    if (!['nid', 'selfie'].includes(type)) return res.status(400).json({ success: false, message: 'Invalid image type.' });
    const { rows } = await pool.query('SELECT nid_image_path, selfie_image_path FROM identity_verifications WHERE id = $1 LIMIT 1', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Image not found.' });
    const imagePath = getSecureImagePath(rows[0], type);
    if (!imagePath) return res.status(404).json({ success: false, message: 'Image not found.' });
    return res.sendFile(imagePath);
  } catch (err) {
    console.error('[admin.getNidImage]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function getStats(req, res) {
  try {
    const { rows: [{ users }] } = await pool.query('SELECT COUNT(*) as users FROM users');
    const { rows: [{ products }] } = await pool.query('SELECT COUNT(*) as products FROM products');
    const { rows: [{ pending_prod }] } = await pool.query("SELECT COUNT(*) as pending_prod FROM products WHERE status = 'pending'");
    const { rows: [{ pending_nid }] } = await pool.query("SELECT COUNT(*) as pending_nid FROM identity_verifications WHERE verification_status IN ('pending','processing','review')");
    const { rows: [{ auto_approved_nid }] } = await pool.query("SELECT COUNT(*) as auto_approved_nid FROM identity_verifications WHERE verification_status = 'approved' AND review_source = 'auto'");
    const { rows: [{ rejected_nid }] } = await pool.query("SELECT COUNT(*) as rejected_nid FROM identity_verifications WHERE verification_status = 'rejected'");
    const { rows: [{ fraud_flagged_nid }] } = await pool.query("SELECT COUNT(*) as fraud_flagged_nid FROM identity_verifications WHERE jsonb_array_length(fraud_flags) > 0");
    const { rows: [{ inquiries }] } = await pool.query('SELECT COUNT(*) as inquiries FROM inquiries');
    return res.json({
      success: true,
      stats: {
        users: parseInt(users),
        products: parseInt(products),
        pending_prod: parseInt(pending_prod),
        pending_nid: parseInt(pending_nid),
        auto_approved_nid: parseInt(auto_approved_nid),
        rejected_nid: parseInt(rejected_nid),
        fraud_flagged_nid: parseInt(fraud_flagged_nid),
        inquiries: parseInt(inquiries),
      },
    });
  } catch (err) {
    console.error('[admin.getStats]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getPendingProducts,
  reviewProduct,
  getPendingNid,
  reviewNid,
  blockNid,
  getNidImage,
  getStats,
};
