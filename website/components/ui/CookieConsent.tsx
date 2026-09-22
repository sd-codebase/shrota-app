"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import {
  CookieConsent as ConsentState,
  DEFAULT_CONSENT,
  getStoredConsent,
  saveConsent,
} from "@/lib/cookieConsent";

const CATEGORIES: Array<{
  key: keyof Omit<ConsentState, "necessary">;
  title: string;
  description: string;
}> = [
  {
    key: "analytics",
    title: "Analytics",
    description: "Helps us understand how visitors use Shrota so we can improve it.",
  },
  {
    key: "preferences",
    title: "Preferences",
    description: "Remembers choices you make on the site for a better experience next time.",
  },
];

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [draft, setDraft] = useState<ConsentState>(DEFAULT_CONSENT);

  useEffect(() => {
    // Only decide whether to show the banner after mount, so SSR output
    // never flashes it before we know whether consent was already given.
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const finish = (consent: ConsentState) => {
    saveConsent(consent);
    setVisible(false);
    setManaging(false);
  };

  const acceptAll = () => finish({ necessary: true, analytics: true, preferences: true });
  const rejectAll = () => finish({ necessary: true, analytics: false, preferences: false });
  const confirmChoices = () => finish(draft);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[100]"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie preferences"
        >
          <div className="w-full bg-bg-card shadow-2xl shadow-black/50">
            <div className="h-[3px] w-full bg-gradient-to-r from-brand-blue via-brand-orange to-brand-orange-light" />
            <Container className="py-5 sm:py-6">
              {!managing ? (
              <>
                <p className="text-text-secondary text-sm sm:text-base mb-4">
                  We use cookies to run Shrota and, if you allow it, to
                  understand usage and remember your preferences. See our{" "}
                  <Link href="/privacy" className="text-brand-blue hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  for details.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                  <button
                    onClick={() => {
                      setDraft(getStoredConsent() || DEFAULT_CONSENT);
                      setManaging(true);
                    }}
                    className="text-text-secondary hover:text-text-primary text-sm underline underline-offset-2 transition-colors sm:mr-auto"
                  >
                    Manage preferences
                  </button>
                  <Button variant="outline" size="sm" onClick={rejectAll}>
                    Reject All
                  </Button>
                  <Button variant="primary" size="sm" onClick={acceptAll}>
                    Accept All
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-text-primary font-semibold mb-1">Cookie preferences</h2>
                <p className="text-text-secondary text-sm mb-4">
                  Necessary cookies are always on — the site can&apos;t work without them.
                  Choose which other cookies you&apos;re okay with.
                </p>

                <div className="flex flex-col gap-3 mb-5">
                  <div className="flex items-center justify-between gap-4 bg-white/[0.06] rounded-xl p-3 border border-white/10">
                    <div>
                      <p className="text-text-primary text-sm font-medium">Necessary</p>
                      <p className="text-text-secondary text-xs">Required for the site to function.</p>
                    </div>
                    <span className="text-xs text-text-primary font-medium px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
                      Always on
                    </span>
                  </div>

                  {CATEGORIES.map((cat) => (
                    <div
                      key={cat.key}
                      className="flex items-center justify-between gap-4 bg-white/[0.06] rounded-xl p-3 border border-white/10"
                    >
                      <div>
                        <p className="text-text-primary text-sm font-medium">{cat.title}</p>
                        <p className="text-text-secondary text-xs">{cat.description}</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={draft[cat.key]}
                        aria-label={cat.title}
                        onClick={() =>
                          setDraft((d) => ({ ...d, [cat.key]: !d[cat.key] }))
                        }
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors ${
                          draft[cat.key]
                            ? "bg-brand-orange border-brand-orange"
                            : "bg-white/15 border-white/25"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                            draft[cat.key] ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                  <button
                    onClick={() => setManaging(false)}
                    className="text-text-secondary hover:text-text-primary text-sm underline underline-offset-2 transition-colors sm:mr-auto"
                  >
                    Back
                  </button>
                  <Button variant="outline" size="sm" onClick={rejectAll}>
                    Reject All
                  </Button>
                  <Button variant="primary" size="sm" onClick={confirmChoices}>
                    Confirm My Choices
                  </Button>
                </div>
              </>
            )}
            </Container>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
