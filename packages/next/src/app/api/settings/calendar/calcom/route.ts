import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { z } from 'zod'

const calComConfigSchema = z.object({
  apiKey: z.string().min(1),
  webhookSecret: z.string().min(1),
  isActive: z.boolean(),
  environment: z.enum(['production', 'development'])
})

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const validatedData = calComConfigSchema.parse(body)

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

    // Upsert Cal.com config
    await prisma.calComConfig.upsert({
      where: { teamId: teamMember.teamId },
      create: {
        teamId: teamMember.teamId,
        apiKey: validatedData.apiKey,
        webhookSecret: validatedData.webhookSecret,
        environment: validatedData.environment,
        isActive: validatedData.isActive,
        webhookUrl
      },
      update: {
        apiKey: validatedData.apiKey,
        webhookSecret: validatedData.webhookSecret,
        environment: validatedData.environment,
        isActive: validatedData.isActive,
        webhookUrl
      }
    })

    return new NextResponse('Settings updated', { status: 200 })
  } catch (error) {
    console.error('Error updating Cal.com settings:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 