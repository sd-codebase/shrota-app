import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delete Your Account - Shrota",
  description: "Request deletion of your Shrota account and associated data.",
};

export default function DeleteAccountPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Delete Your Account</h1>
            <p className="text-text-secondary text-lg mb-2">
              Shrota Mobile Application - Account Deletion Request
            </p>
            <p className="text-text-secondary text-lg">
              Shrota app by Shravanam Soft Solutions LLP
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
                {/* Introduction */}
                <div>
                  <p className="text-text-secondary">
                    We respect your privacy and your right to control your personal data. If you wish to delete your Shrota account and all associated data, please follow the steps below.
                  </p>
                </div>

                {/* Steps to Request Deletion */}
                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">How to Request Account Deletion</h2>
                  <p className="text-text-secondary mb-4">
                    To request deletion of your account, please follow these steps:
                  </p>
                  <ol className="list-decimal list-inside text-text-secondary space-y-4">
                    <li>
                      <strong className="text-text-primary">Send an email</strong> to{" "}
                      <a
                        href="mailto:myshrota@gmail.com?subject=Account%20Deletion%20Request"
                        className="text-brand-blue hover:underline"
                      >
                        myshrota@gmail.com
                      </a>
                    </li>
                    <li>
                      <strong className="text-text-primary">Use the subject line:</strong> &quot;Account Deletion Request&quot;
                    </li>
                    <li>
                      <strong className="text-text-primary">Include in the email body:</strong>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li>Your registered email address</li>
                        <li>Your account username (if known)</li>
                        <li>Reason for deletion (optional)</li>
                      </ul>
                    </li>
                    <li>
                      <strong className="text-text-primary">Submit the request</strong> and wait for confirmation
                    </li>
                  </ol>
                  <div className="mt-6">
                    <a
                      href="mailto:myshrota@gmail.com?subject=Account%20Deletion%20Request&body=I%20would%20like%20to%20request%20deletion%20of%20my%20Shrota%20account.%0A%0ARegistered%20Email%3A%20%0AUsername%3A%20%0AReason%20(optional)%3A%20"
                      className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Request Account Deletion
                    </a>
                  </div>
                </div>

                {/* Data That Will Be Deleted */}
                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Data That Will Be Deleted</h2>
                  <p className="text-text-secondary mb-4">
                    Upon processing your deletion request, the following data will be permanently removed:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Personal information (name, email address, date of birth)</li>
                    <li>Address information (if provided)</li>
                    <li>Account preferences (language settings, genre preferences)</li>
                    <li>Listening history and progress</li>
                    <li>Liked books and favorites</li>
                    <li>Account credentials and login information</li>
                  </ul>
                </div>

                {/* Data That May Be Retained */}
                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Data That May Be Retained</h2>
                  <p className="text-text-secondary mb-4">
                    Some data may be retained for legal and compliance purposes:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>
                      <strong className="text-text-primary">Anonymized usage analytics:</strong> Non-identifiable, aggregated data used to improve our services
                    </li>
                    <li>
                      <strong className="text-text-primary">Transaction records:</strong> If applicable, retained for up to 7 years as required by tax and legal compliance regulations
                    </li>
                  </ul>
                </div>

                {/* Processing Timeline */}
                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Processing Timeline</h2>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Your request will be acknowledged within <strong className="text-text-primary">48 hours</strong></li>
                    <li>Account deletion will be completed within <strong className="text-text-primary">7 business days</strong></li>
                    <li>You will receive a confirmation email once the deletion is complete</li>
                  </ul>
                </div>

                {/* Important Notes */}
                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Important Notes</h2>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Account deletion is <strong className="text-text-primary">permanent and irreversible</strong></li>
                    <li>You will lose access to all your listening history and saved content</li>
                    <li>Any active subscriptions should be cancelled separately through your app store</li>
                    <li>You can create a new account at any time after deletion</li>
                  </ul>
                </div>

                {/* Contact Information */}
                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Contact Us</h2>
                  <p className="text-text-secondary mb-4">
                    If you have any questions about account deletion or your data, please contact us:
                  </p>
                  <div className="text-text-secondary space-y-2">
                    <p><strong className="text-text-primary">Email:</strong>{" "}
                      <a href="mailto:myshrota@gmail.com" className="text-brand-blue hover:underline">
                        myshrota@gmail.com
                      </a>
                    </p>
                    <p><strong className="text-text-primary">Privacy Policy:</strong>{" "}
                      <Link href="/privacy" className="text-brand-blue hover:underline">
                        View our Privacy Policy
                      </Link>
                    </p>
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
