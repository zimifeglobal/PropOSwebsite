import cron from 'node-cron';
import ComplianceLog from '../models/ComplianceLog';
import InsurancePolicy from '../models/InsurancePolicy';
import { runAiAuditor } from './compliance.service';
import logger from '../utils/logger';

const ALERT_DAYS = 60; // days before expiry to alert

/**
 * Check for statutory compliance items expiring within 60 days (EICR, CP12, EPC).
 */
const checkStatutoryAlerts = async (): Promise<void> => {
  const cutoff = new Date(Date.now() + ALERT_DAYS * 24 * 60 * 60 * 1000);
  const expiring = await ComplianceLog.find({
    type: { $in: ['EICR', 'CP12', 'EPC'] },
    expiry_date: { $lte: cutoff, $gte: new Date() },
  }).lean();

  if (expiring.length === 0) {
    logger.info('[Cron] Statutory check: no expiring certs found.');
    return;
  }

  for (const log of expiring) {
    const daysLeft = Math.ceil(
      ((log.expiry_date?.getTime() ?? 0) - Date.now()) / (1000 * 60 * 60 * 24)
    );
    logger.warn(
      `[Statutory Alert] ${log.type} for entity ${log.entity_id} expires in ${daysLeft} days. ` +
      `[STUB] → notify manager via email/SMS`
    );
    // TODO: integrate SendGrid / Twilio for real notifications
  }
};

/**
 * Check for insurance policies expiring within 60 days.
 */
const checkInsuranceExpiry = async (): Promise<void> => {
  const cutoff = new Date(Date.now() + ALERT_DAYS * 24 * 60 * 60 * 1000);
  const expiring = await InsurancePolicy.find({
    expiry_date: { $lte: cutoff, $gte: new Date() },
    is_active: true,
  }).lean();

  for (const policy of expiring) {
    const daysLeft = Math.ceil(
      (policy.expiry_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    logger.warn(
      `[Insurance Alert] Policy for asset ${policy.asset_id} (${policy.policy_type}) ` +
      `expires in ${daysLeft} days. [STUB] → notify manager`
    );
  }
};

/**
 * Start all cron jobs.
 */
export const startCronJobs = (): void => {
  // AI Compliance Auditor: every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await runAiAuditor();
    } catch (err) {
      logger.error('[Cron] AI Auditor failed:', err);
    }
  });

  // Statutory alerts: daily at 08:00 UTC
  cron.schedule('0 8 * * *', async () => {
    try {
      logger.info('[Cron] Running daily statutory & insurance expiry checks...');
      await checkStatutoryAlerts();
      await checkInsuranceExpiry();
    } catch (err) {
      logger.error('[Cron] Statutory alert check failed:', err);
    }
  });

  logger.info('[Cron] Jobs started: AI Auditor (*/5 min) | Statutory Alerts (daily 08:00 UTC)');
};
