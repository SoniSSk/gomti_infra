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
          {
            createdAt: {
              $gte: start,
              $lt: end,
            },
          },

          // ------------------------------------------------------
          // 1.2 Old vehicle + still pending
          // ------------------------------------------------------

          {
            outTime: {
              $in: ["", null],
            },
            status: {
              $ne: "DISPATCH_DONE",
            },
          },

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

      const outTimeDates: string[] = [];

      const currentDate = new Date(start);

      while (currentDate < end) {
        const day = String(currentDate.getUTCDate()).padStart(2, "0");
        const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
        const year = currentDate.getUTCFullYear();

        outTimeDates.push(`${day}-${month}-${year}`);

        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }

      query = {
        $or: [
          // ========================================================
          // 1. CREATED IN LAST 7 DAYS
          // ========================================================
          {
            createdAt: {
              $gte: start,
              $lt: end,
            },
          },

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
          {
            outTime: {
              $in: ["", null],
            },
            status: {
              $ne: "DISPATCH_DONE",
            },
          },
        ],
      };
    }

    // ============================================================
    // 3. CUSTOM DATE
    // ============================================================
    else if (dateFilter === "custom") {
      if (!customDate) {
        return NextResponse.json(
          {
            success: false,
            message: "Custom date is required",
          },
          { status: 400 },
        );
      }

      /*
        Expected:

        2026-09-06

        OR

        06-09-2026
      */

      const parts = customDate.split("-");

      if (parts.length !== 3) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid custom date format",
          },
          { status: 400 },
        );
      }

      let day: number;
      let month: number;
      let year: number;

      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);
      } else {
        // DD-MM-YYYY
        day = Number(parts[0]);
        month = Number(parts[1]);
        year = Number(parts[2]);
      }

      // ------------------------------------------------------
      // Validate date
      // ------------------------------------------------------
      const selectedDate = new Date(year, month - 1, day);

      if (
        Number.isNaN(selectedDate.getTime()) ||
        selectedDate.getFullYear() !== year ||
        selectedDate.getMonth() !== month - 1 ||
        selectedDate.getDate() !== day
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid custom date",
          },
          { status: 400 },
        );
      }

      // ------------------------------------------------------
      // DD-MM-YYYY
      // ------------------------------------------------------
      const outTimeDate = `${String(day).padStart(
        2,
        "0",
      )}-${String(month).padStart(2, "0")}-${year}`;

      // ------------------------------------------------------
      // IMPORTANT:
      //
      // Custom filter checks ONLY outTime.
      //
      // createdAt is NOT used here.
      // ------------------------------------------------------
      query = {
        outTime: {
          $regex: `^${outTimeDate}`,
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
