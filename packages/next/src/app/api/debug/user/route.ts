import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@graham/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get full user data
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        teamMemberships: {
          include: {
            team: {
              include: {
                clerkConfig: true
              }
            }
          }
        }
      }
    })

    // Get Clerk org data
    const team = await prisma.team.findFirst({
      where: {
        clerkConfig: {
          organizationId: orgId
        }
      },
      include: {
        clerkConfig: true,
        members: true
      }
    })

    return NextResponse.json({
      auth: { userId, orgId },
      user,
      team,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[DEBUG_USER] Error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 