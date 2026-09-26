"use client";

import React, { useState } from "react";
import {
    Activity,
    Check,
    Clock,
    Copy,
    ExternalLink,
    FileText,
    FileX,
    MapPin,
    Package,
    Pencil,
    Phone,
    Truck,
    Users,
} from "lucide-react";

import { Vehicle_new } from "@/app/types/vehicle_new";
import { normalizeVehicle } from "@/app/utils/vehicleMapper";
import { canModifyVehicle, getStoredUserRole } from "@/app/utils/vehiclePermissions";

import CommonButton from "../common/CommonButton";
import CommonFileUpload from "../common/CommonFileUpload";
import CommonModal from "../common/CommonModal";
import CommonTooltip from "../common/CommonTooltip";
import { formatDateTime } from "../common/dateTime";
import {
    DetailGrid,
    DetailItem,
    EmptyNote,
    ModalSection,
    isEmptyValue,
} from "../common/ModalParts";
import { StatusBadge, getStatusMeta } from "../common/vehicleStatus";

interface ViewModalProps {
    vehicle: Vehicle_new | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
}

type Person = NonNullable<Vehicle_new["createdBy"]>;
type TrackingItem = NonNullable<Vehicle_new["tracking"]>[number];

/* =========================================================
   HELPERS
========================================================= */

/** "DETAILS_UPDATED" -> "Details updated" */
const formatAction = (action?: string) =>
    action
        ? action.charAt(0) + action.slice(1).toLowerCase().replaceAll("_", " ")
        : "Update";

