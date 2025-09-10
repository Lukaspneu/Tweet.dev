// Test script to check webhook functionality
const testWebhookData = {
  "tweets": [
    {
      "type": "tweet",
      "id": "1965829655384240555",
      "url": "https://x.com/seven100x/status/1965829655384240555",
      "twitterUrl": "https://twitter.com/seven100x/status/1965829655384240555",
      "text": "We go higher",
      "source": "Twitter for iPhone",
      "retweetCount": 0,
      "replyCount": 0,
      "likeCount": 0,
      "quoteCount": 0,
      "viewCount": 0,
      "createdAt": "Wed Sep 10 17:28:07 +0000 2025",
      "lang": "en",
      "bookmarkCount": 0,
      "isReply": false,
      "inReplyToId": null,
      "conversationId": "1965829655384240555",
      "displayTextRange": [0, 12],
      "inReplyToUserId": null,
      "inReplyToUsername": null,
      "author": {
        "type": "user",
        "userName": "seven100x",
        "url": "https://x.com/seven100x",
        "twitterUrl": "https://twitter.com/seven100x",
        "id": "1776219178409611264",
        "name": "777",
        "isVerified": false,
        "isBlueVerified": true,
        "verifiedType": null,
        "profilePicture": "https://pbs.twimg.com/profile_images/1963264787896213504/P6kyuaNC_normal.jpg",
        "coverPicture": "https://pbs.twimg.com/profile_banners/1776219178409611264/1756529187",
        "description": "",
        "location": "",
        "followers": 396,
        "following": 215,
        "status": "",
        "canDm": true,
        "canMediaTag": false,
        "createdAt": "Fri Apr 05 12:03:57 +0000 2024",
        "entities": {
          "description": {
            "urls": []
          },
          "url": {}
        },
        "fastFollowersCount": 0,
        "favouritesCount": 678,
        "hasCustomTimelines": true,
        "isTranslator": false,
        "mediaCount": 93,
        "statusesCount": 1614,
        "withheldInCountries": [],
        "affiliatesHighlightedLabel": {},
        "possiblySensitive": false,
        "pinnedTweetIds": ["1959402897197912477"],
        "profile_bio": {
          "description": "CT and dev tool: Soon......\n\nTrade on: https://t.co/4CcbWXXsQF",
          "entities": {
            "description": {
              "urls": [
                {
                  "display_url": "axiom.trade/@seven777",
                  "expanded_url": "https://axiom.trade/@seven777",
                  "indices": [39, 62],
                  "url": "https://t.co/4CcbWXXsQF"
                }
              ]
            },
            "url": {
              "urls": [
                {
                  "display_url": "axiom.trade/@7seven7",
                  "expanded_url": "https://axiom.trade/@7seven7",
                  "indices": [0, 23],
                  "url": "https://t.co/A2CHacVhIC"
                }
              ]
            }
          }
        },
        "isAutomated": false,
        "automatedBy": null
      },
      "extendedEntities": {},
      "card": null,
      "place": {},
      "entities": {},
      "quoted_tweet": null,
      "retweeted_tweet": null,
      "isLimitedReply": false,
      "article": null
    }
  ],
  "rule_id": "0cdc452da1fd4da8b213ca5482809673",
  "rule_tag": "please",
  "rule_value": "from:seven100X",
  "event_type": "tweet",
  "timestamp": 1757525302540
}

// Test the webhook endpoint
async function testWebhook() {
  try {
    console.log('🧪 Testing webhook endpoint...')
    
    const response = await fetch('https://extract-dev-aly4pikdp-yes-projects-913a885e.vercel.app/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'new1_67400f93f49a4ab0a677947a92d8ed77'
      },
      body: JSON.stringify(testWebhookData)
    })
    
    const result = await response.json()
    console.log('✅ Webhook response:', result)
    
    // Now test the tweets endpoint
    console.log('🧪 Testing tweets endpoint...')
    const tweetsResponse = await fetch('https://extract-dev-aly4pikdp-yes-projects-913a885e.vercel.app/api/tweets')
    const tweetsResult = await tweetsResponse.json()
    console.log('✅ Tweets response:', tweetsResult)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testWebhook()
