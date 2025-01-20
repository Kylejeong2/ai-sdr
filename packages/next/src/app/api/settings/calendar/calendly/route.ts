import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { z } from 'zod'

const calendlyConfigSchema = z.object({
  accessToken: z.string().min(1),
  webhookSigningKey: z.string().min(1),
  organizationId: z.string().optional(),
  isActive: z.boolean()
})

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const validatedData = calendlyConfigSchema.parse(body)

    // Get team ID from user's team membership
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId },
      include: { team: true }
    })

    if (!teamMember) {
      return new NextResponse('Team not found', { status: 404 })
    }

    // Generate webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/calendar`

    // Upsert Calendly config
    await prisma.calendlyConfig.upsert({
      where: { teamId: teamMember.teamId },
      create: {
        teamId: teamMember.teamId,
        accessToken: validatedData.accessToken,
        webhookSigningKey: validatedData.webhookSigningKey,
        organizationId: validatedData.organizationId,
        isActive: validatedData.isActive,
        webhookUrl
      },
      update: {
        accessToken: validatedData.accessToken,
        webhookSigningKey: validatedData.webhookSigningKey,
        organizationId: validatedData.organizationId,
        isActive: validatedData.isActive,
        webhookUrl
      }
    })

    return new NextResponse('Settings updated', { status: 200 })
  } catch (error) {
    console.error('Error updating Calendly settings:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 