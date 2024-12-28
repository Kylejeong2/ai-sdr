import { prisma, type Lead, type EmailTemplate } from '@graham/db'
import { OpenAI } from 'openai'
import { Resend } from 'resend'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const resend = new Resend(process.env.RESEND_API_KEY)

export class EmailGenerationService {
  async generateEmailContent(lead: Lead, template: EmailTemplate) {
    try {
      const prompt = this.buildPrompt(lead, template)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: `You are an expert SDR who writes highly personalized and effective sales emails.
           Your emails are concise, engaging, and focused on value proposition.`
        }, {
          role: "user",
          content: prompt
        }]
      })

      const emailContent = completion.choices?.[0]?.message?.content || ''
      
      // Create email in database
      const email = await prisma.email.create({
        data: {
          leadId: lead.id,
          subject: this.replaceVariables(template.subject, lead),
          content: emailContent,
          status: 'DRAFT'
        }
      })

      // Add to email queue
      await prisma.emailQueue.create({
        data: {
          emailId: email.id
        }
      })

      return email
    } catch (error) {
      console.error('Error generating email:', error)
      throw error
    }
  }

  private buildPrompt(lead: Lead, template: EmailTemplate): string {
    return `
Generate a personalized sales email based on the following information:

Lead Information:
- Name: ${lead.firstName} ${lead.lastName}
- Company: ${lead.company}
- Title: ${lead.title}
- Industry: ${lead.industry}

Template:
${template.content}

Additional Context:
${JSON.stringify(lead.enrichmentData)}

Please generate a highly personalized email that:
1. References specific details about their role and company
2. Addresses their likely pain points based on their industry
3. Provides clear value proposition
4. Includes a clear call to action
5. Maintains a professional but conversational tone
`
  }

  private replaceVariables(text: string, lead: Lead): string {
    const variables = {
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      company: lead.company || '',
      title: lead.title || '',
      industry: lead.industry || ''
    }

    return text.replace(/\{\{(\w+)\}\}/g, (match, variable: keyof typeof variables) => {
      return variables[variable] || match
    })
  }

  async processEmailQueue() {
    const queueItems = await prisma.emailQueue.findMany({
      where: {
        attempts: { lt: 3 },
        OR: [
          { lastAttempt: null },
          { lastAttempt: { lt: new Date(Date.now() - 1000 * 60 * 5) } } // Retry after 5 minutes
        ]
      },
      take: 10
    })

    for (const item of queueItems) {
      try {
        const email = await prisma.email.findUnique({
          where: { id: item.emailId },
          include: { lead: true }
        })

        if (!email) continue

        // Send email using Resend
        await this.sendEmail(email)

        // Update email status
        await prisma.email.update({
          where: { id: email.id },
          data: {
            status: 'SENT',
            sentAt: new Date()
          }
        })

        // Remove from queue
        await prisma.emailQueue.delete({
          where: { id: item.id }
        })

      } catch (error) {
        await prisma.emailQueue.update({
          where: { id: item.id },
          data: {
            attempts: { increment: 1 },
            lastAttempt: new Date(),
            error: (error as Error).message
          }
        })
      }
    }
  }

  private async sendEmail(email: any) {
    const { lead } = email

    try {
      const response = await resend.emails.send({
        from: 'sales@yourdomain.com',
        to: lead.email,
        subject: email.subject,
        html: email.content,
        tags: [
          {
            name: 'email_id',
            value: email.id
          },
          {
            name: 'lead_id',
            value: lead.id
          }
        ]
      })

      // Store the message ID for tracking
      await prisma.email.update({
        where: { id: email.id },
        data: {
          metadata: {
            messageId: response.id
          }
        }
      })

      return response
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }
} 