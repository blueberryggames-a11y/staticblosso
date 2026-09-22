"use client";

import React from "react";
import Avatar from "./common/avatar";
import { IAuthStore } from "@/store/auth-store";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Link from "next/link";
import { User, LogOut, Settings, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { ADMIN_EMAIL } from "@/constants/admin";

type Props = {
  auth: IAuthStore;
};

function NavbarAvatar({ auth: authStore }: Props) {
  const [open, setOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      authStore.clearAuth();
      toast.success("Signed out 🌸");
    } catch {
      toast.error("Logout failed. Try again.");
    }
    setOpen(false);
  };

  if (!authStore.auth) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[rgba(232,109,176,0.08)] transition-colors cursor-pointer">
          <Avatar
            username={authStore.auth.username}
            url={authStore.auth.avatar}
            id={authStore.auth.id}
            collectionID={authStore.auth.collectionId}
            className="w-8 h-8 ring-2 ring-[rgba(232,109,176,0.4)] ring-offset-1 ring-offset-transparent"
          />
          <span className="text-sm font-semibold text-foreground/80 hidden sm:block max-w-[80px] truncate">
            {authStore.auth.username}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[220px] mt-3 mr-4 p-3 border border-[rgba(232,109,176,0.2)] text-sm"
        style={{ background: "rgba(13,13,18,0.98)", backdropFilter: "blur(20px)" }}
      >
        {/* User header */}
        <div className="flex items-center gap-3 pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <Avatar
            username={authStore.auth.username}
            url={authStore.auth.avatar}
            id={authStore.auth.id}
            className="w-10 h-10 ring-2 ring-[rgba(232,109,176,0.4)]"
          />
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate">@{authStore.auth.username}</p>
            <p className="text-xs text-muted-foreground truncate">{authStore.auth.email}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-0.5 pt-2">
          <Link
            href={`/profile/${authStore.auth.username}`}
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-foreground/75 hover:text-foreground hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
            onClick={() => setOpen(false)}
          >
            <User size={15} className="text-blossom-pink" />
            <span>My Profile</span>
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-foreground/75 hover:text-foreground hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
            onClick={() => setOpen(false)}
          >
            <Settings size={15} className="text-muted-foreground" />
            <span>Settings</span>
          </Link>

          {authStore.auth.email === ADMIN_EMAIL && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-foreground/75 hover:text-foreground hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <ShieldCheck size={15} className="text-muted-foreground" />
              <span>Admin</span>
            </Link>
          )}

          <div className="h-px bg-[rgba(255,255,255,0.06)] my-1" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-red-400/80 hover:text-red-400 hover:bg-[rgba(248,113,113,0.08)] transition-all w-full text-left"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NavbarAvatar;
