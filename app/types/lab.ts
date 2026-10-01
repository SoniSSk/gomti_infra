export interface LabReport {
  Fe?: number;
  Fe2O3?: number;
  silica?: number;
  Mn?: number;
  phosphorus?: number;
  Al?: number;
  LOI?: number;
  specificGravity?: number;
  specificDensity?: number;
}

export interface LabDocuments {
  sampleVideo?: string;
  samplePhoto1?: string;
  samplePhoto2?: string;
  samplePhoto3?: string;
  report?: string;
  /** Spare slot for any extra file. */
  other?: string;
  otherDocuments?: string[];
}

export interface LabFieldUpdate {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  updatedBy: string;
  updatedAt: Date | string;
}

export type LabStatus =
  | "WAITING_FOR_DETAILS"
  | "ON_HOLD"
  | "SAMPLE_TAKEN"
  | "REPORT_PENDING"
  | "REPORT_DELAYED"
  | "REPORT_DONE"
  | "CANCELLED";

export interface LabObject {
  /* =========================
     BASIC
  ========================= */

  id: string;
  sno: number;

  /* =========================
     STATUS
  ========================= */

  status: LabStatus;

  /** Required while status is ON_HOLD. */
  holdReason?: string;

  /** Required while status is CANCELLED. */
  cancelReason?: string;

  /* =========================
     ASSIGNMENT
  ========================= */

  assignedBy: string;
  assignedTo: string;

  /* =========================
     LOT / MATERIAL
  ========================= */

  lot: string;
  lotDescription: string;
  size: string;

  /* =========================
     SAMPLE
  ========================= */

  sampleTakenBy?: string;
  sampleTakenAt?: Date | string;

  /* =========================
     REPORT TIMELINE
  ========================= */

  expectedReportAt?: Date | string;
  reportDoneAt?: Date | string;

  /* =========================
     LAB REPORT
  ========================= */

  report: LabReport;

  /* =========================
     DOCUMENTS
  ========================= */

  documents: LabDocuments;

  /* =========================
     CREATION
  ========================= */

  userCreated: string;
  createdAt: Date | string;
  createdBy: string;

  /* =========================
     LAST UPDATE
  ========================= */

  updatedAt?: Date | string;
  updatedBy?: string;

  /* =========================
     COMPLETE UPDATE HISTORY
  ========================= */

  updateHistory: LabFieldUpdate[];
}
