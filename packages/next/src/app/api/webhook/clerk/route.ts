import { headers } from 'next/headers'
import type { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { Webhook } from 'svix'
import type { OrganizationJSON, OrganizationMembershipJSON, UserJSON } from '@clerk/nextjs/server'
import { TeamRole } from '@graham/db'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env')
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'organization.created': {
        const { id, name, slug, created_at, updated_at, public_metadata } = evt.data as OrganizationJSON;
        
        // Create team and clerk config
        await prisma.team.create({
          data: {
            id: id,
            name: name,
            createdAt: new Date(created_at),
            updatedAt: new Date(updated_at),
            clerkConfig: {
              create: {
                publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
                secretKey: process.env.CLERK_SECRET_KEY!,
                webhookSecret: process.env.CLERK_WEBHOOK_SECRET!,
                organizationId: id,
                organizationName: name,
                organizationSlug: slug,
                organizationMetadata: public_metadata ? JSON.parse(JSON.stringify(public_metadata)) : undefined,
                lastWebhookReceived: new Date(),
                webhookStatus: 'healthy'
              }
            }
          }
        });
        break;
      }

      case 'organizationMembership.created': {
        const { organization, public_user_data } = evt.data as OrganizationMembershipJSON;
        const userId = public_user_data.user_id;
        const orgId = organization.id;
        const role = evt.data.role === 'org:admin' ? TeamRole.OWNER : TeamRole.MEMBER;

        // Create team member
        await prisma.teamMember.create({
          data: {
            userId: userId,
            teamId: orgId,
            role: role,
          }
        });

        // Create or update user
        await prisma.user.upsert({
          where: { id: userId },
          create: {
            id: userId,
            email: '',  // Will be updated when we get user.created event
            firstName: '',
            lastName: '',
            team: {
              connect: { id: orgId }
            }
          },
          update: {
            teamId: orgId,
            clerkOrgId: orgId
          }
        });
        break;
      }

      case 'organizationMembership.deleted': {
        const { organization, public_user_data } = evt.data as OrganizationMembershipJSON;
        const userId = public_user_data.user_id;
        const orgId = organization.id;

        // Remove team member
        await prisma.teamMember.deleteMany({
          where: {
            userId: userId,
            teamId: orgId
          }
        });

        // Update user's team if it was their current team
        await prisma.user.update({
          where: {
            id: userId,
            teamId: orgId // Only update if this was their current team
          },
          data: {
            teamId: undefined,
            clerkOrgId: undefined
          }
        });
        break;
      }

      case 'user.created': {
        const { id, email_addresses, first_name, last_name, created_at } = evt.data as UserJSON;
        
        // Create user without team (they'll join via organization membership)
        await prisma.user.create({
          data: {
            id: id,
            email: email_addresses[0]?.email_address || '',
            firstName: first_name || '',
            lastName: last_name || '',
            createdAt: new Date(created_at),
            updatedAt: new Date(),
            // Create a default team for the user
            team: {
              create: {
                name: `${first_name || 'New'}'s Team`,
                members: {
                  create: {
                    userId: id,
                    role: TeamRole.OWNER
                  }
                }
              }
            }
          }
        });
        break;
      }
    }

    // Update webhook status for organization events
    if (eventType.startsWith('organization.') && 'id' in evt.data) {
      await prisma.clerkConfig.update({
        where: { teamId: evt.data.id },
        data: {
          lastWebhookReceived: new Date(),
          webhookStatus: 'healthy'
        }
      });
    }

    return new Response('', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Update webhook status to error for organization events
    if (eventType.startsWith('organization.') && 'id' in evt.data) {
      await prisma.clerkConfig.update({
        where: { teamId: evt.data.id },
        data: {
          lastWebhookReceived: new Date(),
          webhookStatus: 'error'
        }
      }).catch(console.error);
    }
    
    return new Response('Error processing webhook', { status: 500 });
  }
} 