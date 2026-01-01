"use client";

import React from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav className="border-b bg-white dark:bg-zinc-950 h-16 flex items-center px-4 md:px-8 justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-xl tracking-tight text-blue-700">
          Budge-it
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </nav>
  );
}
