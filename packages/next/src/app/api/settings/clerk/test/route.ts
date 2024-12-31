import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Webhook } from 'svix'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.userId || !session?.orgId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // const { publishableKey, secretKey, webhookSecret } = await req.json()
    const { secretKey, webhookSecret } = await req.json()

    try {
      // 1. Test API keys by making a request to Clerk
      const testResponse = await fetch('https://api.clerk.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        }
      })

      if (!testResponse.ok) {
        throw new Error('Failed to validate API keys')
      }

      // 2. Test webhook signature verification
      const wh = new Webhook(webhookSecret)
      const testPayload = JSON.stringify({ test: true })
      const testTimestamp = new Date().toISOString()
      const testId = 'test-msg-' + Math.random().toString(36).substring(7)
      
      const signature = wh.sign(testPayload, new Date(testTimestamp), testId)

      // Verify the signature works
      try {
        wh.verify(testPayload, {
          'svix-id': testId,
          'svix-timestamp': testTimestamp,
          'svix-signature': signature
        })
      } catch (error) {
        throw new Error('Failed to verify webhook signature')
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Clerk connection test failed:', error)
      return new NextResponse('Connection test failed', { status: 400 })
    }
  } catch (error) {
    console.error('[CLERK_TEST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 