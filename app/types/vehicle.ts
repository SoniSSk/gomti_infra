import { VehicleStatus } from "./vehicle-status";

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

  status: VehicleStatus;

  weightSlip?: string;
  LRSlip?: string;
  etp?: string;
  invoiceImage?: string;
  EWayBill?: string;
}
