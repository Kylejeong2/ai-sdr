import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { client } from '@/trigger'
import { prisma } from '@graham/db'

type CalComOrganizer = {
  name: string
  email: string
  timezone: string
  language: {
    locale: string
  }
}

// Verify Calendly webhook signature
// async function verifyCalendlySignature(signature: string, body: string, teamId: string) {
//   const config = await prisma.calendlyConfig.findUnique({
//     where: { teamId }
//   })
//   if (!config?.webhookSigningKey) return false
  
//   const hmac = crypto.createHmac('sha256', config.webhookSigningKey)
//   hmac.update(body)
//   const hash = hmac.digest('hex')
  
//   return signature === hash
// }

// here's what needs to happen
/** get organizer -> email -> match that to a team member -> match it to the team */

// Verify Cal.com webhook signature
async function verifyCalComSignature(signature: string, body: string, organizer: CalComOrganizer) {
  // get the team member id from the organizer email
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      user: {
        email: organizer.email
      }
    }
  })
  if(!teamMember) return false
  
  const config = await prisma.calComConfig.findFirst({
    where: {
      teamMemberId: teamMember.id
    }
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
  // const calendlySignature = headersList.get('calendly-webhook-signature') || ''
  const calComSignature = headersList.get('x-cal-signature-256') || ''
  const teamId = headersList.get('x-team-id') || ''

  if (!teamId) {
    return new NextResponse('Missing team ID', { status: 400 })
  }

  try {
    const jsonBody = JSON.parse(body)
    let userData = null

    // Handle Calendly webhook
    // if (source === 'calendly' && await verifyCalendlySignature(calendlySignature, body, teamId)) {
    //   const config = await prisma.calendlyConfig.findFirst({
    //     where: { team }
    //   })
      
    //   if (!config?.isActive) {
    //     return new NextResponse('Calendly integration is not active', { status: 400 })
    //   }

    //   if (jsonBody.event === 'invitee.created') {
    //     userData = {
    //       email: jsonBody.payload.invitee.email,
    //       firstName: jsonBody.payload.invitee.first_name,
    //       lastName: jsonBody.payload.invitee.last_name,
    //       teamId,
    //       metadata: {
    //         source: 'calendly',
    //         eventType: jsonBody.payload.event_type.name,
    //         scheduledTime: jsonBody.payload.scheduled_time,
    //         timezone: jsonBody.payload.invitee.timezone,
    //         questions: jsonBody.payload.questions_and_answers
    //       }
    //     }
    //   }
    // }
    // // Handle Cal.com webhook
    // else 
    if (source === 'cal.com' && await verifyCalComSignature(calComSignature, body, jsonBody.payload.organizer)) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          user: {
              email: jsonBody.payload.organizer.email
          }
        }
      })
      if(!teamMember) return false
      const config = await prisma.calComConfig.findFirst({
        where: {
          teamMemberId: teamMember.id
        }
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
          teamId: teamMember.teamId,
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
/*
example webhook from cal.com

{
    "triggerEvent": "BOOKING_CREATED",
    "createdAt": "2023-05-24T09:30:00.538Z",
    "payload": {
        "type": "60min",
        "title": "60min between Pro Example and John Doe",
        "description": "",
        "additionalNotes": "",
        "customInputs": {},
        "startTime": "2023-05-25T09:30:00Z",
        "endTime": "2023-05-25T10:30:00Z",
        "organizer": {
            "id": 5,
            "name": "Pro Example",
            "email": "pro@example.com",
            "username": "pro",
            "timeZone": "Asia/Kolkata",
            "language": {
                "locale": "en"
            },
            "timeFormat": "h:mma"
        },
        "responses": {
            "name": {
                "label": "your_name",
                "value": "John Doe"
            },
            "email": {
                "label": "email_address",
                "value": "john.doe@example.com"
            },
            "location": {
                "label": "location",
                "value": {
                    "optionValue": "",
                    "value": "inPerson"
                }
            },
            "notes": {
                "label": "additional_notes"
            },
            "guests": {
                "label": "additional_guests"
            },
            "rescheduleReason": {
                "label": "reschedule_reason"
            }
        },
        "userFieldsResponses": {},
        "attendees": [
            {
                "email": "john.doe@example.com",
                "name": "John Doe",
                "timeZone": "Asia/Kolkata",
                "language": {
                    "locale": "en"
                }
            }
        ],
        "location": "Calcom HQ",
        "destinationCalendar": {
            "id": 10,
            "integration": "apple_calendar",
            "externalId": "https://caldav.icloud.com/1234567/calendars/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX/",
            "userId": 5,
            "eventTypeId": null,
            "credentialId": 1
        },
        "hideCalendarNotes": false,
        "requiresConfirmation": null,
        "eventTypeId": 7,
        "seatsShowAttendees": true,
        "seatsPerTimeSlot": null,
        "uid": "bFJeNb2uX8ANpT3JL5EfXw",
        "appsStatus": [
            {
                "appName": "Apple Calendar",
                "type": "apple_calendar",
                "success": 1,
                "failures": 0,
                "errors": [],
                "warnings": []
            }
        ],
        "eventTitle": "60min",
        "eventDescription": "",
        "price": 0,
        "currency": "usd",
        "length": 60,
        "bookingId": 91,
        "metadata": {},
        "status": "ACCEPTED"
    }
}


*/