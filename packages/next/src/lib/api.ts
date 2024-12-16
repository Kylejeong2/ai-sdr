import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
})

export interface Lead {
  id: string
  email: string
  firstName?: string
  lastName?: string
  company?: string
  title?: string
  industry?: string
  companySize?: string
  location?: string
  status: string
  emailType: string
  linkedInUrl?: string
  enrichmentData?: any
  createdAt: string
  updatedAt: string
  emails: Email[]
  tags?: Tag[]
  assignedTo?: TeamMember
  sequence?: Sequence
  activities?: Activity[]
}

export interface Email {
  id: string
  subject: string
  content: string
  status: string
  sentAt?: string
  openedAt?: string
  clickedAt?: string
  repliedAt?: string
  createdAt: string
  updatedAt: string
  metadata?: any
  variant?: string
  testGroup?: string
  sequence?: Sequence
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  variables: string[]
  createdAt: string
  updatedAt: string
  teamId: string
  isShared: boolean
  createdBy: TeamMember
}

export interface Sequence {
  id: string
  name: string
  description?: string
  steps: SequenceStep[]
  teamId: string
  leads: Lead[]
  emails: Email[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SequenceStep {
  id: string
  type: "email" | "wait"
  templateId?: string
  waitDays?: number
}

export interface Tag {
  id: string
  name: string
  color: string
  leads: Lead[]
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  userId: string
  teamId: string
  role: string
  leads: Lead[]
  templates: EmailTemplate[]
  activities: Activity[]
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  type: string
  description: string
  metadata?: any
  leadId: string
  lead: Lead
  teamMember: TeamMember
  createdAt: string
}

export interface Integration {
  id: string
  type: string
  provider: string
  config: any
  teamId: string
  isActive: boolean
  metadata?: any
  createdAt: string
  updatedAt: string
}

export interface ABTest {
  id: string
  name: string
  description?: string
  variants: any
  metrics: any
  startDate: string
  endDate?: string
  isActive: boolean
  teamId: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  content: string
  leadId: string
  createdBy: TeamMember
  createdAt: string
  updatedAt: string
}

export const sdrApi = {
  // Leads
  getLeads: async () => {
    const { data } = await api.get<Lead[]>('/sdr/leads')
    return data
  },

  getLead: async (id: string) => {
    const { data } = await api.get<Lead>(`/sdr/lead/${id}`)
    return data
  },

  createLead: async (leadData: { email: string; firstName?: string; lastName?: string }) => {
    const { data } = await api.post<Lead>('/sdr/signup', leadData)
    return data
  },

  updateLead: async (id: string, updates: Partial<Lead>) => {
    const { data } = await api.put<Lead>(`/sdr/lead/${id}`, updates)
    return data
  },

  bulkUpdateLeads: async (ids: string[], updates: Partial<Lead>) => {
    const { data } = await api.put<Lead[]>('/sdr/leads/bulk', { ids, updates })
    return data
  },

  bulkDeleteLeads: async (ids: string[]) => {
    await api.delete('/sdr/leads/bulk', { data: { ids } })
  },

  // Email Templates
  getTemplates: async () => {
    const { data } = await api.get<EmailTemplate[]>('/sdr/templates')
    return data
  },

  getTemplate: async (id: string) => {
    const { data } = await api.get<EmailTemplate>(`/sdr/templates/${id}`)
    return data
  },

  createTemplate: async (templateData: {
    name: string
    subject: string
    content: string
    variables?: string[]
    isShared?: boolean
  }) => {
    const { data } = await api.post<EmailTemplate>('/sdr/templates', templateData)
    return data
  },

  updateTemplate: async (
    id: string,
    templateData: {
      name?: string
      subject?: string
      content?: string
      variables?: string[]
      isShared?: boolean
    }
  ) => {
    const { data } = await api.put<EmailTemplate>(`/sdr/templates/${id}`, templateData)
    return data
  },

  deleteTemplate: async (id: string) => {
    await api.delete(`/sdr/templates/${id}`)
  },

  // Sequences
  getSequences: async () => {
    const { data } = await api.get<Sequence[]>('/sdr/sequences')
    return data
  },

  getSequence: async (id: string) => {
    const { data } = await api.get<Sequence>(`/sdr/sequences/${id}`)
    return data
  },

  createSequence: async (sequenceData: {
    name: string
    description?: string
    steps: SequenceStep[]
    isActive?: boolean
  }) => {
    const { data } = await api.post<Sequence>('/sdr/sequences', sequenceData)
    return data
  },

  updateSequence: async (
    id: string,
    sequenceData: {
      name?: string
      description?: string
      steps?: SequenceStep[]
      isActive?: boolean
    }
  ) => {
    const { data } = await api.put<Sequence>(`/sdr/sequences/${id}`, sequenceData)
    return data
  },

  deleteSequence: async (id: string) => {
    await api.delete(`/sdr/sequences/${id}`)
  },

  // Tags
  getTags: async () => {
    const { data } = await api.get<Tag[]>('/sdr/tags')
    return data
  },

  createTag: async (tagData: { name: string; color: string }) => {
    const { data } = await api.post<Tag>('/sdr/tags', tagData)
    return data
  },

  updateTag: async (id: string, tagData: { name?: string; color?: string }) => {
    const { data } = await api.put<Tag>(`/sdr/tags/${id}`, tagData)
    return data
  },

  deleteTag: async (id: string) => {
    await api.delete(`/sdr/tags/${id}`)
  },

  // Team Members
  getTeamMembers: async () => {
    const { data } = await api.get<TeamMember[]>('/sdr/team')
    return data
  },

  inviteTeamMember: async (email: string, role: string) => {
    const { data } = await api.post<TeamMember>('/sdr/team/invite', {
      email,
      role,
    })
    return data
  },

  updateTeamMember: async (id: string, updates: { role?: string }) => {
    const { data } = await api.put<TeamMember>(`/sdr/team/${id}`, updates)
    return data
  },

  removeTeamMember: async (id: string) => {
    await api.delete(`/sdr/team/${id}`)
  },

  // Analytics
  getAnalytics: async (period: 'day' | 'week' | 'month' | 'year', dateRange?: { from: string; to: string }) => {
    const params = new URLSearchParams({ period })
    if (dateRange) {
      params.append('from', dateRange.from)
      params.append('to', dateRange.to)
    }
    const { data } = await api.get(`/sdr/analytics?${params}`)
    return data
  },

  // A/B Testing
  getABTests: async () => {
    const { data } = await api.get<ABTest[]>('/sdr/ab-tests')
    return data
  },

  createABTest: async (testData: {
    name: string
    description?: string
    variants: any
    startDate: string
    endDate?: string
  }) => {
    const { data } = await api.post<ABTest>('/sdr/ab-tests', testData)
    return data
  },

  updateABTest: async (id: string, updates: Partial<ABTest>) => {
    const { data } = await api.put<ABTest>(`/sdr/ab-tests/${id}`, updates)
    return data
  },

  getABTestResults: async (id: string) => {
    const { data } = await api.get<any>(`/sdr/ab-tests/${id}/results`)
    return data
  },

  // Integrations
  getIntegrations: async () => {
    const { data } = await api.get<Integration[]>('/sdr/integrations')
    return data
  },

  connectIntegration: async (type: string, provider: string, config: any) => {
    const { data } = await api.post<Integration>('/sdr/integrations', {
      type,
      provider,
      config,
    })
    return data
  },

  updateIntegration: async (id: string, updates: { config?: any; isActive?: boolean }) => {
    const { data } = await api.put<Integration>(`/sdr/integrations/${id}`, updates)
    return data
  },

  disconnectIntegration: async (id: string) => {
    await api.delete(`/sdr/integrations/${id}`)
  },

  // OAuth Flows
  startOAuth: async (provider: string) => {
    const { data } = await api.post<{ url: string }>('/sdr/oauth/start', {
      provider,
    })
    return data
  },

  completeOAuth: async (provider: string, code: string) => {
    const { data } = await api.post<Integration>('/sdr/oauth/complete', {
      provider,
      code,
    })
    return data
  },

  // Webhooks
  createWebhook: async (url: string, events: string[], secret?: string) => {
    const { data } = await api.post('/sdr/webhooks', { url, events, secret })
    return data
  },

  updateWebhook: async (id: string, updates: { url?: string; events?: string[]; isActive?: boolean }) => {
    const { data } = await api.put(`/sdr/webhooks/${id}`, updates)
    return data
  },

  deleteWebhook: async (id: string) => {
    await api.delete(`/sdr/webhooks/${id}`)
  },

  // Settings
  updateSettings: async (settings: {
    emailSettings?: {
      dailyLimit?: number
      fromName?: string
      fromEmail?: string
      signature?: string
    }
    notifications?: {
      emailOpens?: boolean
      emailClicks?: boolean
      emailReplies?: boolean
      leadEnriched?: boolean
      dailyDigest?: boolean
    }
  }) => {
    const { data } = await api.put('/sdr/settings', settings)
    return data
  },

  getSettings: async () => {
    const { data } = await api.get('/sdr/settings')
    return data
  },

  // Comments
  getComments: async (leadId: string) => {
    const { data } = await api.get<Comment[]>(`/sdr/leads/${leadId}/comments`)
    return data
  },

  addComment: async (leadId: string, content: string) => {
    const { data } = await api.post<Comment>(`/sdr/leads/${leadId}/comments`, {
      content,
    })
    return data
  },

  deleteComment: async (leadId: string, commentId: string) => {
    await api.delete(`/sdr/leads/${leadId}/comments/${commentId}`)
  },

  // Activities
  getActivities: async (params?: {
    leadId?: string
    teamMemberId?: string
    type?: string
    from?: string
    to?: string
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }
    const { data } = await api.get<Activity[]>(`/sdr/activities?${queryParams}`)
    return data
  },
} 