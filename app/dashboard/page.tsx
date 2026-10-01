import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import CommonHeader from "../component/vehicle_new/common/CommonHeader";
import Links from "../component/dashboard/Links";

export const metadata: Metadata = {
    title: "Dashboard",
};

/*
 * Access is enforced by proxy.ts; the session is read here only to
 * render the user's name/role on the first paint.
 */
const Page = async () => {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <CommonHeader
                title="Dashboard"
                subtitle="Choose a module to open"
                userName={session.user.name ?? ""}
                userRole={session.user.role ?? ""}
            />

            <main className="mx-auto w-full max-w-screen-2xl">
                <Links userRole={session.user.role ?? ""} />
            </main>
        </div>
    );
};

export default Page;
