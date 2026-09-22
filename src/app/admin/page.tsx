"use client";

import React, { useState, useEffect } from "react";
import Container from "@/components/container";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import Button from "@/components/common/custom-button";
import { useAuthStore, useAuthHydrated } from "@/store/auth-store";
import { ADMIN_EMAIL } from "@/constants/admin";
import { useLiveVisitorCount } from "@/lib/presence";
import { useAdminActivity, ActivityRange } from "@/hooks/use-admin-stats";
import {
  useAnnouncement,
  useMaintenanceMode,
  publishAnnouncement,
  setMaintenanceMode,
} from "@/lib/site-config";
import { toast } from "sonner";
import { Users, Megaphone, TreePine } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  borderColor: "rgba(232,109,176,0.15)",
};

function LiveVisitorCard() {
  const count = useLiveVisitorCount();

  return (
    <div className="rounded-xl p-6 border" style={CARD_STYLE}>
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: "#e86db0", animation: "livePulse 1.6s ease-out infinite" }}
          />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blossom-pink" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Live now
        </span>
      </div>
      <div className="flex items-end gap-2">
        <Users className="text-blossom-pink mb-1" size={22} />
        <span className="text-4xl font-black text-white leading-none">
          {count === null ? "—" : count}
        </span>
        <span className="text-sm text-muted-foreground mb-1">
          {count === 1 ? "person online" : "people online"}
        </span>
      </div>
    </div>
  );
}

function ActivityGraphCard() {
  const [range, setRange] = useState<ActivityRange>("week");
  const { data, isLoading } = useAdminActivity(range);

  return (
    <div className="rounded-xl p-6 border" style={CARD_STYLE}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-sm font-bold text-white">Site activity</h2>
        <Tabs value={range} onValueChange={(v) => setRange(v as ActivityRange)}>
          <TabsList className="bg-[rgba(255,255,255,0.05)] rounded-lg p-1 border-0">
            {(["day", "week", "month"] as ActivityRange[]).map((r) => (
              <TabsTrigger
                key={r}
                value={r}
                className="text-xs px-3 rounded-md border-0 data-[state=active]:border-0 data-[state=active]:bg-blossom-pink data-[state=active]:text-white data-[state=active]:shadow-none capitalize"
              >
                {r}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="h-64 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Loading activity…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e86db0" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#e86db0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="rgba(240,238,245,0.4)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={range === "month" ? 3 : range === "day" ? 2 : 0}
              />
              <YAxis
                stroke="rgba(240,238,245,0.4)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(18,18,25,0.98)",
                  border: "1px solid rgba(232,109,176,0.25)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#f0eef5",
                }}
                labelStyle={{ color: "#f0eef5" }}
                cursor={{ stroke: "rgba(232,109,176,0.3)" }}
              />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="#e86db0"
                strokeWidth={2}
                fill="url(#visitsFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function AnnouncementCard() {
  const { announcement, loaded } = useAnnouncement();
  const [text, setText] = useState("");
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (loaded && announcement && !initialized) {
      setText(announcement.text);
      setActive(announcement.active);
      setInitialized(true);
    }
  }, [loaded, announcement, initialized]);

  const handlePublish = async () => {
    setSaving(true);
    try {
      await publishAnnouncement(text.trim(), active);
      toast.success("Announcement updated 🌸");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to publish announcement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl p-6 border" style={CARD_STYLE}>
      <div className="flex items-center gap-2 mb-4">
        <Megaphone size={16} className="text-blossom-pink" />
        <h2 className="text-sm font-bold text-white">Site announcement</h2>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={220}
        rows={3}
        placeholder="e.g. New episodes of One Piece just dropped! 🌸"
        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(240,238,245,0.35)] text-sm rounded-lg px-3 py-2 resize-none transition-colors focus:border-[rgba(232,109,176,0.5)] focus:outline-none"
      />

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} />
          <span className="text-xs text-muted-foreground">
            {active ? "Live for everyone" : "Hidden"}
          </span>
        </div>
        <Button
          size="sm"
          onClick={handlePublish}
          disabled={saving}
          loading={saving}
          className="bg-[#e9376b] hover:bg-[#e9376b]/90 text-white"
        >
          Publish
        </Button>
      </div>
    </div>
  );
}

function MaintenanceCard() {
  const { maintenance, loaded } = useMaintenanceMode();
  const [saving, setSaving] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    setSaving(true);
    try {
      await setMaintenanceMode(enabled);
      toast.success(enabled ? "Maintenance mode is now ON" : "Maintenance mode is now OFF");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update maintenance mode");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl p-6 border" style={CARD_STYLE}>
      <div className="flex items-center gap-2 mb-4">
        <TreePine size={16} className="text-blossom-pink" />
        <h2 className="text-sm font-bold text-white">Maintenance mode</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        When on, everyone except you sees the &ldquo;tending to the
        blossoms&rdquo; page instead of the site. Updates live, no reload
        needed.
      </p>
      <div className="flex items-center gap-2">
        <Switch
          checked={!!maintenance?.enabled}
          onCheckedChange={handleToggle}
          disabled={!loaded || saving}
        />
        <span className="text-xs font-semibold" style={{ color: maintenance?.enabled ? "#e86db0" : undefined }}>
          {maintenance?.enabled ? "Site is in maintenance mode" : "Site is live"}
        </span>
      </div>
    </div>
  );
}

function AdminPage() {
  const { auth } = useAuthStore();
  const authHydrated = useAuthHydrated();

  if (!authHydrated) return null;

  if (!auth || auth.email !== ADMIN_EMAIL) {
    return (
      <Container className="min-h-[70vh] mt-24 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-black text-white mb-2">
          You don&apos;t have access to this page
        </h2>
        <p className="text-sm text-muted-foreground">
          This area is restricted to the site admin.
        </p>
      </Container>
    );
  }

  return (
    <Container className="min-h-[75vh] mt-28 lg:mt-36 pb-20 max-w-4xl">
      <h1 className="text-2xl font-black text-white mb-1">Admin dashboard</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Welcome back, {auth.username || "admin"}.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        <LiveVisitorCard />
        <MaintenanceCard />
      </div>

      <div className="mb-5">
        <ActivityGraphCard />
      </div>

      <AnnouncementCard />
    </Container>
  );
}

export default AdminPage;
