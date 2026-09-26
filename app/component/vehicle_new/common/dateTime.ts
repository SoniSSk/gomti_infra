/* =========================================================
   DATE / TIME PARSING

   createdAt is ISO; inTime / outTime are stored as
   "DD-MM-YYYY hh:mm AM/PM", which Date() cannot parse.
========================================================= */

export interface ParsedDateTime {
    date: string;
    time: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

const TIME_FORMAT = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
});

const DMY_PATTERN =
    /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*([AP]M)$/i;

const toDate = (value?: string | null): Date | null => {
    if (!value) {
        return null;
    }

    const text = String(value).trim();
    const match = DMY_PATTERN.exec(text);

    if (!match) {
        return new Date(text);
    }

    const [, day, month, year, hour, minute, meridiem] = match;
    let hours = Number(hour) % 12;

    if (meridiem.toUpperCase() === "PM") {
        hours += 12;
    }

    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        hours,
        Number(minute),
    );
};

export const parseDateTime = (value?: string | null): ParsedDateTime | null => {
    const date = toDate(value);

    if (!date) {
        return null;
    }

    if (Number.isNaN(date.getTime())) {
        return { date: String(value).trim(), time: "" };
    }

    return {
        date: DATE_FORMAT.format(date),
        time: TIME_FORMAT.format(date).toUpperCase(),
    };
};

const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
});

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now", "15m ago", "3h ago", "2d ago"; older than a week -> "12 Sept". */
export const formatRelativeTime = (
    value?: string | null,
    now: number = Date.now(),
): string => {
    const date = toDate(value);

    if (!date || Number.isNaN(date.getTime())) {
        return value ? String(value).trim() : "";
    }

    const diff = now - date.getTime();

    if (diff < MINUTE) {
        return "just now";
    }

    if (diff < HOUR) {
        return `${Math.floor(diff / MINUTE)}m ago`;
    }

    if (diff < DAY) {
        return `${Math.floor(diff / HOUR)}h ago`;
    }

    if (diff < 7 * DAY) {
        return `${Math.floor(diff / DAY)}d ago`;
    }

    return SHORT_DATE_FORMAT.format(date);
};

/** "26 Sept 2026, 10:05 AM" or "—"-friendly empty string. */
export const formatDateTime = (value?: string | null): string => {
    const parsed = parseDateTime(value);

    if (!parsed) {
        return "";
    }

    return parsed.time ? `${parsed.date}, ${parsed.time}` : parsed.date;
};
