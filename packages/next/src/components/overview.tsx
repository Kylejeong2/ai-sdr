"use client"

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
import { startOfMonth, endOfMonth, eachMonthOfInterval, format } from "date-fns"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
  },
}

interface OverviewProps {
  data: Lead[]
}

export function Overview({ data }: OverviewProps) {
  // Get last 6 months
  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 5)

  const months = eachMonthOfInterval({
    start: sixMonthsAgo,
    end: now,
  })

  const labels = months.map((month: Date) => format(month, 'MMM yyyy'))

  const chartData = {
    labels,
    datasets: [
      {
        label: "New Leads",
        data: months.map((month: Date) => {
          const start = startOfMonth(month)
          const end = endOfMonth(month)
          return data.filter((lead: Lead) => {
            const date = new Date(lead.createdAt)
            return date >= start && date <= end && lead.status === 'NEW'
          }).length
        }),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
      },
      {
        label: "Enriched",
        data: months.map((month: Date) => {
          const start = startOfMonth(month)
          const end = endOfMonth(month)
          return data.filter((lead: Lead) => {
            const date = new Date(lead.createdAt)
            return date >= start && date <= end && lead.status === 'ENRICHED'
          }).length
        }),
        backgroundColor: "rgba(16, 185, 129, 0.5)",
      },
      {
        label: "Converted",
        data: months.map((month: Date) => {
          const start = startOfMonth(month)
          const end = endOfMonth(month)
          return data.filter((lead: Lead) => {
            const date = new Date(lead.createdAt)
            return date >= start && date <= end && lead.status === 'CONVERTED'
          }).length
        }),
        backgroundColor: "rgba(244, 63, 94, 0.5)",
      },
    ],
  }

  return (
    <div className="h-[350px] w-full">
      <Bar options={options} data={chartData} />
    </div>
  )
} 