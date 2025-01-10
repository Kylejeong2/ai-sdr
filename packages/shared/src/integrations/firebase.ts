import type { EnrichmentConfig, UserData } from '../enrichment';
import { EnrichmentClient } from '../enrichment';

type FirebaseUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  tenantId: string | null;
  providerData: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  }>;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  [key: string]: any;
}

type FirebaseEnrichmentConfig = EnrichmentConfig & {
  shouldEnrichOnSignup?: boolean;
  shouldEnrichOnLogin?: boolean;
  shouldEnrichOnProfileUpdate?: boolean;
  customMapping?: (user: FirebaseUser) => UserData;
}

export class FirebaseIntegration {
  private client: EnrichmentClient;
  private config: FirebaseEnrichmentConfig;

  constructor(config: FirebaseEnrichmentConfig = {}) {
    this.client = new EnrichmentClient(config);
    this.config = {
      shouldEnrichOnSignup: true,
      shouldEnrichOnLogin: false,
      shouldEnrichOnProfileUpdate: true,
      ...config
    };
  }

  private extractUserData(user: FirebaseUser): UserData {
    if (this.config.customMapping) {
      return this.config.customMapping(user);
    }

    const nameParts = user.displayName?.split(' ') || [];
    
    return {
      email: user.email || '',
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
      metadata: {
        firebaseId: user.uid,
        providerId: user.providerData[0]?.providerId,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL,
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime
      }
    };
  }

  onAuthStateChanged = async (user: FirebaseUser | null) => {
    if (!user?.email) return;

    const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
    if ((isNewUser && this.config.shouldEnrichOnSignup) || 
        (!isNewUser && this.config.shouldEnrichOnLogin)) {
      await this.client.enrichUser(this.extractUserData(user));
    }
  };

  onProfileUpdate = async (user: FirebaseUser) => {
    if (!user?.email || !this.config.shouldEnrichOnProfileUpdate) return;
    await this.client.enrichUser(this.extractUserData(user));
  };

  // Cloud Function template for Firebase
  getCloudFunction = () => `
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

admin.initializeApp();

exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    await fetch('${this.client.getApiUrl()}/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        firstName: user.displayName?.split(' ')[0],
        lastName: user.displayName?.split(' ').slice(1).join(' '),
        metadata: {
          firebaseId: user.uid,
          providerId: user.providerData[0]?.providerId,
          emailVerified: user.emailVerified,
          isNewUser: true
        }
      })
    });
  } catch (error) {
    console.error('Enrichment failed:', error);
  }
});

exports.onUserUpdated = functions.auth.user().onUpdate(async (change) => {
  const before = change.before;
  const after = change.after;
  
  // Only enrich if important fields changed
  if (before.email === after.email && 
      before.displayName === after.displayName && 
      before.emailVerified === after.emailVerified) {
    return;
  }

  try {
    await fetch('${this.client.getApiUrl()}/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: after.email,
        firstName: after.displayName?.split(' ')[0],
        lastName: after.displayName?.split(' ').slice(1).join(' '),
        metadata: {
          firebaseId: after.uid,
          providerId: after.providerData[0]?.providerId,
          emailVerified: after.emailVerified,
          isNewUser: false,
          isUpdate: true
        }
      })
    });
  } catch (error) {
    console.error('Enrichment failed:', error);
  }
});
  `;
} 