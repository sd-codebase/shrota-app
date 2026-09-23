import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "Personnel Privacy Policy - Shrota",
  description: "How Shravanam Soft Solutions LLP handles personal data of employees, job applicants, and contributors.",
};

export default function PersonnelPrivacyPolicyPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Personnel Privacy Policy
            </h1>
            <p className="text-text-secondary text-lg mb-2">
              For employees, job applicants, and contributors of Shravanam Soft Solutions LLP
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
                    This Personnel Privacy Policy explains how Shravanam Soft Solutions LLP (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) collects, uses, and protects the personal data of our employees, job applicants, interns, and independent contributors such as writers and narrators who work with Shrota (collectively, &quot;Personnel&quot;). It is separate from our{" "}
                    <a href="/privacy" className="text-brand-blue hover:underline">Privacy Policy</a>, which covers app and website users.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">1. Scope</h2>
                  <p className="text-text-secondary">
                    This policy applies to individuals who apply for a role with us, are employed by us, or contribute content to Shrota as writers, narrators, or publishing partners (see our{" "}
                    <a href="/write-with-us" className="text-brand-blue hover:underline">Write With Us</a>{" "}
                    page).
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">2. Personal Data We Collect</h2>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>Contact details (name, phone number, email, address)</li>
                    <li>Identity and eligibility documents (e.g. ID proof, as required for employment or payment)</li>
                    <li>Bank/UPI details, for the purpose of paying salaries, fees, or writer/narrator earnings</li>
                    <li>Professional history, portfolio, or writing samples submitted during an application</li>
                    <li>Any other information you voluntarily provide to us in the course of working with Shrota</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">3. How We Use This Information</h2>
                  <ul className="list-disc list-inside text-text-secondary space-y-2">
                    <li>To evaluate job or contributor applications</li>
                    <li>To manage employment, payroll, and statutory compliance</li>
                    <li>To process payments owed to writers, narrators, and publishing partners</li>
                    <li>To communicate with you about your role or contribution</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">4. Sharing of Information</h2>
                  <p className="text-text-secondary">
                    We do not sell Personnel data. We may share it with payroll or payment processors, and with government or statutory authorities where required by law.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">5. Data Retention</h2>
                  <p className="text-text-secondary">
                    We retain Personnel data for as long as necessary to fulfil the purposes described above, and as required under applicable Indian labour and tax law, after which it is securely deleted or anonymized.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">6. Your Rights</h2>
                  <p className="text-text-secondary">
                    In accordance with India&apos;s Digital Personal Data Protection Act, 2023, you may request access to, correction of, or deletion of your personal data held by us, subject to our legal and contractual obligations. To exercise these rights, contact us using the details below.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">7. Data Security</h2>
                  <p className="text-text-secondary">
                    We take reasonable technical and organizational measures to protect Personnel data against unauthorized access, loss, or misuse.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4">8. Grievance &amp; Contact Information</h2>
                  <p className="text-text-secondary mb-4">
                    For any questions or grievances regarding this policy, contact:
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
