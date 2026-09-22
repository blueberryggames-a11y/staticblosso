import React from "react";
import AnimeCard from "./anime-card";
import { MediaList } from "@/types/miruro-api";
import { ROUTES } from "@/constants/routes";

type Props = {
  title: string;
  anime: MediaList[];
};

const FeaturedCollectionCard = (props: Props) => {
  if (!props.anime || props.anime.length < 3) return null;

  return (
    <div
      className="h-[18.5rem] flex flex-col gap-2 items-center rounded-2xl overflow-hidden w-full relative"
      style={{
        background: "linear-gradient(135deg, #141418 0%, #18181f 100%)",
        border: "1px solid rgba(232,109,176,0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Blossom top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(232,109,176,0.6), transparent)",
        }}
      />

      <h5
        className="text-base font-black pt-5 text-center px-4 z-10 relative"
        style={{
          background: "linear-gradient(135deg, #f0eef5 0%, #e86db0 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {props.title}
      </h5>

      <div className="w-full relative grow flex">
        {props.anime.slice(0, 3).map((item, index) => {
          const title =
            item.title?.english ||
            item.title?.romaji ||
            item.title?.native ||
            "Untitled";
          const poster =
            item.coverImage?.extraLarge || item.coverImage?.large || "";

          const classNames = [
            "absolute md:bottom-[-5.25rem] bottom-[-4.25rem] left-[15%] rotate-[-20deg] w-[9.375rem] border-[.5rem] rounded-lg",
            "absolute md:bottom-[-6.25rem] bottom-[-5rem] rotate-[-10deg] left-[30%] w-[9.375rem] border-[.5rem] rounded-lg",
            "absolute md:bottom-[-6.25rem] bottom-[-6rem] left-[45%] rotate-[5deg] w-[9.375rem] border-[.5rem] rounded-lg",
          ];

          return (
            <AnimeCard
              key={item.id || index}
              title={title}
              format={item.format}
              score={item.averageScore}
              className={classNames[index]}
              style={{
                borderColor: "#141418",
              } as React.CSSProperties}
              poster={poster}
              href={`${ROUTES.ANIME_DETAILS}/${item.id}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default FeaturedCollectionCard;
