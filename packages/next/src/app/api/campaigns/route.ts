import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.userId || !session?.orgId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    if (!teamId || teamId !== session.orgId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get all sequences (campaigns) for the team
    const sequences = await prisma.sequence.findMany({
      where: {
        teamId
      },
      include: {
        leads: true,
        emails: true
      }
    })

    // Transform sequences into campaign format
    const campaigns = sequences.map(sequence => ({
      id: sequence.id,
      name: sequence.name,
      status: sequence.isActive ? 'ACTIVE' : 'COMPLETED',
      leads: sequence.leads.length,
      sent: sequence.emails.length,
      opened: sequence.emails.filter(e => e.openedAt).length,
      replied: sequence.emails.filter(e => e.repliedAt).length,
      createdAt: sequence.createdAt
    }))

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('[CAMPAIGNS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 