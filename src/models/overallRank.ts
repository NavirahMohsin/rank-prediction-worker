export function predictOverallRank(
  totalScore: number,
  maxMarks: number,
  totalCandidates: number,
  exam: string
) {
  const EXPONENTS: Record<string, number> = {
    ap_mpc: 2.1,
    ap_bipc: 3.2,
    tg_bipc: 2.8
  };

  const examKey = exam.toLowerCase();
  const exponent = EXPONENTS[examKey] || 2.5;

  const scoreRatio = totalScore / maxMarks;

  // Clamp between 0 and 1
  const normalized = Math.min(1, Math.max(0, scoreRatio));

  let predictedRank =
    totalCandidates * Math.pow(1 - normalized, exponent);

  if (predictedRank < 1) predictedRank = 1;

  return Math.round(predictedRank);
}
