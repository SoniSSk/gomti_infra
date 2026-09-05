"use client";

interface ConfirmModalProps {
    open: boolean;
    title?: string;
    message?: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function ConfirmModal({
    open,
    title = "Confirm Delete",
    message = "Are you sure you want to delete this vehicle?",
    onCancel,
    onConfirm,
}: ConfirmModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h2 className="mb-2 text-xl font-bold text-gray-800">
                    {title}
                </h2>

                <p className="mb-6 text-gray-600">
                    {message}
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white transition hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}