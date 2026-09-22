import { useMemo } from "react";
import { Vehicle } from "@/app/types/vehicle";

export const useInvoiceGeneratingVehicle = (vehicles: Vehicle[]): Vehicle[] => {
  return useMemo(() => {
    return vehicles.filter(
      (vehicle) => vehicle.status === "INVOICE_GENERATING",
    );
  }, [vehicles]);
};
