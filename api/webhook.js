export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    // Verify API key from webhook request
    const receivedApiKey = req.headers['x-api-key']
    const expectedApiKey = 'new1_67400f93f49a4ab0a677947a92d8ed77'
    
    if (receivedApiKey !== expectedApiKey) {
      console.error('❌ Unauthorized webhook request - invalid API key')
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    console.log('✅ Verified webhook request from TwitterAPI.io')
    
    // Parse webhook data
    const webhookData = req.body
    
    console.log('📊 Webhook data received:', {
      event_type: webhookData.event_type,
      rule_id: webhookData.rule_id,
      rule_tag: webhookData.rule_tag,
      tweet_count: webhookData.tweets?.length || 0,
      timestamp: webhookData.timestamp
    })

    // Process tweets from webhook
    if (webhookData.tweets && webhookData.tweets.length > 0) {
      const processedTweets = webhookData.tweets.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        author: tweet.author,
        created_at: tweet.created_at,
        retweet_count: tweet.retweet_count || 0,
        like_count: tweet.like_count || 0,
        reply_count: tweet.reply_count || 0
      }))

      console.log(`📊 Processed ${processedTweets.length} tweets from webhook`)
      
      // Store tweets in a simple in-memory store (in production, use a database)
      // For now, we'll just log them and return success
      global.webhookTweets = global.webhookTweets || []
      global.webhookTweets.unshift(...processedTweets)
      
      // Keep only last 50 tweets
      global.webhookTweets = global.webhookTweets.slice(0, 50)
      
      console.log(`📊 Total tweets stored: ${global.webhookTweets.length}`)
    }

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      tweet_count: webhookData.tweets?.length || 0
    })

  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
