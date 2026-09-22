"use client";

import React from "react";
import {
  Avatar as AvatarCN,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

type Props = {
  url?: string;
  username?: string;
  /** kept for API-compat with profile page – unused with Firebase */
  collectionID?: string;
  id?: string;
  className?: string;
  onClick?: () => void;
};

/**
 * AniBlossom Avatar
 * - `url` is a direct HTTP(S) URL (Firebase Storage / Google photoURL / custom upload URL).
 * - Falls back to initials when no image is provided.
 */
function Avatar({ url, username, className, onClick }: Props) {
  // url from Firebase is already a full https:// URL
  const src = url ?? "";

  return (
    <AvatarCN className={className} onClick={onClick}>
      {src && (
        <AvatarImage
          src={src}
          alt={username}
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarFallback className="bg-gradient-to-br from-blossom-deep to-blossom-pink text-white font-bold">
        {username?.charAt(0).toUpperCase()}
        {username?.charAt(1)?.toLowerCase()}
      </AvatarFallback>
    </AvatarCN>
  );
}

export default Avatar;
