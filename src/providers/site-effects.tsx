"use client";

import { usePresenceHeartbeat } from "@/lib/presence";
import { useTrackActivity } from "@/hooks/use-track-activity";

/** Renders nothing — just registers this visitor as "online" and logs one
 *  hourly activity ping per session for the admin dashboard. */
function SiteEffects() {
  usePresenceHeartbeat();
  useTrackActivity();
  return null;
}

export default SiteEffects;
