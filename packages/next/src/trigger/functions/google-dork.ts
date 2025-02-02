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
  
export async function getApolloData(email: string) {
    try {
      const [username, domain] = email.split('@')
      
      if (!username || !domain) {
        throw new Error('Invalid email format')
      }
  
      const commonEmailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com']
      const isCompanyDomain = !commonEmailProviders.includes(domain)
      
      const searchParams: any = {
        q_emails: [email]
      }
  
      if (isCompanyDomain) {
        searchParams.q_organization_domains = [domain]
        const [companyName] = domain.split('.')
        if (companyName) {
          searchParams.q_organization_name = companyName
        }
      }

      const response = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Api-Key ${process.env.APOLLO_API_KEY}`
        },
        body: JSON.stringify(searchParams)
      })

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
  
      if (!data.people || data.people.length === 0) {
        throw new Error('Person not found in Apollo')
      }
  
      const person = data.people[0]
      const organization = person.organization
  
      return {
        company: organization.name,
        title: person.title,
        industry: organization.industry,
        companySize: organization.employee_count,
        location: `${person.city}, ${person.state}`,
        enrichmentData: {
          person,
          organization,
          domain,
          isCompanyDomain
        }
      }
    } catch (error) {
      console.error('Error getting Apollo data:', error)
      throw error
    }
  }