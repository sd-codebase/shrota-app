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
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Terms and Conditions</h1>
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
                    These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the website Shrota.in and the Shrota Mobile Application (collectively referred to as the &quot;Service&quot;), owned and operated by Shravanam Soft Solutions LLP (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or &quot;Company&quot;).
                  </p>
                  <p className="text-text-secondary mt-4">
                    By accessing or using Shrota, you agree to be bound by these Terms. If you do not agree, please do not use our Service.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">1. Eligibility</h2>
                  <p className="text-text-secondary mb-4">
                    You must be at least 13 years of age to use Shrota.
                  </p>
                  <p className="text-text-secondary">
                    By using this Service, you represent that you are legally capable of entering into a binding agreement.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">2. Account Registration</h2>
                  <p className="text-text-secondary mb-4">
                    To access certain features, you may be required to create an account. You agree to:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                    <li>Provide accurate and complete information</li>
                    <li>Keep your login credentials secure</li>
                    <li>Be responsible for all activity under your account</li>
                  </ul>
                  <p className="text-text-secondary">
                    Shrota reserves the right to suspend or terminate accounts for false information or misuse.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">3. Use of the Service</h2>
                  <p className="text-text-secondary mb-4">
                    You agree to use Shrota only for lawful purposes and not to:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Upload or share copyrighted content without rights</li>
                    <li>Misuse, copy, or distribute platform content illegally</li>
                    <li>Attempt to hack, reverse engineer, or disrupt services</li>
                    <li>Post harmful, abusive, or misleading content</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">4. Intellectual Property</h2>
                  <p className="text-text-secondary mb-4">
                    All content on Shrota including:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                    <li>Logos</li>
                    <li>Designs</li>
                    <li>Text</li>
                    <li>Audio files</li>
                    <li>Graphics</li>
                  </ul>
                  <p className="text-text-secondary mb-4">
                    are the intellectual property of Shravanam Soft Solutions LLP or its content partners and are protected under applicable copyright laws.
                  </p>
                  <p className="text-text-secondary">
                    Users may not reproduce, redistribute, or resell any content without written permission.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">5. User-Generated Content</h2>
                  <p className="text-text-secondary mb-4">
                    If you upload content to Shrota:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                    <li>You confirm you own the rights or have permission</li>
                    <li>You grant Shrota a non-exclusive license to host and distribute it</li>
                    <li>You remain the owner of your content</li>
                  </ul>
                  <p className="text-text-secondary">
                    Shrota is not responsible for content uploaded by users.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">6. Subscriptions and Payments (If Applicable)</h2>
                  <p className="text-text-secondary mb-4">
                    Some services may require payment or subscription. By subscribing, you agree:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Payments are non-refundable unless stated</li>
                    <li>Prices may change with prior notice</li>
                    <li>Access may be revoked if payment fails</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">7. Content Disclaimer</h2>
                  <p className="text-text-secondary mb-4">
                    Shrota provides audio content for:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                    <li>Educational</li>
                    <li>Informational</li>
                    <li>Entertainment purposes only</li>
                  </ul>
                  <p className="text-text-secondary">
                    We do not guarantee accuracy or completeness of all content.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">8. Third-Party Links</h2>
                  <p className="text-text-secondary">
                    Shrota may contain links to third-party websites or services. We are not responsible for their content or policies.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">9. Termination</h2>
                  <p className="text-text-secondary mb-4">
                    We may suspend or terminate your access to Shrota:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>If you violate these Terms</li>
                    <li>For security reasons</li>
                    <li>Without prior notice if required by law</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">10. Limitation of Liability</h2>
                  <p className="text-text-secondary mb-4">
                    Shravanam Soft Solutions LLP shall not be liable for:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                    <li>Any indirect or incidental damages</li>
                    <li>Data loss</li>
                    <li>Service interruptions</li>
                    <li>Content errors</li>
                  </ul>
                  <p className="text-text-secondary">
                    Use of the Service is at your own risk.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">11. Indemnification</h2>
                  <p className="text-text-secondary mb-4">
                    You agree to indemnify and hold harmless Shravanam Soft Solutions LLP from any claims arising from:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Your misuse of the Service</li>
                    <li>Violation of these Terms</li>
                    <li>Infringement of third-party rights</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">12. Governing Law</h2>
                  <p className="text-text-secondary mb-4">
                    These Terms shall be governed by the laws of India.
                  </p>
                  <p className="text-text-secondary">
                    Any disputes shall be subject to the jurisdiction of courts in Ahilyanagar, Maharashtra, India.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">13. Changes to Terms</h2>
                  <p className="text-text-secondary mb-4">
                    We reserve the right to modify these Terms at any time. Updated Terms will be posted on Shrota.in.
                  </p>
                  <p className="text-text-secondary">
                    Continued use of the Service means acceptance of updated Terms.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">14. Contact Information</h2>
                  <p className="text-text-secondary mb-4">
                    For any questions regarding these Terms, contact:
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
