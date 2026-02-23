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
  const exam = input.exam || "ap_mpc"; // Default to ap_mpc if not provided

  const scenarios: Scenario[] = [];

  // Scenario 1: Accuracy +10%
  {
    const modifiedInput = { ...input };
    const accuracyBoost = 1.1;
    
    const currentAccuracy = input.accuracy_percent || 80;
    const newAccuracy = Math.min(100, currentAccuracy * accuracyBoost);
    const accuracyImprovement = newAccuracy - currentAccuracy;
    const scoreBoost = (accuracyImprovement / 100) * maxMarks;
    
    modifiedInput.totalScore = Math.min(maxMarks, input.totalScore + scoreBoost);
    
    const improvedRank = predictOverallRank(
      modifiedInput.totalScore,
      maxMarks,
      totalCandidates,
      exam
    );
    
    const rankImprovement = currentRank - improvedRank;
    const improvementPercent = (rankImprovement / currentRank) * 100;
    
    scenarios.push({
      scenario: "accuracy_plus_10",
      description: "If you improve overall accuracy by 10%",
      improved_rank: improvedRank,
      rank_improvement: rankImprovement,
      improvement_percent: Math.round(improvementPercent * 100) / 100
    });
  }

  // Scenario 2: Mathematics +20% (only if mathematics subject exists)
  if (models.subject["mathematics"] && input.subjectScores?.mathematics !== undefined) {
    const modifiedInput = { ...input, subjectScores: { ...input.subjectScores } };
    
    const currentMathsScore = input.subjectScores.mathematics || 0;
    const maxMathsScore = models.subject.mathematics.max_score || 80;
    
    const boostAmount = Math.min(maxMathsScore, currentMathsScore * 1.2);
    modifiedInput.subjectScores.mathematics = boostAmount;
    
    const mathsGain = boostAmount - currentMathsScore;
    modifiedInput.totalScore = Math.min(maxMarks, input.totalScore + mathsGain);
    
    const improvedRank = predictOverallRank(
      modifiedInput.totalScore,
      maxMarks,
      totalCandidates,
      exam
    );
    
    const rankImprovement = currentRank - improvedRank;
    const improvementPercent = (rankImprovement / currentRank) * 100;
    
    scenarios.push({
      scenario: "mathematics_plus_20",
      description: "If you improve Maths by 20%",
      improved_rank: improvedRank,
      rank_improvement: rankImprovement,
      improvement_percent: Math.round(improvementPercent * 100) / 100
    });
  }

  // Scenario 3: Physics +20% (if physics subject exists)
  if (models.subject["physics"] && input.subjectScores?.physics !== undefined) {
    const modifiedInput = { ...input, subjectScores: { ...input.subjectScores } };
    
    const currentPhysicsScore = input.subjectScores.physics || 0;
    const maxPhysicsScore = models.subject.physics.max_score || 40;
    
    const boostAmount = Math.min(maxPhysicsScore, currentPhysicsScore * 1.2);
    modifiedInput.subjectScores.physics = boostAmount;
    
    const physicsGain = boostAmount - currentPhysicsScore;
    modifiedInput.totalScore = Math.min(maxMarks, input.totalScore + physicsGain);
    
    const improvedRank = predictOverallRank(
      modifiedInput.totalScore,
      maxMarks,
      totalCandidates,
      exam
    );
    
    const rankImprovement = currentRank - improvedRank;
    const improvementPercent = (rankImprovement / currentRank) * 100;
    
    scenarios.push({
      scenario: "physics_plus_20",
      description: "If you improve Physics by 20%",
      improved_rank: improvedRank,
      rank_improvement: rankImprovement,
      improvement_percent: Math.round(improvementPercent * 100) / 100
    });
  }

  // Scenario 4: Chemistry +20% (if chemistry subject exists)
  if (models.subject["chemistry"] && input.subjectScores?.chemistry !== undefined) {
    const modifiedInput = { ...input, subjectScores: { ...input.subjectScores } };
    
    const currentChemistryScore = input.subjectScores.chemistry || 0;
    const maxChemistryScore = models.subject.chemistry.max_score || 40;
    
    const boostAmount = Math.min(maxChemistryScore, currentChemistryScore * 1.2);
    modifiedInput.subjectScores.chemistry = boostAmount;
    
    const chemistryGain = boostAmount - currentChemistryScore;
    modifiedInput.totalScore = Math.min(maxMarks, input.totalScore + chemistryGain);
    
    const improvedRank = predictOverallRank(
      modifiedInput.totalScore,
      maxMarks,
      totalCandidates,
      exam
    );
    
    const rankImprovement = currentRank - improvedRank;
    const improvementPercent = (rankImprovement / currentRank) * 100;
    
    scenarios.push({
      scenario: "chemistry_plus_20",
      description: "If you improve Chemistry by 20%",
      improved_rank: improvedRank,
      rank_improvement: rankImprovement,
      improvement_percent: Math.round(improvementPercent * 100) / 100
    });
  }

  // Scenario 5: Speed -15% (time per question reduced by 15%)
  {
    const modifiedInput = { ...input };
    
    const timeGainPercent = 0.15;
    const accuracyBoostFromSpeed = 0.08;
    
    const currentAccuracy = input.accuracy_percent || 80;
    const newAccuracy = Math.min(100, currentAccuracy * (1 + accuracyBoostFromSpeed));
    const accuracyImprovement = newAccuracy - currentAccuracy;
    const scoreBoost = (accuracyImprovement / 100) * maxMarks;
    
    modifiedInput.totalScore = Math.min(maxMarks, input.totalScore + scoreBoost);
    
    const improvedRank = predictOverallRank(
      modifiedInput.totalScore,
      maxMarks,
      totalCandidates,
      exam
    );
    
    const rankImprovement = currentRank - improvedRank;
    const improvementPercent = (rankImprovement / currentRank) * 100;
    
    scenarios.push({
      scenario: "speed_minus_15",
      description: "If you reduce time per question by 15%",
      improved_rank: improvedRank,
      rank_improvement: rankImprovement,
      improvement_percent: Math.round(improvementPercent * 100) / 100
    });
  }

  // Sort scenarios by rank_improvement (descending - best improvements first)
  scenarios.sort((a, b) => b.rank_improvement - a.rank_improvement);

  return {
    current_rank: currentRank,
    scenarios
  };
}
