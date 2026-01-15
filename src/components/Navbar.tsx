"use client";

import React from "react";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default function Navbar() {
  return (
    <nav className="border-b bg-white dark:bg-zinc-950 h-16 flex items-center lg:px-8 px-6 justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-black text-4xl tracking-tight text-blue-600">
          Budge-it!
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <SignOutButton />
      </div>
    </nav>
  );
}
