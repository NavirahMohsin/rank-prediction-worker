import { loadModels } from "./models/modelLoader";
import { predictOverallRank } from "./models/overallRank";
import { predictSubjectRank } from "./models/subjectRank";
import { predictTrajectory, generateFullTrajectory } from "./models/trajectory";
import { generateProbabilityDistribution } from "./models/probability";
import { generateWhatIfScenarios } from "./models/scenarios";

const SUPPORTED_EXAMS = ["tg_bipc", "ap_mpc", "ap_bipc"];

function getCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function validateInput(body: any) {
  if (!body.exam) {
    throw new Error("Exam type is required");
  }

  const exam = body.exam.toLowerCase();
  if (!SUPPORTED_EXAMS.includes(exam)) {
    throw new Error(`Unsupported exam. Must be one of: ${SUPPORTED_EXAMS.join(", ")}`);
  }

  if (typeof body.totalScore !== "number") {
    throw new Error("totalScore must be a number");
  }
}

async function handleV1Predict(body: any, corsHeaders: Record<string, string>) {
  validateInput(body);

  const { exam, totalScore, subjectScores = {} } = body;

  const models = await loadModels(exam);

  const maxMarks = models.overall.exam_config.max_marks;
  const totalCandidates = models.overall.exam_config.total_candidates;

  const overallRank = predictOverallRank(
    totalScore,
    maxMarks,
    totalCandidates,
    exam
  );

  // Dynamic Subject Rank Prediction
  const subjectRanks: Record<string, number | null> = {};

  for (const subject in models.subject) {
    const score = subjectScores[subject];

    if (score !== undefined) {
      subjectRanks[subject] = predictSubjectRank(
        score,
        models.subject[subject].max_score,
        overallRank,
        totalCandidates
      );
    } else {
      subjectRanks[subject] = null;
    }
  }

  const trajectory = predictTrajectory(body, models.trajectory);

  return new Response(
    JSON.stringify({
      version: "v1",
      exam,
      overall_rank: overallRank,
      subject_ranks: subjectRanks,
      monthly_improvement_prediction: trajectory
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

async function handleV2Predict(body: any, corsHeaders: Record<string, string>) {
  validateInput(body);

  const { exam, totalScore, subjectScores = {} } = body;

  const models = await loadModels(exam);

  const maxMarks = models.overall.exam_config.max_marks;
  const totalCandidates = models.overall.exam_config.total_candidates;

  // === PREDICTIONS ===
  const overallRank = predictOverallRank(
    totalScore,
    maxMarks,
    totalCandidates,
    exam
  );

  // Dynamic Subject Rank Prediction
  const subjectRanksArray: Record<string, any> = {};

  for (const subject in models.subject) {
    const score = subjectScores[subject];

    if (score !== undefined) {
      const subjectRank = predictSubjectRank(
        score,
        models.subject[subject].max_score,
        overallRank,
        totalCandidates
      );
      subjectRanksArray[subject] = {
        rank: subjectRank,
        score: score,
        max_score: models.subject[subject].max_score
      };
    } else {
      subjectRanksArray[subject] = null;
    }
  }

  // === PROBABILITY DISTRIBUTION ===
  const probabilityDist = generateProbabilityDistribution(overallRank, totalCandidates);

  // === TRAJECTORY PROJECTION ===
  const trajectoryProj = generateFullTrajectory(body, overallRank, models.trajectory, totalCandidates);

  // === WHAT-IF SCENARIOS ===
  const scenarios = generateWhatIfScenarios(body, overallRank, models);

  // === MODEL METADATA ===
  const modelMetadata = {
    model_accuracy: models.overall.metrics?.test_r2 || 0.85,
    confidence_level: `High (R² = ${(models.overall.metrics?.test_r2 || 0.85).toFixed(2)})`,
    prediction_timestamp: new Date().toISOString(),
    exam_name: models.overall.exam || exam
  };

  // === BUILD V2 RESPONSE ===
  return new Response(
    JSON.stringify({
      exam,
      overall_prediction: {
        predicted_rank: overallRank,
        confidence_68: [
          probabilityDist.ranges.find(r => r.probability === 68)?.min_rank || 1,
          probabilityDist.ranges.find(r => r.probability === 68)?.max_rank || totalCandidates
        ],
        confidence_95: [
          probabilityDist.ranges.find(r => r.probability === 95)?.min_rank || 1,
          probabilityDist.ranges.find(r => r.probability === 95)?.max_rank || totalCandidates
        ],
        percentile: probabilityDist.percentile
      },
      subject_predictions: subjectRanksArray,
      probability_distribution: {
        ranges: probabilityDist.ranges
      },
      trajectory: trajectoryProj,
      what_if_scenarios: scenarios,
      model_metadata: modelMetadata
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

export default {
  async fetch(request: Request) {
    const corsHeaders = getCorsHeaders();

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    try {
      const body = await request.json();

      if (url.pathname === "/v1/predict") {
        return await handleV1Predict(body, corsHeaders);
      } else if (url.pathname === "/v2/predict") {
        return await handleV2Predict(body, corsHeaders);
      } else {
        return new Response(
          JSON.stringify({
            error: "Endpoint not found. Use /v1/predict or /v2/predict"
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: err.message || "Internal Server Error"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }
  }
};