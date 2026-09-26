/* eslint-disable @typescript-eslint/no-explicit-any */
import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

const DB_NAME = "gomti_infra";

const getISTDateParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
};

const getISTDayRange = (date = new Date()) => {
  const { year, month, day } = getISTDateParts(date);

  // IST = UTC + 5:30
  const start = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0) - 5.5 * 60 * 60 * 1000,
  );

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return {
    start,
    end,
  };
};

const formatDateForOutTime = (date: Date) => {
  const { year, month, day } = getISTDateParts(date);

  return `${String(day).padStart(2, "0")}-${String(month).padStart(
    2,
    "0",
  )}-${year}`;
};

/*
 * createdAt is a Date for vehicles saved by POST, but older edits
 * wrote it back as an ISO string. A plain { $gte: Date } skips
 * strings, so convert before comparing.
 */
const createdAtBetween = (start: Date, end: Date) => {
  const createdAt = {
    $convert: {
      input: "$createdAt",
      to: "date",
      onError: null,
      onNull: null,
    },
  };

  return {
    $expr: {
      $and: [{ $gte: [createdAt, start] }, { $lt: [createdAt, end] }],
    },
  };
};

/*
 * Same "pending" rule as /api/vehicles/stats: anything not
 * dispatched, or dispatched without an outTime.
 */
const pendingQuery = {
  $or: [
    { status: { $ne: "DISPATCH_DONE" } },
    { outTime: { $in: ["", null] } },
  ],
};

const getLast7DaysRange = () => {
  const today = new Date();

  const { start } = getISTDayRange(today);

  const last7Start = new Date(start.getTime() - 6 * 24 * 60 * 60 * 1000);

  const { end } = getISTDayRange(today);

  return {
    start: last7Start,
    end,
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;

const MAX_CUSTOM_RANGE_DAYS = 366;

/*
 * Accepts YYYY-MM-DD or DD-MM-YYYY. Returns the calendar day as
 * UTC midnight, or null if it isn't a real date.
 */
const parseCustomDate = (value: string) => {
  const parts = value.split("-");

  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] =
    parts[0].length === 4
      ? parts.map(Number)
      : [Number(parts[2]), Number(parts[1]), Number(parts[0])];

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const dateFilter = searchParams.get("dateFilter") || "today";
    const customDate = searchParams.get("date");

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    let query: any = {};

    // ============================================================
    // 1. TODAY
    // ============================================================
    if (dateFilter === "today") {
      const { start, end } = getISTDayRange();

      const todayDate = formatDateForOutTime(new Date());

      query = {
        $or: [
          // ------------------------------------------------------
          // 1.1 Created today
          // ------------------------------------------------------
          createdAtBetween(start, end),

          // ------------------------------------------------------
          // 1.2 Old vehicle + still pending
          // ------------------------------------------------------
          pendingQuery,

          // ------------------------------------------------------
          // 1.3 Dispatched today based on outTime
          // ------------------------------------------------------
          {
            outTime: {
              $regex: `^${todayDate}`,
            },
            status: "DISPATCH_DONE",
          },
        ],
      };
    }

    // ============================================================
    // 2. LAST 7 DAYS
    // ============================================================
    else if (dateFilter === "last7days") {
      const { start, end } = getLast7DaysRange();

      // If outTime is stored as:
      // DD-MM-YYYY HH:MM AM/PM
      // then we need to match each of the last 7 dates.

      // start is IST midnight (18:30 UTC the day before), so the
      // dates must be read in IST, not UTC.
      const outTimeDates = Array.from({ length: 7 }, (_, i) =>
        formatDateForOutTime(
          new Date(start.getTime() + i * 24 * 60 * 60 * 1000),
        ),
      );

      query = {
        $or: [
          // ========================================================
          // 1. CREATED IN LAST 7 DAYS
          // ========================================================
          createdAtBetween(start, end),

          // ========================================================
          // 2. OUT TIME IN LAST 7 DAYS
          // ========================================================
          {
            $or: outTimeDates.map((date) => ({
              outTime: {
                $regex: `^${date}`,
              },
            })),
          },

          // ========================================================
          // 3. OLD PENDING VEHICLES
          // ========================================================
          pendingQuery,
        ],
      };
    }

    // ============================================================
    // 3. CUSTOM RANGE
    // ============================================================
    else if (dateFilter === "custom") {
      // startDate/endDate are inclusive. A lone "date" is kept for
      // older callers and means a single-day range.
      const startParam = searchParams.get("startDate") || customDate;
      const endParam = searchParams.get("endDate") || startParam;

      if (!startParam || !endParam) {
        return NextResponse.json(
          {
            success: false,
            message: "Custom start and end dates are required",
          },
          { status: 400 },
        );
      }

      const startDate = parseCustomDate(startParam);
      const endDate = parseCustomDate(endParam);

      if (!startDate || !endDate) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid custom date. Use YYYY-MM-DD or DD-MM-YYYY.",
          },
          { status: 400 },
        );
      }

      const days =
        Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;

      if (days < 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Start date must be on or before end date",
          },
          { status: 400 },
        );
      }

      if (days > MAX_CUSTOM_RANGE_DAYS) {
        return NextResponse.json(
          {
            success: false,
            message: `Custom range can't exceed ${MAX_CUSTOM_RANGE_DAYS} days`,
          },
          { status: 400 },
        );
      }

      // outTime is stored as "DD-MM-YYYY HH:MM AM/PM", so match
      // each day in the range by prefix.
      const outTimeDates = Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate.getTime() + i * DAY_MS);

        return `${String(date.getUTCDate()).padStart(2, "0")}-${String(
          date.getUTCMonth() + 1,
        ).padStart(2, "0")}-${date.getUTCFullYear()}`;
      });

      // ------------------------------------------------------
      // IMPORTANT:
      //
      // Custom filter checks ONLY outTime.
      //
      // createdAt is NOT used here.
      // ------------------------------------------------------
      query = {
        outTime: {
          $regex: `^(${outTimeDates.join("|")})`,
        },
        status: "DISPATCH_DONE",
      };
    }

    // ============================================================
    // 4. ALL
    // ============================================================
    else if (dateFilter === "all") {
      query = {};
    }

    // ============================================================
    // INVALID FILTER
    // ============================================================
    else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid dateFilter. Use today, last7days, custom or all.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // DATABASE QUERY
    // ============================================================
    const vehicles = await db
      .collection("vehicles")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      dateFilter,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    console.error("GET /api/vehicles error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch vehicles",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("gomti_infra");

    const result = await db.collection("vehicles").insertOne({
      ...body,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        insertedId: result.insertedId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save vehicle" },
      { status: 500 },
    );
  }
}
