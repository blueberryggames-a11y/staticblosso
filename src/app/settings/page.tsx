"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/container";
import Avatar from "@/components/common/avatar";
import Button from "@/components/common/custom-button";
import { useAuthStore } from "@/store/auth-store";
import { db, auth as firebaseAuth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { fileToBase64 } from "@/lib/avatar";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

function SettingsPage() {
  const router = useRouter();
  const { auth, setAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(auth?.username ?? "");
  const [avatarPreview, setAvatarPreview] = useState(auth?.avatar ?? "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!auth) {
    return (
      <Container className="min-h-[70vh] mt-24 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-black text-white mb-2">Sign in required</h2>
        <p className="text-sm text-muted-foreground">
          You need to be signed in to edit your settings.
        </p>
      </Container>
    );
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      // Downscale + encode client-side, then store directly on the
      // Firestore user doc as a base64 data URL — no Firebase Storage,
      // so no storage billing.
      const dataUrl = await fileToBase64(file);

      await updateDoc(doc(db, "users", auth.id), { photoURL: dataUrl });

      if (firebaseAuth.currentUser) {
        try {
          await updateProfile(firebaseAuth.currentUser, { photoURL: "" });
        } catch (_) {}
      }

      setAvatarPreview(dataUrl);
      setAuth({ ...auth, avatar: dataUrl });
      toast.success("Profile picture updated 🌸");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update profile picture");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveName = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      toast.error("Username can't be empty");
      return;
    }
    if (trimmed.length > 30) {
      toast.error("Username must be under 30 characters");
      return;
    }
    if (trimmed === auth.username) {
      toast.info("Nothing changed");
      return;
    }

    setSavingName(true);
    try {
      await updateDoc(doc(db, "users", auth.id), { username: trimmed });

      if (firebaseAuth.currentUser) {
        await updateProfile(firebaseAuth.currentUser, { displayName: trimmed });
      }

      setAuth({ ...auth, username: trimmed });
      toast.success("Name updated 🌸");
      router.replace(`/settings`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update your name");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <Container className="min-h-[75vh] mt-28 lg:mt-36 pb-20 max-w-2xl">
      <h1 className="text-2xl font-black text-white mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Manage your public profile — anyone who visits your profile page can
        see your name and picture.
      </p>

      {/* Profile picture */}
      <div
        className="rounded-xl p-6 mb-6 border"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderColor: "rgba(232,109,176,0.15)",
        }}
      >
        <h2 className="text-sm font-bold text-white mb-4">Profile picture</h2>
        <div className="flex items-center gap-5">
          <div
            className="relative group rounded-full overflow-hidden shrink-0 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar
              username={username}
              url={avatarPreview}
              id={auth.id}
              className="w-20 h-20 ring-2 ring-[rgba(232,109,176,0.4)]"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </div>
          </div>
          <div>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              loading={uploadingAvatar}
              className="bg-[#e9376b] hover:bg-[#e9376b]/90 text-white"
            >
              Upload new picture
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              JPG or PNG. This is visible to everyone who visits your profile.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {/* Display name */}
      <div
        className="rounded-xl p-6 border"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderColor: "rgba(232,109,176,0.15)",
        }}
      >
        <h2 className="text-sm font-bold text-white mb-4">Display name</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(240,238,245,0.35)] text-sm rounded-lg px-3 py-2 transition-colors focus:border-[rgba(232,109,176,0.5)] focus:outline-none"
            placeholder="Your display name"
          />
          <Button
            size="sm"
            onClick={handleSaveName}
            disabled={savingName}
            loading={savingName}
            className="bg-[#e9376b] hover:bg-[#e9376b]/90 text-white sm:w-32"
          >
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This is also your profile URL: /profile/{username || "yourname"}
        </p>
      </div>
    </Container>
  );
}

export default SettingsPage;
