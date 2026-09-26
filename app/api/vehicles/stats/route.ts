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
  "ON_HOLD",
  "ETP_GENERATING",
  "ETP_DONE",
  "INVOICE_GENERATING",
  "ETP_INVOICE_DONE",
  "NOT_REGISTERED",
  "DISPATCH_DONE",
] as const;

/* ============================================================
   ALERT STATUSES
============================================================ */

const ALERT_STATUSES = [
  "ON_HOLD",
  "ETP_GENERATING",
  "ETP_DONE",
  "LOADING_SLIP_SENT",
  "INVOICE_GENERATING",
  "NOT_REGISTERED",
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

   1. DD-MM-YYYY
   2. DD-MM-YYYY HH:MM
   3. DD-MM-YYYY HH:MM AM/PM
   4. ISO DATE
   5. MongoDB Date
   6. JavaScript Date

   IMPORTANT:
   Everything is compared using Asia/Kolkata.

   This avoids dependency on Vercel/server timezone.
============================================================ */

const isToday = (value?: string | Date | null): boolean => {
  if (!value) {
    return false;
  }

  /* ==========================================================
     TODAY IN IST
  ========================================================== */

  const todayIST = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  let date: Date;

  /* ==========================================================
     JAVASCRIPT DATE
  ========================================================== */

  if (value instanceof Date) {
    date = value;
  } else {
    const dateString = String(value).trim();

    /* ========================================================
       DD-MM-YYYY HH:MM AM/PM

       Example:

       23-09-2026
       23-09-2026 12:15
       23-09-2026 12:15 AM
       23-09-2026 12:15 PM
    ======================================================== */

    const match = dateString.match(
      /^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?$/i,
    );

    if (match) {
      const [, day, month, year, hour = "0", minute = "0", ampm] = match;

      let hours = Number(hour);

      const minutes = Number(minute);

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

      /* ======================================================
         EXPLICIT IST OFFSET

         +05:30 = India Standard Time
      ====================================================== */

      const isoIST =
        `${year}-${month}-${day}T` +
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:00` +
        `+05:30`;

      date = new Date(isoIST);
    } else {
      /* ======================================================
         ISO / MONGODB DATE
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

     IMPORTANT:
     Never use server timezone here.
  ========================================================== */

  const dateIST = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  /* ==========================================================
     COMPARE

     Example:

     todayIST = 09/23/2026

     dateIST  = 09/23/2026

     => true
  ========================================================== */

  return dateIST === todayIST;
};

/* ============================================================
   TODAY VEHICLE

   ONLY createdAt is checked.

   createdAt TODAY
   =
   TODAY VEHICLE
============================================================ */

const isTodayCreatedVehicle = (vehicle: VehicleDocument): boolean => {
  return isToday(vehicle.createdAt);
};

/* ============================================================
   PREVIOUS VEHICLE

   createdAt NOT today
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
  ON_HOLD: 0,
  ETP_GENERATING: 0,
  ETP_DONE: 0,
  ETP_INVOICE_DONE: 0,
  INVOICE_GENERATING: 0,
  NOT_REGISTERED: 0,
  DISPATCH_DONE: 0,
});

/* ============================================================
   STATUS VEHICLE MAP
============================================================ */

type StatusVehicleMap = {
  [key in (typeof VEHICLE_STATUSES)[number]]: VehicleDocument[];
};

/* ============================================================
   EMPTY STATUS VEHICLE MAP
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
  NOT_REGISTERED: [],
  DISPATCH_DONE: [],
  ON_HOLD: [],
});

/* ============================================================
   SERIALIZE VEHICLE

   Converts MongoDB ObjectId into string.
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
       TODAY VEHICLES

       ONLY createdAt = TODAY IST
    ======================================================== */

    const todayVehicleList = vehicles.filter((vehicle) =>
      isTodayCreatedVehicle(vehicle),
    );

    const todayVehicles = todayVehicleList.length;

    /* ========================================================
       PREVIOUS VEHICLES

       createdAt != TODAY IST
    ======================================================== */

    const previousVehicleList = vehicles.filter((vehicle) =>
      isPreviousVehicle(vehicle),
    );

    const previousVehicleCount = previousVehicleList.length;

    /* ========================================================
       PREVIOUS PENDING VEHICLES

       Previous vehicle AND

       (
         status != DISPATCH_DONE
         OR outTime is empty
         OR DISPATCH_DONE + outTime TODAY
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
    ======================================================== */

    vehicles.forEach((vehicle) => {
      const currentStatus = vehicle.status;

      /* ======================================================
         INVALID / UNKNOWN STATUS
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

         VERY IMPORTANT:

         ONLY COUNT IF:

         status = DISPATCH_DONE

         AND

         outTime = TODAY IST
      ====================================================== */

      if (
        currentStatus === "DISPATCH_DONE" &&
        vehicle.outTime &&
        isToday(vehicle.outTime)
      ) {
        status.DISPATCH_DONE++;

        statusVehicles.DISPATCH_DONE.push(vehicle);

        return;
      }

      /* ======================================================
         DISPATCH DONE BUT OLD DATE

         Do NOT count it in today's dispatch.
      ====================================================== */

      if (currentStatus === "DISPATCH_DONE") {
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
      ON_HOLD: statusVehicles.ON_HOLD.length,

      ETP_GENERATING: statusVehicles.ETP_GENERATING.length,

      ETP_DONE: statusVehicles.ETP_DONE.length,

      LOADING_SLIP_SENT: statusVehicles.LOADING_SLIP_SENT.length,

      INVOICE_GENERATING: statusVehicles.INVOICE_GENERATING.length,

      NOT_REGISTERED: statusVehicles.NOT_REGISTERED.length,

      ETP_INVOICE_DONE: statusVehicles.ETP_INVOICE_DONE.length,
    };

    /* ========================================================
       SEGREGATION

       Every category contains:

       count
       vehicles
    ======================================================== */

    const segregation = {
      /* ======================================================
         TODAY
      ====================================================== */

      today: {
        count: todayVehicleList.length,

        vehicles: todayVehicleList,
      },

      /* ======================================================
         PREVIOUS
      ====================================================== */

      previous: {
        count: previousVehicleList.length,

        vehicles: previousVehicleList,
      },

      /* ======================================================
         PREVIOUS PENDING
      ====================================================== */

      previousPending: {
        count: previousPendingVehicleList.length,

        vehicles: previousPendingVehicleList,
      },

      /* ======================================================
         WAITING FOR DETAILS
      ====================================================== */

      waitingForDetails: {
        count: statusVehicles.WAITING_FOR_DETAILS.length,

        vehicles: statusVehicles.WAITING_FOR_DETAILS,
      },

      /* ======================================================
         ENTRY DONE
      ====================================================== */

      entryDone: {
        count: statusVehicles.ENTRY_DONE.length,

        vehicles: statusVehicles.ENTRY_DONE,
      },

      /* ======================================================
         LOADING STARTED
      ====================================================== */

      loadingStarted: {
        count: statusVehicles.LOADING_STARTED.length,

        vehicles: statusVehicles.LOADING_STARTED,
      },

      /* ======================================================
         LOADING DONE
      ====================================================== */

      loadingDone: {
        count: statusVehicles.LOADING_DONE.length,

        vehicles: statusVehicles.LOADING_DONE,
      },

      /* ======================================================
         LOADING SLIP SENT
      ====================================================== */

      loadingSlipSent: {
        count: statusVehicles.LOADING_SLIP_SENT.length,

        vehicles: statusVehicles.LOADING_SLIP_SENT,
      },

      /* ======================================================
         ON HOLD
      ====================================================== */

      onHold: {
        count: statusVehicles.ON_HOLD.length,

        vehicles: statusVehicles.ON_HOLD,
      },

      /* ======================================================
         ETP GENERATING
      ====================================================== */

      etpGenerating: {
        count: statusVehicles.ETP_GENERATING.length,

        vehicles: statusVehicles.ETP_GENERATING,
      },

      /* ======================================================
         ETP DONE
      ====================================================== */

      etpDone: {
        count: statusVehicles.ETP_DONE.length,

        vehicles: statusVehicles.ETP_DONE,
      },

      /* ======================================================
         ETP + INVOICE DONE
      ====================================================== */

      etpInvoiceDone: {
        count: statusVehicles.ETP_INVOICE_DONE.length,

        vehicles: statusVehicles.ETP_INVOICE_DONE,
      },

      /* ======================================================
         INVOICE GENERATING
      ====================================================== */

      invoiceGenerating: {
        count: statusVehicles.INVOICE_GENERATING.length,

        vehicles: statusVehicles.INVOICE_GENERATING,
      },

      /* ======================================================
         NOT REGISTERED
      ====================================================== */

      notRegistered: {
        count: statusVehicles.NOT_REGISTERED.length,

        vehicles: statusVehicles.NOT_REGISTERED,
      },

      /* ======================================================
         DISPATCHED

         ONLY:

         status = DISPATCH_DONE
         AND
         outTime = TODAY IST
      ====================================================== */

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

         Existing structure maintained.
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
           STATUS COUNTS
        ----------------------------------------------- */

        waitingForDetails: status.WAITING_FOR_DETAILS,

        entryDone: status.ENTRY_DONE,

        loadingStarted: status.LOADING_STARTED,

        loadingDone: status.LOADING_DONE,

        loadingSlipSent: status.LOADING_SLIP_SENT,

        onHold: status.ON_HOLD,

        etpGenerating: status.ETP_GENERATING,

        etpDone: status.ETP_DONE,

        etpInvoiceDone: status.ETP_INVOICE_DONE,

        invoiceGenerating: status.INVOICE_GENERATING,

        notRegistered: status.NOT_REGISTERED,

        dispatchDone: status.DISPATCH_DONE,

        /* -----------------------------------------------
           COMPLETE STATUS COUNTS
        ----------------------------------------------- */

        status,
      },

      /* ======================================================
         NEW SEGREGATED VEHICLE DATA
      ====================================================== */

      segregation,

      /* ======================================================
         STATUS VEHICLES
      ====================================================== */

      statusVehicles,

      /* ======================================================
         ALERT VEHICLES
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

          onHold: 0,

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

          onHold: {
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
            NOT_REGISTERED: 0,
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
