/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

export const USERS_DB = "gomti_infra";
export const USERS_COLLECTION = "users";

/* Everything the table needs; the password hash never leaves the server. */
export const USER_PROJECTION = {
  name: 1,
  email: 1,
  role: 1,
  buyer: 1,
  active: 1,
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
