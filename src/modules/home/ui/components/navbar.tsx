"use client";

import Image from "next/image";
import Link from "next/link";
import { SignInButton, SignUpButton, Show } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { UserControl } from "@/components/user-control";

export const Navbar = () => {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 p-4 bg-transparent border-b border-transparent transition-all duration-200">
      <nav className="max-w-5xl mx-auto w-full flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Vibe"
            width={24}
            height={24}
            className="object-contain"
          />
          <span className="font-semibold text-lg">Vibe</span>
        </Link>

        <Show when={"signed-out"}>
          <div className="flex gap-2">
            <SignInButton>
              <Button size="sm" variant="outline">
                Sign in
              </Button>
            </SignInButton>

            <SignUpButton>
              <Button size="sm">Sign up</Button>
            </SignUpButton>
          </div>
        </Show>

        <Show when={"signed-in"}>
          <UserControl showName />
        </Show>
      </nav>
    </header>
  );
};
