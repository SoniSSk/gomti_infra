/*
 * Mining module: one trip per record, from the loading point to the
 * unloading point. Actual weight is always loaded - empty, computed
 * here and never taken from the client.
 */

/* =========================
   ENUMS
========================= */

export type MiningStatus =
  | "EMPTY_WEIGHT"
  | "LOADING"
  | "LOADED_WEIGHT"
  | "IN_TRANSIT"
  | "UNLOADING"
  | "CANCELLED"
  | "ON_HOLD";

export const MINING_STATUSES: MiningStatus[] = [
  "EMPTY_WEIGHT",
  "LOADING",
  "LOADED_WEIGHT",
  "IN_TRANSIT",
  "UNLOADING",
  "CANCELLED",
  "ON_HOLD",
];

/** Trips not yet unloaded or cancelled stay visible on every date filter. */
export const OPEN_MINING_STATUSES: MiningStatus[] = [
  "EMPTY_WEIGHT",
  "LOADING",
  "LOADED_WEIGHT",
  "IN_TRANSIT",
  "ON_HOLD",
];

/** Statuses that need a reason, kept in `cancelReason`. */
export const REASON_MINING_STATUSES: MiningStatus[] = ["CANCELLED", "ON_HOLD"];

export const needsMiningReason = (status?: string) =>
  REASON_MINING_STATUSES.includes(status as MiningStatus);

/** Statuses reached only once the truck has been weighed loaded. */
export const LOADED_MINING_STATUSES: MiningStatus[] = [
  "LOADED_WEIGHT",
  "IN_TRANSIT",
  "UNLOADING",
];

/** Fields whose requirement depends on the status. */
export type MiningRequiredField =
  | "vehicleNo"
  | "miningType"
  | "emptyWeight"
  | "loadingPoint"
  | "loadingPerson"
  | "loadedWeight"
  | "unloadingPoint"
  | "unloadingPerson"
  | "unloadedAt";

/** Needed on every trip, whatever the status. Lot and size never are. */
const ALWAYS_REQUIRED: MiningRequiredField[] = ["vehicleNo"];

/*
 * Each stage needs what the stages before it did, plus its own.
 * Cancelled / on hold trips only need their reason.
 */
const EMPTY_STAGE: MiningRequiredField[] = ["emptyWeight"];
/* The type of mining is decided at loading, so it isn't needed before. */
const LOADING_STAGE: MiningRequiredField[] = [
  ...EMPTY_STAGE,
  "miningType",
  "loadingPoint",
  "loadingPerson",
];
const LOADED_STAGE: MiningRequiredField[] = [...LOADING_STAGE, "loadedWeight"];
const TRANSIT_STAGE: MiningRequiredField[] = [...LOADED_STAGE, "unloadingPoint"];
const UNLOADING_STAGE: MiningRequiredField[] = [...TRANSIT_STAGE, "unloadingPerson", "unloadedAt"];

export const MINING_REQUIRED_BY_STATUS: Record<MiningStatus, MiningRequiredField[]> = {
  EMPTY_WEIGHT: EMPTY_STAGE,
  LOADING: LOADING_STAGE,
  LOADED_WEIGHT: LOADED_STAGE,
  IN_TRANSIT: TRANSIT_STAGE,
  UNLOADING: UNLOADING_STAGE,
  CANCELLED: [],
  ON_HOLD: [],
};

const MINING_FIELD_LABELS: Record<MiningRequiredField, string> = {
  vehicleNo: "Vehicle no",
  miningType: "Type of mining",
  emptyWeight: "Empty weight",
  loadingPoint: "Loading point",
  loadingPerson: "Loading person",
  loadedWeight: "Loaded weight",
  unloadingPoint: "Unloading point",
  unloadingPerson: "Unloading person",
  unloadedAt: "Unloaded at",
};

/** Whether a field must be filled for the given status. */
export const isMiningFieldRequired = (field: string, status?: string) =>
  ALWAYS_REQUIRED.includes(field as MiningRequiredField) ||
  (MINING_REQUIRED_BY_STATUS[status as MiningStatus] ?? []).includes(
    field as MiningRequiredField,
  );

export const miningReasonLabel = (status?: string) =>
  status === "ON_HOLD" ? "Hold reason" : "Cancellation reason";

/*
 * Types of mining, as operation + material, from the columns of the
 * daily production report. Stored as "OPERATION - MATERIAL".
 */
export const MINING_TYPE_GROUPS = [
  { operation: "BREAKER", materials: ["ROM", "BHQ", "OB"] },
  { operation: "BLASTING", materials: ["ROM", "BHQ", "OB"] },
  { operation: "BUCKET", materials: ["ROM", "BHQ", "OB"] },
  { operation: "SHIFTING", materials: ["FINES", "14*38", "LUMPS"] },
  {
    operation: "TRANSPORTING",
    materials: [
      "FINES 0*10",
      "LUMPS 14*38",
      "LUMPS",
      "LUMPS 9*14",
      "LUMPS 14*28",
      "ROM",
      "BHQ",
      "OB",
      "Oversize",
    ],
  },
] as const;

export const formatMiningType = (operation: string, material: string) =>
  `${operation} - ${material}`;

export const MINING_TYPES: string[] = MINING_TYPE_GROUPS.flatMap(
  ({ operation, materials }) =>
    materials.map((material) => formatMiningType(operation, material)),
);

