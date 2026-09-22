/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import toast from "react-hot-toast";
import CommonModal from "./CommonModal";

/* =========================================================
   TYPES
========================================================= */

export interface CommonFileUploadProps {
    label: string;

    accept?: string;

    value?: File | string | null;

    onChange?: (
        file: File | null,
    ) => void;

    /**
     * Called after successful S3 upload.
     *
     * Returns the uploaded S3 URL.
     */
    onUpload?: (
        url: string,
    ) => void;

    /**
     * Upload API.
     *
     * Default:
     * /api/upload
     *
     * Your API should upload the received
     * file to AWS S3 and return:
     *
     * {
     *   success: true,
     *   url: "https://....s3...."
     * }
     */
    uploadUrl?: string;

    /**
     * Automatically upload selected
     * file to S3.
     */
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

/* =========================================================
   COMPONENT
========================================================= */

const CommonFileUpload: React.FC<
    CommonFileUploadProps
> = ({
    label,

    accept = "image/*,.pdf,video/*",

    value = null,

    onChange,

    onUpload,

    uploadUrl = "/api/upload",

    autoUpload = true,

    disabled = false,

    required = false,

    maxSizeMB = 100,

    className = "",

    previewHeight = "h-52",

    showPreview = true,

    showReplace = true,

    showRemove = true,

    showOpen = true,

    showFileName = true,

    uploadSuccessMessage =
    "File uploaded successfully",

    uploadErrorMessage =
    "Upload failed",
}) => {

        /* =====================================================
           REFS
        ===================================================== */

        const inputRef =
            useRef<HTMLInputElement>(null);

        const fileReaderRef =
            useRef<FileReader | null>(null);

        /* =====================================================
           STATE
        ===================================================== */

        const [
            selectedFile,
            setSelectedFile,
        ] = useState<File | null>(null);

        const [
            localPreviewUrl,
            setLocalPreviewUrl,
        ] = useState<string | null>(null);

        const [
            uploadedUrl,
            setUploadedUrl,
        ] = useState<string | null>(
            typeof value === "string"
                ? value
                : null,
        );

        console.log(uploadedUrl, "uploadedUrl")

        const [
            error,
            setError,
        ] = useState("");

        const [
            loading,
            setLoading,
        ] = useState(false);

        const [
            isPreviewOpen,
            setIsPreviewOpen,
        ] = useState(false);

        const [
            rotation,
            setRotation,
        ] = useState(0);

        /* =====================================================
           EFFECTIVE FILE
        ===================================================== */

        const effectiveFile =
            selectedFile ??
            (value instanceof File
                ? value
                : null);

        /* =====================================================
           EFFECTIVE URL
        ===================================================== */

        const effectivePreviewUrl =
            localPreviewUrl ??
            uploadedUrl ??
            (typeof value === "string"
                ? value
                : null);

        /* =====================================================
           FILE NAME
        ===================================================== */

        const effectiveFileName =
            selectedFile?.name ??
            (value instanceof File
                ? value.name
                : typeof value === "string"
                    ? value.split("/").pop() ||
                    "Uploaded file"
                    : uploadedUrl
                        ? uploadedUrl
                            .split("/")
                            .pop() ||
                        "Uploaded file"
                        : "");

        /* =====================================================
           SYNC VALUE
        ===================================================== */

        useEffect(() => {
            if (
                typeof value === "string"
            ) {
                setUploadedUrl(value);
                return;
            }

            if (!value) {
                setUploadedUrl(null);
            }
        }, [value]);

        /* =====================================================
           FILE READER
        ===================================================== */

        const createLocalPreview = (
            file: File,
        ) => {
            const reader =
                new FileReader();

            fileReaderRef.current =
                reader;

            reader.onload = () => {
                if (
                    fileReaderRef.current !==
                    reader
                ) {
                    return;
                }

                const result =
                    reader.result;

                if (
                    typeof result === "string"
                ) {
                    setLocalPreviewUrl(
                        result,
                    );
                }
            };

            reader.onerror = () => {
                if (
                    fileReaderRef.current !==
                    reader
                ) {
                    return;
                }

                setLocalPreviewUrl(
                    null,
                );
            };

            reader.readAsDataURL(file);
        };

        /* =====================================================
           CLEANUP
        ===================================================== */

        useEffect(() => {
            return () => {
                if (
                    fileReaderRef.current &&
                    fileReaderRef.current
                        .readyState ===
                    FileReader.LOADING
                ) {
                    fileReaderRef.current.abort();
                }
            };
        }, []);

        /* =====================================================
           FILE TYPE HELPERS
        ===================================================== */

        const getExtension = (
            name: string,
        ) => {
            const extension =
                name
                    .split(".")
                    .pop();

            return extension
                ? extension.toLowerCase()
                : "";
        };

        const extension =
            getExtension(
                effectiveFileName,
            );

        const isImage =
            effectiveFile
                ? effectiveFile.type.startsWith(
                    "image/",
                )
                : /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)$/i.test(
                    effectiveFileName,
                );

