'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization } from '@clerk/nextjs'
import type { Team, TeamMember } from '@graham/db'

interface TeamContextType {
  team: Team | null
  currentMember: TeamMember | null
  isLoading: boolean
  error: Error | null
}

const TeamContext = createContext<TeamContextType>({
  team: null,
  currentMember: null,
  isLoading: true,
  error: null
})

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useOrganization()
  const [team, setTeam] = useState<Team | null>(null)
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadTeam() {
      if (!organization?.id) return

      try {
        const response = await fetch(`/api/teams/${organization.id}`)
        if (!response.ok) throw new Error('Failed to load team')
        
        const data = await response.json()
        setTeam(data.team)
        setCurrentMember(data.currentMember)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTeam()
  }, [organization?.id])

  return (
    <TeamContext.Provider value={{ team, currentMember, isLoading, error }}>
      {children}
    </TeamContext.Provider>
  )
}

export const useTeam = () => useContext(TeamContext) 