export type CanonicalDeployLane = "prd" | "preview_main" | `preview_pr_${number}`;

export type PreviewLane = "preview-main" | `preview-pr-${number}`;

export type PreviewLaneSpec = {
  readonly lane: PreviewLane;
  readonly workerName: string;
  readonly hostname: string;
  readonly url: string;
};

const PREVIEW_PR_PATTERN = /^preview-pr-(\d+)$/u;
const CANONICAL_PREVIEW_PR_PATTERN = /^preview_pr_(\d+)$/u;
const PREVIEW_DOMAIN = "ozby.dev";
const TOP_LEVEL_WORKER_NAME = "ozby-dev";

export function canonicalPreviewLaneToDashed(lane: CanonicalDeployLane): PreviewLane | null {
  if (lane === "preview_main") return "preview-main";
  const match = CANONICAL_PREVIEW_PR_PATTERN.exec(lane);
  if (match) return `preview-pr-${Number(match[1])}`;
  return null;
}

export function resolvePreviewLane(rawLane: string): PreviewLaneSpec {
  if (rawLane === "preview-main") {
    return {
      lane: "preview-main",
      workerName: `${TOP_LEVEL_WORKER_NAME}-preview-main`,
      hostname: "preview-main.ozby.dev",
      url: "https://preview-main.ozby.dev",
    };
  }

  const prMatch = PREVIEW_PR_PATTERN.exec(rawLane);
  if (!prMatch) {
    throw new Error(`Preview lane must be preview-main or preview-pr-<n>; got "${rawLane}"`);
  }

  const prNumber = Number(prMatch[1]);
  return {
    lane: `preview-pr-${prNumber}`,
    workerName: `${TOP_LEVEL_WORKER_NAME}-preview-pr-${prNumber}`,
    hostname: `preview-pr-${prNumber}.${PREVIEW_DOMAIN}`,
    url: `https://preview-pr-${prNumber}.${PREVIEW_DOMAIN}`,
  };
}
