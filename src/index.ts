import { loadModels } from "./models/modelLoader";
import { predictOverallRank } from "./models/overallRank";
import { predictSubjectRank } from "./models/subjectRank";
import { predictTrajectoryScore } from "./models/trajectory";

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

    if (url.pathname !== "/v1/predict") {
      return new Response("Not Found", { 
        status: 404,
        headers: corsHeaders
      });
    }

    try {
        const body = await request.json();
        validateInput(body);

        const { exam, totalScore, subjectScores = {} } = body;

        const models = await loadModels(exam);

        const maxMarks = models.overall.exam_config.max_marks;
        const totalCandidates = models.overall.exam_config.total_candidates;

        const overallRank = predictOverallRank(
        totalScore,
        maxMarks,
        totalCandidates
        );

        // 🔥 Dynamic Subject Rank Prediction
        const subjectRanks: Record<string, number | null> = {};

        for (const subject in models.subject) {

        const score = subjectScores[subject];

        if (score !== undefined) {
            subjectRanks[subject] = predictSubjectRank(
            score,
            models.subject[subject].max_score,
            totalCandidates
            );
        } else {
            subjectRanks[subject] = null;
        }
        }

    const expectedScoreGain = predictTrajectoryScore(body, models.trajectory);

    const projectedScore = totalScore + expectedScoreGain;

    const projectedRank = predictOverallRank(
    projectedScore,
    maxMarks,
    totalCandidates
    );

    const rankImprovement = overallRank - projectedRank;

      return new Response(
        JSON.stringify({
          version: "v1",
          exam,
          overall_rank: overallRank,
          subject_ranks: subjectRanks,
          monthly_improvement_prediction: {
            expected_score_gain_next_month: expectedScoreGain,
            projected_rank_next_month: projectedRank,
            rank_improvement: rankImprovement
          }
        }),
        {
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );

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