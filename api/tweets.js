export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    // Get stored tweets from webhook
    const tweets = global.webhookTweets || []
    
    console.log(`📊 Fetching ${tweets.length} stored tweets`)
    
    res.status(200).json({ 
      success: true,
      tweets: tweets,
      count: tweets.length
    })

  } catch (error) {
    console.error('❌ Error fetching tweets:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
