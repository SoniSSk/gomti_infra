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

export const parseDateTime = (value?: string | null): ParsedDateTime | null => {
    if (!value) {
        return null;
    }

    const text = String(value).trim();
    const match = DMY_PATTERN.exec(text);

    let date: Date;

    if (match) {
        const [, day, month, year, hour, minute, meridiem] = match;
        let hours = Number(hour) % 12;

        if (meridiem.toUpperCase() === "PM") {
            hours += 12;
        }

        date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            hours,
            Number(minute),
        );
    } else {
        date = new Date(text);
    }

    if (Number.isNaN(date.getTime())) {
        return { date: text, time: "" };
    }

    return {
        date: DATE_FORMAT.format(date),
        time: TIME_FORMAT.format(date).toUpperCase(),
    };
};

/** "26 Sept 2026, 10:05 AM" or "—"-friendly empty string. */
export const formatDateTime = (value?: string | null): string => {
    const parsed = parseDateTime(value);

    if (!parsed) {
        return "";
    }

    return parsed.time ? `${parsed.date}, ${parsed.time}` : parsed.date;
};
