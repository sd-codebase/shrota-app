import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { EventsTimeline } from "@/components/sections/EventsTimeline";
import { fetchAllEvents } from "@/lib/api";

export const metadata: Metadata = {
  title: "Events | Shrota",
  description: "Latest events and updates from Shrota Audiobooks.",
};

export default async function EventsPage() {
  const events = await fetchAllEvents();

  return (
    <main className="min-h-screen bg-bg-primary pt-24 pb-20">
      <Container>
        <FadeIn>
          <h1 className="text-4xl font-bold text-white mb-2">Events</h1>
          <p className="text-text-secondary mb-12">Latest news and updates from Shrota</p>
        </FadeIn>

        {events.length === 0 ? (
          <FadeIn>
            <p className="text-text-secondary text-center py-20">No events yet.</p>
          </FadeIn>
        ) : (
          <EventsTimeline events={events} />
        )}
      </Container>
    </main>
  );
}
