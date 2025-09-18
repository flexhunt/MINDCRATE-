import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "DMCA Policy | Mindcrate",
  description:
    "Read Mindcrate’s Digital Millennium Copyright Act (DMCA) policy and procedures for reporting copyright infringement.",
}

export default function DmcaPage() {
  return (
    <div className="container max-w-4xl py-12 mx-auto">
      <div className="bg-card p-8 rounded-2xl shadow-sm">
        <h1 className="text-4xl font-bold mb-4">DMCA Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: September 10, 2025</p>

        {/* Quick Summary */}
        <div className="bg-muted p-4 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-2">Quick Summary</h2>
          <p className="text-muted-foreground">
            Mindcrate respects intellectual property rights. If you believe your copyright is being
            infringed on our platform, you can submit a DMCA notice. If your content was wrongly
            removed, you can file a counter-notice.
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <h2>DMCA Notice</h2>
          <p>
            In accordance with the Digital Millennium Copyright Act of 1998 (“DMCA”), we will respond
            promptly to valid claims of copyright infringement reported to our designated agent.
          </p>

          <h2>DMCA Notice Requirements</h2>
          <p>
            If you are a copyright owner (or authorized agent), and you believe your work has been
            infringed, your notice must include:
          </p>
          <ol>
            <li>Your physical or electronic signature.</li>
            <li>Identification of the copyrighted work.</li>
            <li>
              Identification of the material claimed to be infringing and information to locate it.
            </li>
            <li>Your contact information (address, phone, email).</li>
            <li>
              A statement of good faith belief that the use is not authorized by the copyright owner,
              its agent, or the law.
            </li>
            <li>
              A statement, under penalty of perjury, that the information is accurate and you are
              authorized to act.
            </li>
          </ol>

          <h2>Where to Send DMCA Notices</h2>
          <p>
            Please send DMCA notices to our designated copyright agent:
          </p>
          <p>
            📩 <a href="mailto:flexhunt1@gmail.com" className="text-primary hover:underline">flexhunt1@gmail.com</a><br />
            📞 +91 7706984182
          </p>

          <h2>Counter-Notification</h2>
          <p>
            If your content was removed and you believe it is not infringing, you may submit a
            counter-notification including:
          </p>
          <ol>
            <li>Your physical or electronic signature.</li>
            <li>
              Identification of the removed content and its previous location on the platform.
            </li>
            <li>
              A statement of good faith belief that the content was removed due to mistake or
              misidentification.
            </li>
            <li>
              Your name, address, phone, and email, plus consent to the jurisdiction of the federal
              court in your district, and agreement to accept service of process.
            </li>
          </ol>

          <h2>Repeat Infringers</h2>
          <p>
            We may terminate or restrict accounts of repeat infringers. We may also take action
            against any account that infringes intellectual property rights, even without repeat
            violations.
          </p>

          <h2>Updates</h2>
          <p>
            We may update this DMCA Policy from time to time. Changes will be posted on this page,
            and continued use of Mindcrate after updates indicates acceptance.
          </p>

          <h2>Contact Us</h2>
          <p>
            For general questions about this policy, contact us at:
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
