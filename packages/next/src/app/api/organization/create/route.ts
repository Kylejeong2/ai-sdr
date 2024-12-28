import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { TeamRole } from '@prisma/client'
import { clerk } from '@/configs/clerk-server'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.userId || !session?.orgId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const org = await clerk.organizations.getOrganization({ organizationId: session.orgId })
    const user = await clerk.users.getUser(session.userId)

    // First create or update the team
    const team = await prisma.team.upsert({
      where: { id: org.id },
      create: {
        id: org.id,
        name: org.name,
        createdAt: new Date(org.createdAt),
        updatedAt: new Date(org.updatedAt),
        clerkConfig: {
          create: {
            publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
            secretKey: process.env.CLERK_SECRET_KEY || '',
            webhookSecret: process.env.CLERK_WEBHOOK_SECRET || '',
            organizationId: org.id,
            organizationName: org.name,
            organizationSlug: org.slug || '',
            organizationMetadata: org.publicMetadata ? JSON.parse(JSON.stringify(org.publicMetadata)) : undefined,
            lastWebhookReceived: null,
            webhookStatus: 'unconfigured'
          }
        }
      },
      update: {
        name: org.name,
        updatedAt: new Date(org.updatedAt)
      }
    })

    // First create the ClerkManagedOrg record
    const managedOrg = await prisma.clerkManagedOrg.create({
      data: {
        organizationId: org.id,
        name: org.name,
        slug: org.slug || '',
        metadata: org.publicMetadata ? JSON.parse(JSON.stringify(org.publicMetadata)) : undefined,
        clerkConfig: {
          connect: { teamId: team.id }
        }
      }
    })

    // Then create or update the team member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.userId,
        teamId: team.id
      }
    })

    if (existingMember) {
      await prisma.teamMember.update({
        where: { id: existingMember.id },
        data: { role: TeamRole.OWNER }
      })
    } else {
      await prisma.teamMember.create({
        data: {
          userId: session.userId,
          teamId: team.id,
          role: TeamRole.OWNER
        }
      })
    }

    // Finally update the user with the managed org reference
    await prisma.user.upsert({
      where: { id: session.userId },
      create: {
        id: session.userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        teamId: team.id,
        role: 'OWNER',
        clerkOrgId: managedOrg.id
      },
      update: {
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        teamId: team.id,
        role: 'OWNER',
        clerkOrgId: managedOrg.id
      }
    })

    // Redirect to onboarding
    return NextResponse.redirect(new URL('/onboarding', req.url))
  } catch (error) {
    console.error('[ORGANIZATION_CREATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 