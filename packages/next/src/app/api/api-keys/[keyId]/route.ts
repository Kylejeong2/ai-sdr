import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@graham/db"

export async function DELETE(
  req: Request,
  { params }: { params: { keyId: string } }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId,
        team: {
          clerkConfig: {
            organizationId: orgId
          }
        }
      }
    })

    if (!teamMember) {
      return new NextResponse("Team member not found", { status: 404 })
    }

    // Delete the API key
    await prisma.apiKey.delete({
      where: {
        id: params.keyId,
        teamId: teamMember.teamId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[API_KEY_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 