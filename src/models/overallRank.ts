/**
 * Piecewise Linear Interpolation for Rank Prediction
 *
 * Uses isotonic regression calibration points to ensure monotonic, smooth rank predictions.
 * Fitted from 98,650+ qualified student records for each exam.
 *
 * Metrics:
 * - AP_MPC: R² = 0.665, MAE = 1.32% of rank range (accurate for broad trends)
 * - TG_MPC: R² = 1.000, MAE = 0.003% (essentially perfect fit)
 * - TG_BiPC: R² = 0.9998, MAE = 0.008% (essentially perfect fit)
 */

interface CalibrationPoint {
  score: number;
  rank: number;
}

function interpolateLinear(
  calibrationPoints: CalibrationPoint[],
  score: number,
  minRank: number,
  maxRank: number
): number {
  // Find the two surrounding points for linear interpolation
  let lower: CalibrationPoint | null = null;
  let upper: CalibrationPoint | null = null;

  for (const point of calibrationPoints) {
    if (point.score <= score) {
      if (!lower || point.score > lower.score) {
        lower = point;
      }
    }
    if (point.score >= score) {
      if (!upper || point.score < upper.score) {
        upper = point;
      }
    }
  }

  // Exact match
  if (lower && lower.score === score) {
    return Math.round(Math.max(minRank, Math.min(maxRank, lower.rank)));
  }

  // Extrapolation: below minimum
  if (!lower) {
    return Math.round(Math.max(minRank, Math.min(maxRank, upper!.rank)));
  }

  // Extrapolation: above maximum
  if (!upper) {
    return Math.round(Math.max(minRank, Math.min(maxRank, lower.rank)));
  }

  // Linear interpolation between lower and upper
  const t = (score - lower.score) / (upper.score - lower.score);
  const interpolatedRank = lower.rank + t * (upper.rank - lower.rank);

  return Math.round(Math.max(minRank, Math.min(maxRank, interpolatedRank)));
}


import tgMpcModel from "../metadata/tg_mpc/poly_model.json";
import tgBipcModel from "../metadata/tg_bipc/poly_model.json";
import apMpcModel from "../metadata/ap_mpc/poly_model.json";

export function predictOverallRank(exam: string, score: number) {
  switch (exam.toLowerCase()) {
    case "tg_mpc": {
      const points = (tgMpcModel.calibration_points as any).map((p: any) => ({
        score: p[0],
        rank: p[1]
      }));
      return interpolateLinear(points, score, tgMpcModel.rank_min || 1, tgMpcModel.rank_max);
    }

    case "tg_bipc": {
      const points = (tgBipcModel.calibration_points as any).map((p: any) => ({
        score: p[0],
        rank: p[1]
      }));
      return interpolateLinear(points, score, tgBipcModel.rank_min || 1, tgBipcModel.rank_max);
    }

    case "ap_mpc": {
      const points = (apMpcModel.calibration_points as any).map((p: any) => ({
        score: p[0],
        rank: p[1]
      }));
      return interpolateLinear(points, score, apMpcModel.rank_min || 1, apMpcModel.rank_max);
    }

    default:
      throw new Error(`Unsupported exam type: ${exam}`);
  }
}
