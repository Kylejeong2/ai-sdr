import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { prisma } from '@graham/db'
import { WebClient } from '@slack/web-api'

const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

// Verify Slack request signature
function verifySlackRequest(request: Request, body: string) {
  const headersList = headers()
  const timestamp = headersList.get('x-slack-request-timestamp')
  const signature = headersList.get('x-slack-signature')

  if (!timestamp || !signature) {
    return false
  }

  // Check timestamp is within 5 minutes
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5
  if (parseInt(timestamp) < fiveMinutesAgo) {
    return false
  }

  const sigBasestring = `v0:${timestamp}:${body}`
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', process.env.SLACK_SIGNING_SECRET || '')
    .update(sigBasestring)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  
  // Verify the request is from Slack
  if (!verifySlackRequest(request, body)) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  try {
    const payload = JSON.parse(new URLSearchParams(body).get('payload') || '')

    // Handle different types of interactions
    switch (payload.type) {
      case 'block_actions': {
        const action = payload.actions[0]
        const { userId, action: actionType } = JSON.parse(action.value)

        // Get the user
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            team: true
          }
        })

        if (!user) {
          return new NextResponse('User not found', { status: 404 })
        }

        if (actionType === 'approve') {
          // Update user status
          await prisma.user.update({
            where: { id: userId },
            data: {
              status: 'APPROVED'
            }
          })

          // Update Slack message
          await slack.chat.update({
            channel: payload.channel.id,
            ts: payload.message.ts,
            text: 'Email approved',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `✅ *Email Approved*\n\nEmail for ${user.firstName} ${user.lastName} has been approved and will be sent shortly.`
                }
              }
            ]
          })

          // Queue email sending (mock for now)
          console.log('Would send email to:', user.email)
        } else if (actionType === 'reject') {
          // Update user status
          await prisma.user.update({
            where: { id: userId },
            data: {
              status: 'REJECTED'
            }
          })

          // Update Slack message
          await slack.chat.update({
            channel: payload.channel.id,
            ts: payload.message.ts,
            text: 'Email rejected',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `❌ *Email Rejected*\n\nEmail for ${user.firstName} ${user.lastName} has been rejected.`
                }
              }
            ]
          })
        }

        return NextResponse.json({ message: 'Action processed' })
      }

      default:
        return new NextResponse('Unsupported interaction type', { status: 400 })
    }
  } catch (error) {
    console.error('Error processing Slack webhook:', error)
    return new NextResponse('Error processing webhook', { status: 500 })
  }
} 