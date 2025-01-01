import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { prisma } from '@graham/db'
import { TeamRole } from '@graham/db'
import { tasks } from "@trigger.dev/sdk/v3"
import type { enrichUserTask } from '@/trigger/enrichment'

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const headersList = headers()
    const svixId = headersList.get('svix-id')
    const svixTimestamp = headersList.get('svix-timestamp')
    const svixSignature = headersList.get('svix-signature')

    // Extract organization ID from the webhook payload
    const payload = await req.json()
    const orgId = payload?.data?.organization?.id || payload?.data?.organization_id

    // Get webhook secret from database
    const clerkConfig = orgId ? await prisma.clerkConfig.findUnique({
      where: { id: orgId }
    }) : null

    // For org creation events, we won't have a config yet
    const webhookSecret = clerkConfig?.webhookSecret || process.env.CLERK_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('No webhook secret found')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 400 })
    }

    // Verify webhook
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing svix headers')
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
    }

    const wh = new Webhook(webhookSecret)
    let evt: any

    try {
      evt = wh.verify(JSON.stringify(payload), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature
      })
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return NextResponse.json({ error: 'Error verifying webhook' }, { status: 400 })
    }

    // Handle different webhook events
    const eventType = evt.type
    console.log(`Received webhook event: ${eventType}`)

    switch (eventType) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name } = evt.data
        const primaryEmail = email_addresses?.[0]?.email_address

        // Create basic user record immediately
        const user = await prisma.user.create({
          data: {
            id,
            email: primaryEmail || '',
            firstName: first_name || '',
            lastName: last_name || '',
            team: {
              create: {
                name: `${first_name || 'New'}'s Team`,
                members: {
                  create: {
                    userId: id,
                    role: TeamRole.OWNER
                  }
                }
              }
            }
          },
          include: {
            team: true
          }
        })

        // Queue enrichment via Trigger.dev
        await tasks.trigger<typeof enrichUserTask>("enrich-user", {
          userId: id,
          teamId: user.team.id,
          email: primaryEmail,
          metadata: {
            source: 'clerk_signup',
            type: 'user.created',
            firstName: first_name,
            lastName: last_name,
            signupTimestamp: new Date(),
            clerkUserId: id,
            teamId: user.team.id
          }
        })
        break
      }

      case 'organization.created': {
        const { id, name, slug } = evt.data

        // Create team immediately
        const team = await prisma.team.create({
          data: {
            id,
            name,
            clerkConfig: {
              create: {
                id,
                publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
                secretKey: process.env.CLERK_SECRET_KEY!,
                webhookSecret: process.env.CLERK_WEBHOOK_SECRET!,
                organizationId: id,
                organizationName: name,
                organizationSlug: slug,
                isActive: true,
                webhookStatus: 'healthy'
              }
            }
          }
        })

        // Queue enrichment via Trigger.dev
        await tasks.trigger<typeof enrichUserTask>("enrich-user", {
          userId: id,
          teamId: team.id,
          email: name,
          metadata: {
              source: 'clerk_signup',
              type: 'organization.created',
              name,
              slug,
            teamId: team.id
          }
        })
        break
      }

      case 'organizationMembership.created': {
        const { organization, public_user_data, role } = evt.data
        const userId = public_user_data.user_id
        const orgId = organization.id
        const teamRole = role === 'org:admin' ? TeamRole.OWNER : TeamRole.MEMBER

        // Create team member relationship
        await prisma.teamMember.create({
          data: {
            userId,
            teamId: orgId,
            role: teamRole
          }
        })

        // Update user's current team
        await prisma.user.update({
          where: { id: userId },
          data: {
            teamId: orgId,
            clerkOrgId: orgId
          }
        })
        break
      }
    }

    // Update webhook status for organization events
    if (eventType.startsWith('organization.') && orgId) {
      await prisma.clerkConfig.update({
        where: { id: orgId },
        data: {
          lastWebhookReceived: new Date(),
          webhookStatus: 'healthy'
        }
      })
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