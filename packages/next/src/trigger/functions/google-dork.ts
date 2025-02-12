import { z } from "zod"
import { Stagehand } from '@browserbasehq/stagehand'

export async function findLinkedInProfile(linkedInUrl: string) {
    const stagehand = new Stagehand({
      env: 'BROWSERBASE',
      enableCaching: true
    })
  
    await stagehand.init()
    
    try {
      await stagehand.page.goto(linkedInUrl)
      
      const data = await stagehand.page.extract({
        instruction: "extract the person's current company that their working at, url of that company's website, title, industry, about, contact info (if available), and location from their profile",
        schema: z.object({
          companyName: z.string(),
          companyUrl: z.string(),
          title: z.string().optional(), 
          industry: z.string().optional(),
          about: z.string().optional(),
          contactInfo: z.string().optional(),
          location: z.string().optional(),
          profileUrl: z.string()
        })
      })
  
      return data;
    } finally {
      await stagehand.close()
    }
  }

export async function googleDorkSearch(email: string, fullName?: string) {
  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    enableCaching: true
  })

  await stagehand.init()

  try {

    const searchQuery = `site:linkedin.com/in/ "${email}" OR "${fullName}"`

    await stagehand.page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`)
      
    const result = await stagehand.page.extract({
      instruction: "extract the first LinkedIn profile URL from the search results",
      schema: z.object({
        url: z.string()
      })
    })
    
    return {
      found: !!result?.url,
      linkedInUrl: result?.url || ''
    }
  } finally {
    await stagehand.close()
  }
}