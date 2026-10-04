import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getSessionDashboards } from "@/app/lib/users";
import { accountsDashboardKey } from "@/app/constant/dashboards";
import type { AccountBookKey } from "@/app/types/accounts";
import AccountsDashboard from "./AccountsDashboard";

/*
 * Shared page body for every account book (/accounts,
 * /arvind-accounts, /kuldeep-accounts).
 *
 * Users granted this book's dashboard only. proxy.ts enforces this
 * too; the check here keeps the page safe if the matcher changes.
 */
const AccountsPage = async ({ bookKey }: { bookKey: AccountBookKey }) => {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const dashboards = await getSessionDashboards(session.user);

    if (!dashboards.includes(accountsDashboardKey(bookKey))) {
        redirect("/dashboard");
    }

    return (
        <AccountsDashboard
            bookKey={bookKey}
            userName={session.user.name ?? ""}
            userRole={session.user.role ?? ""}
            dashboards={dashboards}
        />
    );
};

export default AccountsPage;
