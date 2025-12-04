import { prisma } from '../prisma';
import { createMercuryClient } from '../mercury/client';
import type { MercuryTransaction, MercuryAccount } from '../mercury/types';

export class SyncService {
  private mercury Client;

  constructor() {
    this.mercuryClient = createMercuryClient();
  }

  async syncAccounts(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const { accounts } = await this.mercuryClient.getAccounts();

      for (const mercuryAccount of accounts) {
        try {
          await prisma.account.upsert({
            where: { mercuryAccountId: mercuryAccount.id },
            update: {
              name: mercuryAccount.name,
              type: mercuryAccount.type,
              status: mercuryAccount.status,
              currentBalance: parseFloat(mercuryAccount.currentBalance),
              availableBalance: parseFloat(mercuryAccount.availableBalance),
              currency: mercuryAccount.currency,
              lastSyncedAt: new Date(),
            },
            create: {
              mercuryAccountId: mercuryAccount.id,
              name: mercuryAccount.name,
              type: mercuryAccount.type,
              status: mercuryAccount.status,
              currentBalance: parseFloat(mercuryAccount.currentBalance),
              availableBalance: parseFloat(mercuryAccount.availableBalance),
              currency: mercuryAccount.currency,
              lastSyncedAt: new Date(),
            },
          });
          synced++;
        } catch (error) {
          errors.push(`Failed to sync account ${mercuryAccount.id}: ${error}`);
        }
      }

      return { synced, errors };
    } catch (error) {
      throw new Error(`Failed to sync accounts: ${error}`);
    }
  }

  async syncTransactions(accountId?: string): Promise<{
    synced: number;
    errors: string[];
    total: number;
  }> {
    const errors: string[] = [];
    let synced = 0;
    let total = 0;

    try {
      // Get accounts to sync
      const accounts = accountId
        ? [await prisma.account.findUnique({ where: { id: accountId } })]
        : await prisma.account.findMany({
            where: { type: { not: 'virtual' } },
          });

      for (const account of accounts) {
        if (!account) continue;

        try {
          // Get last sync date or fetch last 90 days
          const lastSyncDate = account.lastSyncedAt || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

          const { transactions } = await this.mercuryClient.getTransactions(
            account.mercuryAccountId,
            {
              start: lastSyncDate.toISOString(),
              limit: 1000, // Mercury API limit
            }
          );

          total += transactions.length;

          for (const tx of transactions) {
            try {
              await this.upsertTransaction(tx, account.id);
              synced++;
            } catch (error) {
              errors.push(`Failed to sync transaction ${tx.id}: ${error}`);
            }
          }

          // Update last synced timestamp
          await prisma.account.update({
            where: { id: account.id },
            data: { lastSyncedAt: new Date() },
          });
        } catch (error) {
          errors.push(`Failed to sync transactions for account ${account.id}: ${error}`);
        }
      }

      return { synced, errors, total };
    } catch (error) {
      throw new Error(`Failed to sync transactions: ${error}`);
    }
  }

  private async upsertTransaction(mercuryTx: MercuryTransaction, accountId: string) {
    const transactionData = {
      accountId,
      date: new Date(mercuryTx.postedAt || mercuryTx.createdAt),
      amount: Math.abs(parseFloat(mercuryTx.amount)),
      description: mercuryTx.bankDescription || mercuryTx.details || 'Unknown transaction',
      counterpartyName: mercuryTx.counterpartyName,
      status: mercuryTx.status,
      type: parseFloat(mercuryTx.amount) < 0 ? 'debit' : 'credit',
      source: 'mercury' as const,
      isManualEntry: false,
      rawData: mercuryTx,
    };

    return prisma.transaction.upsert({
      where: { mercuryTransactionId: mercuryTx.id },
      update: transactionData,
      create: {
        mercuryTransactionId: mercuryTx.id,
        ...transactionData,
      },
    });
  }

  async fullSync(): Promise<{
    accountsSynced: number;
    transactionsSynced: number;
    errors: string[];
  }> {
    // First sync accounts
    const accountsResult = await this.syncAccounts();

    // Then sync transactions
    const transactionsResult = await this.syncTransactions();

    return {
      accountsSynced: accountsResult.synced,
      transactionsSynced: transactionsResult.synced,
      errors: [...accountsResult.errors, ...transactionsResult.errors],
    };
  }
}
