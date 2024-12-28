import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { startOfDay, subDays, format } from 'date-fns'

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

    // Get all emails for the team
    const emails = await prisma.email.findMany({
      where: {
        sequence: {
          teamId
        }
      }
    })

    // Calculate overall metrics
    const emailsSent = emails.length
    const emailsOpened = emails.filter(e => e.openedAt).length
    const emailsClicked = emails.filter(e => e.clickedAt).length
    const emailsReplied = emails.filter(e => e.repliedAt).length

    // Calculate daily stats for the last 30 days
    const dailyStats = []
    for (let i = 0; i < 30; i++) {
      const date = subDays(startOfDay(new Date()), i)
      const dayEmails = emails.filter(e => {
        const emailDate = startOfDay(new Date(e.createdAt))
        return emailDate.getTime() === date.getTime()
      })

      dailyStats.unshift({
        date: format(date, 'MMM dd'),
        sent: dayEmails.length,
        opened: dayEmails.filter(e => e.openedAt).length,
        clicked: dayEmails.filter(e => e.clickedAt).length,
        replied: dayEmails.filter(e => e.repliedAt).length
      })
    }

    return NextResponse.json({
      emailsSent,
      emailsOpened,
      emailsClicked,
      emailsReplied,
      dailyStats
    })
  } catch (error) {
    console.error('[ANALYTICS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 