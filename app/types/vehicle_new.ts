export interface Vehicle_new {
  _id?: string;

  /* =========================
     BASIC VEHICLE
  ========================= */

  vehicleNo: string;
  driverName?: string;
  transporterName?: string;
  tyre?: string;
  route?: string;

  /* =========================
     BUYER / MATERIAL
  ========================= */

  buyerDetails?: string;
  materialName?: string;
  materialGrade?: string;
  netWeight?: string;

  /* =========================
     STATUS
  ========================= */

  status: VehicleStatus;

  /** Required while status is ON_HOLD. */
  holdReason?: string;

  /* =========================
     DOCUMENTS
  ========================= */

  documents?: {
    weightSlip?: string;
    LRSlip?: string;
    etp?: string;
    invoiceImage?: string;
    EWayBill?: string;
    vehicleImage?: string;
    driverLicenseImage?: string;
    vehicleRegistrationImage?: string;
    loadingVideo?: string;
  };

  /* =========================
     TIME
  ========================= */

  inTime?: string;
  outTime?: string;

  /* =========================
     CURRENT LOCATION
  ========================= */

  currentLocation?: {
    latitude: number;
    longitude: number;

    address?: string;

    accuracy?: number;
    speed?: number;
    heading?: number;

    recordedAt: string;
  };

  /* =========================
     CREATED / UPDATED BY
  ========================= */

  createdBy?: {
    id?: string;
    name: string;
    email?: string;
    role?: string;
  };

  updatedBy?: {
    id?: string;
    name: string;
    email?: string;
    role?: string;
  };

  /* =========================
     COMPLETE TRACKING
  ========================= */

  tracking?: {
    action:
      | "VEHICLE_CREATED"
      | "DETAILS_UPDATED"
      | "STATUS_CHANGED"
      | "DOCUMENT_UPLOADED"
      | "DOCUMENT_UPDATED"
      | "DOCUMENT_REMOVED"
      | "LOADING_STARTED"
      | "LOADING_COMPLETED"
      | "ETP_GENERATED"
      | "INVOICE_GENERATED"
      | "DISPATCHED"
      | "LOCATION_UPDATED";

    user: {
      id?: string;
      name: string;
      email?: string;
      role?: string;
    };

    fromStatus?: VehicleStatus;
    toStatus?: VehicleStatus;

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

  /* =========================
     DATABASE TIMESTAMPS
  ========================= */

  createdAt: string;
  updatedAt: string;

  destination?: string;
  tokenNo?: string;
  driverContact?: string;
  sno?: number;

  etpNo?: number;
  etpDate?: string;
}

/* =========================
   STATUS
========================= */

export type VehicleStatus =
  | "WAITING_FOR_DETAILS"
  | "ENTRY_DONE"
  | "WAITING_FOR_TOKEN"
  | "LOADING_STARTED"
  | "LOADING_DONE"
  | "LOADING_SLIP_SENT"
  | "ON_HOLD"
  | "NOT_REGISTERED"
  | "ETP_GENERATING"
  | "ETP_DONE"
  | "INVOICE_GENERATING"
  | "ETP_INVOICE_DONE"
  | "DISPATCH_DONE";
