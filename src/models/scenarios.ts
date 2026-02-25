import { predictOverallRank } from "./overallRank";

export interface Scenario {
  scenario: string;
  description: string;
  improved_rank: number;
  rank_improvement: number;
  improvement_percent: number;
}

export interface WhatIfScenarios {
  current_rank: number;
  scenarios: Scenario[];
}

export function generateWhatIfScenarios(
  input: any,
  currentRank: number,
  models: any
): WhatIfScenarios {

  const maxMarks = models.overall.exam_config.max_marks;
  const totalCandidates = models.overall.exam_config.total_candidates;
  const exam = input.exam || "ap_mpc";

  const currentScore = input.totalScore;
  const scenarios: Scenario[] = [];

  function simulateScenario(
    key: string,
    description: string,
    scoreBoost: number
  ) {
    const newScore = Math.min(maxMarks, currentScore + scoreBoost);

    const improvedRank = predictOverallRank(
      exam,
      newScore
    );

    const rankImprovement = currentRank - improvedRank;

    scenarios.push({
      scenario: key,
      description,
      improved_rank: improvedRank,
      rank_improvement: rankImprovement,
      improvement_percent:
        Math.round((rankImprovement / currentRank) * 10000) / 100
    });
  }

  // -------------------------
  // Scenario 1: Accuracy +10%
  // -------------------------
  const accuracyBoostMarks = maxMarks * 0.07; // realistic 7% gain
  simulateScenario(
    "accuracy_plus_10",
    "If you improve overall accuracy by 10%",
    accuracyBoostMarks
  );

  // -------------------------
  // Subject +20% logic
  // -------------------------
  function subjectBoost(subjectName: string, label: string, aliases: string[] = []) {
    const key = [subjectName, ...aliases].find((name) => input.subjectScores?.[name] !== undefined);
    if (!key) return;

    const currentSubScore = input.subjectScores[key];
    const maxSubScore = models.subject[key]?.max_score || models.subject[subjectName]?.max_score || 0;

    const remaining = maxSubScore - currentSubScore;
    const boost = remaining * 0.2; // 20% of remaining potential

    simulateScenario(
      `${key}_plus_20`,
      `If you improve ${label} by 20%`,
      boost
    );
  }

  subjectBoost("maths", "Maths", ["mathematics", "maths_score"]);
  subjectBoost("physics", "Physics");
  subjectBoost("chemistry", "Chemistry");
  subjectBoost("biology", "Biology");

  // Sort by best improvement
  scenarios.sort((a, b) => b.rank_improvement - a.rank_improvement);

  return {
    current_rank: currentRank,
    scenarios
  };
}
