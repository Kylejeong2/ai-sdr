import { EnrichmentService } from '../services/enrichment'
import { EmailGenerationService } from '../services/emailGeneration'

const enrichmentService = new EnrichmentService()
const emailService = new EmailGenerationService()

async function processQueues() {
  try {
    // Process enrichment queue
    await enrichmentService.processEnrichment()
    
    // Process email queue
    await emailService.processEmailQueue()
  } catch (error) {
    console.error('Error processing queues:', error)
  }
}

// Process queues every minute
setInterval(processQueues, 60 * 1000)

processQueues() 