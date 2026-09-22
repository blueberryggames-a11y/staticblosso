"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAnimeStore } from "@/store/anime-store";
import dynamic from "next/dynamic";

const AniBlossomPlayer = dynamic(() => import("@/components/kitsune-player"), {
  ssr: false,
});
import { useGetEpisodeData } from "@/query/get-episode-data";
import { Captions, Mic, AlertCircle, Tv } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useGetAllEpisodes } from "@/query/get-all-episodes";

import useBookMarks from "@/hooks/use-get-bookmark";
import { useGetSourceAvailable } from "@/query/get-source-available";

// ── Server configuration (mirrors old ANIMETEST site) ─────────────
const ANIMEAPI_BASE = "https://api.straight2u.pro";

type ServerKey = "server1" | "server2" | "server3";

interface LegacyServerConfig {
  id: ServerKey;
  name: string;
  label: string;
  badge?: { text: string; type: "best" | "good" };
  // Whether this server's stream URL actually changes based on sub/dub.
  // Servers that ignore the category entirely can't really offer dub —
  // toggling it wouldn't change anything, so we disable the button
  // instead of pretending it works.
  supportsDub: boolean;
  buildUrl: (
    anilistId: string | number,
    episode: number,
    category: "sub" | "dub",
    server3Slug?: string,
    server3Season?: number,
  ) => string;
}

const LEGACY_SERVERS: LegacyServerConfig[] = [
  {
    id: "server1",
    name: "Server 1",
    label: "Server 1",
    // filmu.in's embed URL has no category segment — it always serves
    // whatever single track it has, so we can't offer a dub toggle here.
    supportsDub: false,
    buildUrl: (anilistId, episode) =>
      `https://embed.filmu.in/anime/${anilistId}/1/${episode}`,
  },
  {
    id: "server2",
    name: "Server 2",
    label: "Server 2",
    badge: { text: "Recommended", type: "good" },
    supportsDub: true,
    buildUrl: (anilistId, episode, category) =>
      `https://megaplay.buzz/stream/ani/${anilistId}/${episode}/${category}`,
  },
  {
    id: "server3",
    name: "Server 3",
    label: "Server 3",
    badge: { text: "Best", type: "best" },
    supportsDub: true,
    buildUrl: (_anilistId, episode, category, slug, season = 1) =>
      slug
        ? `${ANIMEAPI_BASE}/embed?anime=${encodeURIComponent(slug)}&s=${season}&ep=${episode}&category=${category}`
        : `${ANIMEAPI_BASE}/embed?ep=${episode}&category=${category}`,
  },
];

// ── Server 3 / AnimeAPI helpers ────────────────────────────────────
async function server3Fetch(path: string) {
  const url = ANIMEAPI_BASE + path;
  const r = await fetch(url, { headers: { "ngrok-skip-browser-warning": "1" } });
  if (!r.ok) throw new Error(`AnimeAPI HTTP ${r.status}`);
  return r.json();
}

interface Server3Cache {
  slug: string;
  season: number;
  episodes: { number: number; season: number; title: string }[];
}

const server3Cache: Record<string, Server3Cache> = {};

async function resolveServer3(animeTitle: string, anilistId: string | number): Promise<Server3Cache> {
  const cacheKey = String(anilistId);
  if (server3Cache[cacheKey]) return server3Cache[cacheKey];

  // Try to search by title
  const titleClean = animeTitle.replace(/[^\w\s]/g, " ").trim();
  const results = await server3Fetch(`/search?q=${encodeURIComponent(titleClean)}`);
  const firstResult = Array.isArray(results) ? results[0] : results?.results?.[0];
  if (!firstResult?.slug) throw new Error(`Server 3: anime not found for "${titleClean}"`);

  const slug = firstResult.slug;
  const epData = await server3Fetch(`/api/anime/${encodeURIComponent(slug)}`);
  const episodes = (epData?.episodes || []).map((ep: any) => ({
    number: ep.episode,
    season: ep.season ?? 1,
    title: ep.title ?? `Episode ${ep.episode}`,
  }));

  const result: Server3Cache = { slug, season: firstResult.season ?? 1, episodes };
  server3Cache[cacheKey] = result;
  return result;
}

