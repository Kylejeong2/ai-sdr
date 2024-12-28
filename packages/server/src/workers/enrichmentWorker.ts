import { prisma } from '@graham/db'
import { WebClient } from '@slack/web-api'
import { verifySignature } from '@upstash/qstash'
import { EmailGenerationService } from '../services/emailGeneration'
import type { FastifyPluginAsync } from 'fastify'

const slack = new WebClient(process.env.SLACK_BOT_TOKEN)
const emailService = new EmailGenerationService()

interface ClerkData {
  username: string
  profileImage: string
  phoneNumbers: Array<{
    phone_number: string
    verification: {
      status: string
      strategy: string
    }
    id: string
  }>
  organization: {
    name: string
    slug: string
    role: string
  }
}

interface EnrichmentJob {
  userId: string
  teamId: string
  metadata: {
    signupDate: string
    source: string
    clerkData?: ClerkData
  }
}

export const enrichmentWorker: FastifyPluginAsync = async (fastify) => {
  fastify.post('/webhook/enrich', {
    config: {
      rawBody: true
    }
  }, async (request, reply) => {
    // Verify QStash signature
    const signature = request.headers['upstash-signature'] as string
    const isValid = await verifySignature({
      signature,
      body: request.body as string,
      currentDate: request.headers['upstash-date'] as string,
      secret: process.env.QSTASH_CURRENT_SIGNING_KEY!
    })

    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid signature' })
    }

    const job = request.body as EnrichmentJob

    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: job.userId },
        include: { team: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Start with Clerk data if available
      const initialData = job.metadata.clerkData ? {
        company: job.metadata.clerkData.organization.name,
        role: job.metadata.clerkData.organization.role,
        phoneNumbers: job.metadata.clerkData.phoneNumbers.map(p => p.phone_number),
        profileImage: job.metadata.clerkData.profileImage
      } : {}

      // Enrich with additional data (mock enrichment for now)
      // In reality, this would call services like Clearbit, Hunter.io, etc.
      const enrichedData = {
        ...initialData,
        linkedInUrl: 'https://linkedin.com/in/johndoe',
        industry: 'Technology',
        companySize: '51-200',
        location: 'San Francisco, CA',
        // Additional enrichment fields
        companyDomain: 'acme.com',
        companyLinkedIn: 'https://linkedin.com/company/acme',
        employeeCount: '150',
        funding: '$10M Series A',
        technologies: ['React', 'Node.js', 'PostgreSQL'],
        competitors: ['competitor1.com', 'competitor2.com'],
        revenueRange: '$1M-$10M'
      }

      // Update user with enriched data
      await prisma.user.update({
        where: { id: user.id },
        data: {
          enrichmentData: enrichedData,
          status: 'ENRICHED'
        }
      })

      // Create activity for enrichment
      await prisma.activity.create({
        data: {
          type: 'enrichment_completed',
          description: `Enriched data for ${user.email}`,
          metadata: enrichedData,
          leadId: user.id,
          teamMemberId: user.id
        }
      })

      // Generate personalized email based on enriched data
      const emailContent = await emailService.generatePersonalizedEmail(user, enrichedData)

      // Send to Slack for approval
      await slack.chat.postMessage({
        channel: process.env.SLACK_APPROVAL_CHANNEL!,
        text: 'New Lead Enriched - Approval Needed',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*New Lead Enriched*\n*Team:* ${user.team.name}\n*Email:* ${user.email}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Company Info:*\n' +
                `• *Company:* ${enrichedData.company}\n` +
                `• *Size:* ${enrichedData.companySize}\n` +
                `• *Industry:* ${enrichedData.industry}\n` +
                `• *Revenue:* ${enrichedData.revenueRange}\n` +
                `• *Funding:* ${enrichedData.funding}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Contact Info:*\n' +
                `• *Role:* ${enrichedData.role}\n` +
                `• *Location:* ${enrichedData.location}\n` +
                `• *LinkedIn:* ${enrichedData.linkedInUrl}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Tech Stack:*\n' +
                enrichedData.technologies.map(tech => `• ${tech}`).join('\n')
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Proposed Email:*\n' +
                `*Subject:* ${emailContent.subject}\n\n${emailContent.content}`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Approve & Send',
                  emoji: true
                },
                style: 'primary',
                value: JSON.stringify({
                  action: 'approve_email',
                  userId: user.id,
                  emailContent
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
                  action: 'reject_email',
                  userId: user.id
                })
              }
            ]
          }
        ]
      })

      return reply.send({ status: 'success' })
    } catch (error) {
      console.error('Enrichment error:', error)
      return reply.code(500).send({ error: (error as Error).message })
    }
  })
} 