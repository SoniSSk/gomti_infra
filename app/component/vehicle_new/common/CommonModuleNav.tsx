"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { getModulesForUser } from "@/app/constant/modules";

/*
 * Module tabs under the page header, so users can jump between
 * modules without going back to the dashboard. Scrolls
 * horizontally on phones.
 */

const DASHBOARD_ITEM = {
    shortTitle: "Dashboard",
    path: "/dashboard",
    icon: LayoutGrid,
};

const isActivePath = (pathname: string, path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

interface CommonModuleNavProps {
    userRole?: string;
    dashboards?: string[];
}

const CommonModuleNav = ({ userRole, dashboards }: CommonModuleNavProps) => {
    const pathname = usePathname();

    const navItems = [DASHBOARD_ITEM, ...getModulesForUser(userRole, dashboards)];

    return (
        <nav
            aria-label="Modules"
            className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8"
        >
            <ul className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {navItems.map(({ shortTitle, path, icon: Icon }) => {
                    const active = isActivePath(pathname, path);

                    return (
                        <li key={path} className="shrink-0">
                            <Link
                                href={path}
                                aria-current={active ? "page" : undefined}
                                className={`inline-flex h-10 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition focus:outline-none focus-visible:bg-orange-50 ${active
                                    ? "border-orange-500 text-orange-700"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900"
                                    }`}
                            >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                {shortTitle}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default CommonModuleNav;
