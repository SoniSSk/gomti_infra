"use client";

import React, { useCallback, useState } from "react";
import { Plus } from "lucide-react";

import CommonHeader from "../component/vehicle_new/common/CommonHeader";
import CommonButton from "../component/vehicle_new/common/CommonButton";
import AccountsTable from "../component/accounts/AccountsTable";
import AccountsFormModal from "../component/accounts/AccountsFormModal";
import { ACCOUNT_BOOKS, type AccountBookKey } from "@/app/types/accounts";

interface AccountsDashboardProps {
    bookKey: AccountBookKey;
    userName: string;
    userRole: string;
    /** Granted dashboards, for the module nav. */
    dashboards: string[];
}

const AccountsDashboard = ({
    bookKey,
    userName,
    userRole,
    dashboards,
}: AccountsDashboardProps) => {
    const book = ACCOUNT_BOOKS[bookKey];

    const [isAddOpen, setIsAddOpen] = useState(false);

    /*
     * Bumped after an entry is added so the table refetches
     * without a page reload (and keeps its filters).
     */
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAdded = useCallback(() => {
        setIsAddOpen(false);
        setRefreshKey((key) => key + 1);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <CommonHeader
                title={book.title}
                subtitle="Track payments, transactions, compliance and documents"
                userName={userName}
                userRole={userRole}
                dashboards={dashboards}
                actions={
                    <CommonButton
                        icon={Plus}
                        onClick={() => setIsAddOpen(true)}
                        aria-label="Add entry"
                        title="Add entry"
                        className="max-sm:w-10 max-sm:px-0"
                    >
                        <span className="hidden sm:inline">
                            Add Entry
                        </span>
                    </CommonButton>
                }
            />

            <main className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
                <AccountsTable book={book} refreshKey={refreshKey} />
            </main>

            <AccountsFormModal
                book={book}
                operation={null}
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={handleAdded}
            />
        </div>
    );
};

export default AccountsDashboard;
