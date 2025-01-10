export type EnrichmentConfig = {
  apiUrl?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export type UserData = {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  metadata?: Record<string, any>;
}

export class EnrichmentClient {
  private apiUrl: string;
  private onSuccess?: (data: any) => void;
  private onError?: (error: Error) => void;

  constructor(config: EnrichmentConfig = {}) {
    this.apiUrl = config.apiUrl || 'http://localhost:3001';
    this.onSuccess = config.onSuccess;
    this.onError = config.onError;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  async enrichUser(userData: UserData): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`Enrichment failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.onSuccess?.(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      this.onError?.(err);
      throw err;
    }
  }
}

// React Hook
export function useEnrichment(config: EnrichmentConfig = {}) {
  const client = new EnrichmentClient(config);
  
  return {
    enrichUser: client.enrichUser.bind(client),
  };
} 