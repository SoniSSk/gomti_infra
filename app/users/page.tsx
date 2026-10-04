import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { canManageUsers } from "@/app/utils/vehiclePermissions";
import { getSessionDashboards } from "@/app/lib/users";
import UsersDashboard from "./UsersDashboard";

export const metadata: Metadata = {
    title: "Users",
};

/*
 * Super admins only. proxy.ts enforces this too; the check
 * here keeps the page safe if the proxy matcher changes.
 */
const Page = async () => {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if (!canManageUsers(session.user.role)) {
        redirect("/dashboard");
    }

    return (
        <UsersDashboard
            userName={session.user.name ?? ""}
            userRole={session.user.role ?? ""}
            currentUserId={session.user.id ?? ""}
            dashboards={await getSessionDashboards(session.user)}
        />
    );
};

export default Page;
