export const VEHICLE_STATUS = [
  "WAITING_FOR_DETAILS",
  "ENTRY_DONE",
  "WAITING_FOR_TOKEN",
  "LOADING_STARTED",
  "LOADING_DONE",
  "LOADING_SLIP_SENT",
  "ETP_INVOICE_DONE",
  "DISPATCH_DONE",
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUS)[number];