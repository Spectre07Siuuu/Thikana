const jwt = require('jsonwebtoken')

/**
 * verifyToken — Express middleware.
 * Expects: Authorization: Bearer <jwt_token>
 * Attaches decoded payload to req.user on success.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // { id, email, role, iat, exp }
    next()
  } catch (err) {
    const msg =
      err.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid token.'
    return res.status(401).json({ success: false, message: msg })
  }
}

/**
 * requireRole(...roles) — role-based access control middleware.
 * Usage: router.get('/admin', verifyToken, requireRole('admin'), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission.',
      })
    }
    next()
  }
}

module.exports = { verifyToken, requireRole }
