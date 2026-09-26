import type { Vehicle_new } from "@/app/types/vehicle_new";

type Person = NonNullable<Vehicle_new["createdBy"]>;

export interface LastStatusChange {
  user: Person;
  at?: string;
}

/**
 * Structural input so both the Vehicle_new and legacy Vehicle shapes
 * (the stats API returns whole documents, tracking included) can be passed.
 */
interface StatusChangeSource {
  tracking?: {
    user?: Person;
    fromStatus?: string;
    toStatus?: string;
    createdAt?: string;
  }[];
  createdBy?: Person;
  createdAt?: string;
}

/**
 * Who last changed the vehicle's status: the newest tracking entry that
 * records a status transition, falling back to the creator, who set the
 * initial status.
 */
export const getLastStatusChange = (
  vehicle?: StatusChangeSource | null,
): LastStatusChange | null => {
  const tracking = vehicle?.tracking ?? [];

  for (let i = tracking.length - 1; i >= 0; i--) {
    const entry = tracking[i];

    if (entry?.toStatus && entry.toStatus !== entry.fromStatus && entry.user?.name) {
      return { user: entry.user, at: entry.createdAt };
    }
  }

  if (vehicle?.createdBy?.name) {
    return { user: vehicle.createdBy, at: vehicle.createdAt };
  }

  return null;
};
