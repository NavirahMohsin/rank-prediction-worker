export function predictTrajectoryScore(input: any, trajectoryMeta: any) {
  let scoreImprovement = trajectoryMeta.intercept;

  for (const coeff of trajectoryMeta.coefficients) {
    const featureValue = input[coeff.feature] || 0;
    scoreImprovement += featureValue * coeff.coefficient;
  }

  const [minImp, maxImp] = trajectoryMeta.monthly_improvement_range;

  if (scoreImprovement < minImp) scoreImprovement = minImp;
  if (scoreImprovement > maxImp) scoreImprovement = maxImp;

  return Math.round(scoreImprovement);
}