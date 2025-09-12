# DeckDev Webhook API

## Overview
The DeckDev webhook endpoint accepts POST requests with JSON payloads and processes them for various use cases like notifications, data updates, and integrations.

## Endpoints

### POST /webhook
Accepts JSON payloads and processes them.

**URL:** `https://your-domain.com/webhook`

**Headers:**
```
Content-Type: application/json
```

**Request Body:** JSON object with any structure

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "id": "processed-id",
    "type": "processed-type",
    "data": "original-payload",
    "processedAt": "2024-01-01T00:00:00.000Z",
    "source": "DeckDev Webhook"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /health
Health check endpoint to verify service status.

**Response:**
```json
{
  "status": "healthy",
  "service": "DeckDev Webhook Service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## Usage Examples

### cURL Example
```bash
curl -X POST https://your-domain.com/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "user-123",
    "type": "notification",
    "data": {
      "message": "New follower!",
      "user": "john_doe"
    }
  }'
```

### JavaScript Example
```javascript
const response = await fetch('https://your-domain.com/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'tweet-456',
    type: 'tweet',
    data: {
      username: 'testuser',
      message: 'Hello from webhook!',
      timestamp: new Date().toISOString()
    }
  })
});

const result = await response.json();
console.log(result);
```

### Python Example
```python
import requests
import json

payload = {
    "id": "payment-789",
    "type": "payment",
    "data": {
        "amount": 100,
        "currency": "USD",
        "from": "user123",
        "to": "user456"
    }
}

response = requests.post(
    'https://your-domain.com/webhook',
    headers={'Content-Type': 'application/json'},
    data=json.dumps(payload)
)

print(response.json())
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "No JSON payload provided",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Error details",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Testing

Use the included test script to verify your webhook:

```bash
# Test local webhook
node test-webhook.js

# Test remote webhook
node test-webhook.js https://your-domain.com/webhook
```

## Customization

The webhook processing logic can be customized in `server.js`. Currently it:

1. Logs incoming requests
2. Validates JSON payload
3. Processes the data
4. Returns a structured response

You can modify the processing logic to:
- Save data to a database
- Send notifications
- Trigger other services
- Validate webhook signatures
- Rate limiting
- Authentication

## Security Considerations

- Add authentication/authorization if needed
- Implement webhook signature verification
- Add rate limiting
- Validate and sanitize input data
- Use HTTPS in production
- Log security events
