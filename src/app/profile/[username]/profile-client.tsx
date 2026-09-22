"use client";

import React, { useRef } from "react";
import Container from "@/components/container";
import Avatar from "@/components/common/avatar";
import { useAuthStore } from "@/store/auth-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import CoverImage from "@/assets/profile-banner.png";
import AnimeLists from "./components/anime-lists";
import ActivityProgression from "./components/activity-progression";
import Loading from "@/app/loading";
import AnilistImport from "./components/anilist-import";
import { useQuery } from "react-query";
import { Camera, UserX } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { fileToBase64 } from "@/lib/avatar";
import { auth as firebaseAuth } from "@/lib/firebase";

export type TargetProfileUser = {
  id: string;
  username: string;
  avatar: string;
  collectionId: string;
  collectionName: string;
  created: string;
};

function ProfilePage() {
  const params = useParams();
  const rawUsername = params?.username as string;
  const username = rawUsername ? decodeURIComponent(rawUsername) : "";

  const { auth, setAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch target user profile by username from Firestore
  const {
    data: targetUser,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["PUBLIC_PROFILE_USER_FIREBASE", username],
    queryFn: async (): Promise<TargetProfileUser> => {
      // We query by username field — Firestore needs a collection query
      const { getDocs, collection, query, where } = await import("firebase/firestore");
      const q = query(collection(db, "users"), where("username", "==", username));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("User not found");
      const docSnap = snap.docs[0];
      const data = docSnap.data();
      return {
        id: docSnap.id,
        username: data.username ?? username,
        avatar: data.photoURL ?? "",
        collectionId: "firebase_users",
        collectionName: "users",
        created: data.createdAt?.toDate?.()?.toISOString() ?? "",
      };
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const isOwner = !!(auth?.id && targetUser?.id && auth.id === targetUser.id);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwner || !auth) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Downscale + encode as base64 and store directly on the Firestore
      // user doc — no Firebase Storage involved.
      const dataUrl = await fileToBase64(file);

      await updateDoc(doc(db, "users", auth.id), { photoURL: dataUrl });

      // Firebase Auth's photoURL field caps out around 2KB, so we don't
      // push the base64 avatar there — Firestore is the source of truth
      // for avatars across the app.
      if (firebaseAuth.currentUser) {
        try {
          await updateProfile(firebaseAuth.currentUser, { photoURL: "" });
        } catch (_) {}
      }

      // Update local auth store
      setAuth({ ...auth, avatar: dataUrl });
      toast.success("Avatar updated 🌸");
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update avatar");
    }
  };

  if (isLoading) return <Loading />;

  if (isError || !targetUser) {
    return (
      <Container className="min-h-[70vh] mt-24 flex flex-col items-center justify-center text-center">
        <UserX className="h-16 w-16 mb-4" style={{ color: "rgba(232,109,176,0.5)" }} />
        <h2 className="text-2xl font-black text-white mb-2">User Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The profile &quot;@{username}&quot; does not exist or has been removed.
        </p>
      </Container>
    );
  }

  return (
    <>
      {/* Cover banner */}
      <div className="w-full h-48 md:h-64 lg:h-72 relative">
        <Image
          src={CoverImage.src}
          alt="cover"
          fill
          className="object-cover"
          priority
          placeholder="blur"
          blurDataURL={CoverImage.blurDataURL}
        />
        {/* Blossom overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(232,109,176,0.05) 0%, rgba(13,13,18,0.8) 100%)",
          }}
        />
      </div>

      <Container className="min-h-[70vh] mt-10 flex flex-col md:flex-row justify-around gap-8 md:gap-4">
        {/* Sidebar */}
        <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
          <div className="relative group rounded-full overflow-hidden shrink-0">
            <Avatar
              className="w-[150px] h-[150px] cursor-pointer ring-4 ring-[rgba(232,109,176,0.4)] ring-offset-2 ring-offset-[#0d0d12]"
              username={targetUser.username}
              url={targetUser.avatar}
              id={targetUser.id}
              collectionID={targetUser.collectionId}
              onClick={() => {
                if (isOwner && fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
            />
            {isOwner && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white p-2 text-center select-none"
              >
                <Camera className="h-7 w-7 mb-1 drop-shadow-md animate-bounce" style={{ color: "#e86db0" }} />
                <span className="text-xs font-bold tracking-wide">Change Avatar</span>
              </div>
            )}
          </div>

          {isOwner && (
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          )}

          <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl font-black text-white">@{targetUser.username}</h2>
            {isOwner && (
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(232,109,176,0.12)",
                  border: "1px solid rgba(232,109,176,0.3)",
                  color: "#e86db0",
                }}
              >
                🌸 Your Profile
              </span>
            )}
            {targetUser.created && (
              <p className="text-xs text-muted-foreground mt-1">
                Member since {new Date(targetUser.created).getFullYear()}
              </p>
            )}
          </div>
        </div>

        {/* Activity & Lists */}
        <div className="w-full md:w-2/3">
          <div className="w-full">
            {isOwner && (
              <div className="float-right flex gap-2 items-center mb-2">
                <p className="text-sm text-muted-foreground">Import:</p>
                <AnilistImport />
              </div>
            )}

            <Tabs defaultValue="watching" className="w-full">
              <TabsList
                className="grid w-full grid-cols-5 mb-1"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                {["watching", "plan-to-watch", "on-hold", "completed", "dropped"].map(
                  (v) => (
                    <TabsTrigger
                      key={v}
                      value={v}
                      className="text-xs capitalize data-[state=active]:text-white"
                      style={{
                        ["--tw-ring-color" as string]: "rgba(232,109,176,0.5)",
                      }}
                    >
                      {v.replace("-", " ")}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>

              <TabsContent value="watching" className="mt-4">
                <AnimeLists status="watching" userId={targetUser.id} />
              </TabsContent>
              <TabsContent value="plan-to-watch" className="mt-4">
                <AnimeLists status="plan to watch" userId={targetUser.id} />
              </TabsContent>
              <TabsContent value="on-hold" className="mt-4">
                <AnimeLists status="on hold" userId={targetUser.id} />
              </TabsContent>
              <TabsContent value="completed" className="mt-4">
                <AnimeLists status="completed" userId={targetUser.id} />
              </TabsContent>
              <TabsContent value="dropped" className="mt-4">
                <AnimeLists status="dropped" userId={targetUser.id} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="my-10">
            <ActivityProgression targetUser={targetUser} />
          </div>
        </div>
      </Container>
    </>
  );
}

export default ProfilePage;
