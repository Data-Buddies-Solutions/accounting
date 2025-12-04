// Mercury API Types

export interface MercuryAccount {
  id: string;
  name: string;
  accountNumber: string;
  routingNumber: string;
  type: 'checking' | 'savings';
  status: 'active' | 'inactive';
  currentBalance: string;
  availableBalance: string;
  currency: string;
  createdAt: string;
}

export interface MercuryTransaction {
  id: string;
  accountId: string;
  amount: string;
  bankDescription: string | null;
  counterpartyName: string | null;
  counterpartyId: string | null;
  createdAt: string;
  dashboardLink: string;
  details: string | null;
  estimatedDeliveryDate: string | null;
  failedAt: string | null;
  kind: string;
  note: string | null;
  postedAt: string | null;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
}

export interface MercuryTransactionsResponse {
  transactions: MercuryTransaction[];
  total: number;
}

export interface MercuryError {
  error: {
    message: string;
    code: string;
  };
}
