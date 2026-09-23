import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "Cookie Policy - Shrota",
  description: "Learn what cookies Shrota uses and how you can control them.",
};

export default function CookiePolicyPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Cookie Policy
            </h1>
            <p className="text-text-secondary text-lg mb-2">
              For Shrota.in &amp; Shrota Mobile Application
            </p>
            <p className="text-text-secondary text-lg mb-2">
              Operated by Shravanam Soft Solutions LLP
            </p>
            <p className="text-text-secondary text-lg">
              Effective Date: 23/09/2026
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16 bg-bg-secondary">
        <Container>
          <FadeIn>
            <div className="max-w-3xl prose prose-invert prose-lg">
              <div className="bg-bg-card rounded-2xl p-8 border border-white/5 space-y-8">
                <div>
                  <p className="text-text-secondary">
                    This Cookie Policy explains how Shravanam Soft Solutions LLP (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) uses cookies and similar technologies on Shrota.in and the Shrota Mobile Application (&quot;Service&quot;). It should be read alongside our{" "}
                    <Link href="/privacy" className="text-brand-blue hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">1. What Are Cookies</h2>
                  <p className="text-text-secondary">
                    Cookies are small text files stored on your device when you visit a website. They help the site remember information about your visit, which can make it easier to use the site again and make the site more useful to you.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">2. Types of Cookies We Use</h2>
                  <p className="text-text-secondary mb-4">
                    When you visit Shrota.in, you can choose which categories of cookies you allow via our cookie preference banner:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li><strong className="text-text-primary">Necessary</strong> — required for the site to function (e.g. remembering your cookie preference itself). These cannot be switched off.</li>
                    <li><strong className="text-text-primary">Analytics</strong> — help us understand how visitors use Shrota.in, so we can improve it.</li>
                    <li><strong className="text-text-primary">Preferences</strong> — remember choices you make on the site for a better experience on your next visit.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">3. Third-Party Cookies</h2>
                  <p className="text-text-secondary">
                    Some cookies on Shrota.in may be set by third-party services we use (for example, analytics providers). We do not control these cookies directly; please refer to the respective third party&apos;s own cookie or privacy policy for details.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">4. How to Control Cookies</h2>
                  <p className="text-text-secondary mb-4">
                    You can manage your cookie preferences for Shrota.in at any time using the cookie preference banner shown when you visit the site. You can also control or delete cookies through your browser settings — most browsers let you refuse or delete cookies, though doing so may affect how some parts of the site work.
                  </p>
                  <p className="text-text-secondary">
                    The Shrota Mobile Application does not use browser cookies; any equivalent device identifiers or local storage used by the app are covered by our{" "}
                    <Link href="/privacy" className="text-brand-blue hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">5. Changes to This Policy</h2>
                  <p className="text-text-secondary">
                    We may update this Cookie Policy from time to time. The latest version will always be available on Shrota.in.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">6. Contact Information</h2>
                  <div className="text-text-secondary space-y-2">
                    <p><strong className="text-text-primary">Firm Name:</strong> Shravanam Soft Solutions LLP</p>
                    <p><strong className="text-text-primary">Email:</strong> <span className="text-brand-blue">myshrota@gmail.com</span></p>
                    <p><strong className="text-text-primary">Website:</strong> <span className="text-brand-blue">https://shrota.in</span></p>
                    <p><strong className="text-text-primary">Address:</strong> Jijau Colony, Hanuman Nagar, Daund Road, Ahilyanagar, Maharashtra, India, Pin 414005</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
