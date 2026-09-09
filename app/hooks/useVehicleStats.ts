import { useMemo } from "react";
import { Vehicle } from "@/app/types/vehicle";

export const useVehicleStats = (vehicles: Vehicle[]) => {
  return useMemo(() => {
    const today = new Date();

    /**
     * Check if date is today
     *
     * Supports:
     * 08-09-2026 10:25 AM
     * 2026-09-08T10:25:00
     */
    const isToday = (dateString?: string) => {
      if (!dateString) return false;

      let date: Date;

      const ddmmyyyyMatch = dateString.match(
        /^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?$/i,
      );

      if (ddmmyyyyMatch) {
        const [, day, month, year, hour, minute, ampm] = ddmmyyyyMatch;

        let hours = hour ? Number(hour) : 0;
        const minutes = minute ? Number(minute) : 0;

        if (ampm) {
          const period = ampm.toUpperCase();

          if (period === "PM" && hours !== 12) {
            hours += 12;
          }

          if (period === "AM" && hours === 12) {
            hours = 0;
          }
        }

        date = new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          hours,
          minutes,
        );
      } else {
        date = new Date(dateString);
      }

      if (Number.isNaN(date.getTime())) {
        console.warn("Invalid date:", dateString);
        return false;
      }

      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    };

    // ==========================================
    // TOTAL VEHICLES
    // ==========================================

    const totalVehicles = vehicles.length;

    // ==========================================
    // TODAY'S VEHICLES
    // ==========================================

    const todayVehicles = vehicles.filter((vehicle) =>
      isToday(vehicle.dateTime),
    ).length;

    // ==========================================
    // PREVIOUS DAY VEHICLES
    //
    // 1. dateTime is NOT today
    //    AND
    //    status is NOT DISPATCH_DONE
    //
    // OR
    //
    // 2. dateTime is NOT today
    //    AND
    //    outTime is today
    //    AND
    //    status is DISPATCH_DONE
    //
    // This includes:
    // - Older pending vehicles
    // - Older vehicles dispatched today
    // ==========================================

    const previousPendingVehicles = vehicles.filter(
      (vehicle) =>
        (!isToday(vehicle.dateTime) && vehicle.status !== "DISPATCH_DONE") ||
        (!isToday(vehicle.dateTime) &&
          isToday(vehicle.outTime) &&
          vehicle.status === "DISPATCH_DONE"),
    ).length;

    // ==========================================
    // STATUS COUNT
    // ==========================================

    const status = {
      WAITING_FOR_DETAILS: 0,
      ENTRY_DONE: 0,
      LOADING_STARTED: 0,
      LOADING_DONE: 0,
      LOADING_SLIP_SENT: 0,
      ETP_INVOICE_DONE: 0,
      DISPATCH_DONE: 0,
    };

    vehicles.forEach((vehicle) => {
      // WAITING_FOR_DETAILS
      if (vehicle.status === "WAITING_FOR_DETAILS") {
        status.WAITING_FOR_DETAILS++;
      }

      // ENTRY_DONE
      if (vehicle.status === "ENTRY_DONE") {
        status.ENTRY_DONE++;
      }

      // LOADING_STARTED
      if (vehicle.status === "LOADING_STARTED") {
        status.LOADING_STARTED++;
      }

      // LOADING_DONE
      if (vehicle.status === "LOADING_DONE") {
        status.LOADING_DONE++;
      }

      // LOADING_SLIP_SENT
      if (vehicle.status === "LOADING_SLIP_SENT") {
        status.LOADING_SLIP_SENT++;
      }

      // ETP_INVOICE_DONE
      if (vehicle.status === "ETP_INVOICE_DONE") {
        status.ETP_INVOICE_DONE++;
      }

      // ==========================================
      // DISPATCH DONE
      //
      // status = DISPATCH_DONE
      // AND
      // outTime = TODAY
      // ==========================================

      if (vehicle.status === "DISPATCH_DONE" && isToday(vehicle.outTime)) {
        status.DISPATCH_DONE++;
      }
    });

    console.log("Vehicle Stats:", {
      totalVehicles,
      todayVehicles,
      previousPendingVehicles,
      status,
    });

    return {
      // ALL vehicles
      totalVehicles,

      // TODAY vehicles
      todayVehicles,

      // PREVIOUS DAY VEHICLES
      // dateTime != today
      // status != DISPATCH_DONE
      previousPendingVehicles,

      // Status counts
      waitingForDetails: status.WAITING_FOR_DETAILS,

      entryDone: status.ENTRY_DONE,

      loadingStarted: status.LOADING_STARTED,

      loadingDone: status.LOADING_DONE,

      loadingSlipSent: status.LOADING_SLIP_SENT,

      etpInvoiceDone: status.ETP_INVOICE_DONE,

      // DISPATCH_DONE + outTime TODAY
      dispatchDone: status.DISPATCH_DONE,

      // Complete status
      status,
    };
  }, [vehicles]);
};
