import { useMemo } from "react";
import { Vehicle } from "@/app/types/vehicle";

export const useEtpGeneratingVehicles = (vehicles: Vehicle[]): Vehicle[] => {
  return useMemo(() => {
    return vehicles.filter((vehicle) => vehicle.status === "ETP_GENERATING");
  }, [vehicles]);
};
