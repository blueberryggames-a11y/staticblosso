"use client";

import React from "react";
import Container from "./container";
import AnimeCard from "./anime-card";
import BlurFade from "./ui/blur-fade";
import { MediaList } from "@/types/miruro-api";
import { ROUTES } from "@/constants/routes";
import Button from "./common/custom-button";
import { ArrowLeft, ArrowRight } from "lucide-react";

type Props = {
  animeList: MediaList[];
  loading: boolean;
  title: string;
  page?: number;
  hasNextPage?: boolean;
  onPageChange?: (newPage: number) => void;
};

const AnimeSections = ({
  animeList,
  loading,
  title: sectionTitle,
  page = 1,
  hasNextPage = false,
  onPageChange,
}: Props) => {
  if (loading || !animeList?.length) return <LoadingSkeleton />;

  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start">
      {/* Section title with blossom accent */}
      <div className="flex items-center gap-3 w-full">
        <h5
          className="text-2xl font-black tracking-tight"
          style={{
            background: "linear-gradient(135deg, #f0eef5 0%, #e86db0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {sectionTitle}
        </h5>
        <div
          className="flex-1 h-px max-w-[120px]"
          style={{
            background: "linear-gradient(90deg, rgba(232,109,176,0.5), transparent)",
          }}
        />
      </div>

      <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
        {animeList.map((anime, idx) => {
          const title =
            anime.title?.english ||
            anime.title?.romaji ||
            anime.title?.native ||
            "Untitled";
          const poster =
            anime.coverImage?.extraLarge || anime.coverImage?.large || "";

          return (
            <BlurFade key={`${anime.id}-${idx}`} delay={idx * 0.03} inView>
              <AnimeCard
                title={title}
                format={anime.format}
                score={anime.averageScore}
                poster={poster}
                className="self-center justify-self-center"
                href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}
              />
            </BlurFade>
          );
        })}
      </div>

      {onPageChange && (
        <div className="flex items-center justify-end w-full gap-3 mt-4">
          <Button
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={page <= 1}
            className="rounded-full h-9 w-9 p-0 disabled:opacity-30 transition-all"
            style={{
              background: "rgba(232,109,176,0.1)",
              border: "1px solid rgba(232,109,176,0.3)",
            }}
          >
            <ArrowLeft className="text-blossom-pink h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground px-2">Page {page}</span>
          <Button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
            className="rounded-full h-9 w-9 p-0 disabled:opacity-30 transition-all"
            style={{
              background: "rgba(232,109,176,0.1)",
              border: "1px solid rgba(232,109,176,0.3)",
            }}
          >
            <ArrowRight className="text-blossom-pink h-4 w-4" />
          </Button>
        </div>
      )}
    </Container>
  );
};

const LoadingSkeleton = () => {
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start">
      <div className="h-8 w-[200px] animate-pulse rounded-lg bg-[rgba(232,109,176,0.1)]" />
      <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
        {[...Array(14)].map((_, idx) => (
          <div
            key={idx}
            className="rounded-xl h-[15.625rem] min-w-[10.625rem] max-w-[12.625rem] md:h-[18.75rem] animate-pulse"
            style={{ background: "rgba(232,109,176,0.06)" }}
          />
        ))}
      </div>
    </Container>
  );
};

export default AnimeSections;
