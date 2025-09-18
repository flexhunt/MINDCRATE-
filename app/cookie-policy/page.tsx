import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy | Mindcrate",
  description: "Understand how Mindcrate uses cookies and similar technologies to improve your experience.",
}

export default function CookiePolicyPage() {
  return (
    <div className="container max-w-4xl py-12 mx-auto">
      <div className="bg-card p-8 rounded-2xl shadow-sm">
        <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: September 10, 2025</p>

        {/* Quick Summary */}
        <div className="bg-muted p-4 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-2">Quick Summary</h2>
          <p className="text-muted-foreground">
            Mindcrate uses cookies to keep the site running smoothly, remember your preferences, analyze usage, and show relevant ads. You can manage or disable cookies in your browser settings at any time.
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <h2>What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help websites remember
            your actions and preferences to improve your browsing experience.
          </p>

          <h2>How We Use Cookies</h2>
          <ul className="list-disc pl-6">
            <li><strong>Essential:</strong> Required for the site to function (e.g., login, security).</li>
            <li><strong>Preferences:</strong> Remember your settings like theme, language, and region.</li>
            <li><strong>Analytics:</strong> Help us understand site usage and improve performance.</li>
            <li><strong>Marketing:</strong> Deliver relevant ads and measure their effectiveness.</li>
            <li><strong>Social Media:</strong> Enable sharing and integrations with platforms you use.</li>
          </ul>

          <h2>First-Party vs. Third-Party Cookies</h2>
          <p>
            <strong>First-party cookies</strong> are set by Mindcrate, while <strong>third-party cookies</strong> come
            from services we use (e.g., Google Analytics, AdSense, social media embeds).
          </p>

          <h2>Google Services</h2>
          <h3>Google Analytics</h3>
          <p>
            We use Google Analytics to track site performance. Learn more at{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Google Privacy Policy
            </a>.
          </p>

          <h3>Google AdSense</h3>
          <p>
            Google AdSense uses cookies to personalize ads. You can opt out at{" "}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Google Ads Policy
            </a>.
          </p>

          <h2>Managing Cookies</h2>
          <p>
            Most browsers let you control cookies. You can delete or block them, but doing so may affect site
            functionality.
          </p>

          <h2>Updates</h2>
          <p>
            We may update this Cookie Policy to reflect changes in technology, law, or our practices. Please check this
            page periodically.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have questions about our Cookie Policy, reach us at:
          </p>
          <p>
            📧 <a href="mailto:flexhunt1@gmail.com" className="text-primary hover:underline">flexhunt1@gmail.com</a><br />
            📞 +91 7706984182
          </p>
        </div>
      </div>
    </div>
  )
}
