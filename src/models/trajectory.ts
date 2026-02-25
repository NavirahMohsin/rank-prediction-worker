function calculateMonthlyImprovement(
  currentScore: number,
  maxScore: number,
  accuracy: number
): number {

  const scoreRatio = currentScore / maxScore;

  let improvement = 0;

  // Base improvement from accuracy
  if (accuracy >= 0.85) {
    improvement = 6; // strong conceptual clarity
  } else if (accuracy >= 0.70) {
    improvement = 8;
  } else if (accuracy >= 0.55) {
    improvement = 10;
  } else if (accuracy >= 0.40) {
    improvement = 7;
  } else {
    improvement = 4; // needs fundamentals
  }

  // Apply plateau effect
  if (scoreRatio > 0.90) {
    improvement *= 0.4;
  } else if (scoreRatio > 0.80) {
    improvement *= 0.6;
  } else if (scoreRatio > 0.70) {
    improvement *= 0.8;
  }

  return improvement;
}

export function generateFullTrajectory(
  currentScore: number,
  maxScore: number,
  accuracy: number,
  predictRankFromScore: (score: number) => number
) {

  const monthlyImprovement = calculateMonthlyImprovement(
    currentScore,
    maxScore,
    accuracy
  );

  const score1 = Math.min(maxScore, currentScore + monthlyImprovement * 1);
  const score3 = Math.min(maxScore, currentScore + monthlyImprovement * 3);
  const score6 = Math.min(maxScore, currentScore + monthlyImprovement * 6);

  return {
    monthly_score_improvement: monthlyImprovement,
    projected_score_1_month: score1,
    projected_score_3_months: score3,
    projected_score_6_months: score6,
    rank_after_1_month: predictRankFromScore(score1),
    rank_after_3_months: predictRankFromScore(score3),
    rank_after_6_months: predictRankFromScore(score6)
  };
}