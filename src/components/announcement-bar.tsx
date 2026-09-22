"use client";

import React, { useEffect, useState } from "react";
import { X, Megaphone } from "lucide-react";
import { useAnnouncement } from "@/lib/site-config";

function AnnouncementBar() {
  const { announcement, loaded } = useAnnouncement();
  const [dismissed, setDismissed] = useState(false);
  const [lastText, setLastText] = useState<string | null>(null);

  // Re-show the bar automatically whenever the admin publishes new text,
  // even if the visitor dismissed a previous announcement in this session.
  useEffect(() => {
    if (announcement && announcement.text !== lastText) {
      setLastText(announcement.text);
      setDismissed(false);
    }
  }, [announcement, lastText]);

  if (!loaded || !announcement?.active || !announcement.text || dismissed) {
    return null;
  }

  return (
    <div
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm text-white relative"
      style={{
        background: "linear-gradient(135deg, #c94d94 0%, #e86db0 100%)",
      }}
    >
      <Megaphone size={15} className="shrink-0" />
      <p className="text-center font-medium leading-snug">
        {announcement.text}
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100 transition-opacity"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export default AnnouncementBar;
