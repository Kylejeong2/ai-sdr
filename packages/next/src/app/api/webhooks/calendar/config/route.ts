import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const configSchema = z.object({
  provider: z.enum(['calcom', 'calendly']),
  webhookUrl: z.string().url(),
  webhookSecret: z.string().min(10),
  apiKey: z.string().min(1),
  organizationId: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = configSchema.parse(body)

    // Get the team member record
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        user: { clerkId: session.userId },
        team: { id: validatedData.organizationId },
      },
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    if (validatedData.provider === 'calcom') {
      await prisma.calComConfig.upsert({
        where: { teamMemberId: teamMember.id },
        create: {
          teamMemberId: teamMember.id,
          apiKey: validatedData.apiKey,
          webhookSecret: validatedData.webhookSecret,
          webhookUrl: validatedData.webhookUrl,
          environment: 'production',
          isActive: true,
        },
        update: {
          apiKey: validatedData.apiKey,
          webhookSecret: validatedData.webhookSecret,
          webhookUrl: validatedData.webhookUrl,
          isActive: true,
        },
      })
    } else {
      await prisma.calendlyConfig.upsert({
        where: { teamMemberId: teamMember.id },
        create: {
          teamMemberId: teamMember.id,
          accessToken: validatedData.apiKey,
          webhookSigningKey: validatedData.webhookSecret,
          webhookUrl: validatedData.webhookUrl,
          isActive: true,
        },
        update: {
          accessToken: validatedData.apiKey,
          webhookSigningKey: validatedData.webhookSecret,
          webhookUrl: validatedData.webhookUrl,
          isActive: true,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving webhook config:', error)
    return NextResponse.json(
      { error: 'Failed to save webhook configuration' },
      { status: 500 }
    )
  }
} 