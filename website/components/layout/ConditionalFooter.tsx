"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Footer } from "./Footer";

function FooterWithParams() {
  const searchParams = useSearchParams();
  const noFooter = searchParams.has("nofooter");

  if (noFooter) {
    return null;
  }

  return <Footer />;
}

export function ConditionalFooter() {
  return (
    <Suspense fallback={<Footer />}>
      <FooterWithParams />
    </Suspense>
  );
}
