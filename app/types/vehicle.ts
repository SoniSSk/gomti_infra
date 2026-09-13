/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Vehicle {
  _id: string;
  createdAt: string;
  updatedAt: string;
  sno: number;
  dateTime: string;

  tokenNo: string;
  vehicleNo: string;

  driverName: string;
  driverContact: string;
  transporterName: string;

  buyerDetails: string;

  materialName: string;
  materialGrade: string;

  destination: string;

  vehicleImage: string;
  netWeight: string;

  loadingVideo?: string;

  status: any;

  weightSlip?: string;
  LRSlip?: string;
  etp?: string;
  invoiceImage?: string;
  EWayBill?: string;

  driverLicenseImage?: string;
  vehicleRegistrationImage?: string;
  tyre?: string;
  route?: string;
  inTime?: string;
  outTime?: string;
}
