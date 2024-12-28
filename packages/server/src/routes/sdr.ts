import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '@graham/db'
// import { LeadDetectionService } from '../services/leadDetection'
import { EmailGenerationService } from '../services/emailGeneration'
import { validateEmail } from '../utils/emailUtils'
import { z } from 'zod'
import { Client } from '@upstash/qstash'

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!
})

// const leadDetectionService = new LeadDetectionService()
const emailService = new EmailGenerationService()

// const EmailTypeEnum = z.enum(['PERSONAL', 'COMPANY'])
// const LeadStatusEnum = z.enum(['NEW', 'ENRICHED', 'EMAIL_QUEUED', 'EMAIL_SENT', 'RESPONDED', 'CONVERTED', 'DEAD'])
// const EmailStatusEnum = z.enum(['DRAFT', 'QUEUED', 'SENT', 'OPENED', 'CLICKED', 'REPLIED'])

const leadSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  status: z.string(),
  emailType: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
})

const emailTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  subject: z.string(),
  content: z.string(),
  variables: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string()
})

const signupSchema = z.object({
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  teamId: z.string()
})

const emailSchema = z.object({
  id: z.string(),
  subject: z.string(),
  content: z.string(),
  status: z.string(),
  createdAt: z.string()
})

const leadWithEmailsSchema = leadSchema.extend({
  emails: z.array(emailSchema)
})

export const sdrRoutes: FastifyPluginAsync = async (fastify) => {
  // Handle new sign-up
  fastify.post('/signup', {
    schema: {
      body: signupSchema
    }
  }, async (request, reply) => {
    const { email, firstName, lastName, teamId } = signupSchema.parse(request.body)

    if (!validateEmail(email)) {
      return reply.code(400).send({ error: 'Invalid email address' })
    }

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        teamId,
      },
      include: {
        team: true
      }
    })

    // Queue enrichment job
    await qstash.publishJSON({
      url: `${process.env.API_URL}/api/webhook/enrich`,
      body: {
        userId: user.id,
        teamId: user.teamId,
        metadata: {
          signupDate: user.createdAt,
          source: 'signup_form'
        }
      },
      // Retry up to 3 times with exponential backoff
      retries: 3
    })

    return user
  })

  // Get lead status
  fastify.get('/lead/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: z.object(leadWithEmailsSchema.shape)
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        emails: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!lead) {
      return reply.code(404).send({ error: 'Lead not found' })
    }

    return lead
  })

  // Get all leads
  fastify.get('/leads', {
    schema: {
      response: {
        200: z.array(leadWithEmailsSchema)
      }
    }
  }, async () => {
    return prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        emails: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  })

  // Create email template
  fastify.post('/templates', {
    schema: {
      body: z.object({
        name: z.string(),
        subject: z.string(),
        content: z.string(),
        variables: z.array(z.string()).optional()
      }),
      response: {
        200: z.object(emailTemplateSchema.shape)
      }
    }
  }, async (request) => {
    const { name, subject, content, variables } = request.body as any
    return prisma.emailTemplate.create({
      data: {
        name,
        subject,
        content,
        variables: variables || [],
        team: { connect: { id: '123' } },
        createdBy: { connect: { id: '123' } }
      }
    })
  })

  // Get all email templates
  fastify.get('/templates', {
    schema: {
      response: {
        200: z.array(emailTemplateSchema)
      }
    }
  }, async () => {
    return prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })
  })

  // Generate email for lead
  fastify.post('/leads/:id/emails', {
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ templateId: z.string() })
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { templateId } = request.body as { templateId: string }

    const lead = await prisma.lead.findUnique({
      where: { id }
    })

    if (!lead) {
      return reply.code(404).send({ error: 'Lead not found' })
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return reply.code(404).send({ error: 'Template not found' })
    }

    return emailService.generateEmailContent(lead, template)
  })
} 