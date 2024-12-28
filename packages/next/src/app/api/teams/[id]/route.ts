import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.userId || !session?.orgId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Verify the team belongs to the organization
    if (params.id !== session.orgId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get or create the team
    const team = await prisma.team.upsert({
      where: { id: session.orgId },
      create: {
        id: session.orgId,
        name: 'My Team',
        members: {
          create: {
            userId: session.userId,
            role: 'OWNER'
          }
        }
      },
      update: {},
      include: {
        members: true,
        templates: true,
        sequences: true,
        clerkConfig: true
      }
    })

    // Get the current team member
    const currentMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.userId,
        teamId: team.id
      }
    })

    return NextResponse.json({ team, currentMember })
  } catch (error) {
    console.error('[TEAM_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 