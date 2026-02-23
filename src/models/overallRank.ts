export function predictOverallRank(
  totalScore: number,
  maxMarks: number,
  totalCandidates: number
) {
  const scoreRatio = totalScore / maxMarks;

  // High-accuracy non-linear compression
  const exponent = 3.2;

  let predictedRank =
    totalCandidates * (1 - Math.pow(scoreRatio, exponent));

  if (predictedRank < 1) predictedRank = 1;

  return Math.round(predictedRank);
}