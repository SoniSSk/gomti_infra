import type { Metadata } from "next";

import { ACCOUNT_BOOKS } from "@/app/types/accounts";
import AccountsPage from "./AccountsPage";

export const metadata: Metadata = {
    title: ACCOUNT_BOOKS.gimpl.title,
};

const Page = () => <AccountsPage bookKey="gimpl" />;

export default Page;
