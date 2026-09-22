"use client";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";
import Container from "./container";
import { Button } from "./ui/button";
import React from "react";
import { ArrowLeft, ArrowRight, Star, Calendar } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { ButtonLink } from "./common/button-link";
import { MediaList } from "@/types/miruro-api";
import { Badge } from "./ui/badge";

type IHeroSectionProps = {
  spotlightAnime: MediaList[];
  isDataLoading: boolean;
};

const HeroSection = (props: IHeroSectionProps) => {
  const [api, setApi] = React.useState<CarouselApi>();

  if (props.isDataLoading || !props.spotlightAnime?.length)
    return <LoadingSkeleton />;

  return (
    <div className="h-[82vh] w-full relative">
      <Carousel className="w-full h-full" setApi={setApi} opts={{ loop: true }}>
        <CarouselContent className="h-full">
          {props.spotlightAnime.map((anime, index) => (
            <CarouselItem key={anime.id || index} className="h-full">
              <HeroCarouselItem anime={anime} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Navigation Arrows */}
      <div className="absolute hidden md:flex items-center gap-3 right-8 bottom-20 z-50">
        <Button
          onClick={() => api?.scrollPrev()}
          className="rounded-full w-10 h-10 p-0 border border-[rgba(232,109,176,0.4)] bg-[rgba(13,13,18,0.7)] hover:bg-[rgba(232,109,176,0.2)] hover:border-blossom-pink transition-all"
        >
          <ArrowLeft className="text-white h-4 w-4" />
        </Button>
        <Button
          onClick={() => api?.scrollNext()}
          className="rounded-full w-10 h-10 p-0 border border-[rgba(232,109,176,0.4)] bg-[rgba(13,13,18,0.7)] hover:bg-[rgba(232,109,176,0.2)] hover:border-blossom-pink transition-all"
        >
          <ArrowRight className="text-white h-4 w-4" />
        </Button>
      </div>

      {/* Floating blossom petals decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-4 opacity-20 animate-petal-float"
            style={{
              left: `${15 + i * 18}%`,
              top: `${10 + (i % 3) * 20}%`,
              background: "radial-gradient(ellipse at 40% 30%, #ffb7d5, #e86db0)",
              borderRadius: "0 100% 0 100%",
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const HeroCarouselItem = ({ anime }: { anime: MediaList }) => {
  const bgImage =
    anime.bannerImage ||
    anime.coverImage?.extraLarge ||
    anime.coverImage?.large ||
    "";
  const title =
    anime.title?.english ||
    anime.title?.romaji ||
    anime.title?.native ||
    "Untitled";

  return (
    <div className="w-full h-[82vh] relative overflow-hidden">
      {/* Sharp background art — stays crisp across the main area */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Blurred copy of the same art, masked to only show — and blur —
          along the bottom edge, so it softens into "Recent Releases"
          instead of cutting off sharply. The rest of the image underneath
          stays untouched/crisp. */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-center scale-110 blur-lg"
        style={{
          backgroundImage: `url(${bgImage})`,
          maskImage: "linear-gradient(to bottom, transparent 78%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 78%, black 100%)",
        }}
      />

      {/* Legibility gradient — dark under the text (left), clear on the
          right so the art shows through */}
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(13,13,18,0.8)] via-[rgba(13,13,18,0.35)] to-[rgba(13,13,18,0.1)] z-10" />
      {/* Soft blend into the page background at the very bottom edge */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-transparent to-transparent z-10" />
      {/* Blossom tint */}
      <div className="absolute inset-0 bg-[rgba(201,77,148,0.06)] z-10" />


      {/* Content */}
      <div className="w-full h-[calc(100%-5rem)] relative z-20">
        <Container className="w-full h-full flex flex-col justify-end md:justify-center pb-12">
          <div className="space-y-4 lg:w-[48vw]">
            {/* Genre tags */}
            <div className="flex flex-wrap gap-1.5">
              {anime.genres?.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(232,109,176,0.12)",
                    border: "1px solid rgba(232,109,176,0.3)",
                    color: "#ffb7d5",
                  }}
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-black text-white line-clamp-2 leading-tight tracking-tight">
              {title}
            </h1>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2">
              {anime.format && (
                <Badge
                  className="font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #c94d94, #e86db0)" }}
                >
                  {anime.format}
                </Badge>
              )}
              {anime.seasonYear && (
                <Badge
                  variant="outline"
                  className="border-[rgba(255,255,255,0.2)] text-gray-300 flex items-center gap-1"
                >
                  <Calendar className="h-3 w-3" />
                  {anime.season ? `${anime.season} ` : ""}
                  {anime.seasonYear}
                </Badge>
              )}
              {!!anime.averageScore && (
                <Badge
                  variant="outline"
                  className="border-[rgba(245,200,66,0.3)] bg-[rgba(245,200,66,0.08)] text-yellow-300 flex items-center gap-1"
                >
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {anime.averageScore}%
                </Badge>
              )}
            </div>

            {/* Description */}
            {anime.description && (
              <p
                className="text-sm text-gray-300/80 line-clamp-3 max-w-lg leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: anime.description.replace(/<[^>]+>/g, ""),
                }}
              />
            )}

            {/* CTA */}
            <div className="flex items-center gap-3 pt-2">
              <ButtonLink
                href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}
                className="h-11 px-6 text-sm font-bold text-white border-0 animate-learn-more-pulse"
                style={{
                  background: "linear-gradient(135deg, #c94d94 0%, #e86db0 100%)",
                }}
              >
                🌸 Learn More
              </ButtonLink>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => {
  return (
    <div className="h-[82vh] w-full relative bg-[#0d0d12]">
      <div className="w-full h-full relative z-20">
        <Container className="w-full h-full flex flex-col justify-end md:justify-center pb-12">
          <div className="space-y-4 lg:w-[45vw]">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 w-16 animate-pulse rounded-full bg-[rgba(232,109,176,0.2)]" />
              ))}
            </div>
            <div className="h-12 animate-pulse bg-[rgba(232,109,176,0.1)] rounded-lg w-3/4" />
            <div className="h-5 animate-pulse bg-[rgba(232,109,176,0.1)] rounded-lg w-1/2" />
            <div className="h-16 animate-pulse bg-[rgba(232,109,176,0.08)] rounded-lg w-full" />
            <div className="h-11 w-36 animate-pulse rounded-lg bg-[rgba(232,109,176,0.2)]" />
          </div>
        </Container>
      </div>
    </div>
  );
};

export default HeroSection;
