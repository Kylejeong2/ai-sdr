import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Webhook } from 'svix'

export async function POST(req: Request) {
  try {
    // console.log('[CLERK_TEST] Starting auth check...')
    const session = await auth()
    // console.log('[CLERK_TEST] Session:', { userId: session?.userId, orgId: session?.orgId })
    
    if (!session?.userId || !session?.orgId) {
      // console.log('[CLERK_TEST] Auth failed - missing userId or orgId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { secretKey, webhookSecret } = await req.json()
    // console.log('[CLERK_TEST] Received credentials:', { 
    //   secretKeyLength: secretKey?.length,
    //   secretKeyPrefix: secretKey?.substring(0, 7),
    //   webhookSecretLength: webhookSecret?.length,
    //   webhookSecretPrefix: webhookSecret?.substring(0, 7)
    // })

    if (!secretKey || !webhookSecret) {
      // console.log('[CLERK_TEST] Missing credentials')
      return NextResponse.json(
        { error: 'Missing required credentials' },
        { status: 400 }
      )
    }

    try {
      // 1. Test API keys by making a request to Clerk
      // console.log('[CLERK_TEST] Testing Clerk API connection...')
      const testResponse = await fetch('https://api.clerk.com/v1/users', {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          'Clerk-Backend-API-Version': '2023-07-01'
        }
      })

      const responseData = await testResponse.json()
      // console.log('[CLERK_TEST] Clerk API response:', { 
      //   status: testResponse.status,
      //   ok: testResponse.ok,
      //   error: responseData.errors?.[0]
      // })

      if (!testResponse.ok) {
        // console.log('[CLERK_TEST] API key validation failed')
        return NextResponse.json(
          { error: `Invalid Secret Key - ${responseData.errors?.[0]?.message || 'Failed to authenticate with Clerk'}` },
          { status: 400 }
        )
      }

      // 2. Test webhook signature verification
      // console.log('[CLERK_TEST] Testing webhook signature...')
      try {
        const wh = new Webhook(webhookSecret)
        const testPayload = JSON.stringify({ test: true })
        const now = new Date()
        // const testTimestamp = now.toISOString() // used for console log testing
        const testId = 'test-msg-' + Math.random().toString(36).substring(7)
        
        // Just test if we can create a valid signature
        const signature = wh.sign(testPayload, now, testId)
        if (!signature) {
          throw new Error('Failed to generate webhook signature')
        }
        // console.log('[CLERK_TEST] Webhook signature generated successfully')
      } catch (error) {
        // console.error('[CLERK_TEST] Webhook verification failed:', error)
        return NextResponse.json(
          { error: 'Invalid Webhook Secret - Failed to verify webhook signature' },
          { status: 400 }
        )
      }

      // console.log('[CLERK_TEST] All tests passed successfully')
      return NextResponse.json({ 
        success: true,
        message: 'Successfully validated API keys and webhook secret'
      })
    } catch (error) {
      // console.error('[CLERK_TEST] Connection test failed:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Connection test failed' },
        { status: 400 }
      )
    }
  } catch (error) {
    // console.error('[CLERK_TEST] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 