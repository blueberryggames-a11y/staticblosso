"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import {
  auth,
  googleProvider,
  db,
} from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

type FormData = {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
};

const BLOSSOM_BTN =
  "w-full py-2 px-4 rounded-lg font-bold text-sm text-white transition-all duration-200 cursor-pointer";

function LoginPopoverButton() {
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [tabValue, setTabValue] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  const hydrateAuth = async (uid: string, fallbackEmail: string, fallbackName: string, photoURL: string) => {
    let username = fallbackName;
    let autoSkip = false;
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const d = snap.data();
        username = d.username ?? username;
        autoSkip = d.autoSkip ?? false;
      }
    } catch (_) {}
    setAuth({
      id: uid,
      email: fallbackEmail,
      username,
      avatar: photoURL,
      collectionId: "firebase_users",
      collectionName: "users",
      autoSkip,
    });
  };

  const loginWithEmail = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const u = cred.user;
      await hydrateAuth(u.uid, u.email ?? "", u.displayName ?? formData.email.split("@")[0], u.photoURL ?? "");
      toast.success("Welcome back! 🌸");
      clearForm();
    } catch (e: any) {
      toast.error(e.code === "auth/invalid-credential" ? "Invalid email or password" : "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirm_password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (formData.password !== formData.confirm_password) {
      toast.error("Passwords don't match");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const u = cred.user;
      await updateProfile(u, { displayName: formData.username });
      // Save profile to Firestore
      await setDoc(doc(db, "users", u.uid), {
        username: formData.username,
        email: formData.email,
        photoURL: "",
        autoSkip: false,
        createdAt: serverTimestamp(),
      });
      await hydrateAuth(u.uid, u.email ?? "", formData.username, "");
      toast.success("Account created! Welcome to AniBlossom 🌸");
      clearForm();
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") {
        toast.error("That email is already registered");
      } else {
        toast.error("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      // Upsert Firestore profile
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          username: u.displayName ?? u.email?.split("@")[0] ?? "user",
          email: u.email,
          photoURL: u.photoURL ?? "",
          autoSkip: false,
          createdAt: serverTimestamp(),
        });
      }
      await hydrateAuth(u.uid, u.email ?? "", u.displayName ?? "", u.photoURL ?? "");
      toast.success("Signed in with Google 🌸");
    } catch (e: any) {
      if (e.code !== "auth/popup-closed-by-user") {
        toast.error("Google sign-in failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () =>
    setFormData({ username: "", email: "", password: "", confirm_password: "" });

  const inputCls =
    "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(240,238,245,0.35)] text-sm rounded-lg px-3 py-2 w-full transition-colors focus:border-[rgba(232,109,176,0.5)] focus:outline-none";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="btn-blossom px-4 py-1.5 text-sm font-bold rounded-lg"
          style={{
            background: "linear-gradient(135deg, #c94d94 0%, #e86db0 100%)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Sign In
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        className="w-[300px] mt-3 mr-4 p-4 border border-[rgba(232,109,176,0.2)] shadow-2xl"
        style={{ background: "rgba(13,13,18,0.98)", backdropFilter: "blur(20px)" }}
      >
        {/* Blossom header */}
        <div className="text-center mb-4">
          <p className="font-display text-lg font-black blossom-text">AniBlossom</p>
          <p className="text-xs text-muted-foreground mt-0.5">Watch anime, beautifully 🌸</p>
        </div>

        <Tabs
          value={tabValue}
          onValueChange={(v) => {
            setTabValue(v as "login" | "signup");
            clearForm();
          }}
        >
          <TabsList className="w-full bg-[rgba(255,255,255,0.05)] mb-4 rounded-lg p-1 border-0">
            <TabsTrigger
              value="login"
              className="flex-1 text-xs rounded-md border-0 data-[state=active]:border-0 data-[state=active]:bg-blossom-pink data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="flex-1 text-xs rounded-md border-0 data-[state=active]:border-0 data-[state=active]:bg-blossom-pink data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* LOGIN */}
          <TabsContent value="login" className="flex flex-col gap-3">
            <input
              className={inputCls}
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && loginWithEmail()}
            />
            <input
              className={inputCls}
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && loginWithEmail()}
            />
            <button
              onClick={loginWithEmail}
              disabled={loading}
              className={BLOSSOM_BTN}
              style={{ background: "linear-gradient(135deg, #c94d94 0%, #e86db0 100%)", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
            </div>
            <button
              onClick={loginWithGoogle}
              disabled={loading}
              className={`${BLOSSOM_BTN} flex items-center justify-center gap-2`}
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#f0eef5", opacity: loading ? 0.6 : 1 }}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </TabsContent>

          {/* SIGNUP */}
          <TabsContent value="signup" className="flex flex-col gap-3">
            <input
              className={inputCls}
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            <input
              className={inputCls}
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              className={inputCls}
              type="password"
              placeholder="Password (min 6 chars)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <input
              className={inputCls}
              type="password"
              placeholder="Confirm password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && signupWithEmail()}
            />
            <button
              onClick={signupWithEmail}
              disabled={loading}
              className={BLOSSOM_BTN}
              style={{ background: "linear-gradient(135deg, #c94d94 0%, #e86db0 100%)", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
            </div>
            <button
              onClick={loginWithGoogle}
              disabled={loading}
              className={`${BLOSSOM_BTN} flex items-center justify-center gap-2`}
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#f0eef5", opacity: loading ? 0.6 : 1 }}
            >
              <GoogleIcon />
              Sign up with Google
            </button>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default LoginPopoverButton;
