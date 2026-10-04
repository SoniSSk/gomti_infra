import type { VehicleStatus } from "@/app/types/vehicle_new";

/** "superAdmin" / "Super Admin" / "super_admin" -> "superadmin" */
const normalizeRole = (role?: string | null): string =>
    role?.trim().toLowerCase().replace(/[\s_-]+/g, "") ?? "";

export const isSuperAdminRole = (role?: string | null): boolean =>
    normalizeRole(role) === "superadmin";

export const isEmployeeRole = (role?: string | null): boolean =>
    normalizeRole(role) === "employee";

/** Lab staff: the lab module only, no vehicles. */
export const isLabRole = (role?: string | null): boolean =>
    normalizeRole(role) === "lab";

/** Accounts staff: the accounts module only, no vehicles. */
export const isAccountsRole = (role?: string | null): boolean =>
    normalizeRole(role) === "accounts";

/** Generic customer, limited to the buyer saved on their account. */
export const isCustomerRole = (role?: string | null): boolean =>
    normalizeRole(role) === "customer";

/** Admin or super admin. */
export const isAdminRole = (role?: string | null): boolean =>
    ["admin", "superadmin"].includes(normalizeRole(role));

/*
 * Which modules a user can open is granted per user by a super
 * admin (see app/constant/dashboards.ts). The checks below only
 * decide what a role can do inside a module.
 */

/** Lab and accounts staff only view vehicles, even when granted dispatch. */
const isVehicleStaffRole = (role?: string | null): boolean =>
    !isLabRole(role) && !isAccountsRole(role);

/** User management (add / edit / remove accounts) is super admin only. */
export const canManageUsers = (role?: string | null): boolean =>
    isSuperAdminRole(role);

/** Employees, admins and super admins can register new vehicles. */
export const canAddVehicle = (role?: string | null): boolean =>
    isAdminRole(role) || isEmployeeRole(role);

/** Role saved at login; empty during SSR. */
export const getStoredUserRole = (): string => {
    if (typeof window === "undefined") {
        return "";
    }

    return localStorage.getItem("userRole") ?? "";
};

/** Client roles that can only view the vehicle list: no View / Edit actions. */
const READ_ONLY_ROLES = ["welspun", "evonith", "shreecement", "customer"];

export const isReadOnlyRole = (role?: string | null): boolean =>
    READ_ONLY_ROLES.includes(normalizeRole(role));

/** Customers only see the list; everyone else can open a vehicle. */
export const canViewVehicle = (role?: string | null): boolean =>
    !isReadOnlyRole(role);

/** Everyone except customers, lab and accounts staff can edit vehicles, employees included. */
export const canEditVehicles = (role?: string | null): boolean =>
    isVehicleStaffRole(role) && !isReadOnlyRole(role);

/** Customers and employees can't delete vehicles. */
export const canDeleteVehicles = (role?: string | null): boolean =>
    canEditVehicles(role) && !isEmployeeRole(role);

/** Dispatched vehicles are locked for everyone but a super admin. */
const isUnlocked = (
    status: VehicleStatus | string | undefined,
    role?: string | null,
): boolean => status !== "DISPATCH_DONE" || isSuperAdminRole(role);

/**
 * Can open this vehicle's View modal. Once dispatched,
 * only admins and super admins can (view only for admins).
 */
export const canViewVehicleDetails = (
    status: VehicleStatus | string | undefined,
    role?: string | null,
): boolean =>
    canViewVehicle(role) &&
    (status !== "DISPATCH_DONE" || isAdminRole(role));

/** Customer role -> the buyer name stored on their vehicles. */
const CUSTOMER_BUYERS: Record<string, string> = {
    welspun: "WELSPUN",
    evonith: "EVONITH",
    shreecement: "SHREE CEMENT",
};

/**
 * Buyer a customer is limited to, or null for internal roles.
 * The generic "customer" role uses the buyer saved on the user,
 * and gets "" (no vehicles) until one is set.
 */
export const getCustomerBuyer = (
    role?: string | null,
    buyer?: string | null,
): string | null =>
    isCustomerRole(role)
        ? buyer?.trim() ?? ""
        : CUSTOMER_BUYERS[normalizeRole(role)] ?? null;

const escapeRegex = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Mongo filter that limits a customer to their own vehicles.
 * Empty for internal roles, so they still see everything.
 */
export const customerVehicleFilter = (
    role?: string | null,
    buyer?: string | null,
) => {
    const customerBuyer = getCustomerBuyer(role, buyer);

    if (customerBuyer === null) {
        return {};
    }

    // A customer with no buyer linked matches nothing
    if (!customerBuyer) {
        return { _id: { $in: [] } };
    }

    return {
        buyerDetails: { $regex: escapeRegex(customerBuyer), $options: "i" },
    };
};

/**
 * Needs edit access, and once a vehicle is dispatched it is locked:
 * only a super admin can edit or delete it.
 */
export const canModifyVehicle = (
    status: VehicleStatus | string | undefined,
    role?: string | null,
): boolean => canEditVehicles(role) && isUnlocked(status, role);
