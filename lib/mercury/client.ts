import type { MercuryAccount, MercuryTransaction, MercuryTransactionsResponse } from './types';

export class MercuryClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL: string = 'https://api.mercury.com/api/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mercury API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  // Get all accounts
  async getAccounts(): Promise<{ accounts: MercuryAccount[] }> {
    return this.request('/accounts');
  }

  // Get specific account by ID
  async getAccount(accountId: string): Promise<MercuryAccount> {
    return this.request(`/account/${accountId}`);
  }

  // Get transactions for an account
  async getTransactions(
    accountId: string,
    params?: {
      offset?: number;
      limit?: number;
      start?: string; // ISO date string
      end?: string;   // ISO date string
      status?: 'pending' | 'sent' | 'cancelled' | 'failed';
    }
  ): Promise<MercuryTransactionsResponse> {
    const queryParams = new URLSearchParams();

    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.start) queryParams.set('start', params.start);
    if (params?.end) queryParams.set('end', params.end);
    if (params?.status) queryParams.set('status', params.status);

    const query = queryParams.toString();
    const endpoint = `/account/${accountId}/transactions${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  // Get all transactions across all accounts (helper method)
  async getAllTransactions(params?: {
    limit?: number;
    start?: string;
    end?: string;
  }): Promise<MercuryTransaction[]> {
    const accounts = await this.getAccounts();
    const allTransactions: MercuryTransaction[] = [];

    for (const account of accounts.accounts) {
      const { transactions } = await this.getTransactions(account.id, params);
      allTransactions.push(...transactions);
    }

    // Sort by creation date descending
    return allTransactions.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

// Factory function to create client with env variables
export function createMercuryClient(): MercuryClient {
  const apiKey = process.env.MERCURY_API_KEY;
  const baseURL = process.env.MERCURY_BASE_URL || 'https://api.mercury.com/api/v1';

  if (!apiKey) {
    throw new Error('MERCURY_API_KEY environment variable is not set');
  }

  return new MercuryClient(apiKey, baseURL);
}
