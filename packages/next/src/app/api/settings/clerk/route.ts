import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.userId || !session?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId, publishableKey, secretKey, webhookSecret, organizationId, environment = 'test', webhookEvents } = await req.json()

    if (!teamId || !publishableKey || !secretKey || !webhookSecret || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get team info from Clerk
    const teamResponse = await fetch(`https://api.clerk.com/v1/organizations/${organizationId}`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    })
    const teamData = await teamResponse.json()

    const team = await prisma.team.upsert({
      where: { id: teamId },
      create: {
        id: teamId,
        name: teamData.name || 'My Organization'
      },
      update: {
        name: teamData.name || 'My Organization'
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Then create/update clerk config
    const settings = await prisma.clerkConfig.upsert({
      where: { id: teamId },
      create: {
        id: teamId,
        publishableKey,
        secretKey,
        webhookSecret,
        organizationId,
        environment,
        webhookEvents,
        isActive: true,
        webhookStatus: 'healthy',
        organizationName: teamData.name || 'My Organization',
        organizationSlug: teamData.slug || 'my-org',
        team: {
          connect: { id: teamId }
        }
      },
      update: {
        publishableKey,
        secretKey,
        webhookSecret,
        organizationId,
        environment,
        webhookEvents,
        isActive: true,
        webhookStatus: 'healthy',
        organizationName: teamData.name || 'My Organization',
        organizationSlug: teamData.slug || 'my-org'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: {
        ...settings,
        secretKey: undefined,
        webhookSecret: undefined
      }
    })
  } catch (error) {
    console.error('[CLERK_SETTINGS_SAVE]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    )
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