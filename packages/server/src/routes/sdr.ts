import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '@graham/db'
import { LeadDetectionService } from '../services/leadDetection'
import { EmailGenerationService } from '../services/emailGeneration'
import { validateEmail } from '../utils/emailUtils'

const leadDetectionService = new LeadDetectionService()
const emailService = new EmailGenerationService()

export const sdrRoutes: FastifyPluginAsync = async (fastify) => {
  // Schema definitions
  const leadSchema = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      firstName: { type: 'string', nullable: true },
      lastName: { type: 'string', nullable: true },
      status: { type: 'string' },
      emailType: { type: 'string' },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' }
    }
  }

  const emailTemplateSchema = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      subject: { type: 'string' },
      content: { type: 'string' },
      variables: { type: 'array', items: { type: 'string' } },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' }
    }
  }

  // Handle new sign-up
  fastify.post('/signup', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' }
        }
      },
      response: {
        200: leadSchema
      }
    }
  }, async (request, reply) => {
    const { email, firstName, lastName } = request.body as any

    if (!validateEmail(email)) {
      return reply.code(400).send({ error: 'Invalid email address' })
    }

    const lead = await leadDetectionService.handleNewSignup(email, firstName, lastName)
    return lead
  })

  // Get lead status
  fastify.get('/lead/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          ...leadSchema,
          properties: {
            ...leadSchema.properties,
            emails: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  subject: { type: 'string' },
                  content: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' }
                }
              }
            }
          }
        }
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
        200: {
          type: 'array',
          items: leadSchema
        }
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
      body: {
        type: 'object',
        required: ['name', 'subject', 'content'],
        properties: {
          name: { type: 'string' },
          subject: { type: 'string' },
          content: { type: 'string' },
          variables: { type: 'array', items: { type: 'string' } }
        }
      },
      response: {
        200: emailTemplateSchema
      }
    }
  }, async (request, reply) => {
    const { name, subject, content, variables } = request.body as any

    return prisma.emailTemplate.create({
      data: {
        name,
        subject,
        content,
        variables: variables || []
      }
    })
  })

  // Get all email templates
  fastify.get('/templates', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: emailTemplateSchema
        }
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
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['templateId'],
        properties: {
          templateId: { type: 'string' }
        }
      }
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