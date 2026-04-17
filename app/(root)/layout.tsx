import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { isAuthenticated } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import UserMenu from "@/components/UserMenu";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await isAuthenticated();

  return (
    <div className="root-layout">

      <nav className="flex items-center justify-between px-6 py-4">
        {/* Left Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="logo"
            width={38}
            height={32}
          />
          <h2 className="text-primary-100 font-semibold">
            VocalHire
          </h2>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="font-semibold hover:text-purple-400 transition">
            Home
          </Link>
          <Link href="/about" className="font-semibold hover:text-purple-400 transition">
            About Us
          </Link>
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link href="/sign-in">
              <button className="bg-purple-500 px-4 py-2 rounded">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </nav>

      {children}

    </div>
  );
}