import type { Metadata } from "next";

import { ACCOUNT_BOOKS } from "@/app/types/accounts";
import AccountsPage from "../accounts/AccountsPage";

export const metadata: Metadata = {
    title: ACCOUNT_BOOKS.kuldeep.title,
};

const Page = () => <AccountsPage bookKey="kuldeep" />;

export default Page;
