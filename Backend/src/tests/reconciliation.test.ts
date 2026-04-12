import { fuzzyMatch, levenshtein, MatchCandidate } from '../utils/fuzzyMatch';

describe('Levenshtein Distance', () => {
  test('identical strings = distance 0', () => {
    expect(levenshtein('SMITH-001', 'SMITH-001')).toBe(0);
  });

  test('completely different strings = max distance', () => {
    expect(levenshtein('abc', 'xyz')).toBe(3);
  });

  test('single char difference', () => {
    expect(levenshtein('SMITH001', 'SMITH002')).toBe(1);
  });

  test('empty string vs non-empty', () => {
    expect(levenshtein('', 'abc')).toBe(3);
  });
});

describe('Fuzzy Match — Rent Reconciliation', () => {
  const candidates: MatchCandidate[] = [
    { tenancyId: 'TEN001', reference: 'SMITH-UNIT-4A' },
    { tenancyId: 'TEN002', reference: 'JONES-UNIT-2B' },
    { tenancyId: 'TEN003', reference: 'BROWN-FLAT-7' },
    { tenancyId: 'TEN004', reference: 'WILLIAMS-12C' },
  ];

  test('exact match returns score 1 and autoReconcile true', () => {
    const results = fuzzyMatch('SMITH-UNIT-4A', candidates);
    expect(results[0].tenancyId).toBe('TEN001');
    expect(results[0].score).toBe(1);
    expect(results[0].autoReconcile).toBe(true);
  });

  test('near match (typo) returns high score', () => {
    const results = fuzzyMatch('SMITTH-UNIT-4A', candidates);
    expect(results[0].tenancyId).toBe('TEN001');
    expect(results[0].score).toBeGreaterThan(0.8);
  });

  test('partially matching ref returns best match first', () => {
    const results = fuzzyMatch('JONES-UNIT-2B', candidates);
    expect(results[0].tenancyId).toBe('TEN002');
  });

  test('no match scores low', () => {
    const results = fuzzyMatch('XXXXXXXXXX', candidates);
    expect(results[0].score).toBeLessThan(0.5);
    expect(results[0].autoReconcile).toBe(false);
  });

  test('results are sorted descending by score', () => {
    const results = fuzzyMatch('BROWN-FLAT-7', candidates);
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  });

  test('normalisation ignores spaces and case', () => {
    const results = fuzzyMatch('smith unit 4a', candidates);
    expect(results[0].tenancyId).toBe('TEN001');
    expect(results[0].score).toBe(1);
  });
});
