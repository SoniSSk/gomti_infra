"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");

        await signOut({ redirect: false });

        router.push("/");
    };

    return (
        <button
            onClick={handleLogout}
            className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600"
        >
            Logout
        </button>
    );
}