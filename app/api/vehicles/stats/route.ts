import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

const DB_NAME = "gomti_infra";
const COLLECTION_NAME = "vehicles";

/* ============================================================
   VEHICLE DOCUMENT
============================================================ */

interface VehicleDocument {
  _id?: unknown;

  vehicleNo?: string;
  driverName?: string;
  driverContact?: string;

  transporterName?: string;
  tyre?: string;
  route?: string;

  buyerDetails?: string;
  materialName?: string;
  materialGrade?: string;
  netWeight?: number;

  status?: string | null;

  documents?: {
    weightSlip?: string;
    LRSlip?: string;
    etp?: string;
    invoiceImage?: string;
    EWayBill?: string;
    vehicleImage?: string;
    driverLicenseImage?: string;
    vehicleRegistrationImage?: string;
    loadingVideo?: string;
  };

  inTime?: string;
  outTime?: string;

  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
    speed?: number;
    heading?: number;
    recordedAt: string;
  };

  createdBy?: {
    id?: string;
    name: string;
    email?: string;
    role?: string;
  };

  updatedBy?: {
    id?: string;
    name: string;
    email?: string;
    role?: string;
  };

  tracking?: unknown[];

  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;

  dateTime?: string | Date | null;

  destination?: string;
  tokenNo?: string;

  sno?: number;

  etpNo?: number;
  etpDate?: string;
}

/* ============================================================
   ALERT STATUSES

   ALL VEHICLES HAVING THESE STATUSES WILL BE
   RETURNED AS COMPLETE OBJECTS
============================================================ */

const ALERT_STATUSES = [
  "ETP_DONE",
  "LOADING_SLIP_SENT",
  "INVOICE_GENERATING",
  "NOT_REGISTERD",
  "ETP_INVOICE_DONE",
] as const;

/* ============================================================
   GET TODAY IN IST
============================================================ */

const getTodayIST = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),

    month: Number(parts.find((part) => part.type === "month")?.value),

    day: Number(parts.find((part) => part.type === "day")?.value),
  };
};

/* ============================================================
   CHECK DATE IS TODAY - IST

   Supports:

   DD-MM-YYYY
   DD-MM-YYYY HH:MM
   DD-MM-YYYY HH:MM AM/PM
   ISO DATE
   DATE OBJECT
============================================================ */

const isToday = (value?: string | Date | null): boolean => {
  if (!value) {
    return false;
  }

  let date: Date;

  /* ==========================================================
     DATE OBJECT
  ========================================================== */

  if (value instanceof Date) {
    date = value;
  } else {
    const dateString = String(value).trim();

    /* ========================================================
       DD-MM-YYYY HH:MM AM/PM
    ======================================================== */

    const ddmmyyyyMatch = dateString.match(
      /^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?$/i,
    );

    if (ddmmyyyyMatch) {
      const [, day, month, year, hour, minute, ampm] = ddmmyyyyMatch;

      let hours = hour ? Number(hour) : 0;

      const minutes = minute ? Number(minute) : 0;

      /* ======================================================
         AM / PM
      ====================================================== */

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
      /* ======================================================
         ISO / OTHER DATE FORMAT
      ====================================================== */

      date = new Date(dateString);
    }
  }

  /* ==========================================================
     INVALID DATE
  ========================================================== */

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  /* ==========================================================
     CONVERT DATE TO IST
  ========================================================== */

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);

  const month = Number(parts.find((part) => part.type === "month")?.value);

  const day = Number(parts.find((part) => part.type === "day")?.value);

  const today = getTodayIST();

  return day === today.day && month === today.month && year === today.year;
};

/* ============================================================
   GET API
============================================================ */

