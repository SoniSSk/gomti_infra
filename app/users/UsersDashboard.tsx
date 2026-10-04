"use client";

import React, { useCallback, useState } from "react";
import { UserPlus } from "lucide-react";

import CommonHeader from "../component/vehicle_new/common/CommonHeader";
import CommonButton from "../component/vehicle_new/common/CommonButton";
import UserTable from "../component/users/UserTable";
import UserFormModal from "../component/users/UserFormModal";

interface UsersDashboardProps {
    userName: string;
    userRole: string;
    /** Granted dashboards, for the module nav. */
    dashboards: string[];
    currentUserId: string;
}

const UsersDashboard = ({
    userName,
    userRole,
    currentUserId,
    dashboards,
}: UsersDashboardProps) => {
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);

    /* Bumped after a user is added so the table refetches. */
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUserAdded = useCallback(() => {
        setIsAddUserOpen(false);
        setRefreshKey((key) => key + 1);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <CommonHeader
                title="Users"
                subtitle="Add, edit and deactivate user accounts"
                userName={userName}
                userRole={userRole}
                dashboards={dashboards}
                actions={
                    <CommonButton
                        icon={UserPlus}
                        onClick={() => setIsAddUserOpen(true)}
                        aria-label="Add user"
                        title="Add user"
                        className="max-sm:w-10 max-sm:px-0"
                    >
                        <span className="hidden sm:inline">Add User</span>
                    </CommonButton>
                }
            />

            <main className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
                <UserTable
                    refreshKey={refreshKey}
                    currentUserId={currentUserId}
                />
            </main>

            <UserFormModal
                user={null}
                isOpen={isAddUserOpen}
                onClose={() => setIsAddUserOpen(false)}
                onSuccess={handleUserAdded}
            />
        </div>
    );
};

export default UsersDashboard;
