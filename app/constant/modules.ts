import { canManageUsers } from "@/app/utils/vehiclePermissions";
import {
    FlaskConical,
    Landmark,
    Pickaxe,
    Truck,
    UserCog,
    type LucideIcon,
} from "lucide-react";
import { ACCOUNT_BOOKS } from "@/app/types/accounts";
import {
    LAB_DASHBOARD,
    MINING_DASHBOARD,
    VEHICLES_DASHBOARD,
    accountsDashboardKey,
} from "./dashboards";

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
    /** Grantable dashboard (see DASHBOARDS) that opens this module. */
    dashboardKey?: string;
    /** Role check for modules that aren't granted per user. */
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
        dashboardKey: VEHICLES_DASHBOARD,
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
        dashboardKey: LAB_DASHBOARD,
    },
    {
        title: "Mining",
        shortTitle: "Mining",
        description:
            "Track vehicle trips from loading to unloading, with weights and timings.",
        path: "/mining",
        icon: Pickaxe,
        dashboardKey: MINING_DASHBOARD,
    },
    // One module per account book: GIMPL, Arvind, Kuldeep
    ...Object.values(ACCOUNT_BOOKS).map(
        ({ key, title, path }): AppModule => ({
            title,
            shortTitle: title,
            description:
                "Track payments, transactions, masters, compliance and their documents.",
            path,
            icon: Landmark,
            dashboardKey: accountsDashboardKey(key),
        }),
    ),
    {
        title: "User Management",
        shortTitle: "Users",
        description:
            "Add and edit user accounts, their roles and access.",
        path: "/users",
        icon: UserCog,
        canAccess: canManageUsers,
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

/** Modules this user can open, from their role and granted dashboards. */
export const getModulesForUser = (
    role?: string | null,
    dashboards: readonly string[] = [],
): AppModule[] =>
    APP_MODULES.filter(({ dashboardKey, canAccess }) =>
        dashboardKey
            ? dashboards.includes(dashboardKey)
            : !canAccess || canAccess(role),
    );
