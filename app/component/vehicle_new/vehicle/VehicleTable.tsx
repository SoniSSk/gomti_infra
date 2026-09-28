"use client";

import { useCallback, useState } from "react";

import Test from "./Test";
import VehicleStats from "./VehicleStats";

interface VehicleTableProps {
    refreshKey?: number;
    userRole?: string;
}

const VehicleTable = ({
    refreshKey = 0,
    userRole,
}: VehicleTableProps) => {
    // Bumped by the table's auto refresh so stats stay in sync
    const [pollKey, setPollKey] = useState(0);

    const handleAutoRefresh = useCallback(() => {
        setPollKey((key) => key + 1);
    }, []);

    // Bumped after an edit so the table refetches in the background
    const [syncKey, setSyncKey] = useState(0);

    const handleVehicleUpdated = useCallback(() => {
        setPollKey((key) => key + 1);
        setSyncKey((key) => key + 1);
    }, []);

    return (
        <section className="w-full">
<div className="w-full space-y-6">
                <VehicleStats
                    refreshKey={refreshKey}
                    pollKey={pollKey}
                    userRole={userRole}
                    onVehicleUpdated={handleVehicleUpdated}
                />

                <Test
                    refreshKey={refreshKey}
                    onAutoRefresh={handleAutoRefresh}
                    syncKey={syncKey}
                    onVehicleUpdated={handleVehicleUpdated}
                />
            </div>
        </section>
    );
};

export default VehicleTable;
