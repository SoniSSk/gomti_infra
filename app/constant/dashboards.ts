import { ACCOUNT_BOOKS } from "@/app/types/accounts";
import { isSuperAdminRole } from "@/app/utils/vehiclePermissions";

/*
 * Dashboards a super admin can grant per user. Keys are stored on
 * the user's `dashboards` field; a user with none can't open any.
 * Super admins can open every dashboard, plus User Management.
 *
 * No icons here so the proxy and API routes can import it.
 */

export interface Dashboard {
    key: string;
    label: string;
}

/** Dashboard key for an account book, e.g. "accounts-gimpl". */
export const accountsDashboardKey = (bookKey: string): string =>
    `accounts-${bookKey}`;

export const VEHICLES_DASHBOARD = "vehicles";
export const LAB_DASHBOARD = "lab";
export const MINING_DASHBOARD = "mining";

export const DASHBOARDS: Dashboard[] = [
    { key: VEHICLES_DASHBOARD, label: "Vehicle Dispatch" },
    { key: LAB_DASHBOARD, label: "Lab" },
    { key: MINING_DASHBOARD, label: "Mining" },
    ...Object.values(ACCOUNT_BOOKS).map(({ key, title }) => ({
        key: accountsDashboardKey(key),
        label: title,
    })),
];

export const ALL_DASHBOARD_KEYS = DASHBOARDS.map(({ key }) => key);

export const DASHBOARD_LABELS: Record<string, string> = Object.fromEntries(
    DASHBOARDS.map(({ key, label }) => [key, label]),
);

/** Keeps known keys only, deduped, in DASHBOARDS order. */
export const toDashboardKeys = (value: unknown): string[] =>
    Array.isArray(value)
        ? ALL_DASHBOARD_KEYS.filter((key) => value.includes(key))
        : [];

/** Dashboards this user can open: all for a super admin, else their grants. */
export const getUserDashboardKeys = (
    role?: string | null,
    dashboards?: unknown,
): string[] =>
    isSuperAdminRole(role) ? ALL_DASHBOARD_KEYS : toDashboardKeys(dashboards);
