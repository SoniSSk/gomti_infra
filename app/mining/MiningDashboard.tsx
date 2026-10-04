"use client";

import React, { useCallback, useState } from "react";
import { Plus } from "lucide-react";

import CommonHeader from "../component/vehicle_new/common/CommonHeader";
import CommonButton from "../component/vehicle_new/common/CommonButton";
import MiningTable from "../component/mining/MiningTable";
import MiningFormModal from "../component/mining/MiningFormModal";

interface MiningDashboardProps {
    userName: string;
    userRole: string;
    /** Granted dashboards, for the module nav. */
    dashboards: string[];
}

const MiningDashboard = ({
    userName,
    userRole,
    dashboards,
}: MiningDashboardProps) => {
    const [isAddOpen, setIsAddOpen] = useState(false);

    /*
     * Bumped after a trip is added so the table refetches
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
                title="Mining"
                subtitle="Track vehicle trips, weights and timings"
                userName={userName}
                userRole={userRole}
                dashboards={dashboards}
                actions={
                    <CommonButton
                        icon={Plus}
                        onClick={() => setIsAddOpen(true)}
                        aria-label="Add trip"
                        title="Add trip"
                        className="max-sm:w-10 max-sm:px-0"
                    >
                        <span className="hidden sm:inline">
                            Add Trip
                        </span>
                    </CommonButton>
                }
            />

            <main className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
                <MiningTable refreshKey={refreshKey} />
            </main>

            <MiningFormModal
                trip={null}
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={handleAdded}
            />
        </div>
    );
};

export default MiningDashboard;
