export type CloudflareDnsRecord = {
  readonly id?: string;
  readonly type: string;
  readonly name: string;
  readonly content?: string;
  readonly proxied?: boolean | null;
};

type CloudflareDnsListResponse = {
  readonly success: boolean;
  readonly errors?: ReadonlyArray<{ readonly message?: string }>;
  readonly result?: ReadonlyArray<CloudflareDnsRecord>;
};

export function buildCloudflareDnsRecordsUrl(zoneId: string, hostname: string): string {
  const params = new URLSearchParams({ name: hostname, type: "CNAME", per_page: "100" });
  return `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?${params.toString()}`;
}

export function getConflictingCustomDomainCnameRecords(
  hostname: string,
  records: ReadonlyArray<CloudflareDnsRecord>,
): CloudflareDnsRecord[] {
  const normalizedHost = hostname.toLowerCase();
  return records.filter(
    (record) =>
      record.type === "CNAME" &&
      record.name.toLowerCase() === normalizedHost &&
      !isCloudflareManagedCustomDomainRecord(record),
  );
}

function isCloudflareManagedCustomDomainRecord(record: CloudflareDnsRecord): boolean {
  return record.proxied === true && (record.content ?? "").toLowerCase().endsWith(".cdn.cloudflare.net");
}

export async function assertNoConflictingCustomDomainCname(options: {
  readonly hostname: string;
  readonly zoneId: string;
  readonly apiToken: string;
  readonly fetchImpl?: typeof fetch;
}): Promise<void> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(buildCloudflareDnsRecordsUrl(options.zoneId, options.hostname), {
    headers: {
      Authorization: `Bearer ${options.apiToken}`,
      "content-type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Cloudflare DNS preflight failed for ${options.hostname}: API returned ${response.status}`,
    );
  }

  const payload = (await response.json()) as CloudflareDnsListResponse;
  if (!payload.success) {
    const message =
      payload.errors?.map((entry) => entry.message).filter(Boolean).join("; ") ||
      "unknown Cloudflare DNS API failure";
    throw new Error(`Cloudflare DNS preflight failed for ${options.hostname}: ${message}`);
  }

  const conflicts = getConflictingCustomDomainCnameRecords(options.hostname, payload.result ?? []);
  if (conflicts.length === 0) return;

  const renderedConflicts = conflicts
    .map((record) => `${record.name} -> ${record.content ?? "<unknown target>"}`)
    .join(", ");

  throw new Error(
    `Custom-domain preflight blocked ${options.hostname}: remove conflicting CNAME record(s) before deploy (${renderedConflicts}).`,
  );
}
