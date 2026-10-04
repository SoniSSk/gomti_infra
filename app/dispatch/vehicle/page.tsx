import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getSessionDashboards } from "@/app/lib/users";
import { VEHICLES_DASHBOARD } from "@/app/constant/dashboards";
import VehicleDashboard from "./VehicleDashboard";

export const metadata: Metadata = {
    title: "Vehicle Dispatch",
};

/*
 * Users granted the Vehicle Dispatch dashboard only. proxy.ts enforces
 * this too; the check here keeps the page safe if the matcher changes.
 * The session also renders the user's name/role on the first paint.
 */
const Page = async () => {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const dashboards = await getSessionDashboards(session.user);

    if (!dashboards.includes(VEHICLES_DASHBOARD)) {
        redirect("/dashboard");
    }

    return (
        <VehicleDashboard
            userName={session.user.name ?? ""}
            userRole={session.user.role ?? ""}
            dashboards={dashboards}
        />
    );
};

export default Page;
