import { canAccessLab } from "@/app/utils/vehiclePermissions";
import {
    FlaskConical,
    Truck,
    type LucideIcon,
} from "lucide-react";

/*
 * Operations modules, shared by the dashboard cards and the
 * module nav in the page header.
 */

export interface AppModule {
    title: string;
    /** Short label for the header nav. */
    shortTitle: string;
    description: string;
    path: string;
    icon: LucideIcon;
    /** Omit when every signed-in user can open the module. */
    canAccess?: (role?: string | null) => boolean;
}

export const APP_MODULES: AppModule[] = [
    {
        title: "Vehicle Dispatch",
        shortTitle: "Vehicles",
        description:
            "Manage vehicle entry, loading, ETP, documents and dispatch operations.",
        path: "/dispatch/vehicle",
        icon: Truck,
    },
    // {
    //     title: "Rake Dispatch",
    //     shortTitle: "Rake",
    //     description:
    //         "Manage railway rake loading, lots, wagons and dispatch details.",
    //     path: "/dispatch/rake",
    //     icon: TrainFront,
    // },
    // {
    //     title: "Weighbridge",
    //     shortTitle: "Weighbridge",
    //     description:
    //         "Manage vehicle weighing, weight slips and weighbridge records.",
    //     path: "/weighbridge",
    //     icon: Scale,
    // },
    {
        title: "Lab",
        shortTitle: "Lab",
        description:
            "Track lot samples, assignments and lab report results.",
        path: "/lab",
        icon: FlaskConical,
        canAccess: canAccessLab,
    },
    // {
    //     title: "Screening",
    //     shortTitle: "Screening",
    //     description:
    //         "Manage screening production, material processing and stock.",
    //     path: "/screening",
    //     icon: Factory,
    // },
    // {
    //     title: "Machine Hiring",
    //     shortTitle: "Hiring",
    //     description:
    //         "Manage machine hiring, operating hours, hourly rates and records.",
    //     path: "/hiring",
    //     icon: Construction,
    // },
    // {
    //     title: "Attendance",
    //     shortTitle: "Attendance",
    //     description:
    //         "Manage employee attendance, working hours and attendance records.",
    //     path: "/attendance",
    //     icon: ClipboardCheck,
    // },
    // {
    //     title: "Mining Plan",
    //     shortTitle: "Mining Plan",
    //     description:
    //         "Manage mining targets, production plans, excavation, material and daily progress.",
    //     path: "/mining-plan",
    //     icon: Pickaxe,
    // },
];

/** Modules this role can open. */
export const getModulesForRole = (role?: string | null): AppModule[] =>
    APP_MODULES.filter(({ canAccess }) => !canAccess || canAccess(role));
