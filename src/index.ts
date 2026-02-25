import { predictOverallRank } from "./models/overallRank";
import { predictSubjectRank } from "./models/subjectRank";
import { generateFullTrajectory } from "./models/trajectory";
import { generateWhatIfScenarios } from "./models/scenarios";
import { generateRankSensitivityBand } from "./models/probability";

const SUPPORTED_EXAMS = ["tg_mpc", "tg_bipc", "ap_mpc", "ap_bipc"];

function getCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

import tg_mpc_config from "./metadata/tg_mpc/exam_config.json";
import tg_bipc_config from "./metadata/tg_bipc/exam_config.json";
import ap_mpc_config from "./metadata/ap_mpc/exam_config.json";
import ap_bipc_config from "./metadata/ap_bipc/exam_config.json";

function loadExamConfig(exam: string) {
  switch (exam) {
    case "tg_mpc":
      return tg_mpc_config;
    case "tg_bipc":
      return tg_bipc_config;
    case "ap_mpc":
      return ap_mpc_config;
    case "ap_bipc":
      return ap_bipc_config;
    default:
      throw new Error("Unsupported exam config");
  }
}

function normalizeAccuracy(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0.7;
  }

  // Accept either 0-1 or 0-100
  if (value > 1) {
    return Math.min(1, value / 100);
  }

  return Math.max(0, Math.min(1, value));
}

export default {
  async fetch(request: Request): Promise<Response> {
    const corsHeaders = getCorsHeaders();

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Only POST allowed", {
        status: 405,
        headers: corsHeaders
      });
    }

    try {
      const body = (await request.json()) as any;

      const exam = body.exam?.toLowerCase();
      if (!exam || !SUPPORTED_EXAMS.includes(exam)) {
        return new Response(
          JSON.stringify({
            error: `Unsupported exam. Must be one of: ${SUPPORTED_EXAMS.join(", ")}`
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const totalScore = body.totalScore;
      if (typeof totalScore !== "number") {
        return new Response(
          JSON.stringify({ error: "Invalid totalScore" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const subjectScores = body.subjectScores || {};

      const examData = loadExamConfig(exam) as Record<string, any>;

      const maxMarks = examData.exam_config.max_marks;
      const totalCandidates = examData.exam_config.total_candidates;

      const overallRank = predictOverallRank(exam, totalScore);

      // Get subject keys dynamically
      const subjectKeys = Object.keys(examData).filter(
        (key) => key !== "exam_config"
      );

      const subjectRanks: Record<string, number | null> = {};

      for (const subjectName of subjectKeys) {
        const score = subjectScores[subjectName];

        if (typeof score === "number") {
          const subjectConfig = examData[subjectName];
          subjectRanks[subjectName] = predictSubjectRank(
            subjectName,
            score,
            subjectConfig.max_score,
            totalScore,
            maxMarks,
            overallRank,
            totalCandidates,
            exam
          );
        } else {
          subjectRanks[subjectName] = null;
        }
      }

      const rankBand = generateRankSensitivityBand(
        totalScore,
        maxMarks,
        totalCandidates,
        (score) => predictOverallRank(exam, score)
      );

      const accuracy = normalizeAccuracy(body.accuracy_percent);
      const trajectory = generateFullTrajectory(
        totalScore,
        maxMarks,
        accuracy,
        (score) => predictOverallRank(exam, score)
      );

      // Structure models object for scenarios function
      const models = {
        overall: {
          exam_config: examData.exam_config
        },
        subject: Object.keys(examData)
          .filter(key => key !== "exam_config")
          .reduce((acc, key) => {
            acc[key] = examData[key];
            return acc;
          }, {} as Record<string, any>)
      };

      const scenarios = generateWhatIfScenarios(body, overallRank, models);

      return new Response(
        JSON.stringify({
          version: "v2",
          exam,
          overall_prediction: rankBand,
          overall_rank: overallRank,
          subject_ranks: subjectRanks,
          trajectory,
          what_if_scenarios: scenarios
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || "Internal Server Error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  }
};