        const isPdf =
            effectiveFile
                ? effectiveFile.type ===
                "application/pdf"
                : extension === "pdf";

        const isVideo =
            effectiveFile
                ? effectiveFile.type.startsWith(
                    "video/",
                )
                : /\.(mp4|webm|mov|avi|mkv|m4v|ogg)$/i.test(
                    effectiveFileName,
                );

        /* =====================================================
           FILE EXTENSION
        ===================================================== */

        const getFileExtension = () => {
            const ext =
                effectiveFileName
                    .split(".")
                    .pop();

            return ext
                ? ext.toUpperCase()
                : "FILE";
        };

        /* =====================================================
           OPEN FILE PICKER
        ===================================================== */

        const openFilePicker = () => {
            if (
                disabled ||
                loading
            ) {
                return;
            }

            inputRef.current?.click();
        };

        /* =====================================================
           UPLOAD TO AWS S3
        ===================================================== */

        const uploadFile = async (
            file: File,
        ) => {
            try {
                setLoading(true);
                setError("");

                const formData =
                    new FormData();

                formData.append(
                    "file",
                    file,
                );

                const response =
                    await fetch(
                        uploadUrl,
                        {
                            method: "POST",
                            body: formData,
                        },
                    );

                /*
                 * Handle non-JSON responses safely.
                 */
                const contentType =
                    response.headers.get(
                        "content-type",
                    ) || "";

                let data: any = null;

                if (
                    contentType.includes(
                        "application/json",
                    )
                ) {
                    data =
                        await response.json();
                } else {
                    const text =
                        await response.text();

                    throw new Error(
                        text ||
                        `Upload failed with status ${response.status}`,
                    );
                }

                if (
                    !response.ok ||
                    !data?.success
                ) {
                    throw new Error(
                        data?.error ||
                        data?.message ||
                        uploadErrorMessage,
                    );
                }

                /*
                 * Your /api/upload API should
                 * return the AWS S3 URL here.
                 */
                const s3Url =
                    data?.url ||
                    data?.location ||
                    data?.Location;

                if (!s3Url) {
                    throw new Error(
                        "AWS S3 upload completed but URL was not returned",
                    );
                }

                /*
                 * Store the S3 URL.
                 */
                setUploadedUrl(
                    s3Url,
                );

                /*
                 * Keep the uploaded URL
                 * visible immediately.
                 */
                setLocalPreviewUrl(
                    s3Url,
                );

                /*
                 * Notify parent with
                 * the actual S3 URL.
                 */
                onUpload?.(
                    s3Url,
                );

                toast.success(
                    uploadSuccessMessage,
                );

                return s3Url;
            } catch (uploadError) {
                console.error(
                    "❌ AWS S3 upload failed:",
                    uploadError,
                );

                const message =
                    uploadError instanceof Error
                        ? uploadError.message
                        : uploadErrorMessage;

                setError(
                    message,
                );

                toast.error(
                    message,
                );

                return null;
            } finally {
                setLoading(false);
            }
        };

        /* =====================================================
           FILE CHANGE
        ===================================================== */

        const handleFileChange =
            async (
                event: React.ChangeEvent<HTMLInputElement>,
            ) => {
                if (
                    disabled ||
                    loading
                ) {
                    event.target.value =
                        "";

                    return;
                }

                const file =
                    event.target.files?.[0];

                if (!file) {
                    return;
                }

                setError("");

                /* =========================
                   SIZE VALIDATION
                ========================= */

                const maxSize =
                    maxSizeMB *
                    1024 *
                    1024;

                if (
                    file.size >
                    maxSize
                ) {
                    const message =
                        `File size must be less than ${maxSizeMB} MB`;

                    setError(
                        message,
                    );

                    toast.error(
                        message,
                    );

                    event.target.value =
                        "";

                    return;
                }

                /* =========================
                   LOCAL PREVIEW
                ========================= */

                createLocalPreview(
                    file,
                );

                setSelectedFile(
                    file,
                );

                setRotation(
                    0,
                );

                /*
                 * Parent gets the local
                 * File immediately.
                 */
                onChange?.(
                    file,
                );

                /* =========================
                   AWS S3 UPLOAD
                ========================= */

                if (autoUpload) {
                    await uploadFile(
                        file,
                    );
                }
            };

