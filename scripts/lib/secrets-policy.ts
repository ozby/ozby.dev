export const SECRETS_CONFIG_PATH = ".webpresso/secrets.config.json";

export const SECRET_VALUE_PATTERN =
  /(?:^|[\s"'`=:])(?:(?:sk|pk)(?=[-_0-9])|ghp|gho|ghu|ghs|ghr|dp\.st|napi_|pplx-|ctx7sk-)[-_a-zA-Z0-9./+=]{8,}/u;

const ALLOWED_CONFIG_KEYS = new Set(["manager", "projectId", "projectLabel"]);
const FORBIDDEN_CONFIG_KEY =
  /(?:^|_)(?:token|secret|password|api[_-]?key|credential|private[_-]?key)(?:$|_)/iu;
const PROJECT_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,62}$/u;

export type SecretsConfigMetadata = {
  manager: "doppler" | "infisical";
  projectId: string;
  projectLabel?: string;
};

export function parseSecretsConfigMetadata(
  raw: string,
  sourceLabel: string,
): SecretsConfigMetadata {
  if (SECRET_VALUE_PATTERN.test(raw)) {
    throw new Error(`${sourceLabel} must not contain secret values`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${sourceLabel}: ${detail}`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${sourceLabel} must be a JSON object`);
  }

  const obj = parsed as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_CONFIG_KEYS.has(key)) {
      throw new Error(`${sourceLabel}: unexpected key "${key}"`);
    }
    if (FORBIDDEN_CONFIG_KEY.test(key)) {
      throw new Error(`${sourceLabel}: key "${key}" looks like a secret name`);
    }
  }

  if (obj.manager !== "doppler" && obj.manager !== "infisical") {
    throw new Error(`${sourceLabel}: "manager" must be "doppler" or "infisical"`);
  }
  if (typeof obj.projectId !== "string" || obj.projectId.length === 0) {
    throw new Error(`${sourceLabel}: "projectId" must be a non-empty string`);
  }
  if (!PROJECT_ID_PATTERN.test(obj.projectId)) {
    throw new Error(`${sourceLabel}: "projectId" must be a valid project slug`);
  }

  const config: SecretsConfigMetadata = { manager: obj.manager, projectId: obj.projectId };
  if (obj.projectLabel !== undefined) {
    if (typeof obj.projectLabel !== "string" || obj.projectLabel.length === 0) {
      throw new Error(`${sourceLabel}: "projectLabel" must be a non-empty string when set`);
    }
    if (SECRET_VALUE_PATTERN.test(obj.projectLabel)) {
      throw new Error(`${sourceLabel} projectLabel must not contain secret values`);
    }
    config.projectLabel = obj.projectLabel;
  }
  return config;
}
