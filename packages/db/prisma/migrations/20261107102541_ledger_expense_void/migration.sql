-- AlterEnum (own migration: a new enum value can't be used in the transaction that adds it)
ALTER TYPE "LedgerType" ADD VALUE 'EXPENSE_VOID';
