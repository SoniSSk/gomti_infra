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

/**
 * Once a vehicle is dispatched it is locked: only a super admin
 * can edit or delete it.
 */
export const canModifyVehicle = (
    status: VehicleStatus | string | undefined,
    role?: string | null,
): boolean => status !== "DISPATCH_DONE" || isSuperAdminRole(role);
