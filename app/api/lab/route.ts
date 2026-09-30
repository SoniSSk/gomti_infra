/* eslint-disable @typescript-eslint/no-explicit-any */
import getMongoClient from "@/app/lib/mongodb";
import { auth } from "@/auth";
import { canAccessLab } from "@/app/utils/vehiclePermissions";
import { NextRequest, NextResponse } from "next/server";

const DB_NAME = "gomti_infra";
const COLLECTION = "lab";

const DAY_MS = 24 * 60 * 60 * 1000;

const MAX_CUSTOM_RANGE_DAYS = 366;

/* IST midnight -> next IST midnight, as UTC instants. */
const getISTDayRange = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  // IST = UTC + 5:30
  const start = new Date(
    Date.UTC(get("year"), get("month") - 1, get("day")) - 5.5 * 60 * 60 * 1000,
  );

  return { start, end: new Date(start.getTime() + DAY_MS) };
};

/*
 * createdAt may be a Date or an ISO string, and a plain
 * { $gte: Date } skips strings, so convert before comparing.
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

/* Samples still waiting on a report stay visible on every date filter. */
const pendingQuery = {
  status: { $nin: ["REPORT_DONE", "CANCELLED"] },
};

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

const badRequest = (message: string) =>
  NextResponse.json({ success: false, message }, { status: 400 });

const forbidden = (message: string) =>
  NextResponse.json({ success: false, message }, { status: 403 });

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!canAccessLab(session?.user?.role)) {
      return forbidden("You don't have permission to view lab records");
    }

    const { searchParams } = new URL(request.url);

    const dateFilter = searchParams.get("dateFilter") || "today";

    let query: any = {};

    // ============================================================
    // 1. TODAY: created today + anything still pending
    // ============================================================
    if (dateFilter === "today") {
      const { start, end } = getISTDayRange();

      query = { $or: [createdAtBetween(start, end), pendingQuery] };
    }

    // ============================================================
    // 2. LAST 7 DAYS: created in the window + anything still pending
    // ============================================================
    else if (dateFilter === "last7days") {
      const { start: todayStart, end } = getISTDayRange();
      const start = new Date(todayStart.getTime() - 6 * DAY_MS);

      query = { $or: [createdAtBetween(start, end), pendingQuery] };
    }

    // ============================================================
    // 3. CUSTOM RANGE (inclusive, by createdAt only)
    // ============================================================
    else if (dateFilter === "custom") {
      const startParam = searchParams.get("startDate");
      const endParam = searchParams.get("endDate") || startParam;

      if (!startParam || !endParam) {
        return badRequest("Custom start and end dates are required");
      }

      const startDate = parseCustomDate(startParam);
      const endDate = parseCustomDate(endParam);

      if (!startDate || !endDate) {
        return badRequest("Invalid custom date. Use YYYY-MM-DD or DD-MM-YYYY.");
      }

      const days =
        Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;

      if (days < 1) {
        return badRequest("Start date must be on or before end date");
      }

      if (days > MAX_CUSTOM_RANGE_DAYS) {
        return badRequest(
          `Custom range can't exceed ${MAX_CUSTOM_RANGE_DAYS} days`,
        );
      }

      // Calendar days are IST, so shift UTC midnight back 5:30
      const start = new Date(startDate.getTime() - 5.5 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + days * DAY_MS);

      query = createdAtBetween(start, end);
    }

    // ============================================================
    // 4. ALL
    // ============================================================
    else if (dateFilter !== "all") {
      return badRequest(
        "Invalid dateFilter. Use today, last7days, custom or all.",
      );
    }

    const client = await getMongoClient();

    const labs = await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      dateFilter,
      count: labs.length,
      labs,
    });
  } catch (error) {
    console.error("GET /api/lab error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch lab records" },
      { status: 500 },
    );
  }
}

/* Fields logged to updateHistory when a record is created. */
const CREATE_HISTORY_FIELDS = [
  "status",
  "lot",
  "lotDescription",
  "size",
  "assignedBy",
  "assignedTo",
  "expectedReportAt",
] as const;

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!canAccessLab(session?.user?.role)) {
      return forbidden("You don't have permission to add lab records");
    }

    const body = await req.json();

    const userName = session?.user?.name ?? session?.user?.email ?? "";

    const now = new Date();

    const record = {
      status: "WAITING_FOR_DETAILS",
      report: {},
      documents: {},
      ...body,
      sno: body.sno ?? Date.now(),
      // Always the logged-in user, whatever the client sent
      userCreated: userName,
      assignedBy: userName,
      createdBy: userName,
      createdAt: now,
    };

    // The create is the first entry in the history: one per field it set
    const updateHistory = CREATE_HISTORY_FIELDS.filter(
      (field) => record[field] !== undefined && record[field] !== "",
    ).map((field) => ({
      field,
      oldValue: null,
      newValue: record[field],
      updatedBy: userName,
      updatedAt: now,
    }));

    const client = await getMongoClient();

    const result = await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .insertOne({ ...record, updateHistory });

    return NextResponse.json(
      { success: true, insertedId: result.insertedId },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/lab error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save lab record" },
      { status: 500 },
    );
  }
}
