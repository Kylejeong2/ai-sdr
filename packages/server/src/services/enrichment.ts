import { prisma, type Lead, EmailType } from '@graham/db'
import { OpenAI } from 'openai'
import axios from 'axios'
import { Browserbase } from '@browserbasehq/sdk'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const browserbase = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY
})

const apolloClient = axios.create({
  baseURL: 'https://api.apollo.io/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Api-Key ${process.env.APOLLO_API_KEY}`
  }
})

export class EnrichmentService {
  private async enrichPersonalEmail(lead: Lead) {
    try {
      // Use browserbase to scrape LinkedIn
      const linkedInData = await this.scrapeLinkedIn(lead.email)
      
      // Update lead with enriched data
      return await prisma.lead.update({
        where: { id: lead.id },
        data: {
          linkedInUrl: linkedInData.profileUrl,
          company: linkedInData.company,
          title: linkedInData.title,
          industry: linkedInData.industry,
          enrichmentData: linkedInData,
          status: 'ENRICHED'
        }
      })
    } catch (error) {
      console.error('Error enriching personal email:', error)
      throw error
    }
  }

  private async enrichCompanyEmail(lead: Lead) {
    try {
      // Use Apollo API to get company data
      const apolloData = await this.getApolloData(lead.email)
      
      // Update lead with enriched data
      return await prisma.lead.update({
        where: { id: lead.id },
        data: {
          company: apolloData.company,
          title: apolloData.title,
          industry: apolloData.industry,
          companySize: apolloData.companySize,
          location: apolloData.location,
          enrichmentData: apolloData,
          status: 'ENRICHED'
        }
      })
    } catch (error) {
      console.error('Error enriching company email:', error)
      throw error
    }
  }

  async processEnrichmentQueue() {
    const queueItems = await prisma.enrichmentQueue.findMany({
      where: {
        attempts: { lt: 3 },
        OR: [
          { lastAttempt: null },
          { lastAttempt: { lt: new Date(Date.now() - 1000 * 60 * 60) } } // Retry after 1 hour
        ]
      },
      take: 10
    })

    for (const item of queueItems) {
      try {
        const lead = await prisma.lead.findUnique({
          where: { id: item.leadId }
        })

        if (!lead) continue

        if (lead.emailType === EmailType.PERSONAL) {
          await this.enrichPersonalEmail(lead)
        } else {
          await this.enrichCompanyEmail(lead)
        }

        // Remove from queue on success
        await prisma.enrichmentQueue.delete({
          where: { id: item.id }
        })

      } catch (error) {
        // Update attempt count and error
        await prisma.enrichmentQueue.update({
          where: { id: item.id },
          data: {
            attempts: { increment: 1 },
            lastAttempt: new Date(),
            error: (error as Error).message
          }
        })
      }
    }
  }

  private async scrapeLinkedIn(email: string) {
    try {
      // Create a new browser instance
      const browser = await browserbase.browser.create({
        name: `LinkedIn Scrape - ${email}`,
        browserType: 'chrome',
        proxyEnabled: true
      })

      // Create a new page
      const page = await browser.page.create()

      // Go to LinkedIn email search
      await page.goto(`https://www.linkedin.com/pub/dir?email=${email}`)
      
      // Wait for profile card or search results
      const profileCard = await page.waitForSelector('.profile-card, .search-result-item')
      
      // Get profile URL
      const profileUrl = await profileCard.$eval('a[href*="/in/"]', (el) => el.href)
      
      // Navigate to profile
      await page.goto(profileUrl)
      
      // Wait for content to load
      await page.waitForSelector('.pv-top-card')
      
      // Extract data
      const data = await page.evaluate(() => {
        const getTextContent = (selector: string) => 
          document.querySelector(selector)?.textContent?.trim() || ''

        return {
          company: getTextContent('.pv-top-card .pv-text-details__right-panel .pv-text-details__employer-info'),
          title: getTextContent('.pv-top-card .pv-text-details__right-panel .pv-text-details__role'),
          industry: getTextContent('.pv-top-card .pv-text-details__right-panel .pv-entity__industry'),
          location: getTextContent('.pv-top-card .pv-text-details__right-panel .pv-text-details__location'),
          profileUrl: window.location.href
        }
      })

      // Close browser
      await browser.close()
      
      return data
    } catch (error) {
      console.error('Error scraping LinkedIn:', error)
      throw error
    }
  }

  private async getApolloData(email: string) {
    try {
      // Search for person in Apollo
      const { data } = await apolloClient.post('/people/search', {
        q_organization_domains: [email.split('@')[1]],
        q_emails: [email]
      })

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
          organization
        }
      }
    } catch (error) {
      console.error('Error getting Apollo data:', error)
      throw error
    }
  }
} 