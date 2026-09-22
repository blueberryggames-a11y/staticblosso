"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Container from "./container";
import { Separator } from "./ui/separator";
import { ROUTES } from "@/constants/routes";
import React, { ReactNode, useEffect, useState } from "react";
import SearchBar from "./search-bar";
import { MenuIcon, X } from "lucide-react";
import useScrollPosition from "@/hooks/use-scroll-position";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "./ui/sheet";
import LoginPopoverButton from "./login-popover-button";
import { useAuthStore } from "@/store/auth-store";
import NavbarAvatar from "./navbar-avatar";
import { auth as firebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const NavBar = () => {
  const authStore = useAuthStore(); // ✅ Always call hook at top level, never conditionally
  const { auth, setAuth, clearAuth } = authStore;
  const { y } = useScrollPosition();
  const isHeaderSticky = y > 10;

  // Sync Firebase auth state on mount
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        let username = user.displayName ?? user.email?.split("@")[0] ?? "user";
        let autoSkip = false;

        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            username = data.username ?? username;
            autoSkip = data.autoSkip ?? false;
          }
        } catch (_) {}

        setAuth({
          id: user.uid,
          email: user.email ?? "",
          username,
          avatar: user.photoURL ?? "",
          collectionId: "firebase_users",
          collectionName: "users",
          autoSkip,
          created: user.metadata.creationTime ?? "",
        });
      } else {
        clearAuth();
      }
    });
    return () => unsub();
  }, []);

  return (
    <div
      className={cn([
        "h-fit w-full sticky top-0 z-[100] transition-all duration-300",
        isHeaderSticky
          ? "bg-[rgba(13,13,18,0.92)] backdrop-blur-xl border-b border-[rgba(232,109,176,0.12)] shadow-lg"
          : "bg-gradient-to-b from-[rgba(13,13,18,0.8)] to-transparent",
      ])}
    >
      <Container className="flex items-center justify-between py-3 gap-8">
        {/* Logo */}
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2 cursor-pointer flex-shrink-0 group"
        >
          <div className="relative w-9 h-9">
            <Image
              src="/aniblossom-logo.svg"
              alt="AniBlossom"
              fill
              className="object-contain transition-all duration-300"
              unoptimized
            />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className="font-display text-[1.3rem] font-black tracking-tight"
              style={{
                background: "linear-gradient(135deg, #ffb7d5 0%, #e86db0 60%, #f4a6cc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AniBlossom
            </span>
          </div>
        </Link>

        {/* Desktop Search + Auth */}
        <div className="w-1/3 hidden lg:flex items-center gap-4">
          <SearchBar />
          {/* ✅ Pass already-retrieved store, not a new hook call */}
          {auth ? <NavbarAvatar auth={authStore} /> : <LoginPopoverButton />}
        </div>

        {/* Mobile */}
        <div className="lg:hidden flex items-center gap-4">
          <MobileMenuSheet trigger={<MenuIcon suppressHydrationWarning />} />
          {auth ? <NavbarAvatar auth={authStore} /> : <LoginPopoverButton />}
        </div>
      </Container>

      {/* Blossom shimmer line */}
      {isHeaderSticky && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(232,109,176,0.5) 50%, transparent 100%)",
          }}
        />
      )}
    </div>
  );
};

const MobileMenuSheet = ({ trigger }: { trigger: ReactNode }) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>{trigger}</SheetTrigger>
      <SheetContent
        className="flex flex-col w-[80vw] z-[150] bg-[#0d0d12] border-r border-[rgba(232,109,176,0.15)]"
        hideCloseButton
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="w-full h-full relative">
          <SheetClose className="absolute top-0 right-0 text-muted-foreground hover:text-white transition-colors">
            <X />
          </SheetClose>
          <div className="flex flex-col gap-5 mt-10">
            <Link
              href={ROUTES.HOME}
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-muted-foreground hover:text-blossom-pink transition-colors"
            >
              🏠 Home
            </Link>
            <Link
              href={ROUTES.SEARCH}
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-muted-foreground hover:text-blossom-pink transition-colors"
            >
              🔍 Search
            </Link>
            <Separator className="bg-[rgba(232,109,176,0.15)]" />
            <SearchBar onAnimeClick={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavBar;
