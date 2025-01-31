import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { NextResponse } from 'next/server'

async function createOrgEntities(userId: string, orgId: string, name: string) {
  // 1. Create team if it doesn't exist
  const team = await prisma.team.upsert({
    where: { id: orgId },
    create: {
      id: orgId,
      name: name,
      members: {
        create: {
          role: 'ADMIN',
          user: {
            connect: { clerkId: userId }
          }
        }
      }
    },
    update: {}, 
    include: {
      members: {
        include: { user: true }
      }
    }
  });

  // 2. Find the team member (should exist now)
  const teamMember = team.members.find(m => m.user.clerkId === userId);
  if (!teamMember) {
    throw new Error('Team member not found after creation');
  }

  return { team, teamMember, dbUser: teamMember.user };
}

// Handle Clerk's redirect after org creation
export async function GET() {
  try {
    const session = await auth()
    const user = await currentUser()
    const userId = session.userId
    const orgId = session.orgId
    
    if (!userId || !orgId || !user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json(
        { error: 'Unauthorized or missing email' },
        { status: 401 }
      )
    }

    // Get org details from Clerk
    const org = await fetch(
      `https://api.clerk.com/v1/organizations/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    ).then(res => res.json())

    await createOrgEntities(userId, orgId, org.name)

    // Redirect to onboarding
    return NextResponse.redirect(new URL('/onboarding', process.env.NEXT_PUBLIC_BASE_URL))
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}

// Handle direct API calls
export async function POST(req: Request) {
  try {
    const session = await auth()
    const user = await currentUser()
    const userId = session.userId
    
    if (!userId || !user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json(
        { error: 'Unauthorized or missing email' },
        { status: 401 }
      )
    }

    const { orgId, name } = await req.json()
    const result = await createOrgEntities(userId, orgId, name)

    return NextResponse.json({ 
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
} 