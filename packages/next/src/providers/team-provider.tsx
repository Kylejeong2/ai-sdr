'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization } from '@clerk/nextjs'

type CalComConfig = {
  apiKey: string
  webhookSecret: string
  webhookUrl?: string
  webhookId?: string
  environment: string
  lastWebhookReceived?: Date
  webhookStatus?: string
  isActive: boolean
}

type CalendlyConfig = {
  accessToken: string
  webhookSigningKey: string
  webhookUrl?: string
  webhookId?: string
  organizationId?: string
  lastWebhookReceived?: Date
  webhookStatus?: string
  isActive: boolean
}

type TeamWithConfig = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  calComConfig?: CalComConfig | null
  calendlyConfig?: CalendlyConfig | null
}

interface TeamContextType {
  team: TeamWithConfig | null
  setTeam: (team: TeamWithConfig | null) => void
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useOrganization()
  const [team, setTeam] = useState<TeamWithConfig | null>(null)

  useEffect(() => {
    async function loadTeam() {
      if (!organization?.id) return

      try {
        const response = await fetch(`/api/teams/${organization.id}`)
        if (!response.ok) throw new Error('Failed to load team')

        const data = await response.json()
        setTeam(data)
      } catch (err) {
        console.error('Error loading team:', err)
      }
    }

    loadTeam()
  }, [organization?.id])

  return (
    <TeamContext.Provider value={{ team, setTeam }}>
      {children}
    </TeamContext.Provider>
  )
}

export function useTeam() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider')
  }
  return context
}

export { TeamContext }
export type { TeamWithConfig as Team, CalComConfig, CalendlyConfig } 