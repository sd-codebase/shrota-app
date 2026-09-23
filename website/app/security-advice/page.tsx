import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "Security Advice - Shrota",
  description: "Tips to keep your Shrota account safe from phishing, scams, and unauthorized access.",
};

export default function SecurityAdvicePage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Security Advice
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
                    This page offers practical advice to help you keep your Shrota account and personal information safe. If you are a security researcher looking to report a technical vulnerability, please see our{" "}
                    <Link href="/vulnerability-disclosure" className="text-brand-blue hover:underline">
                      Vulnerability Disclosure Policy
                    </Link>{" "}
                    instead.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">1. Protecting Your Account</h2>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Never share your password or login OTP with anyone, including anyone claiming to be from Shrota</li>
                    <li>Use a strong, unique password and avoid reusing passwords from other services</li>
                    <li>Log out of Shrota on shared or public devices</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">2. OTP Awareness</h2>
                  <p className="text-text-secondary">
                    Shrota may send a one-time password (OTP) to verify your identity when you sign in or make changes to your account. This OTP is only ever meant to be entered by you, in the Shrota app or website — never share it over phone, SMS reply, email, or with anyone claiming to represent Shrota.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">3. Recognizing Phishing &amp; Scams</h2>
                  <p className="text-text-secondary mb-4">
                    Be cautious of messages, emails, or calls that:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Ask you to share your password or OTP</li>
                    <li>Link to a website that looks like Shrota but has a different or misspelled domain</li>
                    <li>Create urgency (&quot;your account will be blocked&quot;) to pressure you into acting quickly</li>
                    <li>Ask for payment or bank details outside the official app</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">4. Device &amp; Network Security</h2>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Keep the Shrota app updated to the latest version</li>
                    <li>Avoid logging into your account over unsecured public Wi-Fi where possible</li>
                    <li>Only download the Shrota app from the official Google Play Store or Apple App Store</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">5. What Shrota Will Never Ask You</h2>
                  <p className="text-text-secondary mb-4">
                    Shrota will never ask you, over phone, email, or SMS, to:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Share your password or OTP</li>
                    <li>Make a payment to a personal bank account or UPI ID</li>
                    <li>Install any remote-access or screen-sharing app</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">6. Reporting Suspicious Activity</h2>
                  <p className="text-text-secondary">
                    If you notice unusual activity on your account, or receive a suspicious message claiming to be from Shrota, please contact us immediately at{" "}
                    <span className="text-brand-orange font-semibold">myshrota@gmail.com</span>.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">7. Contact Information</h2>
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
