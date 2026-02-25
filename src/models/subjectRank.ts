export function predictSubjectRank(
  subjectName: string,
  subjectScore: number,
  maxSubjectScore: number,
  totalScore: number,
  maxTotalMarks: number,
  overallRank: number,
  totalCandidates: number,
  exam: string
) {
  if (!subjectScore || subjectScore <= 0) {
    return overallRank;
  }

  const subjectStrength = subjectScore / maxSubjectScore;
  const overallStrength = totalScore / maxTotalMarks;

  const performanceGap = subjectStrength - overallStrength;

  // Base multiplier
  let impactMultiplier = 0.7;

  // Increase weight for 80-mark subjects
  if (maxSubjectScore === 80) {
    impactMultiplier += 0.2; // weight advantage
  }

  // Tie-breaker priority boost
  if (
    ((exam === "ap_mpc" || exam === "tg_mpc") && (subjectName === "mathematics" || subjectName === "maths" || subjectName === "maths_score")) ||
    ((exam === "ap_bipc" || exam === "tg_bipc") && subjectName === "biology")
  ) {
    impactMultiplier += 0.15;
  }

  const rankShift =
    overallRank * performanceGap * impactMultiplier;

  let subjectRank = overallRank - rankShift;

  subjectRank = Math.max(1, Math.min(totalCandidates, subjectRank));

  return Math.round(subjectRank);
}