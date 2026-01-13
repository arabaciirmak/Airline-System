const jwt = require('jsonwebtoken');
const axios = require('axios');

// Verify Cognito JWT token
async function verifyCognitoToken(token) {
  try {
    // For AWS Cognito, we need to verify the token
    // In production, you should verify against Cognito's public keys
    // For now, we'll decode and validate basic structure
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded || !decoded.payload) {
      return null;
    }

    // Verify token is not expired
    if (decoded.payload.exp && decoded.payload.exp < Date.now() / 1000) {
      return null;
    }

    return decoded.payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Middleware to check authentication
async function authenticate(req, res, next) {
  // Allow OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyCognitoToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      sub: payload.sub,
      email: payload.email,
      groups: payload['cognito:groups'] || []
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Middleware to check admin role
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.groups.includes('Admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = {
  authenticate,
  requireAdmin
};
