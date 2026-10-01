import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { canAccessLab } from "@/app/utils/vehiclePermissions";
import LabDashboard from "./LabDashboard";

export const metadata: Metadata = {
    title: "Lab",
};

/*
 * Admins and super admins only. proxy.ts enforces this too; the
 * check here keeps the page safe if the proxy matcher changes.
 */
const Page = async () => {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if (!canAccessLab(session.user.role)) {
        redirect("/dashboard");
    }

    return (
        <LabDashboard
            userName={session.user.name ?? ""}
            userRole={session.user.role ?? ""}
        />
    );
};

export default Page;
