/**
 * Compliance tests: AML flagging logic and GDPR PII masking logic.
 * These are pure unit tests — no DB connection required.
 */

const AML_THRESHOLD = 10000;

// ─── AML Logic (extracted from aml.middleware.ts) ───────────────────
const shouldFlagAml = (amount: number, threshold: number): boolean => amount > threshold;

describe('AML Flagging Logic', () => {
  test('transaction exactly at threshold is NOT flagged', () => {
    expect(shouldFlagAml(10000, AML_THRESHOLD)).toBe(false);
  });

  test('transaction £1 above threshold IS flagged', () => {
    expect(shouldFlagAml(10001, AML_THRESHOLD)).toBe(true);
  });

  test('transaction of £50,000 IS flagged', () => {
    expect(shouldFlagAml(50000, AML_THRESHOLD)).toBe(true);
  });

  test('transaction of £0 is NOT flagged', () => {
    expect(shouldFlagAml(0, AML_THRESHOLD)).toBe(false);
  });

  test('transaction of £9,999.99 is NOT flagged', () => {
    expect(shouldFlagAml(9999.99, AML_THRESHOLD)).toBe(false);
  });

  test('transaction of £10,000.01 IS flagged', () => {
    expect(shouldFlagAml(10000.01, AML_THRESHOLD)).toBe(true);
  });
});

// ─── GDPR PII Masking Logic ────────────────────────────────────────
interface UserLike {
  name: string;
  email: string;
  deletedAt: Date | null;
  pii_masked: boolean;
  isActive: boolean;
}

const maskUserPii = (user: UserLike, userId: string): UserLike => ({
  ...user,
  name: 'GDPR_ERASED',
  email: `gdpr_erased_${userId}@erased.invalid`,
  deletedAt: new Date(),
  pii_masked: true,
  isActive: false,
});

describe('GDPR PII Masking', () => {
  const originalUser: UserLike = {
    name: 'John Smith',
    email: 'john.smith@example.com',
    deletedAt: null,
    pii_masked: false,
    isActive: true,
  };

  test('masked user has GDPR_ERASED name', () => {
    const masked = maskUserPii(originalUser, 'usr123');
    expect(masked.name).toBe('GDPR_ERASED');
  });

  test('masked email follows erased format', () => {
    const masked = maskUserPii(originalUser, 'usr123');
    expect(masked.email).toBe('gdpr_erased_usr123@erased.invalid');
    expect(masked.email).not.toContain('john.smith');
  });

  test('masked user has deletedAt timestamp', () => {
    const masked = maskUserPii(originalUser, 'usr123');
    expect(masked.deletedAt).toBeInstanceOf(Date);
  });

  test('masked user is inactive', () => {
    const masked = maskUserPii(originalUser, 'usr123');
    expect(masked.isActive).toBe(false);
  });

  test('pii_masked flag is set to true', () => {
    const masked = maskUserPii(originalUser, 'usr123');
    expect(masked.pii_masked).toBe(true);
  });

  test('original user object is not mutated', () => {
    maskUserPii(originalUser, 'usr123');
    expect(originalUser.name).toBe('John Smith');
    expect(originalUser.pii_masked).toBe(false);
  });
});

// ─── Insurance ESG Discount Logic ─────────────────────────────────
const ESG_THRESHOLD = 70;
const ESG_DISCOUNT = 0.05;

const calcPremium = (coverageLimit: number, rate: number, esgScore: number) => {
  const base = coverageLimit * rate;
  const discount = esgScore >= ESG_THRESHOLD ? base * ESG_DISCOUNT : 0;
  return { base, discount, final: parseFloat((base - discount).toFixed(2)) };
};

describe('Insurance ESG Discount Logic', () => {
  test('ESG score of 70 qualifies for 5% discount', () => {
    const result = calcPremium(1_000_000, 0.003, 70);
    expect(result.discount).toBeGreaterThan(0);
    expect(result.final).toBe(result.base * 0.95);
  });

  test('ESG score of 69 does NOT get discount', () => {
    const result = calcPremium(1_000_000, 0.003, 69);
    expect(result.discount).toBe(0);
    expect(result.final).toBe(result.base);
  });

  test('ESG score of 100 gets maximum 5% discount', () => {
    const result = calcPremium(500_000, 0.003, 100);
    expect(result.discount).toBeCloseTo(500_000 * 0.003 * 0.05, 2);
  });
});
