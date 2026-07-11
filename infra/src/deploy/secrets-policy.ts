export const SECRET_VALUE_PATTERN =
  /(?:^|[\s"'`=:])(?:(?:sk|pk)(?=[-_0-9])|ghp|gho|ghu|ghs|ghr|dp\.st|napi_|pplx-|ctx7sk-)[-_a-zA-Z0-9./+=]{8,}/u;

const LEGACY_ALLOWED_CONFIG_KEYS = new Set(["manager", "projectId", "projectLabel", "profiles"]);
const V1_ALLOWED_CONFIG_KEYS = new Set([
  "schemaVersion",
  "providers",
  "profiles",
  "sinks",
  "projectLabel",
]);
const FORBIDDEN_CONFIG_KEY =
  /(?:^|_)(?:token|secret|password|api[_-]?key|credential|private[_-]?key)(?:$|_)/iu;
const PROJECT_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,62}$/u;

export type SecretsConfigMetadata = {
  manager: "doppler" | "infisical";
  projectId: string;
  projectLabel?: string;
  profiles?: Record<string, { environment: string }>;
};

function requireRecord(value: unknown, sourceLabel: string, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${sourceLabel}: "${name}" must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertAllowedTopLevelKeys(
  obj: Record<string, unknown>,
  allowedKeys: Set<string>,
  sourceLabel: string,
): void {
  for (const key of Object.keys(obj)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`${sourceLabel}: unexpected key "${key}"`);
    }
    if (FORBIDDEN_CONFIG_KEY.test(key)) {
      throw new Error(`${sourceLabel}: key "${key}" looks like a secret name`);
    }
  }
}

function parseProjectLabel(value: unknown, sourceLabel: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${sourceLabel}: "projectLabel" must be a non-empty string when set`);
  }
  if (SECRET_VALUE_PATTERN.test(value)) {
    throw new Error(`${sourceLabel} projectLabel must not contain secret values`);
  }
  return value;
}

function parseProfiles(
  value: unknown,
  sourceLabel: string,
): Record<string, { environment: string }> | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${sourceLabel}: "profiles" must be an object when set`);
  }
  const profiles: Record<string, { environment: string }> = {};
  for (const [profileName, profileValue] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_CONFIG_KEY.test(profileName)) {
      throw new Error(`${sourceLabel}: profile name "${profileName}" looks like a secret name`);
    }
    if (typeof profileValue !== "object" || profileValue === null || Array.isArray(profileValue)) {
      throw new Error(`${sourceLabel}: profile "${profileName}" must be an object`);
    }
    const environment = (profileValue as Record<string, unknown>).environment;
    if (typeof environment !== "string" || environment.length === 0) {
      throw new Error(`${sourceLabel}: profile "${profileName}" must set a non-empty environment`);
    }
    if (SECRET_VALUE_PATTERN.test(environment)) {
      throw new Error(
        `${sourceLabel}: profile "${profileName}" environment must not contain secret values`,
      );
    }
    profiles[profileName] = { environment };
  }
  return profiles;
}

function assertProjectSlug(project: string, sourceLabel: string, path: string): void {
  if (!PROJECT_ID_PATTERN.test(project)) {
    throw new Error(`${sourceLabel}: "${path}" must be a valid project slug`);
  }
}

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
  if (obj.schemaVersion === 1) {
    assertAllowedTopLevelKeys(obj, V1_ALLOWED_CONFIG_KEYS, sourceLabel);

    const providers = requireRecord(obj.providers, sourceLabel, "providers");
    const defaultProvider = requireRecord(providers.default, sourceLabel, "providers.default");
    const providerType = defaultProvider.type;
    if (providerType !== "doppler" && providerType !== "infisical") {
      throw new Error(`${sourceLabel}: "providers.default.type" must be "doppler" or "infisical"`);
    }

    const project = defaultProvider.project;
    if (typeof project !== "string" || project.length === 0) {
      throw new Error(`${sourceLabel}: "providers.default.project" must be a non-empty string`);
    }
    assertProjectSlug(project, sourceLabel, "providers.default.project");

    const config: SecretsConfigMetadata = { manager: providerType, projectId: project };
    const projectLabel = parseProjectLabel(obj.projectLabel, sourceLabel);
    if (projectLabel !== undefined) config.projectLabel = projectLabel;
    const profiles = parseProfiles(obj.profiles, sourceLabel);
    if (profiles !== undefined) config.profiles = profiles;
    return config;
  }

  assertAllowedTopLevelKeys(obj, LEGACY_ALLOWED_CONFIG_KEYS, sourceLabel);

  const manager = obj.manager;
  if (manager !== "doppler" && manager !== "infisical") {
    throw new Error(`${sourceLabel}: "manager" must be "doppler" or "infisical"`);
  }
  const projectId = obj.projectId;
  if (typeof projectId !== "string" || projectId.length === 0) {
    throw new Error(`${sourceLabel}: "projectId" must be a non-empty string`);
  }
  assertProjectSlug(projectId, sourceLabel, "projectId");

  const config: SecretsConfigMetadata = { manager, projectId };
  const projectLabel = parseProjectLabel(obj.projectLabel, sourceLabel);
  if (projectLabel !== undefined) config.projectLabel = projectLabel;
  const profiles = parseProfiles(obj.profiles, sourceLabel);
  if (profiles !== undefined) config.profiles = profiles;
  return config;
}
