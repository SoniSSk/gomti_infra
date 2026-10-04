/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import getMongoClient from "@/app/lib/mongodb";
import { getUserDashboardKeys } from "@/app/constant/dashboards";
import { isSuperAdminRole } from "@/app/utils/vehiclePermissions";

export const USERS_DB = "gomti_infra";
export const USERS_COLLECTION = "users";

/* Everything the table needs; the password hash never leaves the server. */
export const USER_PROJECTION = {
  name: 1,
  email: 1,
  role: 1,
  buyer: 1,
  active: 1,
  dashboards: 1,
  createdAt: 1,
  updatedAt: 1,
  updatedBy: 1,
  lastLoginAt: 1,
  lastLoginDevice: 1,
  passwordUpdatedAt: 1,
} as const;

export const toUserResponse = ({ _id, ...user }: any) => ({
  id: _id.toString(),
  ...user,
});

export const forbiddenUsersResponse = () =>
  NextResponse.json(
    { success: false, message: "Only a super admin can manage users" },
    { status: 403 },
  );

/*
 * Dashboards the signed-in user can open, read from the database
 * rather than the session so a super admin's changes apply on the
 * user's next request, without signing in again.
 */
export const getSessionDashboards = async (
  user?: { id?: string | null; role?: string | null } | null,
): Promise<string[]> => {
  if (isSuperAdminRole(user?.role)) {
    return getUserDashboardKeys(user?.role);
  }

  if (!user?.id || !ObjectId.isValid(user.id)) {
    return [];
  }

  const client = await getMongoClient();
  const doc = await client
    .db(USERS_DB)
    .collection(USERS_COLLECTION)
    .findOne({ _id: new ObjectId(user.id) }, { projection: { dashboards: 1 } });

  return getUserDashboardKeys(user.role, doc?.dashboards);
};

/** True if the signed-in user was granted this dashboard. */
export const canOpenDashboard = async (
  user: { id?: string | null; role?: string | null } | null | undefined,
  key: string,
): Promise<boolean> => (await getSessionDashboards(user)).includes(key);
