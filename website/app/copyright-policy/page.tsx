import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "Copyright Policy - Shrota",
  description: "Shrota's policy on copyright ownership and how to report infringement.",
};

export default function CopyrightPolicyPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Copyright Policy
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
                    Shravanam Soft Solutions LLP (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) respects the intellectual property rights of others and expects users of Shrota.in and the Shrota Mobile Application (&quot;Service&quot;) to do the same. This Copyright Policy explains how we handle copyright ownership and infringement claims.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">1. Ownership of Content</h2>
                  <p className="text-text-secondary">
                    All audiobooks, narrations, cover art, branding, and other content made available on the Service are owned by Shravanam Soft Solutions LLP, our authors, narrators, and publishing partners, or are licensed to us for distribution. Content is made available for personal, non-commercial listening within the Service only, and may not be copied, redistributed, downloaded outside the app, or used commercially without prior written permission.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">2. Respecting Third-Party Rights</h2>
                  <p className="text-text-secondary">
                    We take copyright seriously and do not knowingly host or distribute content that infringes the rights of third parties. Writers and publishers who submit content to Shrota (see our{" "}
                    <a href="/write-with-us" className="text-brand-blue hover:underline">Write With Us</a>
                    {" "}page) must confirm they hold the necessary rights to that content before it is published.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">3. Reporting Copyright Infringement</h2>
                  <p className="text-text-secondary mb-4">
                    If you believe content on the Service infringes your copyright, please send a written notice to{" "}
                    <span className="text-brand-orange font-semibold">myshrota@gmail.com</span> including:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>A description of the copyrighted work you claim has been infringed</li>
                    <li>The exact location (book/chapter title, or URL) of the material on Shrota</li>
                    <li>Your contact information (name, address, phone number, email)</li>
                    <li>A statement that you have a good-faith belief the use is unauthorized</li>
                    <li>A statement, under penalty of perjury, that the above information is accurate and that you are the rights holder or authorized to act on their behalf</li>
                    <li>Your physical or electronic signature</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">4. Counter-Notification</h2>
                  <p className="text-text-secondary">
                    If content you submitted was removed and you believe this was done in error, you may send a counter-notice to{" "}
                    <span className="text-brand-orange font-semibold">myshrota@gmail.com</span> identifying the removed content and explaining why you believe it does not infringe. We will review counter-notices in good faith and may reinstate content where appropriate.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">5. Repeat Infringers</h2>
                  <p className="text-text-secondary">
                    We may suspend or terminate the account of any writer, publisher, or user who is found to have repeatedly infringed the copyright of others.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">6. Changes to This Policy</h2>
                  <p className="text-text-secondary">
                    We may update this Copyright Policy from time to time. The latest version will always be available on Shrota.in.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">7. Contact Information</h2>
                  <p className="text-text-secondary mb-4">
                    For copyright-related notices, contact:
                  </p>
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
