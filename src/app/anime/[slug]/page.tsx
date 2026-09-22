import AnimeDetailClient from "./anime-detail-client";

// Required for static export with dynamic routes
export function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

export default function Page() {
  return <AnimeDetailClient />;
}
