import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "Privacy Policy - Shrota",
  description: "Learn how Shrota collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
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
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Introduction</h2>
                  <p className="text-text-secondary">
                    Shrota (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Information We Collect</h2>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">Personal Information</h3>
                  <p className="text-text-secondary mb-4">
                    When you create an account, we may collect:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Name and email address</li>
                    <li>Account credentials</li>
                    <li>Payment information (processed securely through third-party providers)</li>
                    <li>Profile preferences and settings</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-text-primary mb-2 mt-6">Usage Information</h3>
                  <p className="text-text-secondary mb-4">
                    We automatically collect:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Device information (type, OS, unique identifiers)</li>
                    <li>Listening history and preferences</li>
                    <li>App usage patterns and interactions</li>
                    <li>Crash reports and performance data</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">How We Use Your Information</h2>
                  <p className="text-text-secondary mb-4">
                    We use your information to:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Provide and maintain our services</li>
                    <li>Personalize your experience and recommendations</li>
                    <li>Process transactions and send related information</li>
                    <li>Send promotional communications (with your consent)</li>
                    <li>Improve our app and develop new features</li>
                    <li>Ensure security and prevent fraud</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Data Sharing and Disclosure</h2>
                  <p className="text-text-secondary mb-4">
                    We may share your information with:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Service providers who assist in our operations</li>
                    <li>Analytics partners to improve our services</li>
                    <li>Legal authorities when required by law</li>
                    <li>Business partners with your consent</li>
                  </ul>
                  <p className="text-text-secondary mt-4">
                    We do not sell your personal information to third parties.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Data Security</h2>
                  <p className="text-text-secondary">
                    We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Your Rights</h2>
                  <p className="text-text-secondary mb-4">
                    You have the right to:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Export your data in a portable format</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Children&apos;s Privacy</h2>
                  <p className="text-text-secondary">
                    Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Changes to This Policy</h2>
                  <p className="text-text-secondary">
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Contact Us</h2>
                  <p className="text-text-secondary">
                    If you have questions about this Privacy Policy, please contact us at:
                  </p>
                  <p className="text-brand-blue mt-2">privacy@shrota.com</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
