"use client";

import ContinueWatching from "@/components/continue-watching";
import FeaturedCollection from "@/components/featured-collection";
import { useGetSpotlightAnime } from "@/query/get-spotlight-anime";
import { useGetRecentAnime } from "@/query/get-recent-anime";
import { useGetPopularAnime } from "@/query/get-popular-anime";
import { useGetTrendingAnime } from "@/query/get-trending-anime";
import { useGetUpcomingAnime } from "@/query/get-upcoming-anime";
import dynamic from "next/dynamic";
import React, { useState, useMemo } from "react";
import RecentCommentsSection from "@/components/recent-comments-section";

const HeroSection = dynamic(() => import("@/components/hero-section"));
const LatestEpisodesAnime = dynamic(
  () => import("@/components/latest-episodes-section"),
);
const AnimeSchedule = dynamic(() => import("@/components/anime-schedule"));
const AnimeSections = dynamic(() => import("@/components/anime-sections"));

export default function Home() {
  const [trendingPage, setTrendingPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);

  const { data: spotlightList = [], isLoading: isLoadingSpotlight } =
    useGetSpotlightAnime();
  const { data: recentRes, isLoading: isLoadingRecent } = useGetRecentAnime();
  const { data: popularRes, isLoading: isLoadingPopular } = useGetPopularAnime();
  const { data: trendingRes, isLoading: isLoadingTrending } =
    useGetTrendingAnime(trendingPage, 14);
  const { data: upcomingRes, isLoading: isLoadingUpcoming } =
    useGetUpcomingAnime(upcomingPage, 14);

  const recentList = recentRes?.results || [];
  const popularList = popularRes?.results || [];
  const trendingList = trendingRes?.results || [];
  const upcomingList = upcomingRes?.results || [];

  const featuredFavoriteList = useMemo(
    () => popularList.slice(0, 3),
    [popularList.length > 0 ? popularList[0]?.id : null],
  );
  const featuredPopularList = useMemo(
    () => popularList.slice(3, 6),
    [popularList.length > 0 ? popularList[0]?.id : null],
  );
  const featuredRecentList = useMemo(
    () => recentList.slice(0, 3),
    [recentList.length > 0 ? recentList[0]?.id : null],
  );

  return (
    <div className="flex flex-col bg-[#0d0d12]">
      <HeroSection
        spotlightAnime={spotlightList}
        isDataLoading={isLoadingSpotlight}
      />

      <LatestEpisodesAnime loading={isLoadingRecent} />

      <ContinueWatching loading={false} />

      <FeaturedCollection
        loading={isLoadingPopular || isLoadingRecent}
        featuredAnime={[
          { title: "🌸 Most Favourite", anime: featuredFavoriteList },
          { title: "✨ Most Popular", anime: featuredPopularList },
          { title: "🆕 Recently Completed", anime: featuredRecentList },
        ]}
      />

      <AnimeSections
        title="🔥 Trending Now"
        animeList={trendingList}
        loading={isLoadingTrending}
        page={trendingPage}
        hasNextPage={trendingRes?.hasNextPage}
        onPageChange={(p) => setTrendingPage(p)}
      />

      <AnimeSchedule />

      <RecentCommentsSection />

      <AnimeSections
        title="📅 Coming Soon"
        animeList={upcomingList}
        loading={isLoadingUpcoming}
        page={upcomingPage}
        hasNextPage={upcomingRes?.hasNextPage}
        onPageChange={(p) => setUpcomingPage(p)}
      />
    </div>
  );
}
