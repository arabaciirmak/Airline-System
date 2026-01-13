const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 8080;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Handle ALL preflight requests FIRST - before any routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  next();
});

// Route definitions
const routes = {
  '/flight-api': {
    target: `http://localhost:${process.env.FLIGHT_SERVICE_PORT || 3001}`,
    changeOrigin: true,
    pathRewrite: { '^/flight-api': '' }
  },
  '/member-api': {
    target: `http://localhost:${process.env.MEMBER_SERVICE_PORT || 3002}`,
    changeOrigin: true,
    pathRewrite: { '^/member-api': '' }
  },
  '/booking-api': {
    target: `http://localhost:${process.env.BOOKING_SERVICE_PORT || 3003}`,
    changeOrigin: true,
    pathRewrite: { '^/booking-api': '' }
  },
  '/admin-api': {
    target: `http://localhost:${process.env.ADMIN_SERVICE_PORT || 3004}`,
    changeOrigin: true,
    pathRewrite: { '^/admin-api': '' }
  },
  '/notification-api': {
    target: `http://localhost:${process.env.NOTIFICATION_SERVICE_PORT || 3005}`,
    changeOrigin: true,
    pathRewrite: { '^/notification-api': '' }
  }
};

// Setup proxy for each route with CORS handling
Object.keys(routes).forEach(path => {
  const proxy = createProxyMiddleware({
    ...routes[path],
    timeout: 30000, // 30 second timeout
    proxyTimeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
      // Add CORS headers to proxied requests
      if (req.headers.origin) {
        proxyReq.setHeader('Origin', req.headers.origin);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add CORS headers to response
      proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    }
  });
  app.use(path, proxy);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', gateway: 'running' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Routes:');
  Object.keys(routes).forEach(path => {
    console.log(`  ${path} -> ${routes[path].target}`);
  });
});

module.exports = app;
