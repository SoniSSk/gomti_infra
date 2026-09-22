export const MINING_TYPES = [
  "OB-BY-BUCKET",
  "OB-BY-BREAKER",
  "BHQ-BY-BREAKER",
  "BHQ-BY-BUCKET",
  "BHQ-BY-BLASTING",
  "IRON-ORE-BY-BLASTING",
  "IRON-ORE-BY-BREAKER",
  "IRON-ORE-BY-BUCKET",
] as const;

export const SCREENING_TYPES = [
  "0-9 MM",
  "0-14 MM",
  "14-22 MM",
  "22-38 MM",
  "10-40 MM",
  "14-38 MM",
] as const;

export const CRUSHING_TYPES = [
  "0-6 MM",
  "0-10 MM",
  "0-14 MM",
  "10-40 MM",
] as const;

export const SHIFTING_TYPES = [
  "TRANSPORT ONLY",
  "LOADING AND TRANSPORT",
] as const;

/* =========================================================
   TYPES
========================================================= */

export type MiningType = (typeof MINING_TYPES)[number];

export type ScreeningType = (typeof SCREENING_TYPES)[number];

export type CrushingType = (typeof CRUSHING_TYPES)[number];

export type ShiftingType = (typeof SHIFTING_TYPES)[number];

export type WeighbridgeType = "MINING" | "SCREENING" | "CRUSHING" | "SHIFTING";

/* =========================================================
   WEIGHBRIDGE STATUS
========================================================= */

export type WeighbridgeStatus =
  | "VEHICLE_CREATED"
  | "WAITING_FOR_WEIGHMENT"
  | "WEIGHMENT_STARTED"
  | "WEIGHMENT_DONE"
  | "WAITING_FOR_LOADING"
  | "LOADING_STARTED"
  | "LOADING_DONE"
  | "WAITING_FOR_UNLOADING"
  | "UNLOADING_STARTED"
  | "UNLOADING_DONE"
  | "WEIGHBRIDGE_OUT"
  | "DISPATCH_DONE"
  | "CANCELLED";

/* =========================================================
   MAIN WEIGHBRIDGE TYPE
========================================================= */

export interface Weighbridge {
  /* =======================================================
     DATABASE
  ======================================================= */

  _id?: string;

  sno?: number;

  /* =======================================================
     VEHICLE
  ======================================================= */

  vehicleNo: string;

  driverName?: string;

  /* =======================================================
     ACTIVITY TYPE
     
     type = MINING / SCREENING / CRUSHING / SHIFTING
     
     activityType values depend on type.
  ======================================================= */

  type?: WeighbridgeType;

  activityType?: MiningType | ScreeningType | CrushingType | ShiftingType;

  /* =======================================================
     WEIGHT
  ======================================================= */

  netWeight?: string;

  /* =======================================================
     TIME
  ======================================================= */

  weighbridgeInTime?: string;

  loadTime?: string;

  unloadTime?: string;

  weighbridgeOutTime?: string;

  /* =======================================================
     POINTS
  ======================================================= */

  loadingPoint?: string;

  unloadingPointName?: string;

  /* =======================================================
     DOCUMENTS
  ======================================================= */

  documents?: {
    image1?: string;

    image2?: string;

    image3?: string;

    weightSlip?: string;

    loadingImage?: string;

    loadingVideo?: string;

    unloadingImage?: string;

    unloadingVideo?: string;

    otherDocument?: string;
  };

  /* =======================================================
     LOCATION
  ======================================================= */

  location?: {
    latitude?: number;

    longitude?: number;

    address?: string;

    speed?: number;

    heading?: number;

    accuracy?: number;

    timestamp?: string;
  };

  /* =======================================================
     CREATED BY
  ======================================================= */

  createdBy?: {
    id?: string;

    name: string;

    email?: string;

    role?: string;
  };

  /* =======================================================
     UPDATED BY
  ======================================================= */

  updatedBy?: {
    id?: string;

    name: string;

    email?: string;

    role?: string;
  };

  /* =======================================================
     TRACKING / AUDIT LOG
  ======================================================= */

  tracking?: {
    action:
      | "VEHICLE_CREATED"
      | "DETAILS_UPDATED"
      | "STATUS_CHANGED"
      | "DOCUMENT_UPLOADED"
      | "DOCUMENT_UPDATED"
      | "DOCUMENT_REMOVED"
      | "WEIGHBRIDGE_IN"
      | "WEIGHBRIDGE_OUT"
      | "WEIGHT_UPDATED"
      | "LOADING_STARTED"
      | "LOADING_DONE"
      | "UNLOADING_STARTED"
      | "UNLOADING_DONE"
      | "LOCATION_UPDATED"
      | "COMMENT_ADDED";

    user: {
      id?: string;

      name: string;

      email?: string;

      role?: string;
    };

    fromStatus?: WeighbridgeStatus;

    toStatus?: WeighbridgeStatus;

    changes?: {
      field: string;

      oldValue?: unknown;

      newValue?: unknown;
    }[];

    location?: {
      latitude?: number;

      longitude?: number;

      address?: string;

      speed?: number;

      heading?: number;

      accuracy?: number;
    };

    comment?: string;

    createdAt: string;
  }[];

  /* =======================================================
     DATABASE TIMESTAMPS
  ======================================================= */

  createdAt?: string;

  updatedAt?: string;
}
