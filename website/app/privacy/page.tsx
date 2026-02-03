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
            <p className="text-text-secondary text-lg mb-2">
              For Shrota.in &amp; Shrota Mobile Application
            </p>
            <p className="text-text-secondary text-lg mb-2">
              Operated by Shravanam Soft Solutions LLP
            </p>
            <p className="text-text-secondary text-lg">
              Effective Date: 02/02/2026
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
                    Shravanam Soft Solutions LLP (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the website Shrota.in and the Shrota Mobile Application (collectively referred to as &quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our Service.
                  </p>
                  <p className="text-text-secondary mt-4">
                    By using Shrota.in or the Shrota Mobile Application, you agree to the collection and use of information in accordance with this policy.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">1. Information We Collect</h2>
                  <p className="text-text-secondary mb-4">
                    We may collect the following types of information:
                  </p>

                  <h3 className="text-xl font-semibold text-text-primary mb-2">a) Personal Information</h3>
                  <p className="text-text-secondary mb-2">
                    When you register or use our services, we may collect:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Phone number (if provided)</li>
                    <li>Address (optional, if provided)</li>
                    <li>Login credentials</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-text-primary mb-2">b) Usage Data</h3>
                  <p className="text-text-secondary mb-2">
                    We may collect information such as:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                    <li>Device type</li>
                    <li>IP address</li>
                    <li>Browser type</li>
                    <li>Pages visited</li>
                    <li>Time and date of access</li>
                    <li>App usage statistics</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-text-primary mb-2">c) Audio Content Data</h3>
                  <p className="text-text-secondary">
                    We do not claim ownership of user-uploaded content. However, metadata related to content usage (like listening history) may be stored to improve user experience.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">2. How We Use Your Information</h2>
                  <p className="text-text-secondary mb-4">
                    We use the collected data for the following purposes:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>To provide and maintain our services</li>
                    <li>To manage user accounts</li>
                    <li>To personalize content and recommendations</li>
                    <li>To improve app and website performance</li>
                    <li>To communicate updates, offers, or important notices</li>
                    <li>To ensure security and prevent fraud</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">3. Sharing of Information</h2>
                  <p className="text-text-secondary mb-4">
                    We do not sell, trade, or rent your personal information to third parties.
                  </p>
                  <p className="text-text-secondary mb-2">
                    We may share information only:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>With service providers for hosting, analytics, or support</li>
                    <li>If required by law or government authorities</li>
                    <li>To protect the rights, safety, or property of users or our firm</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">4. Data Security</h2>
                  <p className="text-text-secondary mb-4">
                    We implement reasonable technical and organizational measures to protect your data against:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                    <li>Unauthorized access</li>
                    <li>Data loss</li>
                    <li>Misuse or alteration</li>
                  </ul>
                  <p className="text-text-secondary">
                    However, no method of transmission over the internet is 100% secure.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">5. Cookies and Tracking Technologies</h2>
                  <p className="text-text-secondary mb-4">
                    Shrota.in may use cookies and similar technologies to:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                    <li>Improve user experience</li>
                    <li>Analyze traffic and usage</li>
                    <li>Remember user preferences</li>
                  </ul>
                  <p className="text-text-secondary">
                    You can disable cookies in your browser settings if you prefer.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">6. Third-Party Services</h2>
                  <p className="text-text-secondary mb-4">
                    Our app or website may contain links to third-party services. We are not responsible for their privacy practices or content.
                  </p>
                  <p className="text-text-secondary">
                    We recommend reviewing their privacy policies separately.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">7. Children&apos;s Privacy</h2>
                  <p className="text-text-secondary mb-4">
                    Shrota does not knowingly collect personal information from children under the age of 13.
                  </p>
                  <p className="text-text-secondary">
                    If you believe your child has provided personal data, please contact us and we will remove it.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">8. Your Rights</h2>
                  <p className="text-text-secondary mb-4">
                    You have the right to:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                    <li>Access your personal data</li>
                    <li>Request correction or deletion</li>
                    <li>Withdraw consent at any time</li>
                  </ul>
                  <p className="text-text-secondary">
                    To exercise these rights, contact us at the email below.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">9. Changes to This Privacy Policy</h2>
                  <p className="text-text-secondary mb-4">
                    We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised effective date.
                  </p>
                  <p className="text-text-secondary">
                    We encourage users to review this policy periodically.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">10. Contact Us</h2>
                  <p className="text-text-secondary mb-4">
                    If you have any questions about this Privacy Policy, you can contact us at:
                  </p>
                  <div className="text-text-secondary space-y-2">
                    <p><strong className="text-text-primary">Firm Name:</strong> Shravanam Soft Solutions LLP</p>
                    <p><strong className="text-text-primary">Address:</strong> Jijau Colony, Hanuman Nagar, Daund Road, Ahilyanagar, Maharashtra, India, Pin 414005</p>
                    <p><strong className="text-text-primary">Email:</strong> <span className="text-brand-blue">myshrota@gmail.com</span></p>
                    <p><strong className="text-text-primary">Website:</strong> <span className="text-brand-blue">https://shrota.in</span></p>
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
