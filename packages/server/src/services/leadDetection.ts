import { prisma, EmailType } from '@graham/db'
import { detectEmailType } from '../utils/emailUtils'

export class LeadDetectionService {
  async handleNewSignup(email: string, firstName?: string, lastName?: string) {
    try {
      const emailType = detectEmailType(email)
      
      const lead = await prisma.lead.create({
        data: {
          email,
          emailType,
          firstName,
          lastName,
          status: 'NEW'
        }
      })

      // Create enrichment queue entry
      await prisma.enrichmentQueue.create({
        data: {
          leadId: lead.id
        }
      })

      return lead
    } catch (error) {
      console.error('Error in handleNewSignup:', error)
      throw error
    }
  }
} 