"use client";

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
    return (
        <section className="w-full">
            <div className="w-full space-y-4">
                <VehicleStats
                    refreshKey={refreshKey}
                    userRole={userRole}
                />

                <Test refreshKey={refreshKey} />
            </div>
        </section>
    );
};

export default VehicleTable;
