import ProfileClient from "./profile-client";

export function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

export default function Page() {
  return <ProfileClient />;
}
