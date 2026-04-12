/** Compute Levenshtein edit distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export interface MatchCandidate {
  tenancyId: string;
  reference: string;
}

export interface MatchResult {
  tenancyId: string;
  reference: string;
  score: number;      // 0–1, higher = better match
  autoReconcile: boolean; // true when score >= 0.85
}

const normalise = (s: string) => s.toLowerCase().replace(/[\s-_]/g, '');

/**
 * Fuzzy-match a bank reference string against tenancy reference candidates.
 * Returns results sorted descending by confidence score.
 */
export function fuzzyMatch(
  bankRef: string,
  candidates: MatchCandidate[]
): MatchResult[] {
  const normBank = normalise(bankRef);

  const results: MatchResult[] = candidates.map(({ tenancyId, reference }) => {
    const normRef = normalise(reference);
    const maxLen = Math.max(normBank.length, normRef.length);
    if (maxLen === 0) return { tenancyId, reference, score: 1, autoReconcile: true };
    const dist = levenshtein(normBank, normRef);
    const score = parseFloat((1 - dist / maxLen).toFixed(3));
    return { tenancyId, reference, score, autoReconcile: score >= 0.85 };
  });

  return results.sort((a, b) => b.score - a.score);
}

/** Export levenshtein for unit testing */
export { levenshtein };
