import type { VehicleStatus } from "@/app/types/vehicle_new";

/** "superAdmin" / "Super Admin" / "super_admin" -> "superadmin" */
const normalizeRole = (role?: string | null): string =>
    role?.trim().toLowerCase().replace(/[\s_-]+/g, "") ?? "";

export const isSuperAdminRole = (role?: string | null): boolean =>
    normalizeRole(role) === "superadmin";

/** Role saved at login; empty during SSR. */
export const getStoredUserRole = (): string => {
    if (typeof window === "undefined") {
        return "";
    }

    return localStorage.getItem("userRole") ?? "";
};

/** Client roles that can only view the vehicle list: no View / Edit actions. */
const READ_ONLY_ROLES = ["welspun", "evonith", "shreecement"];

export const isReadOnlyRole = (role?: string | null): boolean =>
    READ_ONLY_ROLES.includes(normalizeRole(role));

/** Customer role -> the buyer name stored on their vehicles. */
const CUSTOMER_BUYERS: Record<string, string> = {
    welspun: "WELSPUN",
    evonith: "EVONITH",
    shreecement: "SHREE CEMENT",
};

/** Buyer a customer is limited to, or null for internal roles. */
export const getCustomerBuyer = (role?: string | null): string | null =>
    CUSTOMER_BUYERS[normalizeRole(role)] ?? null;

/**
 * Mongo filter that limits a customer to their own vehicles.
 * Empty for internal roles, so they still see everything.
 */
export const customerVehicleFilter = (role?: string | null) => {
    const buyer = getCustomerBuyer(role);

    return buyer
        ? { buyerDetails: { $regex: buyer, $options: "i" } }
        : {};
};

/**
 * Once a vehicle is dispatched it is locked: only a super admin
 * can edit or delete it.
 */
export const canModifyVehicle = (
    status: VehicleStatus | string | undefined,
    role?: string | null,
): boolean => status !== "DISPATCH_DONE" || isSuperAdminRole(role);
