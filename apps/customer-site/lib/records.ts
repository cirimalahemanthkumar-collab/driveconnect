export type ApiRecord = Record<string, unknown>;

export function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ApiRecord : {};
}

export function asList(value: unknown, preferredKeys: string[] = []): ApiRecord[] {
  if (Array.isArray(value)) return value.map(asRecord);

  const record = asRecord(value);
  for (const key of preferredKeys) {
    if (Array.isArray(record[key])) return (record[key] as unknown[]).map(asRecord);
  }

  const firstArray = Object.values(record).find(Array.isArray);
  return Array.isArray(firstArray) ? firstArray.map(asRecord) : [];
}

export function text(record: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "-";
}

export function nestedText(record: ApiRecord, objectKey: string, ...keys: string[]) {
  return text(asRecord(record[objectKey]), ...keys);
}

export function numberValue(record: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

export function money(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Rs 0";
  return `Rs ${amount.toLocaleString("en-IN")}`;
}

export function dateText(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-IN");
}

