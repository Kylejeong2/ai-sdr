import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { z } from 'zod'

const settingsSchema = z.object({
  organizationId: z.string(),
  publishableKey: z.string(),
  secretKey: z.string(),
  webhookSecret: z.string(),
  environment: z.enum(['test', 'production']).default('test'),
  webhookEvents: z.array(z.string()).default([
    'user.created',
    'organization.created',
    'organizationMembership.created'
  ])
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.userId || !session?.orgId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await req.json()
    const body = settingsSchema.parse(json)

    // Verify that the user is updating settings for their own organization
    if (body.organizationId !== session.orgId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get or create the team
    const team = await prisma.team.upsert({
      where: { id: session.orgId },
      create: {
        id: session.orgId,
        name: 'My Team', // You might want to get this from Clerk
      },
      update: {},
    })

    // Update or create the Clerk config
    const clerkConfig = await prisma.clerkConfig.upsert({
      where: { teamId: team.id },
      create: {
        teamId: team.id,
        publishableKey: body.publishableKey,
        secretKey: body.secretKey,
        webhookSecret: body.webhookSecret,
        organizationId: body.organizationId,
        environment: body.environment,
        webhookEvents: body.webhookEvents,
        organizationName: 'My Organization', // You might want to get this from Clerk
        organizationSlug: 'my-org', // You might want to get this from Clerk
      },
      update: {
        publishableKey: body.publishableKey,
        secretKey: body.secretKey,
        webhookSecret: body.webhookSecret,
        environment: body.environment,
        webhookEvents: body.webhookEvents
      }
    })

    return NextResponse.json(clerkConfig)
  } catch (error) {
    console.error('[CLERK_SETTINGS]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.userId || !session?.orgId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    if (!teamId || teamId !== session.orgId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const clerkConfig = await prisma.clerkConfig.findUnique({
      where: { teamId }
    })

    return NextResponse.json(clerkConfig)
  } catch (error) {
    console.error('[CLERK_SETTINGS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 