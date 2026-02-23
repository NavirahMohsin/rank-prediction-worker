export function predictTrajectory(input: any, trajectoryMeta: any) {
  let improvement = trajectoryMeta.intercept;

  for (const coeff of trajectoryMeta.coefficients) {
    const featureValue = input[coeff.feature] || 0;
    improvement += featureValue * coeff.coefficient;
  }

  const [minImp, maxImp] = trajectoryMeta.monthly_improvement_range;

  if (improvement < minImp) improvement = minImp;
  if (improvement > maxImp) improvement = maxImp;

  return Math.round(improvement);
}

export interface TrajectoryProjection {
  monthly_improvement_rate: number;
  rank_after_1_month: number;
  rank_after_3_months: number;
  rank_after_6_months: number;
}

export function generateFullTrajectory(
  input: any,
  currentRank: number,
  trajectoryMeta: any,
  totalCandidates: number
): TrajectoryProjection {
  // Calculate monthly improvement rate as a percentage
  let monthlyImprovement = trajectoryMeta.intercept;

  for (const coeff of trajectoryMeta.coefficients) {
    const featureValue = input[coeff.feature] || 0;
    monthlyImprovement += featureValue * coeff.coefficient;
  }

  const [minImp, maxImp] = trajectoryMeta.monthly_improvement_range;
  monthlyImprovement = Math.max(minImp, Math.min(maxImp, monthlyImprovement));

  // Convert percentage improvement to decimal rate (e.g., 5% = 0.05)
  const monthlyRate = monthlyImprovement / 100;

  // Project future ranks based on exponential decay of rank over time
  // Formula: future_rank = current_rank * (1 - monthly_rate)^months
  const rankAfter1Month = Math.max(1, Math.min(totalCandidates, Math.round(currentRank * Math.pow(1 - monthlyRate, 1))));
  const rankAfter3Months = Math.max(1, Math.min(totalCandidates, Math.round(currentRank * Math.pow(1 - monthlyRate, 3))));
  const rankAfter6Months = Math.max(1, Math.min(totalCandidates, Math.round(currentRank * Math.pow(1 - monthlyRate, 6))));

  return {
    monthly_improvement_rate: Math.round(monthlyImprovement * 100) / 100,
    rank_after_1_month: rankAfter1Month,
    rank_after_3_months: rankAfter3Months,
    rank_after_6_months: rankAfter6Months
  };
}