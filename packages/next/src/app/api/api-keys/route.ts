import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@graham/db"
import crypto from "crypto"

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  // console.log("[API_KEYS_POST] Received request")
  try {
    const { userId, orgId } = await auth()
    // console.log("[API_KEYS_POST] Auth result:", { userId, orgId })
    
    if (!userId || !orgId) {
      // console.log("[API_KEYS_POST] Unauthorized - missing userId or orgId")
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name } = await req.json()
    // console.log("[API_KEYS_POST] Request body:", { name })
    
    if (!name) {
      // console.log("[API_KEYS_POST] Bad request - missing name")
      return new NextResponse("Name is required", { status: 400 })
    }

    // Get team member info
    // console.log("[API_KEYS_POST] Finding team member")
    
    // First check if user exists
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
    // console.log("[API_KEYS_POST] User lookup result:", JSON.stringify(user, null, 2))

    if (!user) {
      // console.log("[API_KEYS_POST] User not found")
      return new NextResponse("User not found", { status: 404 })
    }

    // Find the team membership for this org
    const teamMember = user.teamMemberships.find(
      tm => tm.team.clerkConfig?.organizationId === orgId
    )
    // console.log("[API_KEYS_POST] Team member result:", JSON.stringify(teamMember, null, 2))

    if (!teamMember) {
      // console.log("[API_KEYS_POST] Team member not found")
      return new NextResponse("Team member not found", { status: 404 })
    }

    // Generate API key
    const apiKey = `gk_${crypto.randomBytes(32).toString("hex")}`
    const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex")
    const prefix = apiKey.substring(0, 8)

    // console.log("[API_KEYS_POST] Creating API key")
    // Store hashed key
    const newApiKey = await prisma.apiKey.create({
      data: {
        name,
        key: hashedKey,
        prefix,
        teamId: teamMember.teamId,
        createdById: teamMember.id
      }
    })
    // console.log("[API_KEYS_POST] API key created:", { id: newApiKey.id, prefix })

    return NextResponse.json({
      id: newApiKey.id,
      name: newApiKey.name,
      prefix,
      key: apiKey, // Only returned once during creation
      createdAt: newApiKey.createdAt
    })
  } catch (error) {
    // console.error("[API_KEYS_POST] Error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET() {
  // console.log("[API_KEYS_GET] Received request")
  try {
    const { userId, orgId } = await auth()
    // console.log("[API_KEYS_GET] Auth result:", { userId, orgId })

    if (!userId || !orgId) {
      // console.log("[API_KEYS_GET] Unauthorized - missing userId or orgId")
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // console.log("[API_KEYS_GET] Finding team member")
    
    // First check if user exists
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
    // console.log("[API_KEYS_GET] User lookup result:", JSON.stringify(user, null, 2))

    if (!user) {
      // console.log("[API_KEYS_GET] User not found")
      return new NextResponse("User not found", { status: 404 })
    }

    // Find the team membership for this org
    const teamMember = user.teamMemberships.find(
      tm => tm.team.clerkConfig?.organizationId === orgId
    )
    // console.log("[API_KEYS_GET] Team member result:", JSON.stringify(teamMember, null, 2))

    if (!teamMember) {
      // console.log("[API_KEYS_GET] Team member not found")
      return new NextResponse("Team member not found", { status: 404 })
    }

    // console.log("[API_KEYS_GET] Fetching API keys")
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        teamId: teamMember.teamId
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsed: true,
        createdAt: true
      }
    })
    // console.log("[API_KEYS_GET] Found API keys:", apiKeys.length)

    return NextResponse.json(apiKeys)
  } catch (error) {
    // console.error("[API_KEYS_GET] Error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 