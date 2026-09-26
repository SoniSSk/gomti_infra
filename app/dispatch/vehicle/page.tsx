import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import VehicleDashboard from "./VehicleDashboard";

export const metadata: Metadata = {
    title: "Vehicle Dispatch",
};

/*
 * Access is enforced by proxy.ts; the session is read here only to
 * render the user's name/role on the first paint (no client-side
 * "Verifying user..." screen).
 */
const Page = async () => {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <VehicleDashboard
            userName={session.user.name ?? ""}
            userRole={session.user.role ?? ""}
        />
    );
};

export default Page;
