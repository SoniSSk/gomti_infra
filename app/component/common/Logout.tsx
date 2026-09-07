"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");

        router.push("/login");
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