import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { client } from '@/trigger'
import { prisma } from '@graham/db'

// Verify Calendly webhook signature
async function verifyCalendlySignature(signature: string, body: string, teamId: string) {
  const config = await prisma.calendlyConfig.findUnique({
    where: { teamId }
  })
  if (!config?.webhookSigningKey) return false
  
  const hmac = crypto.createHmac('sha256', config.webhookSigningKey)
  hmac.update(body)
  const hash = hmac.digest('hex')
  
  return signature === hash
}

// Verify Cal.com webhook signature
async function verifyCalComSignature(signature: string, body: string, teamId: string) {
  const config = await prisma.calComConfig.findUnique({
    where: { teamId }
  })
  if (!config?.webhookSecret) return false

  const hmac = crypto.createHmac('sha256', config.webhookSecret)
  hmac.update(body)
  const hash = `sha256=${hmac.digest('hex')}`

  return signature === hash
}

export async function POST(req: Request) {
  const headersList = headers()
  const body = await req.text()
  
  // Get webhook source and signature
  const source = headersList.get('x-webhook-source') || ''
  const calendlySignature = headersList.get('calendly-webhook-signature') || ''
  const calComSignature = headersList.get('x-cal-signature-256') || ''
  const teamId = headersList.get('x-team-id') || ''

  if (!teamId) {
    return new NextResponse('Missing team ID', { status: 400 })
  }

  try {
    const jsonBody = JSON.parse(body)
    let userData = null

    // Handle Calendly webhook
    if (source === 'calendly' && await verifyCalendlySignature(calendlySignature, body, teamId)) {
      const config = await prisma.calendlyConfig.findUnique({
        where: { teamId }
      })
      
      if (!config?.isActive) {
        return new NextResponse('Calendly integration is not active', { status: 400 })
      }

      if (jsonBody.event === 'invitee.created') {
        userData = {
          email: jsonBody.payload.invitee.email,
          firstName: jsonBody.payload.invitee.first_name,
          lastName: jsonBody.payload.invitee.last_name,
          teamId,
          metadata: {
            source: 'calendly',
            eventType: jsonBody.payload.event_type.name,
            scheduledTime: jsonBody.payload.scheduled_time,
            timezone: jsonBody.payload.invitee.timezone,
            questions: jsonBody.payload.questions_and_answers
          }
        }
      }
    }
    // Handle Cal.com webhook
    else if (source === 'cal.com' && await verifyCalComSignature(calComSignature, body, teamId)) {
      const config = await prisma.calComConfig.findUnique({
        where: { teamId }
      })
      
      if (!config?.isActive) {
        return new NextResponse('Cal.com integration is not active', { status: 400 })
      }

      if (jsonBody.triggerEvent === 'BOOKING_CREATED') {
        const attendee = jsonBody.payload.attendees[0]
        userData = {
          email: attendee.email,
          firstName: attendee.name.split(' ')[0],
          lastName: attendee.name.split(' ').slice(1).join(' '),
          teamId,
          metadata: {
            source: 'cal.com',
            eventType: jsonBody.payload.eventTitle,
            scheduledTime: jsonBody.payload.startTime,
            timezone: attendee.timeZone,
            responses: jsonBody.payload.responses
          }
        }
      }
    } else {
      return new NextResponse('Invalid webhook source or signature', { status: 401 })
    }

    if (userData) {
      // Get the first team member to assign the lead to
      const teamMember = await prisma.teamMember.findFirst({
        where: { teamId: userData.teamId }
      })

      if (!teamMember) {
        return new NextResponse('No team members found', { status: 400 })
      }

      // Create a lead record
      const lead = await prisma.lead.create({
        data: {
          email: userData.email,
          emailType: userData.email.includes('@gmail.com') || 
                    userData.email.includes('@yahoo.com') || 
                    userData.email.includes('@hotmail.com') ? 'PERSONAL' : 'COMPANY',
          firstName: userData.firstName,
          lastName: userData.lastName,
          status: 'NEW',
          assignedTo: {
            connect: {
              id: teamMember.id
            }
          }
        }
      })

      // Trigger the enrichment job
      await client.sendEvent({
        name: "enrich.user",
        payload: {
          leadId: lead.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          metadata: userData.metadata
        }
      })

      return new NextResponse('Webhook processed', { status: 200 })
    }

    return new NextResponse('No action needed', { status: 200 })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new NextResponse('Webhook processing failed', { status: 500 })
  }
} 