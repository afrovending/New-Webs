import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft, Calendar, Eye, Database, Shield, Globe } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/legal" className="inline-flex items-center text-red-200 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Legal
          </Link>
          <div className="flex items-center gap-4">
            <Lock className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-red-200 flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                Last Updated: February 19, 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 prose prose-gray max-w-none">
          
          {/* Introduction */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg">
            <p className="text-red-800">
              AfroVending ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our marketplace platform.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Eye className="h-6 w-6 text-red-600" />
              1. Information We Collect
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4">1.1 Information You Provide</h3>
            <p className="text-gray-700 leading-relaxed">We collect information you voluntarily provide, including:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, password, phone number</li>
              <li><strong>Profile Information:</strong> Profile picture, bio, location preferences</li>
              <li><strong>Vendor Information:</strong> Business name, tax ID (last 4 digits only), bank account details, government ID for verification</li>
              <li><strong>Transaction Data:</strong> Shipping addresses, billing information, purchase history</li>
              <li><strong>Communications:</strong> Messages between buyers and sellers, customer support inquiries</li>
              <li><strong>Content:</strong> Product listings, reviews, photos you upload</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">1.2 Information Collected Automatically</h3>
            <p className="text-gray-700 leading-relaxed">When you use our Services, we automatically collect:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent, clicks, search queries</li>
              <li><strong>Location Data:</strong> General location based on IP address, precise location if you enable it</li>
              <li><strong>Cookies and Tracking:</strong> Session cookies, preference cookies, analytics cookies</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">1.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Payment Processors:</strong> Transaction status and fraud signals from Stripe</li>
              <li><strong>Identity Verification:</strong> Verification results from Stripe Identity</li>
              <li><strong>Social Login:</strong> Basic profile information if you sign in with Google</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Database className="h-6 w-6 text-red-600" />
              2. How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed">We use collected information to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process transactions and send related information</li>
              <li>Verify vendor identities and prevent fraud</li>
              <li>Communicate with you about orders, updates, and promotions</li>
              <li>Respond to customer service requests</li>
              <li>Personalize your experience and show relevant products</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Comply with legal obligations</li>
              <li>Enforce our Terms of Service and protect our rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Globe className="h-6 w-6 text-red-600" />
              3. How We Share Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed">We may share your information with:</p>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.1 Other Users</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Sellers see buyer's name, shipping address, and order details</li>
              <li>Buyers see seller's store name, location, and public profile</li>
              <li>Reviews and ratings are publicly visible</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.2 Service Providers</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Payment Processing:</strong> Stripe (for transactions and payouts)</li>
              <li><strong>Cloud Services:</strong> MongoDB Atlas (database), Cloudinary (image hosting)</li>
              <li><strong>Email Services:</strong> SendGrid (transactional emails)</li>
              <li><strong>Analytics:</strong> Tools to understand usage patterns</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.3 Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed">
              We may disclose information if required by law, subpoena, or government request, or to protect our rights, property, or safety.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.4 Business Transfers</h3>
            <p className="text-gray-700 leading-relaxed">
              In connection with a merger, acquisition, or sale of assets, user information may be transferred to the acquiring entity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              4. Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure payment processing through PCI-compliant providers</li>
              <li>Regular security assessments and vulnerability testing</li>
              <li>Access controls and authentication requirements</li>
              <li>Employee training on data protection</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Note:</strong> No method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">5. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide our Services and fulfill transactions</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Account information is retained for 7 years after account closure for legal and audit purposes. Transaction records are retained for 10 years.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">6. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed">Depending on your location, you may have the right to:</p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Access</h4>
                <p className="text-gray-600 text-sm">Request a copy of your personal data</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Correction</h4>
                <p className="text-gray-600 text-sm">Update inaccurate or incomplete data</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Deletion</h4>
                <p className="text-gray-600 text-sm">Request deletion of your data (with exceptions)</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Portability</h4>
                <p className="text-gray-600 text-sm">Receive your data in a portable format</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Opt-Out</h4>
                <p className="text-gray-600 text-sm">Unsubscribe from marketing emails</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Restriction</h4>
                <p className="text-gray-600 text-sm">Limit how we use your data</p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@afrovending.com" className="text-red-600 hover:underline">privacy@afrovending.com</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">7. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Keep you logged in and remember your preferences</li>
              <li>Understand how you use our Services</li>
              <li>Show relevant products and advertisements</li>
              <li>Measure the effectiveness of marketing campaigns</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You can manage cookie preferences through your browser settings. Note that disabling cookies may affect functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">8. International Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              AfroVending operates globally. Your information may be transferred to and processed in countries other than your own, including the United States. We ensure appropriate safeguards are in place for such transfers, including standard contractual clauses and data processing agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">9. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Services are not intended for children under 18. We do not knowingly collect personal information from children. If we learn that we have collected information from a child, we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">10. California Privacy Rights (CCPA)</h2>
            <p className="text-gray-700 leading-relaxed">
              California residents have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Right to know what personal information is collected, used, shared, or sold</li>
              <li>Right to delete personal information (with exceptions)</li>
              <li>Right to opt-out of sale of personal information (we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising privacy rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">11. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last Updated" date. For significant changes, we may also send you an email notification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-red-50 p-4 rounded-lg mt-4">
              <p className="text-red-800"><strong>Privacy Team</strong></p>
              <p className="text-red-700">Email: privacy@afrovending.com</p>
              <p className="text-red-700">Data Protection Officer: dpo@afrovending.com</p>
              <p className="text-red-700">Address: 123 Marketplace Drive, Wilmington, DE 19801, USA</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