        /* =====================================================
           REMOVE
        ===================================================== */

        const handleRemove = () => {
            if (disabled) {
                return;
            }

            if (
                fileReaderRef.current &&
                fileReaderRef.current
                    .readyState ===
                FileReader.LOADING
            ) {
                fileReaderRef.current.abort();
            }

            fileReaderRef.current =
                null;

            setLocalPreviewUrl(
                null,
            );

            setUploadedUrl(
                null,
            );

            setSelectedFile(
                null,
            );

            setError("");

            setRotation(
                0,
            );

            setIsPreviewOpen(
                false,
            );

            if (
                inputRef.current
            ) {
                inputRef.current.value =
                    "";
            }

            /*
             * Notify parent.
             */
            onChange?.(
                null,
            );

            /*
             * Clear S3 URL in parent.
             */
            onUpload?.(
                "",
            );
        };

        /* =====================================================
           REPLACE
        ===================================================== */

        const handleReplace = () => {
            if (
                disabled ||
                loading
            ) {
                return;
            }

            inputRef.current?.click();
        };

        /* =====================================================
           OPEN PREVIEW
        ===================================================== */

        const handleOpen = () => {
            if (
                !effectivePreviewUrl
            ) {
                return;
            }

            setRotation(
                0,
            );

            setIsPreviewOpen(
                true,
            );
        };

        /* =====================================================
           CLOSE PREVIEW
        ===================================================== */

        const handleClosePreview =
            () => {
                setIsPreviewOpen(
                    false,
                );

                setRotation(
                    0,
                );
            };

        /* =====================================================
           ROTATE
        ===================================================== */

        const handleRotateLeft =
            () => {
                if (!isImage) {
                    return;
                }

                setRotation(
                    (previous) =>
                        previous - 90,
                );
            };

        const handleRotateRight =
            () => {
                if (!isImage) {
                    return;
                }

                setRotation(
                    (previous) =>
                        previous + 90,
                );
            };

        const handleResetRotation =
            () => {
                setRotation(
                    0,
                );
            };

        /* =====================================================
           ESC KEY
        ===================================================== */

        useEffect(() => {
            if (
                !isPreviewOpen
            ) {
                return;
            }

            const handleKeyDown =
                (
                    event: KeyboardEvent,
                ) => {
                    if (
                        event.key ===
                        "Escape"
                    ) {
                        handleClosePreview();
                    }
                };

            document.addEventListener(
                "keydown",
                handleKeyDown,
            );

            return () => {
                document.removeEventListener(
                    "keydown",
                    handleKeyDown,
                );
            };
        }, [
            isPreviewOpen,
        ]);

        /* =====================================================
           RENDER
        ===================================================== */

