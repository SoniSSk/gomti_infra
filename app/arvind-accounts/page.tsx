import type { Metadata } from "next";

import { ACCOUNT_BOOKS } from "@/app/types/accounts";
import AccountsPage from "../accounts/AccountsPage";

export const metadata: Metadata = {
    title: ACCOUNT_BOOKS.arvind.title,
};

const Page = () => <AccountsPage bookKey="arvind" />;

export default Page;
