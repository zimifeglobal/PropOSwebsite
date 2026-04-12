import Asset from '../models/Asset';
import logger from '../utils/logger';

const BASE_RATES: Record<string, number> = {
  buildings: 0.003,   // 0.3% of coverage limit
  contents:  0.005,
  liability: 0.004,
  combined:  0.007,
};

const ESG_DISCOUNT_THRESHOLD = 70; // ESG score >= 70 gets 5% discount

export interface InsuranceQuote {
  asset_id: string;
  asset_name: string;
  policy_type: string;
  coverage_limit: number;
  base_premium: number;
  esg_score: number;
  esg_discount_applied: boolean;
  esg_discount_amount: number;
  final_premium: number;
  currency: 'GBP';
  quote_reference: string;
  valid_until: string;
}

/**
 * Calculate insurance premium for an asset.
 * Higher ESG score (≥70) = 5% discount.
 */
export const calculateInsuranceQuote = async (
  assetId: string,
  policyType: 'buildings' | 'contents' | 'liability' | 'combined',
  coverageLimit: number
): Promise<InsuranceQuote> => {
  const asset = await Asset.findById(assetId);
  if (!asset) throw Object.assign(new Error('Asset not found.'), { statusCode: 404 });

  const rate = BASE_RATES[policyType] || 0.005;
  const basePremium = parseFloat((coverageLimit * rate).toFixed(2));
  const esgDiscountApplied = asset.esg_score >= ESG_DISCOUNT_THRESHOLD;
  const esgDiscountAmount = esgDiscountApplied
    ? parseFloat((basePremium * 0.05).toFixed(2))
    : 0;
  const finalPremium = parseFloat((basePremium - esgDiscountAmount).toFixed(2));

  const quoteRef = `QT-${Date.now()}-${assetId.slice(-4).toUpperCase()}`;
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  logger.info(
    `[Insurance] Quote generated for asset ${assetId}: £${finalPremium}/yr ` +
    `(ESG discount: ${esgDiscountApplied})`
  );

  return {
    asset_id: assetId,
    asset_name: asset.name,
    policy_type: policyType,
    coverage_limit: coverageLimit,
    base_premium: basePremium,
    esg_score: asset.esg_score,
    esg_discount_applied: esgDiscountApplied,
    esg_discount_amount: esgDiscountAmount,
    final_premium: finalPremium,
    currency: 'GBP',
    quote_reference: quoteRef,
    valid_until: validUntil,
  };
};
