"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { type Lead } from "@/lib/api"
import { eachMonthOfInterval, format, subMonths, startOfMonth, endOfMonth } from "date-fns"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface LeadMetricsProps {
  data: Lead[]
}

export function LeadMetrics({ data }: LeadMetricsProps) {
  // Get last 6 months
  const now = new Date()
  const sixMonthsAgo = subMonths(now, 5)
  const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now })

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
    labels: months.map(month => format(month, 'MMM yyyy')),
    datasets: [
      {
        label: "New Leads",
        data: months.map(month => {
          const start = startOfMonth(month)
          const end = endOfMonth(month)
          return data.filter(lead => {
            const date = new Date(lead.createdAt)
            return date >= start && date <= end
          }).length
        }),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
      },
      {
        label: "Enriched",
        data: months.map(month => {
          const start = startOfMonth(month)
          const end = endOfMonth(month)
          return data.filter(lead => {
            const date = new Date(lead.createdAt)
            return date >= start && date <= end && lead.status === 'ENRICHED'
          }).length
        }),
        backgroundColor: "rgba(16, 185, 129, 0.5)",
      },
      {
        label: "Converted",
        data: months.map(month => {
          const start = startOfMonth(month)
          const end = endOfMonth(month)
          return data.filter(lead => {
            const date = new Date(lead.createdAt)
            return date >= start && date <= end && lead.status === 'CONVERTED'
          }).length
        }),
        backgroundColor: "rgba(245, 158, 11, 0.5)",
      },
    ],
  }

  // Calculate lead sources distribution
  const leadSources = data.reduce((acc, lead) => {
    const domain = lead.email.split('@')[1]
    acc[domain] = (acc[domain] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topSources = Object.entries(leadSources)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const sourceChartData = {
    labels: topSources.map(([domain]) => domain),
    datasets: [
      {
        label: "Leads by Domain",
        data: topSources.map(([, count]) => count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.5)",
          "rgba(16, 185, 129, 0.5)",
          "rgba(245, 158, 11, 0.5)",
          "rgba(239, 68, 68, 0.5)",
          "rgba(139, 92, 246, 0.5)",
        ],
      },
    ],
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Lead Growth Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <Bar options={options} data={chartData} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Lead Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <Bar
              options={{
                ...options,
                indexAxis: 'y' as const,
              }}
              data={sourceChartData}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 