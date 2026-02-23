export function predictSubjectRank(
  subjectScore,
  maxScore,
  overallRank,
  totalCandidates
) {
  const subjectRatio = subjectScore / maxScore;

  const overallPercentile = 1 - overallRank / totalCandidates;

  // Adjust subject percentile relative to overall
  const subjectPercentile =
    overallPercentile * 0.6 + subjectRatio * 0.4;

  let rank = totalCandidates * (1 - subjectPercentile);

  if (rank < 1) rank = 1;

  return Math.round(rank);
}