import { NextResponse } from "next/server";
import getMongoClient from "@/app/lib/mongodb";
import { auth } from "@/auth";
import { customerVehicleFilter } from "@/app/utils/vehiclePermissions";

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

// Built once: constructing Intl.DateTimeFormat is slow, and
// isToday runs several times per vehicle.
const IST_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const isToday = (value?: string | Date | null): boolean => {
  if (!value) {
    return false;
  }

  /* ==========================================================
     TODAY IN IST
  ========================================================== */

  const todayIST = IST_DATE_FORMAT.format(new Date());

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

  const dateIST = IST_DATE_FORMAT.format(date);

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

    const client = await getMongoClient();

    const db = client.db(DB_NAME);

    const collection = db.collection<VehicleDocument>(COLLECTION_NAME);

    /* ========================================================
       LOAD VEHICLES

       Customers only see vehicles where they are the buyer.

       Counting needs only three fields, so the full documents
       (documents, tracking history, ...) are not loaded for
       every vehicle. Only alert vehicles are sent in full,
       since they open in the view / edit modals.
    ======================================================== */

    const session = await auth();

    const customerFilter = customerVehicleFilter(
      session?.user?.role,
      session?.user?.buyer,
    );

    const [vehicles, rawAlertVehicles] = await Promise.all([
      collection
        .find(customerFilter, {
          projection: { _id: 0, status: 1, createdAt: 1, outTime: 1 },
        })
        .toArray(),

      collection
        .find({
          $and: [customerFilter, { status: { $in: [...ALERT_STATUSES] } }],
        })
        .toArray(),
    ]);

    /* ========================================================
       TOTAL VEHICLES
    ======================================================== */

    const totalVehicles = vehicles.length;

    /* ========================================================
       TODAY / PREVIOUS / PREVIOUS PENDING

       today    = createdAt TODAY IST
       previous = createdAt NOT today

       previous pending = previous vehicle AND

       (
         status != DISPATCH_DONE
         OR outTime is empty
         OR DISPATCH_DONE + outTime TODAY
       )
    ======================================================== */

    let todayVehicles = 0;

    let previousVehicleCount = 0;

    let previousPendingVehicles = 0;

    /* ========================================================
       STATUS COUNTS
    ======================================================== */

    const status = createEmptyStatusCounts();

    /* ========================================================
       LOOP ALL VEHICLES
    ======================================================== */

    vehicles.forEach((vehicle) => {
      const currentStatus = vehicle.status;

      const outToday = !!vehicle.outTime && isToday(vehicle.outTime);

      if (isTodayCreatedVehicle(vehicle)) {
        todayVehicles++;
      } else {
        previousVehicleCount++;

        const isPreviousPending =
          currentStatus !== "DISPATCH_DONE" || !vehicle.outTime;

        const isPreviousDispatchedOutToday =
          currentStatus === "DISPATCH_DONE" && outToday;

        if (isPreviousPending || isPreviousDispatchedOutToday) {
          previousPendingVehicles++;
        }
      }

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

         ONLY COUNT IF outTime = TODAY IST.
         Older dispatches are not today's dispatch.
      ====================================================== */

      if (currentStatus === "DISPATCH_DONE") {
        if (outToday) {
          status.DISPATCH_DONE++;
        }

        return;
      }

      /* ======================================================
         OTHER STATUSES
      ====================================================== */

      status[currentStatus as keyof typeof status]++;
    });

    /* ========================================================
       ALERT VEHICLES
    ======================================================== */

    const alertVehicles = rawAlertVehicles.map(serializeVehicle);

    const alertCounts = {
      ON_HOLD: status.ON_HOLD,

      ETP_GENERATING: status.ETP_GENERATING,

      ETP_DONE: status.ETP_DONE,

      LOADING_SLIP_SENT: status.LOADING_SLIP_SENT,

      INVOICE_GENERATING: status.INVOICE_GENERATING,

      NOT_REGISTERED: status.NOT_REGISTERED,

      ETP_INVOICE_DONE: status.ETP_INVOICE_DONE,
    };

    /* ========================================================
       SUCCESS RESPONSE
    ======================================================== */

    return NextResponse.json({
      success: true,

      date: getTodayIST(),

      timezone: "Asia/Kolkata",

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
