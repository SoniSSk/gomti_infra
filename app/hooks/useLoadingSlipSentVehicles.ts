import { useMemo } from "react";
import { Vehicle } from "@/app/types/vehicle";

export const useLoadingSlipSentVehicles = (vehicles: Vehicle[]): Vehicle[] => {
  return useMemo(() => {
    return vehicles.filter((vehicle) => vehicle.status === "LOADING_SLIP_SENT");
  }, [vehicles]);
};
