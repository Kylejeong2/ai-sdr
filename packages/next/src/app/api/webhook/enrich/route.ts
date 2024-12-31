import { verifySignature } from "@upstash/qstash/nextjs";
import { EnrichmentService } from '@graham/server/src/services/enrichment';
import { NextResponse } from 'next/server';
import type { NextApiRequest } from 'next';

const enrichmentService = new EnrichmentService();

export const POST = verifySignature(async (req: NextApiRequest) => {
  try {
    const { userId, teamId, email, metadata } = req.body;
    
    if (!userId || !teamId || !email || !metadata) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await enrichmentService.processEnrichment(userId);
      
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Enrichment webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process enrichment' }, 
      { status: 500 }
    );
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
}; 