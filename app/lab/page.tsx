import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getSessionDashboards } from "@/app/lib/users";
import { LAB_DASHBOARD } from "@/app/constant/dashboards";
import LabDashboard from "./LabDashboard";

export const metadata: Metadata = {
    title: "Lab",
};

/*
 * Users granted the Lab dashboard only. proxy.ts enforces this too;
 * the check here keeps the page safe if the proxy matcher changes.
 */
const Page = async () => {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const dashboards = await getSessionDashboards(session.user);

    if (!dashboards.includes(LAB_DASHBOARD)) {
        redirect("/dashboard");
    }

    return (
        <LabDashboard
            userName={session.user.name ?? ""}
            userRole={session.user.role ?? ""}
            dashboards={dashboards}
        />
    );
};

export default Page;
