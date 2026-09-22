"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
    Truck,
    TrainFront,
    Scale,
    Factory,
    Construction,
    ClipboardCheck,
    Pickaxe,
    ArrowUpRight,
} from "lucide-react";

interface LinkCard {
    title: string;
    description: string;
    path: string;
    icon: React.ReactNode;
}

const Links = () => {
    const router = useRouter();

    const links: LinkCard[] = [
        {
            title: "Vehicle Dispatch",
            description:
                "Manage vehicle entry, loading, ETP, documents and dispatch operations.",
            path: "/dispatch/vehicle",
            icon: <Truck size={28} strokeWidth={2} />,
        },
        // {
        //     title: "Rake Dispatch",
        //     description:
        //         "Manage railway rake loading, lots, wagons and dispatch details.",
        //     path: "/dispatch/rake",
        //     icon: <TrainFront size={28} strokeWidth={2} />,
        // },
        {
            title: "Weighbridge",
            description:
                "Manage vehicle weighing, weight slips and weighbridge records.",
            path: "/weighbridge",
            icon: <Scale size={28} strokeWidth={2} />,
        },
        // {
        //     title: "Screening",
        //     description:
        //         "Manage screening production, material processing and stock.",
        //     path: "/screening",
        //     icon: <Factory size={28} strokeWidth={2} />,
        // },
        // {
        //     title: "Machine Hiring",
        //     description:
        //         "Manage machine hiring, operating hours, hourly rates and records.",
        //     path: "/hiring",
        //     icon: <Construction size={28} strokeWidth={2} />,
        // },
        // {
        //     title: "Attendance",
        //     description:
        //         "Manage employee attendance, working hours and attendance records.",
        //     path: "/attendance",
        //     icon: <ClipboardCheck size={28} strokeWidth={2} />,
        // },
        // {
        //     title: "Mining Plan",
        //     description:
        //         "Manage mining targets, production plans, excavation, material and daily progress.",
        //     path: "/mining-plan",
        //     icon: <Pickaxe size={28} strokeWidth={2} />,
        // },
    ];

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    return (
        <div className="w-full p-4 sm:p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full bg-orange-500" />

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Operations
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Manage dispatch, weighing, screening, hiring,
                            attendance and mining operations.
                        </p>
                    </div>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {links.map((item) => (
                    <button
                        key={item.path}
                        type="button"
                        onClick={() => handleNavigate(item.path)}
                        className="
                            group
                            relative
                            cursor-pointer
                            overflow-hidden
                            rounded-2xl
                            border
                            border-gray-200
                            bg-white
                            p-5
                            text-left
                            shadow-sm
                            transition-all
                            duration-300
                            hover:-translate-y-1
                            hover:border-orange-300
                            hover:shadow-xl
                            focus:outline-none
                            focus:ring-2
                            focus:ring-orange-400
                            focus:ring-offset-2
                        "
                    >
                        {/* Decorative Circle */}
                        <div
                            className="
                                pointer-events-none
                                absolute
                                -right-10
                                -top-10
                                h-28
                                w-28
                                rounded-full
                                bg-orange-50
                                transition-transform
                                duration-500
                                group-hover:scale-[2]
                            "
                        />

                        {/* Card Header */}
                        <div className="relative flex items-start justify-between">
                            {/* Icon */}
                            <div
                                className="
                                    flex
                                    h-14
                                    w-14
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    bg-orange-100
                                    text-orange-600
                                    transition-all
                                    duration-300
                                    group-hover:bg-orange-500
                                    group-hover:text-white
                                    group-hover:shadow-lg
                                "
                            >
                                {item.icon}
                            </div>

                            {/* Arrow */}
                            <div
                                className="
                                    flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-gray-50
                                    text-gray-400
                                    transition-all
                                    duration-300
                                    group-hover:bg-orange-50
                                    group-hover:text-orange-600
                                "
                            >
                                <ArrowUpRight
                                    size={19}
                                    strokeWidth={2}
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative mt-5">
                            <h2
                                className="
                                    text-base
                                    font-bold
                                    text-gray-900
                                    transition-colors
                                    duration-300
                                    group-hover:text-orange-600
                                "
                            >
                                {item.title}
                            </h2>

                            <p className="mt-2 min-h-[52px] text-sm leading-6 text-gray-500">
                                {item.description}
                            </p>
                        </div>

                        {/* Bottom Indicator */}
                        <div className="relative mt-5">
                            <div
                                className="
                                    h-1
                                    w-10
                                    rounded-full
                                    bg-orange-500
                                    transition-all
                                    duration-500
                                    group-hover:w-full
                                "
                            />
                        </div>

                        {/* Open Module */}
                        <div
                            className="
                                relative
                                mt-4
                                flex
                                items-center
                                gap-1
                                text-xs
                                font-semibold
                                text-gray-400
                                transition-colors
                                duration-300
                                group-hover:text-orange-600
                            "
                        >
                            <span>Open Module</span>

                            <ArrowUpRight
                                size={13}
                                strokeWidth={2}
                            />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Links;