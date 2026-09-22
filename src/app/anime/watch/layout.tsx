import React, { Suspense, ReactNode } from "react";
import WatchLayoutClient from "./watch-layout-client";
import Loading from "@/app/loading";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <WatchLayoutClient>{children}</WatchLayoutClient>
    </Suspense>
  );
}
