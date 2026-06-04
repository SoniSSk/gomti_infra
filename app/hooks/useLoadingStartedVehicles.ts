import { useMemo } from "react";
import { Vehicle } from "@/app/types/vehicle";

export const useLoadingStartedVehicles = (vehicles: Vehicle[]) => {
  return useMemo(() => {
    const today = new Date();

    const isToday = (dateString?: string) => {
      if (!dateString) return false;

      const date = new Date(dateString);

      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    };

    return vehicles
      .filter(
        (vehicle) =>
          isToday(vehicle.dateTime) && vehicle.status === "LOADING_STARTED",
      )
      .map((vehicle) => ({
        sno: vehicle.sno,
        tokenNo: vehicle.tokenNo,
        vehicleNo: vehicle.vehicleNo,
      }));
  }, [vehicles]);
};
