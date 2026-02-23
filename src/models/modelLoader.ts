// TG BIPC
import tg_bipc_overall from "../metadata/tg_bipc/overall_rank_model_metadata.json";
import tg_bipc_subject from "../metadata/tg_bipc/subject_rank_models_metadata.json";
import tg_bipc_trajectory from "../metadata/tg_bipc/trajectory_model_metadata.json";

// AP MPC
import ap_mpc_overall from "../metadata/ap_mpc/overall_rank_model_metadata.json";
import ap_mpc_subject from "../metadata/ap_mpc/subject_rank_models_metadata.json";
import ap_mpc_trajectory from "../metadata/ap_mpc/trajectory_model_metadata.json";

// AP BIPC
import ap_bipc_overall from "../metadata/ap_bipc/overall_rank_model_metadata.json";
import ap_bipc_subject from "../metadata/ap_bipc/subject_rank_models_metadata.json";
import ap_bipc_trajectory from "../metadata/ap_bipc/trajectory_model_metadata.json";

const MODEL_MAP: Record<string, any> = {
  tg_bipc: {
    overall: tg_bipc_overall,
    subject: tg_bipc_subject,
    trajectory: tg_bipc_trajectory,
  },
  ap_mpc: {
    overall: ap_mpc_overall,
    subject: ap_mpc_subject,
    trajectory: ap_mpc_trajectory,
  },
  ap_bipc: {
    overall: ap_bipc_overall,
    subject: ap_bipc_subject,
    trajectory: ap_bipc_trajectory,
  },
};

export function loadModels(examKey: string) {
  const models = MODEL_MAP[examKey];

  if (!models) {
    throw new Error("Invalid or unsupported exam type");
  }

  return models;
}