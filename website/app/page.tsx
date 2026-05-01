import { Hero } from "@/components/sections/Hero";
import { EventsCarousel } from "@/components/sections/EventsCarousel";
import { WhatYoullFind } from "@/components/sections/WhatYoullFind";
import { WhyShrota } from "@/components/sections/WhyShrota";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { AppPreview } from "@/components/sections/AppPreview";
import { Testimonials } from "@/components/sections/Testimonials";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <EventsCarousel />
      <WhatYoullFind />
      <WhyShrota />
      <HowItWorks />
      <AppPreview />
      <Testimonials />
      <FinalCTA />
    </>
  );
}
