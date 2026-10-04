import type { Vehicle_new } from "@/app/types/vehicle_new";

/* =========================================================
   STAT CARD FILTERS

   Client-side copies of the rules /api/vehicles/stats
   uses for the summary cards, so clicking a card shows
   the same vehicles it counts. Keep the two in sync.

   Every rule is a subset of the table's "Today" load
   (created today, pending, or dispatched today).
========================================================= */

export type VehicleStatFilter =
    | "todayVehicles"
    | "previousPendingVehicles"
    | "dispatchDone"
    | "waitingForDetails";

// Dates are compared in IST, like the API
const IST_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

const DMY_PATTERN =
    /^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?$/i;

const isTodayIST = (value?: string | null): boolean => {
    if (!value) {
        return false;
    }

    const text = String(value).trim();
    const match = DMY_PATTERN.exec(text);

    let date: Date;

    if (match) {
        // "DD-MM-YYYY hh:mm AM/PM" is stored in IST
        const [, day, month, year, hour = "0", minute = "0", ampm] = match;

        let hours = Number(hour);

        if (ampm) {
            const period = ampm.toUpperCase();

            if (period === "PM" && hours !== 12) hours += 12;
            if (period === "AM" && hours === 12) hours = 0;
        }

        date = new Date(
            `${year}-${month}-${day}T${String(hours).padStart(2, "0")}:${minute.padStart(2, "0")}:00+05:30`,
        );
    } else {
        date = new Date(text);
    }

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return IST_DATE_FORMAT.format(date) === IST_DATE_FORMAT.format(new Date());
};

const createdToday = (vehicle: Vehicle_new) =>
    isTodayIST((vehicle as { createdAt?: string }).createdAt);

const dispatchedToday = (vehicle: Vehicle_new) =>
    vehicle.status === "DISPATCH_DONE" && isTodayIST(vehicle.outTime);

export const VEHICLE_STAT_FILTERS: Record<
    VehicleStatFilter,
    (vehicle: Vehicle_new) => boolean
> = {
    todayVehicles: createdToday,

    // Older vehicles still pending (or dispatched without
    // an outTime), plus older vehicles dispatched today
    previousPendingVehicles: (vehicle) =>
        !createdToday(vehicle) &&
        (vehicle.status !== "DISPATCH_DONE" ||
            !vehicle.outTime ||
            dispatchedToday(vehicle)),

    dispatchDone: dispatchedToday,

    waitingForDetails: (vehicle) =>
        vehicle.status === "WAITING_FOR_DETAILS",
};