// ── Component ──────────────────────────────────────────────────────
const VideoPlayerSection = () => {
  const searchParams = useSearchParams();
  const animeIdParam = searchParams.get("anime") || "";
  const epParam = searchParams.get("ep");
  const episodeIdParam = searchParams.get("episode") || "";
  const { selectedEpisode, setSelectedEpisode, anime } = useAnimeStore();

  const { data: isSourceAvailable } = useGetSourceAvailable();
  const { data: allEpisodesData } = useGetAllEpisodes(animeIdParam);

  const targetEpByNumber =
    epParam && allEpisodesData?.episodes
      ? allEpisodesData.episodes.find((e) => e.number === Number(epParam))
      : null;

  const activeEpisodeId =
    targetEpByNumber?.episodeId ||
    selectedEpisode ||
    episodeIdParam ||
    allEpisodesData?.episodes?.[0]?.episodeId ||
    "";

  useEffect(() => {
    if (targetEpByNumber?.episodeId && selectedEpisode !== targetEpByNumber.episodeId) {
      setSelectedEpisode(targetEpByNumber.episodeId);
    }
  }, [targetEpByNumber?.episodeId, selectedEpisode, setSelectedEpisode]);

  const isPrimaryDisabled = isSourceAvailable === false;

  const [useFallback, setUseFallback] = useState<boolean>(false);

  // ── Legacy server state ──────────────────────────────────────────
  const [activeServer, setActiveServer] = useState<ServerKey>("server2");
  const [server3Status, setServer3Status] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [server3StatusText, setServer3StatusText] = useState("");
  const [server3Data, setServer3Data] = useState<Server3Cache | null>(null);

  const { data: episodeData, isLoading: isLoadingData } = useGetEpisodeData(
    activeEpisodeId,
    !isPrimaryDisabled && !useFallback,
  );

  const [autoSkip, setAutoSkip] = useState<boolean>(true);
  const [preferredCategory, setPreferredCategory] = useState<"sub" | "dub">("sub");

  const { createOrUpdateBookMark, syncWatchProgress } = useBookMarks({
    animeID: animeIdParam,
    populate: false,
  });

  const fallbackBookmarkIdRef = useRef<string | null>(null);
  const fallbackWatchedRecordIdRef = useRef<string | null>(null);
  const lastSyncedTimeRef = useRef<number>(0);

  useEffect(() => {
    setUseFallback(false);
  }, [activeEpisodeId]);

  useEffect(() => {
    const storedSkip = localStorage.getItem("autoSkip");
    if (storedSkip !== null) setAutoSkip(storedSkip === "true");

    const storedCategory = localStorage.getItem("preferredCategory");
    if (storedCategory === "sub" || storedCategory === "dub") {
      setPreferredCategory(storedCategory);
    }

    const storedServer = localStorage.getItem("activeServer") as ServerKey | null;
    if (storedServer && ["server1", "server2", "server3"].includes(storedServer)) {
      setActiveServer(storedServer);
    }
  }, []);

  function onHandleAutoSkipChange(value: boolean) {
    setAutoSkip(value);
    localStorage.setItem("autoSkip", JSON.stringify(value));
  }

  const rawProviders = allEpisodesData?.rawResponse?.providers || {};
  const providerNames = Object.keys(rawProviders);

  const currentEpNumber =
    allEpisodesData?.episodes?.find((e) => e.episodeId === activeEpisodeId)?.number || 1;

  const handleCategoryChange = (cat: "sub" | "dub") => {
    setPreferredCategory(cat);
    localStorage.setItem("preferredCategory", cat);

    if (providerNames.length > 0) {
      for (const pName of providerNames) {
        const pData = rawProviders[pName]?.episodes?.[cat] || [];
        const targetEp = pData.find((ep: any) => ep.number === currentEpNumber) || pData[0];
        if (targetEp?.id) {
          setSelectedEpisode(targetEp.id);
          break;
        }
      }
    }
  };

  useEffect(() => {
    if (!providerNames.length || !allEpisodesData?.rawResponse?.providers) return;

    const cleanParts = activeEpisodeId.replace(/^\//, "").split("/");
    const activeCat = cleanParts[3] === "dub" ? "dub" : "sub";

    if (activeCat !== preferredCategory) {
      for (const pName of providerNames) {
        const pData = rawProviders[pName]?.episodes?.[preferredCategory] || [];
        const targetEp = pData.find((ep: any) => ep.number === currentEpNumber);
        if (targetEp?.id) {
          setSelectedEpisode(targetEp.id);
          break;
        }
      }
    }
  }, [
    currentEpNumber,
    preferredCategory,
    providerNames,
    rawProviders,
    activeEpisodeId,
    setSelectedEpisode,
    allEpisodesData,
  ]);

  // ── Resolve Server 3 data when needed ───────────────────────────
  useEffect(() => {
    if (activeServer !== "server3" || !useFallback) return;
    const animeName = anime?.anime?.info?.name || "";
    if (!animeName || !animeIdParam) return;

    setServer3Status("loading");
    setServer3StatusText("Connecting to Server 3...");

    resolveServer3(animeName, animeIdParam)
      .then((data) => {
        setServer3Data(data);
        setServer3Status("ok");
        setServer3StatusText(`Server 3 · ${data.episodes.length} eps`);
      })
      .catch((err) => {
        setServer3Status("error");
        setServer3StatusText("Server 3 unavailable");
        console.error("Server 3 error:", err);
      });
  }, [activeServer, useFallback, anime, animeIdParam]);

  // ── Switch legacy server ─────────────────────────────────────────
  const handleLegacyServerSwitch = (serverId: ServerKey) => {
    setActiveServer(serverId);
    localStorage.setItem("activeServer", serverId);
    if (serverId === "server3") {
      setServer3Data(null);
      setServer3Status("idle");
    }

    // If we're switching to a server that can't actually serve dub,
    // fall back to sub so the toggle and the URL stay in sync.
    const newServerConfig = LEGACY_SERVERS.find((s) => s.id === serverId);
    if (newServerConfig && !newServerConfig.supportsDub && preferredCategory === "dub") {
      setPreferredCategory("sub");
      localStorage.setItem("preferredCategory", "sub");
    }
  };

  const isFallbackActive =
    isSourceAvailable === false ||
    useFallback ||
    (!isLoadingData && (!episodeData || !episodeData.sources?.length));

  // Watch progress sync for all fallback iframes
  useEffect(() => {
    fallbackWatchedRecordIdRef.current = null;
    lastSyncedTimeRef.current = 0;

    if (!isFallbackActive || !animeIdParam || !activeEpisodeId) return;

    let isMounted = true;

    const initBookmark = async () => {
      const animeName = anime?.anime?.info?.name || "Anime";
      const poster = anime?.anime?.info?.poster || "";
      const bId = await createOrUpdateBookMark(animeIdParam, animeName, poster, "watching", false);
      if (isMounted) fallbackBookmarkIdRef.current = bId;
    };

    initBookmark();

    const handleIframeMessage = async (event: MessageEvent) => {
      let data = event.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (!data || typeof data !== "object") return;

      let currentTime: number | null = null;
      let duration: number | null = null;
      if (typeof data.currentTime === "number") currentTime = data.currentTime;
      else if (typeof data.time === "number") currentTime = data.time;
      if (typeof data.duration === "number") duration = data.duration;

      const isComplete = data.event === "complete";
      if (currentTime !== null && duration !== null && duration > 0) {
        const now = Math.floor(currentTime);
        if (isComplete || Math.abs(now - lastSyncedTimeRef.current) >= 10) {
          lastSyncedTimeRef.current = now;
          if (fallbackBookmarkIdRef.current) {
            const recordId = await syncWatchProgress(
              fallbackBookmarkIdRef.current,
              fallbackWatchedRecordIdRef.current,
              { episodeId: activeEpisodeId, episodeNumber: Number(currentEpNumber) || 1, current: currentTime, duration },
            );
            if (recordId && isMounted) fallbackWatchedRecordIdRef.current = recordId;
          }
        }
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => {
      isMounted = false;
      window.removeEventListener("message", handleIframeMessage);
    };
  }, [
    useFallback, isLoadingData, episodeData, activeEpisodeId, animeIdParam,
    anime, currentEpNumber, createOrUpdateBookMark, syncWatchProgress,
  ]);

  const handleProviderSelect = (pName: string, category: "sub" | "dub") => {
    setPreferredCategory(category);
    localStorage.setItem("preferredCategory", category);
    const pData = rawProviders[pName]?.episodes?.[category] || [];
    const targetEp = pData.find((ep: any) => ep.number === currentEpNumber) || pData[0];
    if (targetEp?.id) setSelectedEpisode(targetEp.id);
  };

  const cleanParts = activeEpisodeId.replace(/^\//, "").split("/");
  const currentProviderName = cleanParts[1] || providerNames[0] || "kiwi";
  const activeCategory = cleanParts[3] === "dub" ? "dub" : preferredCategory;

  // The fallback player's SUB/DUB toggle streams from a legacy server
  // (server1/2/3), not from the Miruro providers — so whether DUB is
  // selectable depends on whether the *active server* actually serves a
  // dub track (i.e. its URL changes when the category changes). The
  // primary AniBlossomPlayer's own provider list (below) still checks
  // real per-provider sub/dub episode data separately.
  const activeLegacyServer =
    LEGACY_SERVERS.find((s) => s.id === activeServer) || LEGACY_SERVERS[1];
  const fallbackHasSub = true;
  const fallbackHasDub = activeLegacyServer.supportsDub;

  // ── Build fallback iframe URL based on selected legacy server ────
  const anilistId = animeIdParam;
  let fallbackSrc = "";
  if (isFallbackActive) {
    const serverCfg = LEGACY_SERVERS.find((s) => s.id === activeServer) || LEGACY_SERVERS[1];
    if (activeServer === "server3") {
      if (server3Data) {
        const epObj =
          server3Data.episodes.find((e) => e.number === currentEpNumber) ||
          server3Data.episodes[currentEpNumber - 1] ||
          server3Data.episodes[0];
        fallbackSrc = serverCfg.buildUrl(
          anilistId,
          epObj?.number ?? currentEpNumber,
          activeCategory,
          server3Data.slug,
          epObj?.season ?? server3Data.season,
        );
      }
      // else wait for server3Data to load
    } else {
      fallbackSrc = serverCfg.buildUrl(anilistId, currentEpNumber, activeCategory);
    }
  }

  if (!activeEpisodeId || isLoadingData) {
    return (
      <div className="h-auto aspect-video lg:max-h-[calc(100vh-150px)] min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] w-full animate-pulse bg-slate-800 rounded-xl" />
    );
  }

  // ── Fallback / Legacy Server player UI ──────────────────────────
  if (isFallbackActive) {
    return (
      <div className="flex flex-col gap-4 w-full">
        {/* Player */}
        <div className="relative w-full h-auto aspect-video min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] max-h-[500px] lg:max-h-[calc(100vh-150px)] bg-black overflow-hidden rounded-xl border border-slate-800">
          {activeServer === "server3" && server3Status === "loading" ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-[rgba(232,109,176,0.4)] border-t-[#e86db0] rounded-full animate-spin" />
              <span className="text-sm">{server3StatusText || "Connecting to Server 3…"}</span>
            </div>
          ) : activeServer === "server3" && server3Status === "error" ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-red-400 px-6 text-center">
              <AlertCircle className="h-8 w-8" />
              <p className="font-semibold">Server 3 Unavailable</p>
              <p className="text-xs text-muted-foreground">{server3StatusText}</p>
              <Button size="sm" variant="outline" className="mt-2 border-slate-700" onClick={() => handleLegacyServerSwitch("server2")}>
                Switch to Server 2
              </Button>
            </div>
          ) : fallbackSrc ? (
            <iframe
              key={`${activeServer}-${anilistId}-${currentEpNumber}-${activeCategory}`}
              src={fallbackSrc}
              width="100%"
              height="100%"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No stream available for this episode
            </div>
          )}
        </div>

        {/* Server switcher bar */}
        <div className="flex flex-col gap-3 p-4 bg-[#0f172a] rounded-xl border border-slate-800">
          {/* Legacy server buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase shrink-0">Server</span>
            {LEGACY_SERVERS.map((srv) => (
              <button
                key={srv.id}
                onClick={() => handleLegacyServerSwitch(srv.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  activeServer === srv.id
                    ? "border-[#e86db0] text-[#e86db0] bg-[rgba(232,109,176,0.1)]"
                    : "border-slate-700 text-gray-400 bg-slate-800 hover:border-[#e86db0]/50 hover:text-gray-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    activeServer === srv.id ? "bg-[#e86db0]" : "bg-slate-600"
                  }`}
                />
                {srv.label}
                {srv.badge && (
                  <span
                    className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      srv.badge.type === "best"
                        ? "bg-[#e86db0] text-white"
                        : "bg-[rgba(232,109,176,0.25)] text-[#e86db0] border border-[rgba(232,109,176,0.4)]"
                    }`}
                  >
                    {srv.badge.text}
                  </span>
                )}
              </button>
            ))}
            {/* Server 3 status badge */}
            {activeServer === "server3" && server3Status !== "idle" && (
              <span
                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border ${
                  server3Status === "loading"
                    ? "text-muted-foreground border-slate-700 bg-slate-800"
                    : server3Status === "ok"
                    ? "text-green-400 border-green-800/40 bg-green-950/30"
                    : "text-red-400 border-red-800/40 bg-red-950/30"
                }`}
              >
                {server3Status === "loading" && (
                  <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                )}
                {server3StatusText}
              </span>
            )}
          </div>

          {/* Category + primary player toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-gray-400 tracking-wider">CATEGORY:</span>
              <Button
                size="sm" variant="ghost" disabled={!fallbackHasSub}
                onClick={() => handleCategoryChange("sub")}
                className={`h-8 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
                  activeCategory === "sub"
                    ? "bg-[#e9376b] text-white hover:bg-[#e9376b]"
                    : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                }`}
              >
                <Captions className="h-3.5 w-3.5" /> SUB
              </Button>
              <Button
                size="sm" variant="ghost" disabled={!fallbackHasDub}
                title={!fallbackHasDub ? `${activeLegacyServer.label} doesn't offer a dub track — try Server 2 or Server 3.` : undefined}
                onClick={() => handleCategoryChange("dub")}
                className={`h-8 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
                  activeCategory === "dub"
                    ? "bg-green-600 text-white hover:bg-green-600"
                    : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                }`}
              >
                <Mic className="h-3.5 w-3.5" /> DUB
              </Button>
            </div>
            <Button
              size="sm" variant="outline"
              onClick={() => setUseFallback(false)}
              className="h-8 px-3 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-gray-200 flex items-center gap-1.5 shrink-0 self-start sm:self-auto rounded-xl"
            >
              <Tv className="h-3.5 w-3.5 text-blue-400" /> Try Primary Player
            </Button>
          </div>
        </div>

        <Alert variant="destructive" className="border-red-800/80 bg-red-950/40 text-red-300 rounded-xl">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="font-bold">Fallback Video Player Activated</AlertTitle>
          <AlertDescription className="text-xs text-red-300/80 mt-1">
            The primary video stream is currently unavailable or encountered an error. Select a server above to watch this episode.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── Primary AniBlossomPlayer ─────────────────────────────────────
  return (
    <div>
      <AniBlossomPlayer
        key={episodeData.sources?.[0]?.url}
        episodeInfo={episodeData}
        serversData={{
          episodeId: activeEpisodeId,
          episodeNo: String(currentEpNumber),
          sub: providerNames.map((p, idx) => ({ serverId: idx + 1, serverName: p })),
          dub: [],
          raw: [],
        }}
        animeInfo={{
          id: anime?.anime?.info?.id || "0",
          title: anime?.anime?.info?.name || "Anime",
          image: anime?.anime?.info?.poster || "",
        }}
        subOrDub={activeCategory}
        autoSkip={autoSkip}
        onError={() => setUseFallback(true)}
      />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full p-5 bg-[#0f172a] border-t border-slate-800">
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-3">
            <Captions className="text-red-400 h-4 w-4 shrink-0" />
            <p className="font-bold text-xs text-gray-300 tracking-wider">SERVERS (SUB):</p>
            {providerNames.map((pName) => {
              const hasSubEps = (rawProviders[pName]?.episodes?.sub || []).length > 0;
              if (!hasSubEps) return null;
              const isActive =
                currentProviderName.toLowerCase() === pName.toLowerCase() && activeCategory === "sub";
              return (
                <Button
                  size="sm"
                  key={`sub-${pName}`}
                  className={`uppercase font-bold text-xs px-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-[#e9376b] text-white shadow-md ring-2 ring-[#e9376b]/40 scale-105"
                      : "bg-slate-800/80 text-gray-300 hover:bg-slate-700 hover:text-white"
                  }`}
                  onClick={() => handleProviderSelect(pName, "sub")}
                >
                  {pName}
                </Button>
              );
            })}
          </div>

          {providerNames.some((p) => (rawProviders[p]?.episodes?.dub || []).length > 0) && (
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <Mic className="text-green-400 h-4 w-4 shrink-0" />
              <p className="font-bold text-xs text-gray-300 tracking-wider">SERVERS (DUB):</p>
              {providerNames.map((pName) => {
                const hasDubEps = (rawProviders[pName]?.episodes?.dub || []).length > 0;
                if (!hasDubEps) return null;
                const isActive =
                  currentProviderName.toLowerCase() === pName.toLowerCase() && activeCategory === "dub";
                return (
                  <Button
                    size="sm"
                    key={`dub-${pName}`}
                    className={`uppercase font-bold text-xs px-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-green-600 text-white shadow-md ring-2 ring-green-500/40 scale-105"
                        : "bg-slate-800/80 text-gray-300 hover:bg-slate-700 hover:text-white"
                    }`}
                    onClick={() => handleProviderSelect(pName, "dub")}
                  >
                    {pName}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm shrink-0 self-start md:self-auto">
          {/* Legacy server switcher in primary mode too */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Alt Server:</span>
            {LEGACY_SERVERS.map((srv) => (
              <button
                key={srv.id}
                onClick={() => {
                  handleLegacyServerSwitch(srv.id);
                  setUseFallback(true);
                }}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800 text-gray-400 hover:border-[#e86db0]/50 hover:text-gray-200 transition-all"
              >
                {srv.label}
              </button>
            ))}
          </div>
          <div className="flex flex-row items-center space-x-2">
            <Switch
              checked={autoSkip}
              onCheckedChange={(e) => onHandleAutoSkipChange(e)}
              id="auto-skip"
            />
            <p>Auto Skip</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerSection;
