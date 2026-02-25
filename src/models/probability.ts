export interface RankBand {
  predicted_rank: number;
  min_rank: number;
  max_rank: number;
  percentile: number;
}

export function generateRankSensitivityBand(
  totalScore: number,
  maxMarks: number,
  totalCandidates: number,
  predictRankFromScore: (score: number) => number
): RankBand {

  // Core predicted rank
  const predictedRank = predictRankFromScore(totalScore);

  // Score sensitivity window (±2 marks)
  const scoreDelta = totalScore < 60 ? 3 : 2;

  const lowerScore = Math.max(0, totalScore - scoreDelta);
  const higherScore = Math.min(maxMarks, totalScore + scoreDelta);

  const betterRank = predictRankFromScore(higherScore);
  const worseRank = predictRankFromScore(lowerScore);

  // Ensure correct ordering
  const minRank = Math.min(betterRank, worseRank, predictedRank);
  const maxRank = Math.max(betterRank, worseRank, predictedRank);

  // Percentile calculation
  const percentile =
    ((totalCandidates - predictedRank) / totalCandidates) * 100;

  return {
    predicted_rank: predictedRank,
    min_rank: minRank,
    max_rank: maxRank,
    percentile: Math.round(percentile * 100) / 100
  };
}