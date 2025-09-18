import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Our privacy policy explains how we collect, use, and protect your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl py-12 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p>Last updated: June 10, 2025</p>

        <h2>Introduction</h2>
        <p>
          Welcome to our Privacy Policy. This document explains how we collect, use, and disclose your personal
          information when you use our website and services. We are committed to protecting your privacy and handling
          your data in an open and transparent manner.
        </p>

        <h2>Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul>
          <li>
            <strong>Personal Information:</strong> Name, email address, phone number, and other information you provide
            when creating an account or contacting us.
          </li>
          <li>
            <strong>Usage Data:</strong> Information about how you interact with our website, including pages visited,
            time spent, and actions taken.
          </li>
          <li>
            <strong>Device Information:</strong> Information about your device, including IP address, browser type,
            operating system, and device identifiers.
          </li>
          <li>
            <strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to
            enhance your experience and collect information about how you use our website.
          </li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use the information we collect for various purposes, including:</p>
        <ul>
          <li>Providing, maintaining, and improving our services</li>
          <li>Processing transactions and managing your account</li>
          <li>Communicating with you about our services, updates, and promotions</li>
          <li>Analyzing usage patterns to enhance user experience</li>
          <li>Protecting against fraud and unauthorized access</li>
          <li>Complying with legal obligations</li>
        </ul>

        <h2>Sharing Your Information</h2>
        <p>We may share your information with:</p>
        <ul>
          <li>
            <strong>Service Providers:</strong> Third-party companies that perform services on our behalf, such as
            payment processing, data analysis, and customer service.
          </li>
          <li>
            <strong>Business Partners:</strong> Companies with whom we collaborate to offer joint promotions or
            services.
          </li>
          <li>
            <strong>Legal Requirements:</strong> When required by law, court order, or governmental authority.
          </li>
          <li>
            <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.
          </li>
        </ul>

        <h2>Your Rights</h2>
        <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
        <ul>
          <li>Accessing and receiving a copy of your data</li>
          <li>Correcting inaccurate information</li>
          <li>Requesting deletion of your data</li>
          <li>Restricting or objecting to processing</li>
          <li>Data portability</li>
          <li>Withdrawing consent</li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information against
          unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the
          Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
        </p>

        <h2>Children's Privacy</h2>
        <p>
          Our services are not intended for children under the age of 13. We do not knowingly collect personal
          information from children under 13. If you are a parent or guardian and believe your child has provided us
          with personal information, please contact us.
        </p>

        <h2>Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
          Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy
          Policy periodically for any changes.
        </p>

        <h2>Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
        <p>
          Email: privacy@yourwebsite.com
          <br />
          Address: 123 Main Street, City, Country
        </p>
      </div>
    </div>
  )
}
