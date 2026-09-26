/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    ExternalLink,
    Eye,
    File as FileIcon,
    FileText,
    Film,
    Image as ImageIcon,
    LoaderCircle,
    RefreshCw,
    RotateCcw,
    RotateCw,
    Trash2,
    UploadCloud,
} from "lucide-react";
import toast from "react-hot-toast";

import CommonButton from "./CommonButton";
import CommonModal from "./CommonModal";
import CommonTooltip from "./CommonTooltip";

/* =========================================================
   TYPES
========================================================= */

export interface CommonFileUploadProps {
    label: string;
    accept?: string;
    value?: File | string | null;
    onChange?: (file: File | null) => void;
    /** Called with the uploaded file URL ("" when removed). */
    onUpload?: (url: string) => void;
    /** Called with true when an upload starts and false when it finishes. */
    onUploadingChange?: (uploading: boolean) => void;
    /** POST endpoint; must return `{ success: true, url }`. */
    uploadUrl?: string;
    /** Upload as soon as a file is picked. */
    autoUpload?: boolean;
    disabled?: boolean;
    required?: boolean;
    maxSizeMB?: number;
    className?: string;
    previewHeight?: string;
    showPreview?: boolean;
    showReplace?: boolean;
    showRemove?: boolean;
    showOpen?: boolean;
    showFileName?: boolean;
    uploadSuccessMessage?: string;
    uploadErrorMessage?: string;
}

type FileKind = "image" | "pdf" | "video" | "other";

/* =========================================================
   HELPERS
========================================================= */

const IMAGE_RE = /\.(jpe?g|png|gif|webp|bmp|svg|avif)$/i;
const VIDEO_RE = /\.(mp4|webm|mov|avi|mkv|m4v|ogg)$/i;

const getFileKind = (file: File | null, name: string): FileKind => {
    if (file) {
        if (file.type.startsWith("image/")) return "image";
        if (file.type === "application/pdf") return "pdf";
        if (file.type.startsWith("video/")) return "video";
        return "other";
    }

    if (IMAGE_RE.test(name)) return "image";
    if (/\.pdf$/i.test(name)) return "pdf";
    if (VIDEO_RE.test(name)) return "video";
    return "other";
};

const KIND_META: Record<FileKind, { label: string; icon: typeof FileIcon }> = {
    image: { label: "Image", icon: ImageIcon },
    pdf: { label: "PDF", icon: FileText },
    video: { label: "Video", icon: Film },
    other: { label: "File", icon: FileIcon },
};

/** Last path segment of a URL, without the query string. */
const fileNameFromUrl = (url: string) =>
    decodeURIComponent(url.split("?")[0].split("/").pop() || "") ||
    "Uploaded file";

const normalizeRotation = (degrees: number) => ((degrees % 360) + 360) % 360;

/* =========================================================
   COMPONENT
========================================================= */

