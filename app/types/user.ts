/** A user account as returned by /api/users (never includes the password). */
export interface UserObject {
  id: string;
  name: string;
  email: string;
  role: string;
  /** Only for the "customer" role: the buyer whose vehicles they see. */
  buyer?: string;
  /** false blocks sign-in; missing means active (older accounts). */
  active?: boolean;
  /** Dashboard keys this user can open (see DASHBOARDS); none by default. */
  dashboards?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  updatedBy?: string;
  lastLoginAt?: Date | string | null;
  lastLoginDevice?: string | null;
  passwordUpdatedAt?: Date | string | null;
}

/*
 * Roles a super admin can assign. Values are what gets stored;
 * permission checks normalize, so "superAdmin" and "superadmin" match.
 */
export const USER_ROLES = [
  { value: "superadmin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "employee", label: "Employee" },
  { value: "lab", label: "Lab" },
  { value: "accounts", label: "Accounts" },
  { value: "customer", label: "Customer" },
  { value: "welspun", label: "Welspun" },
  { value: "shreecement", label: "Shree Cement" },
  { value: "evonith", label: "Evonith" },
] as const;

export type UserRole = (typeof USER_ROLES)[number]["value"];

/** "superAdmin" / "Super Admin" / "super_admin" -> "superadmin" */
export const toUserRole = (role?: string | null): UserRole | "" => {
  const normalized = role?.trim().toLowerCase().replace(/[\s_-]+/g, "") ?? "";

  return USER_ROLES.find(({ value }) => value === normalized)?.value ?? "";
};

export const USER_ROLE_LABELS: Record<string, string> = Object.fromEntries(
  USER_ROLES.map(({ value, label }) => [value, label]),
);

export const MIN_PASSWORD_LENGTH = 8;

/** Pass a user's `active` field; only an explicit false is inactive. */
export const isUserActive = (active?: unknown): boolean => active !== false;

/** signIn() error code for a deactivated account. */
export const INACTIVE_USER_CODE = "inactive";
