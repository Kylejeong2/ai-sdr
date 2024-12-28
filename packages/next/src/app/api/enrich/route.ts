import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Receiver } from "@upstash/qstash"
import { prisma } from '@graham/db'
import { WebClient } from '@slack/web-api'

const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || ''
})

export async function POST(request: Request) {
  const headersList = headers()
  const signature = headersList.get('upstash-signature')
  const body = await request.text()

  // Verify QStash signature
  const isValid = await receiver.verify({
    signature: signature || '',
    body,
  }).catch(err => {
    console.error('Error verifying signature:', err)
    return false
  })

  if (!isValid) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  const { userId, email, teamId } = JSON.parse(body)

  try {
    // Get the user and team
    const [user, team] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId }
      }),
      prisma.team.findUnique({
        where: { id: teamId },
        include: {
          clerkConfig: true
        }
      })
    ])

    if (!user || !team) {
      return new NextResponse('User or team not found', { status: 404 })
    }

    // Enrich user data (mock enrichment for now)
    const enrichedData = {
      company: 'Acme Corp',
      title: 'Software Engineer', 
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/johndoe',
      twitter: 'https://twitter.com/johndoe',
      github: 'https://github.com/johndoe'
    }

    // Update user with enriched data
    await prisma.user.update({
      where: { id: userId },
      data: {
        enrichmentData: enrichedData,
        status: 'ENRICHED'
      }
    })

    // Generate personalized email
    const emailTemplate = `Hi ${user.firstName},

I noticed you're a ${enrichedData.title} at ${enrichedData.company}. I'd love to connect and learn more about your work.

Best,
${team.name} Team`

    // Send Slack notification for approval
    const slackMessage = await slack.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID || '',
      text: 'New user needs approval',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*New User Enriched*\n\n*Name:* ${user.firstName} ${user.lastName}\n*Email:* ${email}\n*Company:* ${enrichedData.company}\n*Title:* ${enrichedData.title}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Proposed Email:*\n```' + emailTemplate + '```'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Approve',
                emoji: true
              },
              style: 'primary',
              value: JSON.stringify({
                userId,
                action: 'approve'
              })
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Reject',
                emoji: true
              },
              style: 'danger',
              value: JSON.stringify({
                userId,
                action: 'reject'
              })
            }
          ]
        }
      ]
    })

    return NextResponse.json({
      message: 'User enriched and notification sent',
      slackTs: slackMessage.ts
    })
  } catch (error) {
    console.error('Error enriching user:', error)
    return new NextResponse('Error enriching user', { status: 500 })
  }
}

// Make the endpoint public since it's authenticated via QStash signature
export const config = {
  api: {
    bodyParser: false
  }
}