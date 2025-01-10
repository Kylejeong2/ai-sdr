import type { EnrichmentConfig, UserData } from '../enrichment';
import { EnrichmentClient } from '../enrichment';

type ClerkUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses: Array<{
    emailAddress: string;
    id: string;
    verification?: {
      status: string;
      strategy: string;
    };
  }>;
  organizationMemberships?: Array<{
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    role: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

type ClerkSession = {
  id: string;
  user: ClerkUser;
  status: string;
  lastActiveAt: Date;
  expireAt: Date;
  [key: string]: any;
}

type ClerkEnrichmentConfig = EnrichmentConfig & {
  shouldEnrichOnSignup?: boolean;
  shouldEnrichOnLogin?: boolean;
  shouldEnrichOnOrgJoin?: boolean;
  customMapping?: (user: ClerkUser) => UserData;
}

export class ClerkIntegration {
  private client: EnrichmentClient;
  private config: ClerkEnrichmentConfig;

  constructor(config: ClerkEnrichmentConfig = {}) {
    this.client = new EnrichmentClient(config);
    this.config = {
      shouldEnrichOnSignup: true,
      shouldEnrichOnLogin: false,
      shouldEnrichOnOrgJoin: true,
      ...config
    };
  }

  private extractUserData(user: ClerkUser) {
    if (this.config.customMapping) {
      return this.config.customMapping(user);
    }

    const primaryEmail = user.emailAddresses[0]?.emailAddress;
    const primaryOrg = user.organizationMemberships?.[0]?.organization;

    return {
      email: primaryEmail,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      company: primaryOrg?.name,
      metadata: {
        clerkId: user.id,
        organizationId: primaryOrg?.id,
        organizationSlug: primaryOrg?.slug,
        organizationRole: user.organizationMemberships?.[0]?.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
  }

  afterSignIn = async (session: ClerkSession) => {
    const { user } = session;
    if (!user?.emailAddresses[0]?.emailAddress) return;

    const isNewUser = new Date(user.createdAt).getTime() === new Date(user.updatedAt).getTime();
    if ((isNewUser && this.config.shouldEnrichOnSignup) || 
        (!isNewUser && this.config.shouldEnrichOnLogin)) {
      await this.client.enrichUser(this.extractUserData(user));
    }
  };

  onOrganizationJoin = async (user: ClerkUser) => {
    if (!user?.emailAddresses[0]?.emailAddress || !this.config.shouldEnrichOnOrgJoin) return;
    await this.client.enrichUser(this.extractUserData(user));
  };

  // Webhook handler template
  getWebhookHandler = () => `
import { Webhook } from '@clerk/nextjs/server';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
  }

  const headerPayload = headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  
  const wh = new Webhook(WEBHOOK_SECRET);
  
  try {
    const evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
    
    // Handle the webhook
    const { type, data: user } = evt;
    
    if (type === 'user.created' || type === 'user.updated') {
      await fetch('${this.client.getApiUrl()}/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email_addresses[0].email_address,
          firstName: user.first_name,
          lastName: user.last_name,
          company: user.organization_memberships?.[0]?.organization?.name,
          metadata: {
            clerkId: user.id,
            eventType: type,
            isNewUser: type === 'user.created'
          }
        })
      });
    }
    
    return new Response('Success', { status: 200 });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }
}
  `;
} 