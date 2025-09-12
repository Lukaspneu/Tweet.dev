import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webhook endpoint that accepts POST requests with JSON payload
app.post('/webhook', (req, res) => {
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
      source: 'DeckDev Webhook'
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
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'DeckDev Webhook Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`DeckDev server is running on port ${PORT}`);
  console.log(`Webhook endpoint available at: http://localhost:${PORT}/webhook`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
});
