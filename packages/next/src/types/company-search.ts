import { z } from "zod"

// Define company research task schema
export const companyResearchSchema = z.object({
    teamId: z.string(),
    companyUrl: z.string(),
    metadata: z.record(z.any()),
    leadId: z.string()
  })

export type CompanyResearchPayload = z.infer<typeof companyResearchSchema>

// Define types for API responses
export interface NewsItem {
  url: string;
  title: string;
  image?: string;
}

export interface Video {
  id: string;
  url: string;
  title: string;
  author: string;
}

export interface RedditPost {
  url: string;
  title: string;
}

export interface Founder {
  url: string;
  title: string;
}

export interface Competitor {
  title: string;
  url: string;
  summary: string;
}
