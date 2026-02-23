export function predictSubjectRank(
  subjectScore: number,
  maxScore: number,
  totalCandidates: number
) {
  const ratio = subjectScore / maxScore;
  const exponent = 2.8;

  let rank = totalCandidates * (1 - Math.pow(ratio, exponent));

  if (rank < 1) rank = 1;

  return Math.round(rank);
}