/** Unit every weight is entered and shown in. */
export const WEIGHT_UNIT = "MT";

/* =========================
   RECORD
========================= */

export interface MiningFieldUpdate {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  updatedBy: string;
  updatedAt: Date | string;
}

export interface MiningFile {
  url: string;
  uploadedBy?: string;
  uploadedAt?: Date | string;
}

/** Most files one trip can hold. */
export const MAX_MINING_FILES = 20;

export interface MiningObject {
  id: string;
  sno: number;

  status: MiningStatus;
  /** Required while status is CANCELLED or ON_HOLD. */
  cancelReason?: string;

  /* Trip */
  vehicleNo: string;
  miningType: string;
  lot?: string;
  size?: string;

  /* Loading */
  loadingPoint?: string;
  loadingPerson?: string;
  /** Stamped once the trip is weighed loaded, if not entered. */
  loadedAt?: Date | string;

  /* Unloading */
  unloadingPoint?: string;
  unloadingPerson?: string;
  /** Stamped when the trip is marked UNLOADING, if not entered. */
  unloadedAt?: Date | string;

  /* Weights */
  emptyWeight?: number;
  loadedWeight?: number;
  /** loadedWeight - emptyWeight; set only when both are present. */
  actualWeight?: number;
  /** Required whenever loadedWeight is set. */
  weightSlip?: MiningFile;

  /* Files: weight slips, photos, challans... */
  files?: MiningFile[];

  /* Tracking */
  createdAt: Date | string;
  createdBy: string;
  updatedAt?: Date | string;
  updatedBy?: string;
  updateHistory: MiningFieldUpdate[];
}

/** What the add / edit form sends; the server fills the rest. */
export type MiningInput = Pick<
  MiningObject,
  | "status"
  | "cancelReason"
  | "vehicleNo"
  | "miningType"
  | "lot"
  | "size"
  | "loadingPoint"
  | "loadingPerson"
  | "loadedAt"
  | "unloadingPoint"
  | "unloadingPerson"
  | "unloadedAt"
  | "emptyWeight"
  | "loadedWeight"
> & {
  /** Uploaded weight slip URL; required with a loaded weight. */
  weightSlip?: string;
  /** Uploaded file URLs, in display order. */
  files?: string[];
};

/* =========================
   WEIGHT
========================= */

const isWeight = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/*
 * loaded - empty, rounded to 3 decimals so 12.3 - 10.1 isn't
 * 2.2000000000000006. Never negative: validateMining() rejects
 * loaded < empty, and this clamps as a second guard.
 */
export const computeActualWeight = (
  emptyWeight?: number | null,
  loadedWeight?: number | null,
): number | undefined => {
  if (!isWeight(emptyWeight) || !isWeight(loadedWeight)) return undefined;

  return Math.max(0, Math.round((loadedWeight - emptyWeight) * 1000) / 1000);
};

/* =========================
   VALIDATION

   Shared by the form and the API, so both enforce the same rules.
   Returns the first problem, or null when the input is valid.
========================= */

const filled = (value: unknown): boolean =>
  typeof value === "string" && value.trim() !== "";

export const validateMining = (
  input: Partial<MiningInput> | null | undefined,
): string | null => {
  if (!input) return "Missing trip details";

  if (!MINING_STATUSES.includes(input.status as MiningStatus)) {
    return "Select a valid status";
  }

  if (needsMiningReason(input.status) && !filled(input.cancelReason)) {
    return `${miningReasonLabel(input.status)} is required`;
  }

  for (const [key, label] of [
    ["emptyWeight", "Empty weight"],
    ["loadedWeight", "Loaded weight"],
  ] as const) {
    const value = input[key];
    if (value !== undefined && value !== null && !isWeight(value)) {
      return `${label} must be a number of 0 or more`;
    }
  }

  const missing = [
    ...ALWAYS_REQUIRED,
    ...MINING_REQUIRED_BY_STATUS[input.status as MiningStatus],
  ].find((key) =>
    key === "emptyWeight" || key === "loadedWeight"
      ? !isWeight(input[key])
      : !filled(input[key]),
  );
  if (missing) return `${MINING_FIELD_LABELS[missing]} is required`;

  if (
    isWeight(input.emptyWeight) &&
    isWeight(input.loadedWeight) &&
    input.loadedWeight < input.emptyWeight
  ) {
    return "Loaded weight can't be less than empty weight";
  }

  if (input.weightSlip !== undefined && typeof input.weightSlip !== "string") {
    return "Invalid weight slip";
  }

  if (isWeight(input.loadedWeight) && !filled(input.weightSlip)) {
    return "Upload the weight slip for the loaded weight";
  }

  for (const [key, label] of [
    ["loadedAt", "Loaded at"],
    ["unloadedAt", "Unloaded at"],
  ] as const) {
    const value = input[key];
    if (value && Number.isNaN(new Date(value).getTime())) {
      return `${label} is not a valid date`;
    }
  }

  const files = input.files;
  if (files !== undefined) {
    if (!Array.isArray(files) || files.some((url) => !filled(url))) {
      return "Invalid files";
    }

    if (files.length > MAX_MINING_FILES) {
      return `At most ${MAX_MINING_FILES} files per trip`;
    }
  }

  if (
    input.loadedAt &&
    input.unloadedAt &&
    new Date(input.unloadedAt) < new Date(input.loadedAt)
  ) {
    return "Unloaded at can't be before loaded at";
  }

  return null;
};