        return (
            <>
                <div
                    className={`w-full ${className}`}
                >

                    {/* =================================================
                    LABEL
                ================================================= */}

                    <label
                        className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-gray-700
                    "
                    >
                        {label}

                        {required && (
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        )}
                    </label>

                    {/* =================================================
                    CARD
                ================================================= */}

                    <div
                        className={`
                        overflow-hidden
                        rounded-xl
                        border
                        bg-white
                        transition
                        ${effectivePreviewUrl
                                ? "border-orange-200"
                                : "border-dashed border-orange-300"
                            }
                        ${disabled
                                ? "cursor-not-allowed opacity-60"
                                : ""
                            }
                    `}
                    >

                        {/* =================================================
                        UPLOAD STATE
                    ================================================= */}

                        {!effectivePreviewUrl ? (
                            <button
                                type="button"
                                disabled={
                                    disabled ||
                                    loading
                                }
                                onClick={
                                    openFilePicker
                                }
                                className="
                                flex
                                min-h-[150px]
                                w-full
                                flex-col
                                items-center
                                justify-center
                                px-4
                                py-6
                                text-center
                                transition
                                hover:bg-orange-50
                                disabled:cursor-not-allowed
                            "
                            >

                                <div
                                    className="
                                    mb-3
                                    flex
                                    h-12
                                    w-12
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-gradient-to-br
                                    from-orange-100
                                    to-amber-50
                                "
                                >
                                    <svg
                                        className="h-6 w-6 text-orange-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="
                                            M7 16a4 4 0 01-.88-7.903
                                            A5 5 0 0117.9 6L18 6
                                            a5 5 0 011 9.9
                                            M15 13l-3-3m0 0l-3 3m3-3v9
                                        "
                                        />
                                    </svg>
                                </div>

                                <p
                                    className="
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                "
                                >
                                    {loading
                                        ? "Uploading to S3..."
                                        : "Click to upload"}
                                </p>

                                <p
                                    className="
                                    mt-1
                                    text-xs
                                    text-slate-500
                                "
                                >
                                    Select a supported file
                                </p>

                                <p
                                    className="
                                    mt-1
                                    text-xs
                                    text-slate-400
                                "
                                >
                                    Maximum{" "}
                                    {maxSizeMB} MB
                                </p>

                            </button>
                        ) : (

                            /* =================================================
                               PREVIEW STATE
                            ================================================= */

                            <div>

                                {showPreview && (
                                    <div
                                        className="
                                        relative
                                        bg-slate-50
                                    "
                                    >

                                        {isImage ? (
                                            <div
                                                className={`
                                                flex
                                                ${previewHeight}
                                                items-center
                                                justify-center
                                                overflow-hidden
                                                p-3
                                            `}
                                            >
                                                <img
                                                    src={
                                                        effectivePreviewUrl
                                                    }
                                                    alt={
                                                        effectiveFileName
                                                    }
                                                    className="
                                                    max-h-full
                                                    max-w-full
                                                    rounded-lg
                                                    object-contain
                                                "
                                                />
                                            </div>
                                        ) : isPdf ? (
                                            <iframe
                                                src={
                                                    effectivePreviewUrl
                                                }
                                                title={
                                                    effectiveFileName
                                                }
                                                className={`
                                                ${previewHeight}
                                                w-full
                                                border-0
                                            `}
                                            />
                                        ) : isVideo ? (
                                            <video
                                                src={
                                                    effectivePreviewUrl
                                                }
                                                controls
                                                className={`
                                                ${previewHeight}
                                                w-full
                                                object-contain
                                            `}
                                            />
                                        ) : (
                                            <div
                                                className={`
                                                flex
                                                ${previewHeight}
                                                flex-col
                                                items-center
                                                justify-center
                                            `}
                                            >
                                                <div
                                                    className="
                                                    flex
                                                    h-16
                                                    w-16
                                                    items-center
                                                    justify-center
                                                    rounded-xl
                                                    bg-orange-50
                                                "
                                                >
                                                    <svg
                                                        className="
                                                        h-8
                                                        w-8
                                                        text-orange-600
                                                    "
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="
                                                            M7 21h10a2 2 0 002-2
                                                            V9.414a2 2 0 00-.586-1.414
                                                            l-4.414-4.414A2 2 0 0012.586 3H7
                                                            a2 2 0 00-2 2v14a2 2 0 002 2z
                                                        "
                                                        />
                                                    </svg>
                                                </div>

                                                <p
                                                    className="
                                                    mt-3
                                                    text-sm
                                                    font-semibold
                                                    text-slate-700
                                                "
                                                >
                                                    {getFileExtension()} File
                                                </p>
                                            </div>
                                        )}

                                    </div>
                                )}

                                {/* =================================================
                                FILE INFORMATION
                            ================================================= */}

                                {showFileName && (
                                    <div
                                        className="
                                        border-t
                                        border-orange-100
                                        px-4
                                        py-3
                                    "
                                    >
                                        <div
                                            className="
                                            flex
                                            items-center
                                            justify-between
                                            gap-3
                                        "
                                        >

                                            <div
                                                className="
                                                min-w-0
                                                flex-1
                                            "
                                            >
                                                <p
                                                    className="
                                                    truncate
                                                    text-sm
                                                    font-semibold
                                                    text-slate-800
                                                "
                                                    title={
                                                        effectiveFileName
                                                    }
                                                >
                                                    {
                                                        effectiveFileName
                                                    }
                                                </p>

                                                <p
                                                    className="
                                                    mt-1
                                                    text-xs
                                                    text-slate-500
                                                "
                                                >
                                                    {loading
                                                        ? "Uploading to AWS S3..."
                                                        : uploadedUrl
                                                            ? "Uploaded to AWS S3 successfully"
                                                            : "File selected"}
                                                </p>
                                            </div>

                                            <div
                                                className="
                                                flex
                                                shrink-0
                                                flex-wrap
                                                items-center
                                                justify-end
                                                gap-2
                                            "
                                            >

                                                {/* OPEN */}

                                                {showOpen && (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            !effectivePreviewUrl
                                                        }
                                                        onClick={
                                                            handleOpen
                                                        }
                                                        className="
                                                        rounded-lg
                                                        border
                                                        border-orange-200
                                                        bg-orange-50
                                                        px-3
                                                        py-2
                                                        text-xs
                                                        font-semibold
                                                        text-orange-600
                                                        transition
                                                        hover:bg-orange-100
                                                        disabled:cursor-not-allowed
                                                        disabled:opacity-50
                                                    "
                                                    >
                                                        Open
                                                    </button>
                                                )}

                                                {/* REPLACE */}

                                                {showReplace && (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            disabled ||
                                                            loading
                                                        }
                                                        onClick={
                                                            handleReplace
                                                        }
                                                        className="
                                                        rounded-lg
                                                        border
                                                        border-slate-200
                                                        bg-white
                                                        px-3
                                                        py-2
                                                        text-xs
                                                        font-semibold
                                                        text-slate-700
                                                        transition
                                                        hover:bg-slate-50
                                                        disabled:cursor-not-allowed
                                                        disabled:opacity-50
                                                    "
                                                    >
                                                        {loading
                                                            ? "Uploading..."
                                                            : "Replace"}
                                                    </button>
                                                )}

                                                {/* REMOVE */}

                                                {showRemove && (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            disabled ||
                                                            loading
                                                        }
                                                        onClick={
                                                            handleRemove
                                                        }
                                                        className="
                                                        rounded-lg
                                                        border
                                                        border-red-200
                                                        bg-red-50
                                                        px-3
                                                        py-2
                                                        text-xs
                                                        font-semibold
                                                        text-red-600
                                                        transition
                                                        hover:bg-red-100
                                                        disabled:cursor-not-allowed
                                                        disabled:opacity-50
                                                    "
                                                    >
                                                        Remove
                                                    </button>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =================================================
                        HIDDEN INPUT
                    ================================================= */}

                        <input
                            ref={inputRef}
                            type="file"
                            accept={accept}
                            onChange={
                                handleFileChange
                            }
                            disabled={
                                disabled ||
                                loading
                            }
                            className="hidden"
                        />
                    </div>

                    {/* =================================================
                    ERROR
                ================================================= */}

                    {error && (
                        <p
                            className="
                            mt-1
                            text-xs
                            font-medium
                            text-red-500
                        "
                        >
                            {error}
                        </p>
                    )}

                    {/* =================================================
                    DISABLED MESSAGE
                ================================================= */}

                    {disabled && (
                        <p
                            className="
                            mt-1
                            text-xs
                            text-slate-500
                        "
                        >
                            You do not have permission
                            to change this file.
                        </p>
                    )}
                </div>

                {/* =====================================================
                PREVIEW MODAL
            ===================================================== */}

                {effectivePreviewUrl && (
                    <CommonModal
                        isOpen={
                            isPreviewOpen
                        }
                        onClose={
                            handleClosePreview
                        }
                        title={
                            effectiveFileName
                        }
                        size="xl"
                    >
                        <div
                            className="
                            flex
                            h-[calc(95vh-60px)]
                            flex-col
                        "
                        >

                            {/* TOOLBAR */}

                            <div
                                className="
                                flex
                                shrink-0
                                flex-wrap
                                items-center
                                justify-center
                                gap-2
                                border-b
                                border-orange-100
                                bg-orange-50
                                p-3
                            "
                            >

                                <button
                                    type="button"
                                    onClick={
                                        handleRotateLeft
                                    }
                                    title="Rotate left"
                                    disabled={
                                        !isImage
                                    }
                                    className="
                                    inline-flex
                                    h-10
                                    w-10
                                    items-center
                                    justify-center
                                    rounded-lg
                                    border
                                    border-orange-200
                                    bg-white
                                    text-orange-600
                                    transition
                                    hover:bg-orange-100
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                                >
                                    ↶
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleRotateRight
                                    }
                                    title="Rotate right"
                                    disabled={
                                        !isImage
                                    }
                                    className="
                                    inline-flex
                                    h-10
                                    w-10
                                    items-center
                                    justify-center
                                    rounded-lg
                                    border
                                    border-orange-200
                                    bg-white
                                    text-orange-600
                                    transition
                                    hover:bg-orange-100
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                                >
                                    ↷
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleResetRotation
                                    }
                                    disabled={
                                        !isImage
                                    }
                                    className="
                                    rounded-lg
                                    border
                                    border-orange-200
                                    bg-white
                                    px-3
                                    py-2
                                    text-xs
                                    font-semibold
                                    text-orange-600
                                    transition
                                    hover:bg-orange-100
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                                >
                                    Reset
                                </button>

                                {isImage && (
                                    <span
                                        className="
                                        ml-1
                                        min-w-[45px]
                                        text-center
                                        text-xs
                                        font-medium
                                        text-slate-500
                                    "
                                    >
                                        {(
                                            (
                                                rotation %
                                                360
                                            ) +
                                            360
                                        ) %
                                            360}
                                        °
                                    </span>
                                )}
                            </div>

                            {/* PREVIEW */}

                            <div
                                className="
                                flex
                                min-h-0
                                flex-1
                                items-center
                                justify-center
                                overflow-auto
                                bg-slate-900
                                p-4
                                sm:p-8
                            "
                            >
                                {isImage ? (
                                    <img
                                        src={
                                            effectivePreviewUrl
                                        }
                                        alt={
                                            effectiveFileName
                                        }
                                        className="
                                        max-h-full
                                        max-w-full
                                        rounded-lg
                                        object-contain
                                        shadow-2xl
                                        transition-transform
                                        duration-300
                                    "
                                        style={{
                                            transform:
                                                `rotate(${rotation}deg)`,
                                        }}
                                    />
                                ) : isPdf ? (
                                    <iframe
                                        src={
                                            effectivePreviewUrl
                                        }
                                        title={
                                            effectiveFileName
                                        }
                                        className="
                                        h-full
                                        w-full
                                        rounded-lg
                                        bg-white
                                    "
                                    />
                                ) : isVideo ? (
                                    <video
                                        src={
                                            effectivePreviewUrl
                                        }
                                        controls
                                        className="
                                        max-h-full
                                        max-w-full
                                        rounded-lg
                                    "
                                    />
                                ) : (
                                    <div
                                        className="
                                        flex
                                        flex-col
                                        items-center
                                        justify-center
                                        text-center
                                        text-white
                                    "
                                    >
                                        <div
                                            className="
                                            mb-4
                                            flex
                                            h-20
                                            w-20
                                            items-center
                                            justify-center
                                            rounded-2xl
                                            bg-white/10
                                        "
                                        >
                                            <svg
                                                className="h-10 w-10"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="
                                                    M7 21h10a2 2 0 002-2
                                                    V9.414a2 2 0 00-.586-1.414
                                                    l-4.414-4.414A2 2 0 0012.586 3H7
                                                    a2 2 0 00-2 2v14a2 2 0 002 2z
                                                "
                                                />
                                            </svg>
                                        </div>

                                        <p className="text-lg font-semibold">
                                            {getFileExtension()} File
                                        </p>

                                        <p className="mt-1 text-sm text-gray-300">
                                            Preview is not
                                            available
                                            for this file type.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* FOOTER */}

                            <div
                                className="
                                flex
                                shrink-0
                                items-center
                                justify-between
                                gap-3
                                border-t
                                border-orange-100
                                bg-white
                                px-4
                                py-3
                            "
                            >
                                <span
                                    className="
                                    truncate
                                    text-xs
                                    text-slate-500
                                "
                                >
                                    {isImage
                                        ? `Rotation: ${(
                                            (
                                                rotation %
                                                360
                                            ) +
                                            360
                                        ) %
                                        360}°`
                                        : "Document preview"}
                                </span>

                                <button
                                    type="button"
                                    onClick={
                                        handleClosePreview
                                    }
                                    className="
                                    shrink-0
                                    rounded-lg
                                    bg-orange-600
                                    px-4
                                    py-2
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition
                                    hover:bg-orange-700
                                "
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </CommonModal>
                )}
            </>
        );
    };

export default CommonFileUpload;