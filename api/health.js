// Vercel API route for health check
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only GET requests are accepted.',
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({
    status: 'healthy',
    service: 'DeckDev Webhook Service (Vercel)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
}
