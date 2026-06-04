import { useMemo } from "react";
import { Vehicle } from "@/app/types/vehicle";

export const useVehicleStats = (vehicles: Vehicle[]) => {
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

    const totalVehicles = vehicles.length;

    const todayVehicles = vehicles.filter((vehicle) =>
      isToday(vehicle.dateTime),
    ).length;

    const todayStatus = {
      WAITING_FOR_DETAILS: 0,
      ENTRY_DONE: 0,
      WAITING_FOR_TOKEN: 0,
      LOADING_STARTED: 0,
      LOADING_DONE: 0,
      LOADING_SLIP_SENT: 0,
      ETP_INVOICE_DONE: 0,
      DISPATCH_DONE: 0,
    };

    vehicles.forEach((vehicle) => {
      if (
        isToday(vehicle.dateTime) &&
        vehicle.status &&
        vehicle.status in todayStatus
      ) {
        todayStatus[
          vehicle.status as keyof typeof todayStatus
        ]++;
      }
    });

    return {
      totalVehicles,
      todayVehicles,

      todayWaitingForDetails:
        todayStatus.WAITING_FOR_DETAILS,

      todayEntryDone: todayStatus.ENTRY_DONE,

      todayWaitingForToken:
        todayStatus.WAITING_FOR_TOKEN,

      todayLoadingStarted:
        todayStatus.LOADING_STARTED,

      todayLoadingDone:
        todayStatus.LOADING_DONE,

      todayLoadingSlipSent:
        todayStatus.LOADING_SLIP_SENT,

      todayEtpInvoiceDone:
        todayStatus.ETP_INVOICE_DONE,

      todayDispatchDone:
        todayStatus.DISPATCH_DONE,

      todayStatus,
    };
  }, [vehicles]);
};