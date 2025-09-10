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
      rule_value: webhookData.rule_value,
      tweet_count: webhookData.tweets?.length || 0,
      timestamp: webhookData.timestamp
    })

    // Process tweets from webhook - handle the specific structure you provided
    if (webhookData.tweets && webhookData.tweets.length > 0) {
      const processedTweets = webhookData.tweets.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        url: tweet.url || tweet.twitterUrl,
        createdAt: tweet.createdAt,
        author: {
          id: tweet.author?.id,
          username: tweet.author?.userName,
          name: tweet.author?.name,
          profilePicture: tweet.author?.profilePicture,
          isVerified: tweet.author?.isVerified,
          isBlueVerified: tweet.author?.isBlueVerified,
          followers: tweet.author?.followers,
          following: tweet.author?.following
        },
        metrics: {
          retweet_count: tweet.retweetCount || 0,
          like_count: tweet.likeCount || 0,
          reply_count: tweet.replyCount || 0,
          quote_count: tweet.quoteCount || 0,
          view_count: tweet.viewCount || 0,
          bookmark_count: tweet.bookmarkCount || 0
        },
        source: tweet.source,
        lang: tweet.lang,
        isReply: tweet.isReply,
        conversationId: tweet.conversationId
      }))

      console.log(`📊 Processed ${processedTweets.length} tweets from webhook`)
      
      // Store tweets in a simple in-memory store (in production, use a database)
      global.webhookTweets = global.webhookTweets || []
      
      // Add new tweets and avoid duplicates
      processedTweets.forEach(newTweet => {
        const exists = global.webhookTweets.find(existingTweet => existingTweet.id === newTweet.id)
        if (!exists) {
          global.webhookTweets.unshift(newTweet)
        }
      })
      
      // Keep only last 50 tweets
      global.webhookTweets = global.webhookTweets.slice(0, 50)
      
      console.log(`📊 Total tweets stored: ${global.webhookTweets.length}`)
      
      // Log the latest tweet for debugging
      if (processedTweets.length > 0) {
        const latestTweet = processedTweets[0]
        console.log('🐦 Latest tweet:', {
          id: latestTweet.id,
          text: latestTweet.text,
          author: latestTweet.author.username,
          metrics: latestTweet.metrics
        })
      }
    }

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      tweet_count: webhookData.tweets?.length || 0,
      rule_id: webhookData.rule_id
    })

  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