export async function GET() {
  try {
    /* ========================================================
       MONGODB CONNECTION
    ======================================================== */

    const client = await clientPromise;

    const db = client.db(DB_NAME);

    const collection = db.collection<VehicleDocument>(COLLECTION_NAME);

    /* ========================================================
       GET ALL VEHICLES

       Complete MongoDB documents are returned.
    ======================================================== */

    const vehicles = await collection.find({}).toArray();

    /* ========================================================
       TOTAL VEHICLES
    ======================================================== */

    const totalVehicles = vehicles.length;

    /* ========================================================
       TODAY VEHICLES
    ======================================================== */

    const todayVehicles = vehicles.filter((vehicle) =>
      isToday(vehicle.dateTime),
    ).length;

    /* ========================================================
       PREVIOUS PENDING VEHICLES
    ======================================================== */

    const previousPendingVehicles = vehicles.filter(
      (vehicle) =>
        (!isToday(vehicle.dateTime) && vehicle.status !== "DISPATCH_DONE") ||
        (!isToday(vehicle.dateTime) &&
          isToday(vehicle.outTime) &&
          vehicle.status === "DISPATCH_DONE"),
    ).length;

    /* ========================================================
       STATUS COUNTS
    ======================================================== */

    const status = {
      WAITING_FOR_DETAILS: 0,

      ENTRY_DONE: 0,

      LOADING_STARTED: 0,

      LOADING_DONE: 0,

      LOADING_SLIP_SENT: 0,

      ETP_DONE: 0,

      ETP_INVOICE_DONE: 0,

      INVOICE_GENERATING: 0,

      NOT_REGISTERD: 0,

      DISPATCH_DONE: 0,
    };

    /* ========================================================
       VEHICLE ALERTS

       IMPORTANT:

       This array contains the COMPLETE MongoDB
       objects of matching vehicles.
    ======================================================== */

    const alertVehicles: VehicleDocument[] = vehicles.filter((vehicle) =>
      ALERT_STATUSES.includes(
        vehicle.status as (typeof ALERT_STATUSES)[number],
      ),
    );

    /* ========================================================
       COUNT STATUS

       We count all statuses from the complete
       vehicle collection.
    ======================================================== */

    vehicles.forEach((vehicle) => {
      /* ====================================================
           WAITING FOR DETAILS
        ==================================================== */

      if (vehicle.status === "WAITING_FOR_DETAILS") {
        status.WAITING_FOR_DETAILS++;
      }

      /* ====================================================
           ENTRY DONE
        ==================================================== */

      if (vehicle.status === "ENTRY_DONE") {
        status.ENTRY_DONE++;
      }

      /* ====================================================
           LOADING STARTED
        ==================================================== */

      if (vehicle.status === "LOADING_STARTED") {
        status.LOADING_STARTED++;
      }

      /* ====================================================
           LOADING DONE
        ==================================================== */

      if (vehicle.status === "LOADING_DONE") {
        status.LOADING_DONE++;
      }

      /* ====================================================
           LOADING SLIP SENT
        ==================================================== */

      if (vehicle.status === "LOADING_SLIP_SENT") {
        status.LOADING_SLIP_SENT++;
      }

      /* ====================================================
           ETP DONE
        ==================================================== */

      if (vehicle.status === "ETP_DONE") {
        status.ETP_DONE++;
      }

      /* ====================================================
           ETP INVOICE DONE
        ==================================================== */

      if (vehicle.status === "ETP_INVOICE_DONE") {
        status.ETP_INVOICE_DONE++;
      }

      /* ====================================================
           INVOICE GENERATING
        ==================================================== */

      if (vehicle.status === "INVOICE_GENERATING") {
        status.INVOICE_GENERATING++;
      }

      /* ====================================================
           NOT REGISTERED
        ==================================================== */

      if (vehicle.status === "NOT_REGISTERD") {
        status.NOT_REGISTERD++;
      }

      /* ====================================================
           DISPATCH DONE

           Only today's dispatched vehicles
        ==================================================== */

      if (vehicle.status === "DISPATCH_DONE" && isToday(vehicle.outTime)) {
        status.DISPATCH_DONE++;
      }
    });

    /* ========================================================
       ALERT COUNTS

       Counts are calculated from alertVehicles only.
    ======================================================== */

    const alertCounts = {
      ETP_DONE: alertVehicles.filter((vehicle) => vehicle.status === "ETP_DONE")
        .length,

      LOADING_SLIP_SENT: alertVehicles.filter(
        (vehicle) => vehicle.status === "LOADING_SLIP_SENT",
      ).length,

      INVOICE_GENERATING: alertVehicles.filter(
        (vehicle) => vehicle.status === "INVOICE_GENERATING",
      ).length,

      NOT_REGISTERD: alertVehicles.filter(
        (vehicle) => vehicle.status === "NOT_REGISTERD",
      ).length,

      ETP_INVOICE_DONE: alertVehicles.filter(
        (vehicle) => vehicle.status === "ETP_INVOICE_DONE",
      ).length,
    };

    /* ========================================================
       SUCCESS RESPONSE
    ======================================================== */

    return NextResponse.json({
      success: true,

      date: getTodayIST(),

      timezone: "Asia/Kolkata",

      /* ======================================================
         MAIN DASHBOARD COUNTS
      ====================================================== */

      counts: {
        totalVehicles,

        todayVehicles,

        previousPendingVehicles,

        waitingForDetails: status.WAITING_FOR_DETAILS,

        entryDone: status.ENTRY_DONE,

        loadingStarted: status.LOADING_STARTED,

        loadingDone: status.LOADING_DONE,

        loadingSlipSent: status.LOADING_SLIP_SENT,

        etpDone: status.ETP_DONE,

        etpInvoiceDone: status.ETP_INVOICE_DONE,

        invoiceGenerating: status.INVOICE_GENERATING,

        notRegistered: status.NOT_REGISTERD,

        dispatchDone: status.DISPATCH_DONE,

        status,
      },

      /* ======================================================
         VEHICLE ALERTS

         KEEPING YOUR EXACT STRUCTURE

         total
         counts
         vehicles

         vehicles contains COMPLETE OBJECTS.
      ====================================================== */

      vehicleAlerts: {
        total: alertVehicles.length,

        counts: alertCounts,

        vehicles: alertVehicles,
      },
    });
  } catch (error) {
    /* ========================================================
       ERROR LOG
    ======================================================== */

    console.error("GET /api/vehicles/stats error:", error);

    /* ========================================================
       ERROR RESPONSE
    ======================================================== */

    return NextResponse.json(
      {
        success: false,

        message: "Failed to fetch vehicle stats",

        counts: {
          totalVehicles: 0,

          todayVehicles: 0,

          previousPendingVehicles: 0,

          waitingForDetails: 0,

          entryDone: 0,

          loadingStarted: 0,

          loadingDone: 0,

          loadingSlipSent: 0,

          etpDone: 0,

          etpInvoiceDone: 0,

          invoiceGenerating: 0,

          notRegistered: 0,

          dispatchDone: 0,

          status: {
            WAITING_FOR_DETAILS: 0,

            ENTRY_DONE: 0,

            LOADING_STARTED: 0,

            LOADING_DONE: 0,

            LOADING_SLIP_SENT: 0,

            ETP_DONE: 0,

            ETP_INVOICE_DONE: 0,

            INVOICE_GENERATING: 0,

            NOT_REGISTERD: 0,

            DISPATCH_DONE: 0,
          },
        },

        /* ====================================================
           KEEP SAME STRUCTURE ON ERROR
        ==================================================== */

        vehicleAlerts: {
          total: 0,

          counts: {
            ETP_DONE: 0,

            LOADING_SLIP_SENT: 0,

            INVOICE_GENERATING: 0,

            NOT_REGISTERD: 0,

            ETP_INVOICE_DONE: 0,
          },

          vehicles: [],
        },
      },
      {
        status: 500,
      },
    );
  }
}
