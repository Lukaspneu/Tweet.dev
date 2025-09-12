// Vercel API route for webhook
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only POST requests are accepted.',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Log the incoming request
    console.log('Webhook received:', {
      method: req.method,
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Validate that we have a JSON payload
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No JSON payload provided',
        timestamp: new Date().toISOString()
      });
    }

    // Process the webhook data
    const webhookData = req.body;
    
    // Here you can add your custom logic to process the webhook data
    // For example: save to database, trigger notifications, etc.
    
    // Example processing - you can customize this based on your needs
    const processedData = {
      id: webhookData.id || 'unknown',
      type: webhookData.type || 'unknown',
      data: webhookData.data || webhookData,
      processedAt: new Date().toISOString(),
      source: 'DeckDev Webhook (Vercel)'
    };

    // Log the processed data
    console.log('Processed webhook data:', processedData);

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data: processedData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
