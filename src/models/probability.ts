export interface ProbabilityRange {
  min_rank: number;
  max_rank: number;
  probability: number;
  label: string;
}

export interface ProbabilityDistribution {
  ranges: ProbabilityRange[];
  percentile: number;
}

export function generateProbabilityDistribution(
  predictedRank: number,
  totalCandidates: number
): ProbabilityDistribution {
  const ranges: ProbabilityRange[] = [];

  // ±5% most likely: 40% probability (1σ bounds)
  const range_5pct_min = Math.max(1, Math.ceil(predictedRank * 0.95));
  const range_5pct_max = Math.min(totalCandidates, Math.floor(predictedRank * 1.05));
  ranges.push({
    min_rank: range_5pct_min,
    max_rank: range_5pct_max,
    probability: 40,
    label: "Most Likely (±5%)"
  });

  // ±10% high probability: 60% probability
  // This encompasses the 5% range but extends to 10%
  const range_10pct_min = Math.max(1, Math.ceil(predictedRank * 0.90));
  const range_10pct_max = Math.min(totalCandidates, Math.floor(predictedRank * 1.10));
  ranges.push({
    min_rank: range_10pct_min,
    max_rank: range_10pct_max,
    probability: 60,
    label: "Probable Range (±10%)"
  });

  // 68% range: 1σ standard deviation
  const range_68_min = Math.max(1, Math.ceil(predictedRank * 0.9));
  const range_68_max = Math.min(totalCandidates, Math.floor(predictedRank * 1.1));
  ranges.push({
    min_rank: range_68_min,
    max_rank: range_68_max,
    probability: 68,
    label: "68% Confidence (1σ)"
  });

  // 95% range: 2σ standard deviation
  const range_95_min = Math.max(1, Math.ceil(predictedRank * 0.8));
  const range_95_max = Math.min(totalCandidates, Math.floor(predictedRank * 1.2));
  ranges.push({
    min_rank: range_95_min,
    max_rank: range_95_max,
    probability: 95,
    label: "95% Confidence (2σ)"
  });

  // Calculate percentile: what % of candidates rank better than us
  const percentile = ((totalCandidates - predictedRank) / totalCandidates) * 100;

  return {
    ranges,
    percentile: Math.round(percentile * 100) / 100
  };
}