/** "materialGrade" -> "Material grade" */
const formatField = (field: string) => {
    const spaced = field
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replaceAll("_", " ")
        .toLowerCase();

    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const formatValue = (value: unknown): string => {
    if (isEmptyValue(value)) {
        return "—";
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
};

const getInitials = (name?: string) =>
    (name ?? "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "?";

const formatWeight = (weight?: string) =>
    isEmptyValue(weight) ? "" : `${weight} MT`;

/* =========================================================
   COPY BUTTON
========================================================= */

const CopyButton = ({ value, label }: { value?: unknown; label: string }) => {
    const [copied, setCopied] = useState(false);

    if (isEmptyValue(value)) {
        return null;
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    };

    return (
        <CommonTooltip content={copied ? "Copied!" : `Copy ${label}`}>
            <CommonButton
                variant="ghost"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={handleCopy}
                aria-label={copied ? "Copied" : `Copy ${label}`}
                className="-my-1.5"
            />
        </CommonTooltip>
    );
};

/* =========================================================
   SUMMARY TILE (top strip)
========================================================= */

const SummaryTile = ({
    label,
    value,
}: {
    label: string;
    value?: React.ReactNode;
}) => (
    <div className="min-w-0 bg-white px-4 py-3">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p
            className="mt-1 truncate text-sm font-semibold text-gray-900"
            title={typeof value === "string" ? value : undefined}
        >
            {isEmptyValue(value) ? (
                <span className="font-normal text-gray-300">—</span>
            ) : (
                value
            )}
        </p>
    </div>
);

/* =========================================================
   DOCUMENT
========================================================= */

const DocumentItem = ({
    label,
    value,
}: {
    label: string;
    value?: string | null;
}) => {
    if (!value) {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 px-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                    <FileX className="h-4 w-4" aria-hidden="true" />
                </span>

                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-700">
                        {label}
                    </p>
                    <p className="text-xs text-gray-400">Not uploaded</p>
                </div>
            </div>
        );
    }

    return (
        <CommonFileUpload
            label={label}
            value={value}
            disabled
            onChange={() => { }}
            maxSizeMB={100}
            className="w-full"
        />
    );
};

/* =========================================================
   PERSON
========================================================= */

const PersonCard = ({
    heading,
    person,
}: {
    heading: string;
    person?: Person;
}) => (
    <div>
        <p className="mb-2 text-xs font-medium text-gray-500">{heading}</p>

        {person ? (
            <div className="flex items-start gap-3">
                <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700"
                    aria-hidden="true"
                >
                    {getInitials(person.name)}
                </span>

                <div className="min-w-0 text-sm">
                    <p className="truncate font-medium text-gray-900">
                        {person.name || "—"}
                    </p>
                    {person.role && (
                        <p className="truncate text-xs capitalize text-gray-500">
                            {person.role}
                        </p>
                    )}
                    {person.email && (
                        <a
                            href={`mailto:${person.email}`}
                            className="block truncate text-xs text-orange-600 hover:text-orange-700"
                        >
                            {person.email}
                        </a>
                    )}
                </div>
            </div>
        ) : (
            <p className="text-sm text-gray-300">—</p>
        )}
    </div>
);

/* =========================================================
   TIMELINE ENTRY
========================================================= */

const TimelineEntry = ({
    item,
    isLast,
}: {
    item: TrackingItem;
    isLast: boolean;
}) => {
    const dot = item.toStatus
        ? getStatusMeta(item.toStatus).dot
        : "bg-gray-300";

    return (
        <li className="relative pb-6 pl-8 last:pb-0">
            {!isLast && (
                <span
                    className="absolute left-[7px] top-4 h-full w-px bg-gray-200"
                    aria-hidden="true"
                />
            )}

            <span
                className={`absolute left-0 top-1 h-[15px] w-[15px] rounded-full border-[3px] border-white ring-1 ring-gray-200 ${dot}`}
                aria-hidden="true"
            />

            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-medium text-gray-900">
                    {formatAction(item.action)}
                </p>
                <time className="text-xs tabular-nums text-gray-500">
                    {formatDateTime(item.createdAt) || "—"}
                </time>
            </div>

            {item.user?.name && (
                <p className="mt-0.5 text-xs text-gray-500">
                    by{" "}
                    <span className="font-medium text-gray-700">
                        {item.user.name}
                    </span>
                    {item.user.role && (
                        <span className="capitalize"> · {item.user.role}</span>
                    )}
                </p>
            )}

            {item.fromStatus && item.toStatus && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={item.fromStatus} />
                    <span className="text-gray-400" aria-hidden="true">→</span>
                    <StatusBadge status={item.toStatus} />
                </div>
            )}

            {item.changes && item.changes.length > 0 && (
                <ul className="mt-2 space-y-1 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                    {item.changes.map((change, index) => (
                        <li
                            key={`${change.field}-${index}`}
                            className="flex flex-wrap items-baseline gap-x-1.5"
                        >
                            <span className="font-medium text-gray-700">
                                {formatField(change.field)}:
                            </span>
                            <span className="break-all text-gray-400 line-through">
                                {formatValue(change.oldValue)}
                            </span>
                            <span className="text-gray-400" aria-hidden="true">→</span>
                            <span className="break-all text-gray-900">
                                {formatValue(change.newValue)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {item.location?.address && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {item.location.address}
                </p>
            )}

            {item.comment && (
                <p className="mt-2 border-l-2 border-gray-200 pl-3 text-sm italic text-gray-600">
                    {item.comment}
                </p>
            )}
        </li>
    );
};

/* =========================================================
   VIEW MODAL
========================================================= */

const DOCUMENTS: { key: keyof NonNullable<Vehicle_new["documents"]>; label: string }[] = [
    { key: "vehicleImage", label: "Vehicle Image" },
    { key: "vehicleRegistrationImage", label: "Vehicle Registration" },
    { key: "driverLicenseImage", label: "Driver License" },
    { key: "weightSlip", label: "Weight Slip" },
    { key: "etp", label: "ETP" },
    { key: "invoiceImage", label: "Invoice" },
    { key: "EWayBill", label: "E-Way Bill" },
    { key: "LRSlip", label: "LR Slip" },
    { key: "loadingVideo", label: "Loading Video" },
];

const ViewModal = ({
    vehicle,
    isOpen,
    onClose,
    onEdit,
}: ViewModalProps) => {
    if (!isOpen || !vehicle) {
        return null;
    }

    // Flat API document fields -> vehicle.documents
    const v = normalizeVehicle(vehicle);
    const location = v.currentLocation;
    const tracking = (v.tracking ?? []).slice().reverse();
    // Dispatched vehicles: super admin only
    const canEdit =
        !!onEdit && canModifyVehicle(v.status, getStoredUserRole());
    const uploadedCount = DOCUMENTS.filter(({ key }) => v.documents?.[key]).length;

    // Copy button copies `value`; `display` overrides what is rendered.
    const dispatchFields: {
        label: string;
        value?: string | number;
        display?: React.ReactNode;
        mono?: boolean;
    }[] = [
        { label: "Vehicle No", value: v.vehicleNo, mono: true },
        { label: "ETP No", value: v.etpNo },
        { label: "Buyer", value: v.buyerDetails },
        { label: "Transporter", value: v.transporterName },
        {
            label: "Driver Contact No",
            value: v.driverContact,
            display: v.driverContact && (
                <a
                    href={`tel:${v.driverContact}`}
                    className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-700"
                >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {v.driverContact}
                </a>
            ),
        },
        { label: "ETP Date", value: formatDateTime(v.etpDate) },
        { label: "Destination", value: v.destination },
        { label: "Weight", value: formatWeight(v.netWeight) },
        { label: "Route", value: v.route },
    ];

    const mapsUrl =
        location &&
            Number.isFinite(location.latitude) &&
            Number.isFinite(location.longitude)
            ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
            : null;

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            title={
                <span className="flex min-w-0 items-center gap-3">
                    <span className="truncate tracking-wide">
                        {v.vehicleNo || "Vehicle"}
                    </span>
                    <StatusBadge status={v.status} />
                </span>
            }
            description={
                <span className="flex flex-wrap gap-x-2">
                    <span>
                        Token{" "}
                        <span className="font-medium text-gray-700">
                            {v.tokenNo || "—"}
                        </span>
                    </span>
                    {v.createdAt && (
                        <>
                            <span aria-hidden="true">·</span>
                            <span>Created {formatDateTime(v.createdAt)}</span>
                        </>
                    )}
                </span>
            }
            footer={
                <div className="flex justify-end gap-2">
                    <CommonButton variant="secondary" onClick={onClose}>
                        Close
                    </CommonButton>

                    {canEdit && (
                        <CommonButton icon={Pencil} onClick={onEdit}>
                            Edit vehicle
                        </CommonButton>
                    )}
                </div>
            }
        >
            <div className="space-y-4 bg-gray-50 p-4 sm:p-6">
                {/* ================= SUMMARY STRIP ================= */}

                {/* <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-cols-4">
                    <SummaryTile label="Buyer" value={v.buyerDetails} />
                    <SummaryTile label="Destination" value={v.destination} />
                    <SummaryTile label="Net weight" value={formatWeight(v.netWeight)} />
                    <SummaryTile label="Transporter" value={v.transporterName} />
                </div> */}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* ================= MAIN COLUMN ================= */}

                    <div className="space-y-4 lg:col-span-2">
                        <ModalSection title="Dispatch details" icon={Truck}>
                            <DetailGrid>
                                {dispatchFields.map(({ label, value, display, mono }) => (
                                    <DetailItem
                                        key={label}
                                        label={label}
                                        value={display ?? value}
                                        mono={mono}
                                        action={<CopyButton value={value} label={label} />}
                                    />
                                ))}
                            </DetailGrid>
                        </ModalSection>

                        <ModalSection title="Other details" icon={Package}>
                            <DetailGrid>
                                <DetailItem label="Token number" value={v.tokenNo} />
                                <DetailItem label="Driver name" value={v.driverName} />
                                <DetailItem label="Tyre" value={v.tyre} />
                                <DetailItem label="Material" value={v.materialName} />
                                <DetailItem label="Grade" value={v.materialGrade} />
                                {v.status === "ON_HOLD" && (
                                    <DetailItem
                                        label="On hold reason"
                                        value={v.holdReason}
                                        wide
                                    />
                                )}
                            </DetailGrid>
                        </ModalSection>

                        <ModalSection
                            title="Documents"
                            icon={FileText}
                            action={
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-600">
                                    {uploadedCount} of {DOCUMENTS.length} uploaded
                                </span>
                            }
                        >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {DOCUMENTS.map(({ key, label }) => (
                                    <DocumentItem
                                        key={key}
                                        label={label}
                                        value={v.documents?.[key] || null}
                                    />
                                ))}
                            </div>
                        </ModalSection>
                    </div>

                    {/* ================= SIDE COLUMN ================= */}

                    <div className="space-y-4">
                        <ModalSection title="Timing" icon={Clock}>
                            <dl className="space-y-3">
                                <DetailItem label="In time" value={formatDateTime(v.inTime)} />
                                <DetailItem label="Out time" value={formatDateTime(v.outTime)} />
                                <DetailItem label="Created" value={formatDateTime(v.createdAt)} />
                                <DetailItem label="Last updated" value={formatDateTime(v.updatedAt)} />
                            </dl>
                        </ModalSection>

                        <ModalSection
                            title="Current location"
                            icon={MapPin}
                            action={
                                mapsUrl && (
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                                    >
                                        Open map
                                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                    </a>
                                )
                            }
                        >
                            {location ? (
                                <dl className="space-y-3">
                                    <DetailItem label="Address" value={location.address} />
                                    <DetailItem
                                        label="Coordinates"
                                        mono
                                        value={
                                            Number.isFinite(location.latitude)
                                                ? `${location.latitude}, ${location.longitude}`
                                                : ""
                                        }
                                    />
                                    <div className="grid grid-cols-3 gap-3">
                                        <DetailItem label="Speed" value={location.speed} />
                                        <DetailItem label="Heading" value={location.heading} />
                                        <DetailItem label="Accuracy" value={location.accuracy} />
                                    </div>
                                    <DetailItem
                                        label="Recorded"
                                        value={formatDateTime(location.recordedAt)}
                                    />
                                </dl>
                            ) : (
                                <EmptyNote>Location not available</EmptyNote>
                            )}
                        </ModalSection>

                        <ModalSection title="People" icon={Users}>
                            <div className="space-y-4">
                                <PersonCard heading="Created by" person={v.createdBy} />
                                <PersonCard heading="Last updated by" person={v.updatedBy} />
                            </div>
                        </ModalSection>
                    </div>
                </div>

                {/* ================= ACTIVITY ================= */}

                <ModalSection
                    title="Activity"
                    description="Most recent first"
                    icon={Activity}
                    action={
                        tracking.length > 0 && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-600">
                                {tracking.length}
                            </span>
                        )
                    }
                >
                    {tracking.length > 0 ? (
                        <ol>
                            {tracking.map((item, index) => (
                                <TimelineEntry
                                    key={`${item.createdAt}-${index}`}
                                    item={item}
                                    isLast={index === tracking.length - 1}
                                />
                            ))}
                        </ol>
                    ) : (
                        <EmptyNote>No activity recorded yet</EmptyNote>
                    )}
                </ModalSection>
            </div>
        </CommonModal>
    );
};

export default ViewModal;
