import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Our terms of service outline the rules and guidelines for using our website and services.",
}

export default function TermsOfServicePage() {
  return (
    <div className="container max-w-4xl py-12 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <div className="prose prose-lg max-w-none">
        <p>Last updated: June 10, 2025</p>

        <h2>1. Introduction</h2>
        <p>
          Welcome to our website. These Terms of Service ("Terms") govern your use of our website and services. By
          accessing or using our website, you agree to be bound by these Terms. If you disagree with any part of the
          Terms, you may not access the website.
        </p>

        <h2>2. Definitions</h2>
        <p>
          <strong>"Website"</strong> refers to our website, accessible from yourwebsite.com.
          <br />
          <strong>"Service"</strong> refers to the services provided through our Website.
          <br />
          <strong>"User"</strong> refers to individuals who access or use our Website or Service.
          <br />
          <strong>"Content"</strong> refers to text, images, videos, audio, and other materials displayed on our
          Website.
        </p>

        <h2>3. User Accounts</h2>
        <p>
          When you create an account with us, you must provide accurate, complete, and up-to-date information. You are
          responsible for safeguarding the password and for all activities that occur under your account. You agree to
          notify us immediately of any unauthorized use of your account or any other breach of security.
        </p>

        <h2>4. User Content</h2>
        <p>
          Our Service may allow you to post, link, store, share, and otherwise make available certain information, text,
          graphics, videos, or other material. You are responsible for the content you post and its legality,
          reliability, and appropriateness.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          The Website and its original content, features, and functionality are and will remain the exclusive property
          of our company and its licensors. The Website is protected by copyright, trademark, and other laws. Our
          trademarks and trade dress may not be used in connection with any product or service without our prior written
          consent.
        </p>

        <h2>6. Prohibited Uses</h2>
        <p>You agree not to use the Website or Service:</p>
        <ul>
          <li>In any way that violates any applicable law or regulation</li>
          <li>To transmit any material that is defamatory, offensive, or otherwise objectionable</li>
          <li>To impersonate or attempt to impersonate our company, an employee, another user, or any other person</li>
          <li>To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Website</li>
          <li>
            To attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Website
          </li>
        </ul>

        <h2>7. Limitation of Liability</h2>
        <p>
          In no event shall our company, its directors, employees, partners, agents, suppliers, or affiliates be liable
          for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss
          of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or
          inability to access or use the Website or Service.
        </p>

        <h2>8. Disclaimer</h2>
        <p>
          Your use of the Website and Service is at your sole risk. The Website and Service are provided on an "AS IS"
          and "AS AVAILABLE" basis. The Website and Service are provided without warranties of any kind, whether express
          or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular
          purpose, non-infringement, or course of performance.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of [Your Country], without regard to
          its conflict of law provisions.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We reserve the right to modify or replace these Terms at any time. By continuing to access or use our Website
          after those revisions become effective, you agree to be bound by the revised terms.
        </p>

        <h2>11. Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us at:</p>
        <p>
          Email: terms@yourwebsite.com
          <br />
          Address: 123 Main Street, City, Country
        </p>
      </div>
    </div>
  )
}
