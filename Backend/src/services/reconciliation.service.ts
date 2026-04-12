import Tenancy from '../models/Tenancy';
import Transaction from '../models/Transaction';
import { fuzzyMatch, MatchResult } from '../utils/fuzzyMatch';
import logger from '../utils/logger';

export interface BankEntry {
  amount: number;
  bank_ref: string;
  date?: string;
}

export interface ReconciliationResult {
  bank_ref: string;
  amount: number;
  matches: MatchResult[];
  best_match?: MatchResult;
  auto_reconciled: boolean;
  transaction_id?: string;
}

/**
 * Reconcile a batch of bank feed entries against tenancy references.
 * Auto-reconciles transactions where the best match score >= 0.85.
 */
export const reconcileBankEntries = async (
  portfolioId: string,
  bankEntries: BankEntry[]
): Promise<ReconciliationResult[]> => {
  // Fetch all tenancies for assets in this portfolio (via units → assets → portfolio)
  const tenancies = await Tenancy.find().select('bank_ref monthly_rent _id').lean();
  const candidates = tenancies.map((t) => ({
    tenancyId: t._id.toString(),
    reference: t.bank_ref,
  }));

  const results: ReconciliationResult[] = [];

  for (const entry of bankEntries) {
    const matches = fuzzyMatch(entry.bank_ref, candidates);
    const best = matches[0];
    let auto_reconciled = false;
    let transaction_id: string | undefined;

    if (best?.autoReconcile) {
      // Auto-reconcile: mark matching unreconciled transaction for this bank_ref
      const tx = await Transaction.findOneAndUpdate(
        {
          portfolio_id: portfolioId,
          bank_ref: entry.bank_ref,
          reconciled: false,
        },
        { reconciled: true, reconciled_at: new Date(), tenancy_id: best.tenancyId },
        { new: true }
      );

      if (tx) {
        auto_reconciled = true;
        transaction_id = tx._id.toString();
        logger.info(
          `[Reconciliation] Auto-reconciled tx ${transaction_id} → tenancy ${best.tenancyId} (score: ${best.score})`
        );
      }
    }

    results.push({
      bank_ref: entry.bank_ref,
      amount: entry.amount,
      matches: matches.slice(0, 5), // top 5 candidates
      best_match: best,
      auto_reconciled,
      ...(transaction_id && { transaction_id }),
    });
  }

  return results;
};
