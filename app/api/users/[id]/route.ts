/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

import getMongoClient from "@/app/lib/mongodb";
import { auth } from "@/auth";
import { canManageUsers } from "@/app/utils/vehiclePermissions";
import { MIN_PASSWORD_LENGTH, isUserActive, toUserRole } from "@/app/types/user";
import { toDashboardKeys } from "@/app/constant/dashboards";
import {
  USERS_COLLECTION,
  USERS_DB,
  USER_PROJECTION,
  forbiddenUsersResponse,
  toUserResponse,
} from "@/app/lib/users";

const invalidId = () =>
  NextResponse.json(
    { success: false, message: "Invalid user id" },
    { status: 400 },
  );

const notFound = () =>
  NextResponse.json(
    { success: false, message: "User not found" },
    { status: 404 },
  );

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!canManageUsers(session?.user?.role)) {
      return forbiddenUsersResponse();
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return invalidId();
    }

    const _id = new ObjectId(id);
    const body = await req.json();

    const client = await getMongoClient();
    const collection = client.db(USERS_DB).collection(USERS_COLLECTION);

    const existing: any = await collection.findOne({ _id });

    if (!existing) {
      return notFound();
    }

    const isSelf = session?.user?.id === id;
    const updates: Record<string, unknown> = {};
    const unset: Record<string, ""> = {};

    if ("name" in body) {
      const name = typeof body.name === "string" ? body.name.trim() : "";

      if (!name) {
        return NextResponse.json(
          { success: false, message: "Name is required" },
          { status: 400 },
        );
      }

      if (name !== existing.name) updates.name = name;
    }

    if ("email" in body) {
      const email =
        typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

      if (!email) {
        return NextResponse.json(
          { success: false, message: "Email is required" },
          { status: 400 },
        );
      }

      if (email !== existing.email) {
        if (await collection.findOne({ email, _id: { $ne: _id } })) {
          return NextResponse.json(
            { success: false, message: "This email is already registered" },
            { status: 409 },
          );
        }

        updates.email = email;
      }
    }

    if ("role" in body) {
      const role = toUserRole(body.role);

      if (!role) {
        return NextResponse.json(
          { success: false, message: "Invalid role" },
          { status: 400 },
        );
      }

      if (role !== toUserRole(existing.role)) {
        // Stops a super admin from locking themselves out
        if (isSelf) {
          return NextResponse.json(
            { success: false, message: "You can't change your own role" },
            { status: 400 },
          );
        }

        updates.role = role;
      }
    }

    if ("active" in body) {
      if (typeof body.active !== "boolean") {
        return NextResponse.json(
          { success: false, message: "Invalid active value" },
          { status: 400 },
        );
      }

      if (body.active !== isUserActive(existing.active)) {
        if (isSelf) {
          return NextResponse.json(
            { success: false, message: "You can't deactivate your own account" },
            { status: 400 },
          );
        }

        updates.active = body.active;
      }
    }

    if ("dashboards" in body) {
      if (!Array.isArray(body.dashboards)) {
        return NextResponse.json(
          { success: false, message: "Invalid dashboards value" },
          { status: 400 },
        );
      }

      const dashboards = toDashboardKeys(body.dashboards);

      if (
        dashboards.join() !== toDashboardKeys(existing.dashboards).join() ||
        !Array.isArray(existing.dashboards)
      ) {
        updates.dashboards = dashboards;
      }
    }

    // Only a customer carries a buyer; it's required for them
    const nextRole = (updates.role as string) ?? toUserRole(existing.role);

    if (nextRole === "customer") {
      const buyer =
        "buyer" in body
          ? typeof body.buyer === "string"
            ? body.buyer.trim()
            : ""
          : existing.buyer ?? "";

      if (!buyer) {
        return NextResponse.json(
          { success: false, message: "Buyer is required for a customer" },
          { status: 400 },
        );
      }

      if (buyer !== existing.buyer) updates.buyer = buyer;
    } else if (existing.buyer !== undefined) {
      unset.buyer = "";
    }

    // Blank password means "keep the current one"
    if (typeof body.password === "string" && body.password) {
      if (body.password.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
          {
            success: false,
            message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
          },
          { status: 400 },
        );
      }

      updates.password = await bcrypt.hash(body.password, 12);
      updates.passwordUpdatedAt = new Date();
    }

    if (!Object.keys(updates).length && !Object.keys(unset).length) {
      return NextResponse.json({
        success: true,
        message: "No changes to save",
      });
    }

    await collection.updateOne(
      { _id },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
          updatedBy: session?.user?.name ?? session?.user?.email ?? "",
        },
        ...(Object.keys(unset).length && { $unset: unset }),
      },
    );

    const user = await collection.findOne(
      { _id },
      { projection: USER_PROJECTION },
    );

    return NextResponse.json({
      success: true,
      message: "User updated",
      user: user && toUserResponse(user),
    });
  } catch (error: any) {
    console.error("PUT /api/users/[id] error:", error);

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update user" },
      { status: 500 },
    );
  }
}
