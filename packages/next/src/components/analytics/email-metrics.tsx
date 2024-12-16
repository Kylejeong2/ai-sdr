"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { type Lead } from "@/lib/api"
import { eachDayOfInterval, format, subDays } from "date-fns"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface EmailMetricsProps {
  data: Lead[]
}

export function EmailMetrics({ data }: EmailMetricsProps) {
  // Get last 30 days
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 29)
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now })

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const chartData = {
    labels: days.map(day => format(day, 'MMM d')),
    datasets: [
      {
        label: "Emails Sent",
        data: days.map(day => {
          return data.reduce((acc, lead) => {
            return acc + lead.emails.filter(email => {
              const emailDate = new Date(email.createdAt)
              return format(emailDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
            }).length
          }, 0)
        }),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
      },
      {
        label: "Opens",
        data: days.map(day => {
          return data.reduce((acc, lead) => {
            return acc + lead.emails.filter(email => {
              const openDate = email.openedAt ? new Date(email.openedAt) : null
              return openDate && format(openDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
            }).length
          }, 0)
        }),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.5)",
      },
      {
        label: "Replies",
        data: days.map(day => {
          return data.reduce((acc, lead) => {
            return acc + lead.emails.filter(email => {
              const replyDate = email.repliedAt ? new Date(email.repliedAt) : null
              return replyDate && format(replyDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
            }).length
          }, 0)
        }),
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.5)",
      },
    ],
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Performance Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <Line options={options} data={chartData} />
        </div>
      </CardContent>
    </Card>
  )
} 