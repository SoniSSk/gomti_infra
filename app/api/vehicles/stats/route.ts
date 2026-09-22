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
   ALL VEHICLE STATUSES
============================================================ */

const VEHICLE_STATUSES = [
  "WAITING_FOR_DETAILS",
  "ENTRY_DONE",
  "LOADING_STARTED",
  "LOADING_DONE",
  "LOADING_SLIP_SENT",
  "ETP_GENERATING",
  "ETP_DONE",
  "ETP_INVOICE_DONE",
  "INVOICE_GENERATING",
  "NOT_REGISTERD",
  "DISPATCH_DONE",
] as const;

/* ============================================================
   ALERT STATUSES
============================================================ */

const ALERT_STATUSES = [
  "ETP_GENERATING",
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
   TODAY VEHICLE

   createdAt = today
   =================
   TODAY VEHICLE

   dateTime is NOT checked.
============================================================ */

const isTodayCreatedVehicle = (vehicle: VehicleDocument): boolean => {
  return isToday(vehicle.createdAt);
};

/* ============================================================
   PREVIOUS VEHICLE

   createdAt is NOT today
============================================================ */

const isPreviousVehicle = (vehicle: VehicleDocument): boolean => {
  return !isToday(vehicle.createdAt);
};

/* ============================================================
   EMPTY STATUS COUNTS
============================================================ */

const createEmptyStatusCounts = () => ({
  WAITING_FOR_DETAILS: 0,
  ENTRY_DONE: 0,
  LOADING_STARTED: 0,
  LOADING_DONE: 0,
  LOADING_SLIP_SENT: 0,
  ETP_GENERATING: 0,
  ETP_DONE: 0,
  ETP_INVOICE_DONE: 0,
  INVOICE_GENERATING: 0,
  NOT_REGISTERD: 0,
  DISPATCH_DONE: 0,
});

/* ============================================================
   STATUS VEHICLE TYPE

   Keeps exact MongoDB status names.
============================================================ */

type StatusVehicleMap = {
  [key in (typeof VEHICLE_STATUSES)[number]]: VehicleDocument[];
};

/* ============================================================
   CREATE EMPTY STATUS VEHICLE MAP
============================================================ */

const createEmptyStatusVehicles = (): StatusVehicleMap => ({
  WAITING_FOR_DETAILS: [],
  ENTRY_DONE: [],
  LOADING_STARTED: [],
  LOADING_DONE: [],
  LOADING_SLIP_SENT: [],
  ETP_GENERATING: [],
  ETP_DONE: [],
  ETP_INVOICE_DONE: [],
  INVOICE_GENERATING: [],
  NOT_REGISTERD: [],
  DISPATCH_DONE: [],
});

/* ============================================================
   SERIALIZE VEHICLE

   MongoDB ObjectId is converted to string so the frontend
   receives JSON-friendly data.
============================================================ */

const serializeVehicle = (vehicle: VehicleDocument): VehicleDocument => {
  return {
    ...vehicle,

    _id:
      vehicle._id !== undefined && vehicle._id !== null
        ? String(vehicle._id)
        : undefined,
  };
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
    ======================================================== */

    const rawVehicles = await collection.find({}).toArray();

    /* ========================================================
       SERIALIZE VEHICLES
    ======================================================== */

    const vehicles = rawVehicles.map(serializeVehicle);

    /* ========================================================
       TOTAL VEHICLES
    ======================================================== */

    const totalVehicles = vehicles.length;

    /* ========================================================
       TODAY VEHICLE LIST

       ONLY createdAt TODAY.
    ======================================================== */

    const todayVehicleList = vehicles.filter((vehicle) =>
      isTodayCreatedVehicle(vehicle),
    );

    const todayVehicles = todayVehicleList.length;

    /* ========================================================
       PREVIOUS VEHICLE LIST

       createdAt NOT today.
    ======================================================== */

    const previousVehicleList = vehicles.filter((vehicle) =>
      isPreviousVehicle(vehicle),
    );

    const previousVehicleCount = previousVehicleList.length;

    /* ========================================================
       PREVIOUS PENDING VEHICLE LIST

       Previous vehicle AND

       (
         status !== DISPATCH_DONE
         OR
         outTime is empty
         OR
         DISPATCH_DONE + outTime is today
       )
    ======================================================== */

    const previousPendingVehicleList = previousVehicleList.filter((vehicle) => {
      const isPreviousPending =
        vehicle.status !== "DISPATCH_DONE" || !vehicle.outTime;

      const isPreviousDispatchedOutToday =
        vehicle.status === "DISPATCH_DONE" &&
        !!vehicle.outTime &&
        isToday(vehicle.outTime);

      return isPreviousPending || isPreviousDispatchedOutToday;
    });

    const previousPendingVehicles = previousPendingVehicleList.length;

    /* ========================================================
       STATUS COUNTS
    ======================================================== */

    const status = createEmptyStatusCounts();

    /* ========================================================
       STATUS VEHICLE LISTS
    ======================================================== */

    const statusVehicles = createEmptyStatusVehicles();

    /* ========================================================
       LOOP ALL VEHICLES

       IMPORTANT:

       We keep all status vehicles in their respective
       segregation list.

       DISPATCH_DONE is special:
       dashboard dispatch count/list contains only
       vehicles dispatched TODAY.
    ======================================================== */

    vehicles.forEach((vehicle) => {
      const currentStatus = vehicle.status;

      /* ======================================================
         IGNORE UNKNOWN STATUS
      ====================================================== */

      if (
        !currentStatus ||
        !VEHICLE_STATUSES.includes(
          currentStatus as (typeof VEHICLE_STATUSES)[number],
        )
      ) {
        return;
      }

      /* ======================================================
         DISPATCH DONE

         Only today's dispatched vehicles.
      ====================================================== */

      if (currentStatus === "DISPATCH_DONE") {
        if (isToday(vehicle.outTime)) {
          status.DISPATCH_DONE++;

          statusVehicles.DISPATCH_DONE.push(vehicle);
        }

        return;
      }

      /* ======================================================
         OTHER STATUSES
      ====================================================== */

      status[currentStatus as keyof typeof status]++;

      statusVehicles[currentStatus as keyof StatusVehicleMap].push(vehicle);
    });

    /* ========================================================
       ALERT VEHICLES

       Complete vehicle objects.
    ======================================================== */

    const alertVehicles = vehicles.filter((vehicle) =>
      ALERT_STATUSES.includes(
        vehicle.status as (typeof ALERT_STATUSES)[number],
      ),
    );

    /* ========================================================
       ALERT COUNTS
    ======================================================== */

    const alertCounts = {
      ETP_GENERATING: statusVehicles.ETP_GENERATING.length,

      ETP_DONE: statusVehicles.ETP_DONE.length,

      LOADING_SLIP_SENT: statusVehicles.LOADING_SLIP_SENT.length,

      INVOICE_GENERATING: statusVehicles.INVOICE_GENERATING.length,

      NOT_REGISTERD: statusVehicles.NOT_REGISTERD.length,

      ETP_INVOICE_DONE: statusVehicles.ETP_INVOICE_DONE.length,
    };

    /* ========================================================
       STATUS SEGREGATION

       Every category contains:

       count
       vehicles
    ======================================================== */

    const segregation = {
      /* ======================================================
         DATE SEGREGATION
      ====================================================== */

      today: {
        count: todayVehicleList.length,
        vehicles: todayVehicleList,
      },

      previous: {
        count: previousVehicleList.length,
        vehicles: previousVehicleList,
      },

      previousPending: {
        count: previousPendingVehicleList.length,
        vehicles: previousPendingVehicleList,
      },

      /* ======================================================
         STATUS SEGREGATION
      ====================================================== */

      waitingForDetails: {
        count: statusVehicles.WAITING_FOR_DETAILS.length,

        vehicles: statusVehicles.WAITING_FOR_DETAILS,
      },

      entryDone: {
        count: statusVehicles.ENTRY_DONE.length,

        vehicles: statusVehicles.ENTRY_DONE,
      },

      loadingStarted: {
        count: statusVehicles.LOADING_STARTED.length,

        vehicles: statusVehicles.LOADING_STARTED,
      },

      loadingDone: {
        count: statusVehicles.LOADING_DONE.length,

        vehicles: statusVehicles.LOADING_DONE,
      },

      loadingSlipSent: {
        count: statusVehicles.LOADING_SLIP_SENT.length,

        vehicles: statusVehicles.LOADING_SLIP_SENT,
      },

      etpGenerating: {
        count: statusVehicles.ETP_GENERATING.length,

        vehicles: statusVehicles.ETP_GENERATING,
      },

      etpDone: {
        count: statusVehicles.ETP_DONE.length,

        vehicles: statusVehicles.ETP_DONE,
      },

      etpInvoiceDone: {
        count: statusVehicles.ETP_INVOICE_DONE.length,

        vehicles: statusVehicles.ETP_INVOICE_DONE,
      },

      invoiceGenerating: {
        count: statusVehicles.INVOICE_GENERATING.length,

        vehicles: statusVehicles.INVOICE_GENERATING,
      },

      notRegistered: {
        count: statusVehicles.NOT_REGISTERD.length,

        vehicles: statusVehicles.NOT_REGISTERD,
      },

      dispatched: {
        count: statusVehicles.DISPATCH_DONE.length,

        vehicles: statusVehicles.DISPATCH_DONE,
      },
    };

    /* ========================================================
       SUCCESS RESPONSE
    ======================================================== */

    return NextResponse.json({
      success: true,

      date: getTodayIST(),

      timezone: "Asia/Kolkata",

      /* ======================================================
         MAIN COUNTS

         KEPT SAME FOR BACKWARD COMPATIBILITY
      ====================================================== */

      counts: {
        /* -----------------------------------------------
           TOTAL
        ----------------------------------------------- */

        totalVehicles,

        /* -----------------------------------------------
           TODAY
        ----------------------------------------------- */

        todayVehicles,

        /* -----------------------------------------------
           PREVIOUS
        ----------------------------------------------- */

        previousVehicles: previousVehicleCount,

        /* -----------------------------------------------
           PREVIOUS PENDING
        ----------------------------------------------- */

        previousPendingVehicles,

        /* -----------------------------------------------
           INDIVIDUAL STATUS COUNTS
        ----------------------------------------------- */

        waitingForDetails: status.WAITING_FOR_DETAILS,

        entryDone: status.ENTRY_DONE,

        loadingStarted: status.LOADING_STARTED,

        loadingDone: status.LOADING_DONE,

        loadingSlipSent: status.LOADING_SLIP_SENT,

        etpGenerating: status.ETP_GENERATING,

        etpDone: status.ETP_DONE,

        etpInvoiceDone: status.ETP_INVOICE_DONE,

        invoiceGenerating: status.INVOICE_GENERATING,

        notRegistered: status.NOT_REGISTERD,

        dispatchDone: status.DISPATCH_DONE,

        /* -----------------------------------------------
           COMPLETE STATUS COUNTS
        ----------------------------------------------- */

        status,
      },

      /* ======================================================
         NEW SEGREGATED DATA

         COUNT + COMPLETE VEHICLE DETAILS
      ====================================================== */

      segregation,

      /* ======================================================
         RAW STATUS VEHICLES

         Useful if frontend needs direct status mapping.
      ====================================================== */

      statusVehicles,

      /* ======================================================
         VEHICLE ALERTS

         Existing response maintained.
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

          previousVehicles: 0,

          previousPendingVehicles: 0,

          waitingForDetails: 0,

          entryDone: 0,

          loadingStarted: 0,

          loadingDone: 0,

          loadingSlipSent: 0,

          etpGenerating: 0,

          etpDone: 0,

          etpInvoiceDone: 0,

          invoiceGenerating: 0,

          notRegistered: 0,

          dispatchDone: 0,

          status: createEmptyStatusCounts(),
        },

        /* ====================================================
           EMPTY SEGREGATION
        ==================================================== */

        segregation: {
          today: {
            count: 0,
            vehicles: [],
          },

          previous: {
            count: 0,
            vehicles: [],
          },

          previousPending: {
            count: 0,
            vehicles: [],
          },

          waitingForDetails: {
            count: 0,
            vehicles: [],
          },

          entryDone: {
            count: 0,
            vehicles: [],
          },

          loadingStarted: {
            count: 0,
            vehicles: [],
          },

          loadingDone: {
            count: 0,
            vehicles: [],
          },

          loadingSlipSent: {
            count: 0,
            vehicles: [],
          },

          etpGenerating: {
            count: 0,
            vehicles: [],
          },

          etpDone: {
            count: 0,
            vehicles: [],
          },

          etpInvoiceDone: {
            count: 0,
            vehicles: [],
          },

          invoiceGenerating: {
            count: 0,
            vehicles: [],
          },

          notRegistered: {
            count: 0,
            vehicles: [],
          },

          dispatched: {
            count: 0,
            vehicles: [],
          },
        },

        /* ====================================================
           EMPTY STATUS VEHICLES
        ==================================================== */

        statusVehicles: createEmptyStatusVehicles(),

        /* ====================================================
           EMPTY ALERT DATA
        ==================================================== */

        vehicleAlerts: {
          total: 0,

          counts: {
            ETP_GENERATING: 0,
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
