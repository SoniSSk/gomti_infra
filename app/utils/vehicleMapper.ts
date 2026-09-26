import type { Vehicle_new, VehicleStatus } from "@/app/types/vehicle_new";

export interface ApiVehicle extends Partial<Omit<Vehicle_new, "netWeight">> {
  _id?: string;
  sno?: number;
  dateTime?: string;

  vehicleNo: string;

  driverName?: string;
  driverContact?: string;
  transporterName?: string;
  tyre?: string;
  route?: string;

  buyerDetails?: string;
  materialName?: string;
  materialGrade?: string;

  // API can return either string or number
  netWeight?: string | number;

  status: VehicleStatus;

  destination?: string;
  tokenNo?: string;

  // Old flat API document fields
  weightSlip?: string;
  LRSlip?: string;
  etp?: string;
  invoiceImage?: string;
  EWayBill?: string;
  vehicleImage?: string;
  driverLicenseImage?: string;
  vehicleRegistrationImage?: string;
  loadingVideo?: string;

  inTime?: string;
  outTime?: string;

  currentLocation?: Vehicle_new["currentLocation"];

  createdBy?: Vehicle_new["createdBy"];

  updatedBy?: Vehicle_new["updatedBy"];

  tracking?: Vehicle_new["tracking"];

  createdAt?: string;
  updatedAt?: string;

  etpNo?: number;
  etpDate?: string;
}

export const normalizeVehicle = (
  vehicle: ApiVehicle | Vehicle_new,
): Vehicle_new => {
  const source = vehicle as ApiVehicle;

  const existingDocuments = vehicle.documents ?? {};

  return {
    _id: vehicle._id,

    vehicleNo: vehicle.vehicleNo,

    driverName: vehicle.driverName,

    driverContact: vehicle.driverContact,

    transporterName: vehicle.transporterName,

    tyre: vehicle.tyre,

    route: vehicle.route,

    buyerDetails: vehicle.buyerDetails,

    materialName: vehicle.materialName,

    materialGrade: vehicle.materialGrade,

    // Always convert API number/string into Vehicle_new string
    netWeight:
      vehicle.netWeight !== undefined && vehicle.netWeight !== null
        ? String(vehicle.netWeight)
        : undefined,

    status: vehicle.status,

    holdReason: vehicle.holdReason,

    /*
     * Convert old flat document structure
     * into new nested documents structure.
     */
    documents: {
      weightSlip: existingDocuments.weightSlip ?? source.weightSlip,

      LRSlip: existingDocuments.LRSlip ?? source.LRSlip,

      etp: existingDocuments.etp ?? source.etp,

      invoiceImage: existingDocuments.invoiceImage ?? source.invoiceImage,

      EWayBill: existingDocuments.EWayBill ?? source.EWayBill,

      vehicleImage: existingDocuments.vehicleImage ?? source.vehicleImage,

      driverLicenseImage:
        existingDocuments.driverLicenseImage ?? source.driverLicenseImage,

      vehicleRegistrationImage:
        existingDocuments.vehicleRegistrationImage ??
        source.vehicleRegistrationImage,

      loadingVideo: existingDocuments.loadingVideo ?? source.loadingVideo,
    },

    inTime: vehicle.inTime,

    outTime: vehicle.outTime,

    currentLocation: vehicle.currentLocation
      ? {
          latitude: vehicle.currentLocation.latitude ?? 0,

          longitude: vehicle.currentLocation.longitude ?? 0,

          address: vehicle.currentLocation.address,

          accuracy: vehicle.currentLocation.accuracy,

          speed: vehicle.currentLocation.speed,

          heading: vehicle.currentLocation.heading,

          recordedAt:
            vehicle.currentLocation.recordedAt ??
            vehicle.updatedAt ??
            vehicle.createdAt ??
            new Date().toISOString(),
        }
      : undefined,

    createdBy: vehicle.createdBy,

    updatedBy: vehicle.updatedBy,

    tracking: vehicle.tracking ?? [],

    createdAt: vehicle.createdAt ?? source.dateTime ?? new Date().toISOString(),

    updatedAt:
      vehicle.updatedAt ??
      vehicle.createdAt ??
      source.dateTime ??
      new Date().toISOString(),

    destination: vehicle.destination,

    tokenNo: vehicle.tokenNo,

    sno: vehicle.sno,

    etpNo: vehicle.etpNo,

    etpDate: vehicle.etpDate,
  };
};

export const normalizeVehicles = (vehicles: ApiVehicle[]): Vehicle_new[] => {
  return vehicles.map(normalizeVehicle);
};
