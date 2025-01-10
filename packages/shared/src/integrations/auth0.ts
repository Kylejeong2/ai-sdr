import type { EnrichmentConfig, UserData } from '../enrichment';
import { EnrichmentClient } from '../enrichment';

type Auth0User = {
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
  updated_at?: string;
  sub?: string;
  [key: string]: any;
}

type Auth0EnrichmentConfig = EnrichmentConfig & {
  shouldEnrichOnSignup?: boolean;
  shouldEnrichOnLogin?: boolean;
  shouldEnrichOnProfileUpdate?: boolean;
  customMapping?: (user: Auth0User) => UserData;
}

export class Auth0Integration {
  private client: EnrichmentClient;
  private config: Auth0EnrichmentConfig;

  constructor(config: Auth0EnrichmentConfig = {}) {
    this.client = new EnrichmentClient(config);
    this.config = {
      shouldEnrichOnSignup: true,
      shouldEnrichOnLogin: false,
      shouldEnrichOnProfileUpdate: true,
      ...config
    };
  }

  private extractUserData(user: Auth0User) {
    if (this.config.customMapping) {
      return this.config.customMapping(user);
    }

    return {
      email: user.email,
      firstName: user.given_name || user.name?.split(' ')[0],
      lastName: user.family_name || user.name?.split(' ').slice(1).join(' '),
      company: user.company || user['https://your-namespace/company'],
      metadata: {
        auth0Id: user.sub,
        picture: user.picture,
        locale: user.locale,
        lastUpdated: user.updated_at,
        isEmailVerified: user.email_verified
      }
    };
  }

  onRedirectCallback = async (appState: any, user: Auth0User) => {
    if (!user?.email) return;

    const isNewUser = appState?.isNewUser;
    if ((isNewUser && this.config.shouldEnrichOnSignup) || 
        (!isNewUser && this.config.shouldEnrichOnLogin)) {
      await this.client.enrichUser(this.extractUserData(user));
    }
  };

  onProfileUpdate = async (user: Auth0User) => {
    if (!user?.email || !this.config.shouldEnrichOnProfileUpdate) return;
    await this.client.enrichUser(this.extractUserData(user));
  };

  // Action/Rule template for Auth0
  getAuth0Action = () => `
/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  if (event.user.email) {
    const axios = require('axios');
    
    try {
      await axios.post('${this.client.getApiUrl()}/api/signup', {
        email: event.user.email,
        firstName: event.user.given_name,
        lastName: event.user.family_name,
        company: event.user.company,
        metadata: {
          auth0Id: event.user.user_id,
          isNewUser: event.stats.logins_count === 1
        }
      });
    } catch (error) {
      console.error('Enrichment failed:', error);
    }
  }
};
  `;
} 