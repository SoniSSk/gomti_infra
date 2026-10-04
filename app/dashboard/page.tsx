import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getSessionDashboards } from "@/app/lib/users";
import CommonHeader from "../component/vehicle_new/common/CommonHeader";
import Links from "../component/dashboard/Links";

export const metadata: Metadata = {
    title: "Dashboard",
};

/*
 * Shows a card per module the user was granted. Access itself is
 * enforced by proxy.ts and each module's page.
 */
const Page = async () => {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const dashboards = await getSessionDashboards(session.user);

    return (
        <div className="min-h-screen bg-gray-50">
            <CommonHeader
                title="Dashboard"
                subtitle="Choose a module to open"
                userName={session.user.name ?? ""}
                userRole={session.user.role ?? ""}
                dashboards={dashboards}
            />

            <main className="mx-auto w-full max-w-screen-2xl">
                <Links
                    userRole={session.user.role ?? ""}
                    dashboards={dashboards}
                />
            </main>
        </div>
    );
};

export default Page;
