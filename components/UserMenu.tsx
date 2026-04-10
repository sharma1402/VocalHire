"use client";

import { useState, useRef, useEffect } from "react";
import { logout } from "@/lib/actions/auth.action";
import { useRouter } from "next/navigation";

export default function UserMenu({ user }: any) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const name =
    user?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const email =
    user?.email ||
    "No email";

  const initial =
    (name || "U").charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.replace("/sign-in");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () =>
      document.removeEventListener(
        "mousedown",
        handler
      );
  }, []);

  return (
    <div className="relative" ref={ref}>

      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-gray-800 border border-gray-600 
                   flex items-center justify-center text-white font-semibold"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-lg">

          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-sm font-medium text-white">
              {name}
            </p>

            <p className="text-xs text-gray-400 truncate">
              {email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 hover:bg-gray-800 text-sm text-red-400"
          >
            Logout
          </button>

        </div>
      )}

    </div>
  );
}