const CommonFileUpload: React.FC<CommonFileUploadProps> = ({
    label,
    accept = "image/*,.pdf,video/*",
    value = null,
    onChange,
    onUpload,
    onUploadingChange,
    uploadUrl = "/api/upload",
    autoUpload = true,
    disabled = false,
    required = false,
    maxSizeMB = 100,
    className = "",
    previewHeight = "h-40",
    showPreview = true,
    showReplace = true,
    showRemove = true,
    showOpen = true,
    showFileName = true,
    uploadSuccessMessage = "File uploaded successfully",
    uploadErrorMessage = "Upload failed",
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const fileReaderRef = useRef<FileReader | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(
        typeof value === "string" ? value : null,
    );
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [rotation, setRotation] = useState(0);

    /* ================= DERIVED ================= */

    const effectiveFile = selectedFile ?? (value instanceof File ? value : null);

    const previewUrl =
        localPreviewUrl ??
        uploadedUrl ??
        (typeof value === "string" ? value : null);

    const fileName =
        effectiveFile?.name ??
        (typeof value === "string"
            ? fileNameFromUrl(value)
            : uploadedUrl
                ? fileNameFromUrl(uploadedUrl)
                : "");

    const kind = getFileKind(effectiveFile, fileName);
    const { label: kindLabel, icon: KindIcon } = KIND_META[kind];
    const isImage = kind === "image";
    const canEdit = !disabled && !loading;

    /* ================= SYNC VALUE ================= */

    useEffect(() => {
        if (typeof value === "string") {
            setUploadedUrl(value);
        } else if (!value) {
            setUploadedUrl(null);
        }
    }, [value]);

    useEffect(
        () => () => {
            if (fileReaderRef.current?.readyState === FileReader.LOADING) {
                fileReaderRef.current.abort();
            }
        },
        [],
    );

    /* ================= LOCAL PREVIEW ================= */

    const createLocalPreview = (file: File) => {
        const reader = new FileReader();
        fileReaderRef.current = reader;

        reader.onload = () => {
            if (fileReaderRef.current === reader && typeof reader.result === "string") {
                setLocalPreviewUrl(reader.result);
            }
        };

        reader.onerror = () => {
            if (fileReaderRef.current === reader) {
                setLocalPreviewUrl(null);
            }
        };

        reader.readAsDataURL(file);
    };

    /* ================= UPLOAD ================= */

    const uploadFile = async (file: File) => {
        setLoading(true);
        onUploadingChange?.(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(uploadUrl, {
                method: "POST",
                body: formData,
            });

            const contentType = response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                const text = await response.text();
                throw new Error(text || `Upload failed with status ${response.status}`);
            }

            const data = await response.json();

            if (!response.ok || !data?.success) {
                throw new Error(data?.error || data?.message || uploadErrorMessage);
            }

            const url: string | undefined = data?.url || data?.location || data?.Location;

            if (!url) {
                throw new Error("Upload completed but no file URL was returned");
            }

            setUploadedUrl(url);
            setLocalPreviewUrl(url);
            onUpload?.(url);
            toast.success(uploadSuccessMessage);
        } catch (uploadError) {
            console.error("File upload failed:", uploadError);

            const message =
                uploadError instanceof Error ? uploadError.message : uploadErrorMessage;

            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
            onUploadingChange?.(false);
        }
    };

    /* ================= HANDLERS ================= */

    const openFilePicker = () => {
        if (canEdit) {
            inputRef.current?.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!canEdit || !file) {
            event.target.value = "";
            return;
        }

        setError("");

        if (file.size > maxSizeMB * 1024 * 1024) {
            const message = `File size must be less than ${maxSizeMB} MB`;
            setError(message);
            toast.error(message);
            event.target.value = "";
            return;
        }

        createLocalPreview(file);
        setSelectedFile(file);
        setRotation(0);
        onChange?.(file);

        if (autoUpload) {
            await uploadFile(file);
        }
    };

    const handleRemove = () => {
        if (disabled) {
            return;
        }

        if (fileReaderRef.current?.readyState === FileReader.LOADING) {
            fileReaderRef.current.abort();
        }

        fileReaderRef.current = null;
        setLocalPreviewUrl(null);
        setUploadedUrl(null);
        setSelectedFile(null);
        setError("");
        setRotation(0);
        setIsPreviewOpen(false);

        if (inputRef.current) {
            inputRef.current.value = "";
        }

        onChange?.(null);
        onUpload?.("");
    };

    const handleOpen = () => {
        if (previewUrl) {
            setRotation(0);
            setIsPreviewOpen(true);
        }
    };

    const handleClosePreview = () => {
        setIsPreviewOpen(false);
        setRotation(0);
    };

    /* ================= STATUS LINE ================= */

    const status = loading
        ? "Uploading…"
        : selectedFile && !uploadedUrl && autoUpload
            ? "Not uploaded"
            : kindLabel;

    /* ================= RENDER ================= */

    return (
        <>
            <div className={`w-full ${className}`}>
                <p className="mb-1.5 text-xs font-medium text-gray-600">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </p>

                <div
                    className={`overflow-hidden rounded-lg border bg-white ${
                        previewUrl ? "border-gray-200" : "border-dashed border-gray-300"
                    }`}
                >
                    {!previewUrl ? (
                        /* ============ EMPTY ============ */
                        <button
                            type="button"
                            onClick={openFilePicker}
                            disabled={!canEdit}
                            className="flex min-h-[112px] w-full flex-col items-center justify-center gap-1 px-4 py-5 text-center cursor-pointer transition enabled:hover:bg-orange-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <LoaderCircle className="h-5 w-5 animate-spin text-orange-600" aria-hidden="true" />
                            ) : (
                                <UploadCloud
                                    className={`h-5 w-5 ${disabled ? "text-gray-300" : "text-orange-600"}`}
                                    aria-hidden="true"
                                />
                            )}

                            <span className={`text-sm font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
                                {loading ? "Uploading…" : disabled ? "Not uploaded" : "Click to upload"}
                            </span>

                            {!disabled && !loading && (
                                <span className="text-xs text-gray-400">Max {maxSizeMB} MB</span>
                            )}
                        </button>
                    ) : (
                        /* ============ FILLED ============ */
                        <>
                            {showPreview && (
                                <button
                                    type="button"
                                    onClick={handleOpen}
                                    disabled={!showOpen}
                                    aria-label={`Preview ${label}`}
                                    className={`relative flex w-full items-center justify-center overflow-hidden bg-gray-50 ${previewHeight} ${showOpen ? "cursor-zoom-in" : "cursor-default"}`}
                                >
                                    {kind === "image" ? (
                                        <img
                                            src={previewUrl}
                                            alt={fileName}
                                            className="max-h-full max-w-full object-contain p-2"
                                        />
                                    ) : kind === "video" ? (
                                        <video
                                            src={previewUrl}
                                            muted
                                            preload="metadata"
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : kind === "pdf" ? (
                                        /* pointer-events-none keeps the click on the button */
                                        <iframe
                                            src={previewUrl}
                                            title={fileName}
                                            className="pointer-events-none h-full w-full border-0"
                                        />
                                    ) : (
                                        <KindIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                                    )}

                                    {loading && (
                                        <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                                            <LoaderCircle className="h-5 w-5 animate-spin text-orange-600" aria-hidden="true" />
                                        </span>
                                    )}
                                </button>
                            )}

                            {showFileName && (
                                <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-2">
                                    <KindIcon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-gray-800" title={fileName}>
                                            {fileName}
                                        </p>
                                        <p className={`text-[11px] ${loading ? "text-orange-600" : "text-gray-400"}`}>
                                            {status}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center">
                                        {showOpen && (
                                            <CommonTooltip content="View file">
                                                <CommonButton
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={Eye}
                                                    onClick={handleOpen}
                                                    aria-label={`View ${label}`}
                                                />
                                            </CommonTooltip>
                                        )}

                                        {!disabled && showReplace && (
                                            <CommonTooltip content="Replace with another file">
                                                <CommonButton
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={RefreshCw}
                                                    onClick={openFilePicker}
                                                    disabled={loading}
                                                    aria-label={`Replace ${label}`}
                                                />
                                            </CommonTooltip>
                                        )}

                                        {!disabled && showRemove && (
                                            <CommonTooltip content="Remove file">
                                                <CommonButton
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={Trash2}
                                                    onClick={handleRemove}
                                                    disabled={loading}
                                                    aria-label={`Remove ${label}`}
                                                    className="hover:bg-red-50 hover:text-red-600"
                                                />
                                            </CommonTooltip>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        disabled={!canEdit}
                        className="hidden"
                    />
                </div>

                {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
            </div>

            {/* ============ PREVIEW MODAL ============ */}

            {previewUrl && (
                <CommonModal
                    isOpen={isPreviewOpen}
                    onClose={handleClosePreview}
                    title={label}
                    description={fileName}
                    size="xl"
                    footer={
                        <div className="flex items-center justify-between gap-3">
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700"
                            >
                                Open in new tab
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>

                            <CommonButton variant="secondary" onClick={handleClosePreview}>
                                Close
                            </CommonButton>
                        </div>
                    }
                >
                    <div className="flex h-[70vh] flex-col">
                        {isImage && (
                            <div className="flex shrink-0 items-center justify-center gap-1 border-b border-gray-100 bg-gray-50 px-3 py-2">
                                <CommonTooltip content="Rotate left 90°">
                                    <CommonButton
                                        variant="ghost"
                                        size="sm"
                                        icon={RotateCcw}
                                        onClick={() => setRotation((r) => r - 90)}
                                        aria-label="Rotate left"
                                    />
                                </CommonTooltip>
                                <CommonTooltip content="Rotate right 90°">
                                    <CommonButton
                                        variant="ghost"
                                        size="sm"
                                        icon={RotateCw}
                                        onClick={() => setRotation((r) => r + 90)}
                                        aria-label="Rotate right"
                                    />
                                </CommonTooltip>
                                <CommonButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setRotation(0)}
                                    disabled={normalizeRotation(rotation) === 0}
                                >
                                    Reset
                                </CommonButton>
                                <span className="ml-1 w-10 text-center text-xs tabular-nums text-gray-500">
                                    {normalizeRotation(rotation)}°
                                </span>
                            </div>
                        )}

                        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-gray-900 p-4 sm:p-6">
                            {kind === "image" ? (
                                <img
                                    src={previewUrl}
                                    alt={fileName}
                                    className="max-h-full max-w-full rounded object-contain transition-transform duration-300"
                                    style={{ transform: `rotate(${rotation}deg)` }}
                                />
                            ) : kind === "pdf" ? (
                                <iframe
                                    src={previewUrl}
                                    title={fileName}
                                    className="h-full w-full rounded bg-white"
                                />
                            ) : kind === "video" ? (
                                <video src={previewUrl} controls className="max-h-full max-w-full rounded" />
                            ) : (
                                <div className="text-center text-white">
                                    <KindIcon className="mx-auto mb-3 h-10 w-10 text-white/60" aria-hidden="true" />
                                    <p className="text-sm font-medium">Preview isn&apos;t available for this file type.</p>
                                    <p className="mt-1 text-xs text-gray-400">Use “Open in new tab” to view it.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CommonModal>
            )}
        </>
    );
};

export default CommonFileUpload;
