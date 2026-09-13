import { useMemo } from "react";
import { Vehicle } from "@/app/types/vehicle";

export const useEtpDoneVehicles = (vehicles: Vehicle[]): Vehicle[] => {
  return useMemo(() => {
    return vehicles.filter((vehicle) => vehicle.status === "ETP_DONE");
  }, [vehicles]);
};
