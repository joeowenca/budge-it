"use client";

import { signOut } from "@/app/actions/auth";

export default function SignOutButton() {
  return (
    <form action={signOut}>
      <button 
        type="submit" 
        className="text-sm font-medium hover:underline cursor-pointer"
      >
        Sign Out
      </button>
    </form>
  );
}