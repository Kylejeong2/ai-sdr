import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { NextResponse } from 'next/server'

async function createOrgEntities(userId: string, orgId: string, name: string, user: any) {
  // 1. Check if team already exists
  const existingTeam = await prisma.team.findUnique({
    where: { id: orgId },
    include: { members: true }
  })

  // 2. Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { clerkId: userId },
        { email: user.emailAddresses[0].emailAddress }
      ]
    }
  })

  // 3. Create or update team
  const team = existingTeam || await prisma.team.create({
    data: {
      id: orgId,
      name: name
    }
  })

  // 4. Create or update user
  const dbUser = existingUser 
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          clerkId: userId,
          email: user.emailAddresses[0].emailAddress,
          teamId: team.id,
          role: 'OWNER',
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        }
      })
    : await prisma.user.create({
        data: {
          clerkId: userId,
          email: user.emailAddresses[0].emailAddress,
          teamId: team.id,
          role: 'OWNER',
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        }
      })

  // 5. Create team member if doesn't exist
  const existingMember = existingTeam?.members.find(m => m.userId === userId)
  const teamMember = existingMember || await prisma.teamMember.create({
    data: {
      userId,
      teamId: team.id,
      role: 'OWNER'
    }
  })

  return { team, teamMember, dbUser }
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

    await createOrgEntities(userId, orgId, org.name, user)

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_BASE_URL))
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
    const result = await createOrgEntities(userId, orgId, name, user)

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