import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getSessionDashboards } from "@/app/lib/users";
import { MINING_DASHBOARD } from "@/app/constant/dashboards";
import MiningDashboard from "./MiningDashboard";

export const metadata: Metadata = {
    title: "Mining",
};

/*
 * Users granted the Mining dashboard only. proxy.ts enforces this
 * too; the check here keeps the page safe if the proxy matcher changes.
 */
const Page = async () => {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const dashboards = await getSessionDashboards(session.user);

    if (!dashboards.includes(MINING_DASHBOARD)) {
        redirect("/dashboard");
    }

    return (
        <MiningDashboard
            userName={session.user.name ?? ""}
            userRole={session.user.role ?? ""}
            dashboards={dashboards}
        />
    );
};

export default Page;
