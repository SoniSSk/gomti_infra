import React from "react";
import type { LucideIcon } from "lucide-react";

/*
 * Centered icon + message used for empty and error states
 * (tables, lists, panels).
 */

export interface CommonStateMessageProps {
    icon?: LucideIcon;
    tone?: "neutral" | "danger";
    title: React.ReactNode;
    description?: React.ReactNode;
    /** Usually a CommonButton. */
    action?: React.ReactNode;
    className?: string;
}

const TONE_CLASS = {
    neutral: "bg-orange-50 text-orange-500",
    danger: "bg-red-50 text-red-500",
} as const;

const CommonStateMessage = ({
    icon: Icon,
    tone = "neutral",
    title,
    description,
    action,
    className = "",
}: CommonStateMessageProps) => (
    <div
        role={tone === "danger" ? "alert" : undefined}
        className={`flex flex-col items-center justify-center text-center ${className}`}
    >
        {Icon && (
            <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${TONE_CLASS[tone]}`}
            >
                <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
        )}

        <p className="text-sm font-semibold text-gray-700">
            {title}
        </p>

        {description && (
            <p className="mt-1 text-xs text-gray-400">
                {description}
            </p>
        )}

        {action && <div className="mt-3">{action}</div>}
    </div>
);

export default CommonStateMessage;
