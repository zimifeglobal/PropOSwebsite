import Asset from '../models/Asset';
import ComplianceLog from '../models/ComplianceLog';
import logger from '../utils/logger';

/**
 * Aggregate compliance status across a portfolio.
 */
export const getComplianceAuditStatus = async (portfolioIds: string[]) => {
  const logs = await ComplianceLog.find({ portfolio_id: { $in: portfolioIds } })
    .sort({ createdAt: -1 })
    .lean();

  const summary: Record<string, Record<string, number>> = {};
  for (const log of logs) {
    if (!summary[log.type]) summary[log.type] = {};
    summary[log.type][log.status] = (summary[log.type][log.status] || 0) + 1;
  }

  const flaggedCount = logs.filter((l) => l.status === 'flagged').length;
  const pendingCount = logs.filter((l) => l.status === 'pending').length;
  const overallStatus = flaggedCount > 0 ? 'flagged' : pendingCount > 0 ? 'pending' : 'pass';

  return { summary, flaggedCount, pendingCount, overallStatus, totalLogs: logs.length };
};

/**
 * Mock AI Auditor: updates compliance statuses on open logs using rule-based logic.
 * Runs every 5 minutes via cron.
 */
export const runAiAuditor = async (): Promise<void> => {
  logger.info('[AI Auditor] Running compliance status update...');

  const openLogs = await ComplianceLog.find({ status: 'pending' }).limit(50);
  let updated = 0;

  for (const log of openLogs) {
    const rand = Math.random();
    let newStatus: string;

    if (log.type === 'AML') {
      newStatus = rand > 0.3 ? 'review' : 'flagged';
    } else if (log.type === 'KYC') {
      newStatus = rand > 0.2 ? 'pass' : 'fail';
    } else {
      newStatus = rand > 0.1 ? 'pass' : 'fail';
    }

    log.status = newStatus as typeof log.status;
    log.last_audit = new Date();
    await log.save();
    updated++;
  }

  // Update building_health_score on assets
  const assets = await Asset.find().limit(20);
  for (const asset of assets) {
    const assetLogs = await ComplianceLog.find({ entity_id: asset._id });
    if (assetLogs.length > 0) {
      const passRate = assetLogs.filter((l) => l.status === 'pass').length / assetLogs.length;
      asset.building_health_score = Math.round(passRate * 100);
      await asset.save();
    }
  }

  logger.info(`[AI Auditor] Updated ${updated} compliance logs`);
};
