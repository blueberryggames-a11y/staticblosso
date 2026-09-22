import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn, formatSecondsToMMSS } from "@/lib/utils";
import { Progress } from "./ui/progress";
import { WatchHistory } from "@/hooks/use-get-bookmark";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  poster: string;
  title: string;
  episodeCard?: boolean;
  episodes?: number | null;
  score?: number | null;
  format?: string | null;
  subTitle?: string;
  displayDetails?: boolean;
  variant?: "sm" | "lg";
  href?: string;
  showGenre?: boolean;
  watchDetail?: WatchHistory | null;
};

const AnimeCard = ({
  displayDetails = true,
  variant = "sm",
  ...props
}: Props) => {
  const safeCurrent =
    typeof props.watchDetail?.current === "number" ? props.watchDetail.current : 0;
  const safeTotal =
    typeof props.watchDetail?.timestamp === "number" && props.watchDetail.timestamp > 0
      ? props.watchDetail.timestamp
      : 0;
  const clampedCurrent = Math.min(safeCurrent, safeTotal);
  const percentage = safeTotal > 0 ? (clampedCurrent / safeTotal) * 100 : 0;

  return (
    <Link href={props.href as string}>
      <div
        className={cn([
          "rounded-xl overflow-hidden relative cursor-pointer group",
          "transition-all duration-300 hover:scale-[1.04] hover:shadow-xl",
          "border border-transparent hover:border-[rgba(232,109,176,0.3)]",
          variant === "sm" &&
            "h-[12rem] min-[320px]:h-[16.625rem] sm:h-[18rem] max-w-[12.625rem] md:min-w-[12rem]",
          variant === "lg" &&
            "max-w-[12.625rem] md:max-w-[18.75rem] h-auto md:h-[25rem] shrink-0 lg:w-[18.75rem]",
          props.className,
        ])}
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.4)", ...props.style }}
      >
        <Image
          src={props.poster}
          alt={props.title}
          height={100}
          width={100}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />

        {displayDetails && (
          <>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-[rgba(13,13,18,0.5)] to-transparent" />
            {/* Blossom tint on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(201,77,148,0.15)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="absolute bottom-0 flex flex-col gap-1.5 px-3 pb-3 w-full">
              <h5 className="line-clamp-1 font-bold text-sm text-white">{props.title}</h5>

              {props.watchDetail && (
                <>
                  <p className="text-[10px] text-gray-400">
                    Ep {props.watchDetail.episodeNumber} ·{" "}
                    {formatSecondsToMMSS(props.watchDetail.current)} /{" "}
                    {formatSecondsToMMSS(props.watchDetail.timestamp)}
                  </p>
                  <Progress
                    value={percentage}
                    className="h-0.5 bg-[rgba(255,255,255,0.15)]"
                    style={{
                      ["--progress-color" as string]: "#e86db0",
                    }}
                  />
                </>
              )}

              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                {props.episodeCard && !!props.episodes && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white"
                    style={{ background: "linear-gradient(135deg, #c94d94, #e86db0)" }}
                  >
                    Ep {props.episodes}
                  </span>
                )}
                {props.format && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(240,238,245,0.7)",
                    }}
                  >
                    {props.format}
                  </span>
                )}
                {!!props.score && (
                  <span className="text-[10px] font-bold text-yellow-400 ml-auto">
                    ⭐ {props.score}%
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Blossom corner glow on hover */}
        <div
          className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "radial-gradient(circle at top right, rgba(232,109,176,0.25), transparent 70%)",
          }}
        />
      </div>
    </Link>
  );
};

export default AnimeCard;
