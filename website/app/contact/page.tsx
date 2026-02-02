import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "Contact Us - Shrota",
  description: "Get in touch with Shrota. We'd love to hear from you!",
};

const contactInfo = [
  {
    title: "Email",
    value: "myshrota@gmail.com",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Website",
    value: "https://shrota.in",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
  {
    title: "Address",
    value: "Jijau Colony, Hanuman Nagar, Daund Road, Ahilyanagar, Maharashtra, India. Pin 414005",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const contactReasons = [
  "Technical support",
  "Content-related queries",
  "Partnerships and collaborations",
  "Career opportunities",
  "General inquiries",
];

export default function ContactPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-24 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-brand-blue/10 text-brand-blue-light text-sm font-medium mb-6 border border-brand-blue/20">
              Contact Us
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Get in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">
                Touch
              </span>
            </h1>
            <p className="text-text-secondary text-lg">
              We&apos;d love to hear from you! If you have any questions, feedback,
              support requests, partnership inquiries, or suggestions, please feel
              free to get in touch with us.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-bg-secondary">
        <Container>
          <FadeIn className="max-w-2xl mx-auto">
            <div className="bg-bg-card rounded-2xl p-8 md:p-12 border border-white/5">
              <h2 className="text-2xl font-bold mb-2 text-center">Shravanam Soft Solutions LLP</h2>
              <p className="text-text-secondary mb-8 text-center">
                Our team at Shrota is always happy to assist you. We aim to respond
                to all queries as quickly as possible.
              </p>

              <div className="space-y-6 mb-8">
                {contactInfo.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-blue/20 text-brand-blue-light flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm">
                        {item.title}
                      </p>
                      <p className="text-text-primary font-medium">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-bg-secondary rounded-xl border border-white/5">
                <p className="text-text-secondary text-sm mb-3">You can reach us via email for:</p>
                <ul className="space-y-2">
                  {contactReasons.map((reason) => (
                    <li key={reason} className="flex items-center gap-2 text-text-primary text-sm">
                      <svg className="w-4 h-4 text-brand-blue-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
