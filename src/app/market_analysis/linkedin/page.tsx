"use client";

import dynamic from "next/dynamic";

const LinkedInPage = dynamic(() => import("@/app/Linkedln/page"), { ssr: false });

export default function MarketLinkedIn() {
  return <LinkedInPage />;
}
