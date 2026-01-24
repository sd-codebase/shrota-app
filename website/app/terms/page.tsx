import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "Terms & Conditions - Shrota",
  description: "Read the terms and conditions for using the Shrota audiobook application.",
};

export default function TermsPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Terms & Conditions</h1>
            <p className="text-text-secondary text-lg">
              Last updated: January 2024
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
                  <h2 className="text-2xl font-bold text-text-primary mb-4">1. Acceptance of Terms</h2>
                  <p className="text-text-secondary">
                    By downloading, installing, or using the Shrota application (&quot;App&quot;), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">2. Description of Service</h2>
                  <p className="text-text-secondary">
                    Shrota provides a digital platform for streaming and downloading audiobooks, stories, and related audio content. Our services include both free and premium subscription-based content.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">3. User Accounts</h2>
                  <p className="text-text-secondary mb-4">
                    To access certain features, you must create an account. You agree to:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Notify us immediately of any unauthorized use</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">4. Subscriptions and Payments</h2>
                  <p className="text-text-secondary mb-4">
                    Premium features require a paid subscription:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
                    <li>Prices may change with reasonable notice</li>
                    <li>Refunds are subject to our refund policy and applicable law</li>
                    <li>You may cancel your subscription at any time through the App or app store</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">5. Content and Intellectual Property</h2>
                  <p className="text-text-secondary mb-4">
                    All content available through Shrota is protected by copyright:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>You may not copy, distribute, or share content without authorization</li>
                    <li>Downloaded content is for personal, non-commercial use only</li>
                    <li>Content licenses may be limited by region or time</li>
                    <li>We reserve the right to remove or modify content at any time</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">6. Prohibited Conduct</h2>
                  <p className="text-text-secondary mb-4">
                    You agree not to:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on intellectual property rights</li>
                    <li>Attempt to bypass security measures or access restrictions</li>
                    <li>Use automated systems to access the service</li>
                    <li>Share your account credentials with others</li>
                    <li>Engage in any activity that disrupts our services</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">7. Disclaimers</h2>
                  <p className="text-text-secondary">
                    Our services are provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted or error-free service. We are not responsible for any content accuracy or third-party services integrated with our App.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">8. Limitation of Liability</h2>
                  <p className="text-text-secondary">
                    To the maximum extent permitted by law, Shrota shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">9. Termination</h2>
                  <p className="text-text-secondary">
                    We may suspend or terminate your account at our discretion for violation of these terms. Upon termination, your right to use the service ceases immediately, and you may lose access to any content.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">10. Changes to Terms</h2>
                  <p className="text-text-secondary">
                    We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">11. Governing Law</h2>
                  <p className="text-text-secondary">
                    These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, India.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">12. Contact</h2>
                  <p className="text-text-secondary">
                    For questions about these Terms and Conditions, please contact us at:
                  </p>
                  <p className="text-brand-blue mt-2">legal@shrota.com</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
