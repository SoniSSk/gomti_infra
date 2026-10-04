import {
  LOADED_MINING_STATUSES,
  computeActualWeight,
  needsMiningReason,
  type MiningInput,
  type MiningObject,
} from "@/app/types/mining";

/*
 * Turns a validated add / edit body into the stored fields: trims
 * text, stores dates as Dates, computes actualWeight, and stamps
 * loadedAt / unloadedAt the first time a trip reaches that stage.
 * New files are stamped with this user; existing ones keep theirs.
 * Run validateMining() first.
 *
 * Cleared optional fields come back as undefined so the caller can
 * leave them out (create) or $unset them (edit).
 */

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;

  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toWeight = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export const buildMiningFields = (
  input: MiningInput,
  userName: string,
  now: Date,
  existing?: Partial<MiningObject>,
) => {
  const status = input.status;

  const emptyWeight = toWeight(input.emptyWeight);
  const loadedWeight = toWeight(input.loadedWeight);

  // Entered times win; otherwise keep the stored one, else stamp now
  let loadedAt = toDate(input.loadedAt);
  let unloadedAt = toDate(input.unloadedAt);

  if (LOADED_MINING_STATUSES.includes(status)) {
    loadedAt ??= toDate(existing?.loadedAt) ?? now;
  }

  if (status === "UNLOADING") {
    unloadedAt ??= toDate(existing?.unloadedAt) ?? now;
  }

  // Files already on the trip keep their uploader; new ones get this user
  const previous = new Map(
    (existing?.files ?? []).map((file) => [file.url, file]),
  );

  const urls = [...new Set((input.files ?? []).map(text).filter(Boolean))];

  const files = urls.map(
    (url) => previous.get(url) ?? { url, uploadedBy: userName, uploadedAt: now },
  );

  // A re-sent slip keeps its uploader; a new one gets this user
  const slipUrl = text(input.weightSlip);
  const weightSlip = !slipUrl
    ? undefined
    : existing?.weightSlip?.url === slipUrl
      ? existing.weightSlip
      : { url: slipUrl, uploadedBy: userName, uploadedAt: now };

  return {
    status,
    cancelReason: needsMiningReason(status) ? text(input.cancelReason) : undefined,
    vehicleNo: text(input.vehicleNo).toUpperCase(),
    miningType: text(input.miningType),
    lot: text(input.lot).toUpperCase() || undefined,
    size: text(input.size),
    loadingPoint: text(input.loadingPoint),
    loadingPerson: text(input.loadingPerson),
    loadedAt,
    unloadingPoint: text(input.unloadingPoint),
    unloadingPerson: text(input.unloadingPerson) || undefined,
    unloadedAt,
    emptyWeight,
    loadedWeight,
    actualWeight: computeActualWeight(emptyWeight, loadedWeight),
    weightSlip,
    files: files.length ? files : undefined,
  };
};

export type MiningFields = ReturnType<typeof buildMiningFields>;
