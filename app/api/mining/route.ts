/* eslint-disable @typescript-eslint/no-explicit-any */
import getMongoClient from "@/app/lib/mongodb";
import { auth } from "@/auth";
import { canOpenDashboard } from "@/app/lib/users";
import { MINING_DASHBOARD } from "@/app/constant/dashboards";
import {
  OPEN_MINING_STATUSES,
  validateMining,
  type MiningInput,
} from "@/app/types/mining";
import { buildMiningFields } from "@/app/lib/mining";
import { NextRequest, NextResponse } from "next/server";

const DB_NAME = "gomti_infra";
const COLLECTION = "mining";

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

/* Trips still loading or on the road stay visible on every date filter. */
const openQuery = {
  status: { $in: OPEN_MINING_STATUSES },
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

    if (!(await canOpenDashboard(session?.user, MINING_DASHBOARD))) {
      return forbidden("You don't have permission to view mining trips");
    }

    const { searchParams } = new URL(request.url);

    const dateFilter = searchParams.get("dateFilter") || "today";

    let query: any = {};

    // ============================================================
    // 1. TODAY: created today + anything still open
    // ============================================================
    if (dateFilter === "today") {
      const { start, end } = getISTDayRange();

      query = { $or: [createdAtBetween(start, end), openQuery] };
    }

    // ============================================================
    // 2. LAST 7 DAYS: created in the window + anything still open
    // ============================================================
    else if (dateFilter === "last7days") {
      const { start: todayStart, end } = getISTDayRange();
      const start = new Date(todayStart.getTime() - 6 * DAY_MS);

      query = { $or: [createdAtBetween(start, end), openQuery] };
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

    const trips = await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      dateFilter,
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error("GET /api/mining error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch mining trips" },
      { status: 500 },
    );
  }
}

/* Fields logged to updateHistory when a trip is created. */
const CREATE_HISTORY_FIELDS = [
  "status",
  "vehicleNo",
  "miningType",
  "lot",
  "size",
  "loadingPoint",
  "loadingPerson",
  "loadedAt",
  "unloadingPoint",
  "unloadingPerson",
  "unloadedAt",
  "emptyWeight",
  "loadedWeight",
  "actualWeight",
  "weightSlip",
  "files",
] as const;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!(await canOpenDashboard(session?.user, MINING_DASHBOARD))) {
      return forbidden("You don't have permission to add mining trips");
    }

    const body: MiningInput = await req.json().catch(() => null);

    const problem = validateMining(body);

    if (problem) {
      return badRequest(problem);
    }

    const userName = session?.user?.name ?? session?.user?.email ?? "";
    const now = new Date();
    const sno = Date.now();

    // Cleared optional fields are left out rather than stored empty
    const fields = Object.fromEntries(
      Object.entries(buildMiningFields(body, userName, now)).filter(
        ([, value]) => value !== undefined && value !== "",
      ),
    ) as Record<string, unknown>;

    const record = {
      ...fields,
      id: `MIN-${sno}`,
      sno,
      // Always the logged-in user, whatever the client sent
      createdBy: userName,
      createdAt: now,
    };

    // The create is the first entry in the history: one per field it set
    const updateHistory = CREATE_HISTORY_FIELDS.filter(
      (field) => fields[field] !== undefined,
    ).map((field) => ({
      field,
      oldValue: null,
      newValue: fields[field],
      updatedBy: userName,
      updatedAt: now,
    }));

    const client = await getMongoClient();

    const result = await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .insertOne({ ...record, updateHistory });

    return NextResponse.json(
      { success: true, message: "Trip added", insertedId: result.insertedId },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/mining error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save mining trip" },
      { status: 500 },
    );
  }
}
