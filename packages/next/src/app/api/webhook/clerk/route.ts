import { NextResponse } from 'next/server'
import { prisma } from '@graham/db'
import { TeamRole } from '@graham/db'
import { tasks } from "@trigger.dev/sdk/v3"
import { Webhook } from "svix"
import { headers } from 'next/headers'
import type { WebhookEvent } from "@clerk/nextjs/server"
import type { enrichUserTask } from '@/trigger/enrichment'

export const dynamic = "force-dynamic"

async function validateRequest(req: Request, webhookSecret?: string) {
  const payloadString = await req.text()
  const headerPayload = headers()

  // Get the webhook secret - fallback to env if not provided
  const secret = webhookSecret || process.env.CLERK_WEBHOOK_SECRET

  if (!secret) {
    throw new Error('No webhook secret found')
  }

  // Get the headers
  const svixHeaders = {
    'svix-id': headerPayload.get('svix-id') ?? '',
    'svix-timestamp': headerPayload.get('svix-timestamp') ?? '',
    'svix-signature': headerPayload.get('svix-signature') ?? ''
  }

  // Check if headers are present
  if (!svixHeaders['svix-id'] || !svixHeaders['svix-timestamp'] || !svixHeaders['svix-signature']) {
    console.error('Missing Svix headers:', svixHeaders)
    throw new Error('Missing Svix headers')
  }

  try {
    const wh = new Webhook(secret)
    const evt = wh.verify(payloadString, svixHeaders) as WebhookEvent
    return { evt, payloadString }
  } catch (err) {
    console.error('Webhook verification failed:', err, {
      payloadPreview: payloadString.slice(0, 100),
      headers: svixHeaders,
      secretPreview: secret.slice(0, 5) + '...'
    })
    throw new Error(`Webhook verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

export async function POST(req: Request) {
  try {
    // First try to parse the payload without verification to get org ID
    const rawPayload = await req.clone().json()
    console.log('Raw Webhook Payload:', JSON.stringify(rawPayload, null, 2))
    
    const orgId = rawPayload.data?.organization_memberships?.[0]?.organization?.id
    console.log('Extracted Organization ID:', orgId)

    // If we have an org ID, try to find its webhook secret
    let webhookSecret: string | undefined
    if (orgId) {
      const clerkConfig = await prisma.clerkConfig.findFirst({
        where: { organizationId: orgId }
      })
      webhookSecret = clerkConfig?.webhookSecret
    }

    // Validate with org-specific secret if found, otherwise fallback to env
    const { evt: payload } = await validateRequest(req, webhookSecret)
    const eventType = payload.type
    console.log(`Processing webhook event: ${eventType}`, payload)

    // Process verified webhook
    switch (eventType) {
      case 'user.created': {
        const { id: clerkId, email_addresses, first_name, last_name, organization_memberships } = payload.data
        const primaryEmail = email_addresses?.[0]?.email_address
        const orgMemberships = organization_memberships ?? []

        // Create user without team if no org membership exists
        if (orgMemberships.length === 0) {
          await prisma.user.create({
            data: {
              clerkId,
              email: primaryEmail,
              firstName: first_name,
              lastName: last_name,
            }
          })
          break
        }

        // Find the team based on the organization
        const orgId = orgMemberships[0].organization.id
        const team = await prisma.team.findFirst({
          where: {
            clerkConfig: {
              organizationId: orgId
            }
          },
          include: {
            clerkConfig: true
          }
        })

        if (!team) {
          throw new Error('No team found for organization')
        }

        // Create user and connect to team
        const user = await prisma.user.create({
          data: {
            clerkId,
            email: primaryEmail,
            firstName: first_name,
            lastName: last_name,
            teamId: team.id,
            clerkOrgId: orgMemberships[0].organization.id,
            // Create team membership
            teamMemberships: {
              create: {
                teamId: team.id,
                role: TeamRole.MEMBER
              }
            }
          },
          include: {
            teamMemberships: true
          }
        })

        // Queue enrichment via Trigger.dev
        await tasks.trigger<typeof enrichUserTask>("enrich-user", {
          userId: user.id,
          teamId: team.id,
          email: primaryEmail,
          metadata: {
            source: 'clerk_signup',
            type: 'user.created',
            firstName: first_name,
            lastName: last_name,
            signupTimestamp: new Date(),
            clerkUserId: clerkId,
            teamId: team.id
          }
        })

        // Update webhook status
        if (team.clerkConfig) {
          await prisma.clerkConfig.update({
            where: { id: team.clerkConfig.id },
            data: {
              lastWebhookReceived: new Date(),
              webhookStatus: 'healthy'
            }
          })
        }
        break
      }

      case 'organization.created': {
        const { id: clerkOrgId, name, slug } = payload.data

        // Create team with Clerk config
        await prisma.team.create({
          data: {
            name,
            clerkConfig: {
              create: {
                id: clerkOrgId,
                publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
                secretKey: process.env.CLERK_SECRET_KEY!,
                webhookSecret: process.env.CLERK_WEBHOOK_SECRET!,
                organizationId: clerkOrgId,
                organizationName: name,
                organizationSlug: slug,
                isActive: true,
                webhookStatus: 'healthy'
              }
            }
          }
        })
        break
      }

      case 'organizationMembership.created': {
        const { organization, public_user_data, role } = payload.data
        const clerkUserId = public_user_data.user_id
        const clerkOrgId = organization.id
        const teamRole = role === 'org:admin' ? TeamRole.OWNER : TeamRole.MEMBER

        // Find user by Clerk ID
        const user = await prisma.user.findUnique({
          where: { clerkId: clerkUserId }
        })

        if (!user) {
          throw new Error('User not found')
        }

        // Find team by org ID
        const team = await prisma.team.findFirst({
          where: {
            clerkConfig: {
              organizationId: clerkOrgId
            }
          },
          include: {
            clerkConfig: true
          }
        })

        if (!team) {
          throw new Error('Team not found')
        }

        // Create team membership
        await prisma.teamMember.create({
          data: {
            userId: user.id,
            teamId: team.id,
            role: teamRole
          }
        })

        // Update user's current team
        await prisma.user.update({
          where: { id: user.id },
          data: {
            teamId: team.id,
            clerkOrgId
          }
        })

        // Update webhook status
        if (team.clerkConfig) {
          await prisma.clerkConfig.update({
            where: { id: team.clerkConfig.id },
            data: {
              lastWebhookReceived: new Date(),
              webhookStatus: 'healthy'
            }
          })
        }
        break
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
} 