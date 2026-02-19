import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowLeft, Calendar, CheckCircle, AlertTriangle, Ban } from 'lucide-react';

const VendorAgreement = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/legal" className="inline-flex items-center text-green-200 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Legal
          </Link>
          <div className="flex items-center gap-4">
            <Users className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Vendor Agreement</h1>
              <p className="text-green-200 flex items-center gap-2 mt-1">
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
          
          {/* Important Notice */}
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8 rounded-r-lg">
            <p className="text-green-800 font-medium">
              This Vendor Agreement ("Agreement") is a legally binding contract between you ("Vendor," "Seller," or "you") and AfroVending. By registering as a Vendor, you agree to comply with all terms outlined herein.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">1. Vendor Eligibility and Registration</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">1.1 Eligibility Requirements</h3>
            <p className="text-gray-700 leading-relaxed">To become a Vendor on AfroVending, you must:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Be at least 18 years of age or the legal age of majority in your jurisdiction</li>
              <li>Have the legal capacity to enter into a binding agreement</li>
              <li>Provide accurate business and tax information</li>
              <li>Complete identity verification through our designated provider (Stripe Identity)</li>
              <li>Have a valid bank account capable of receiving international payments</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">1.2 Account Verification</h3>
            <p className="text-gray-700 leading-relaxed">
              Vendors must complete our verification process, which includes government-issued ID verification, bank account verification, and tax information submission. Unverified vendors may have limited functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">2. Vendor Responsibilities</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg my-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                2.1 Product Quality and Accuracy
              </h3>
              <p className="text-gray-700 mt-2">Vendors are solely responsible for:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                <li>Ensuring all products meet stated quality standards</li>
                <li>Providing accurate, complete, and non-misleading product descriptions</li>
                <li>Using authentic product images that accurately represent the items</li>
                <li>Maintaining accurate inventory and stock levels</li>
                <li>Ensuring products comply with all applicable safety standards</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg my-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                2.2 Legal Compliance
              </h3>
              <p className="text-gray-700 mt-2">Vendors must comply with:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                <li>All applicable local, national, and international laws</li>
                <li>Consumer protection regulations in all jurisdictions where products are sold</li>
                <li>Import/export laws and customs regulations</li>
                <li>Intellectual property laws (no counterfeit or unauthorized products)</li>
                <li>Tax obligations including collection and remittance of applicable taxes</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg my-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                2.3 Order Fulfillment
              </h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                <li>Process orders within stated handling times (typically 1-3 business days)</li>
                <li>Ship products using reliable carriers with tracking information</li>
                <li>Provide accurate shipping estimates and delivery timeframes</li>
                <li>Package items securely to prevent damage during transit</li>
                <li>Communicate promptly with buyers regarding order status</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">3. Prohibited Products and Practices</h2>
            
            <div className="bg-red-50 p-4 rounded-lg my-4 border-l-4 border-red-500">
              <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                <Ban className="h-5 w-5" />
                3.1 Prohibited Products
              </h3>
              <p className="text-red-700 mt-2">The following products are strictly prohibited:</p>
              <ul className="list-disc pl-6 text-red-700 space-y-1 mt-2">
                <li>Counterfeit, replica, or unauthorized branded products</li>
                <li>Illegal drugs, controlled substances, or drug paraphernalia</li>
                <li>Weapons, ammunition, or explosives</li>
                <li>Stolen property or goods obtained illegally</li>
                <li>Products made from endangered or protected species</li>
                <li>Hazardous materials without proper certification</li>
                <li>Products that infringe intellectual property rights</li>
                <li>Adult content or services (unless in designated categories)</li>
              </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg my-4 border-l-4 border-amber-500">
              <h3 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                3.2 Prohibited Practices
              </h3>
              <ul className="list-disc pl-6 text-amber-700 space-y-1 mt-2">
                <li>Manipulating reviews, ratings, or feedback</li>
                <li>Creating multiple accounts to circumvent restrictions</li>
                <li>Conducting transactions outside the platform</li>
                <li>Misrepresenting product origin, materials, or authenticity</li>
                <li>Price gouging or deceptive pricing practices</li>
                <li>Spam, unsolicited communications, or harassment</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">4. Fees and Payments</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">4.1 Commission Structure</h3>
            <p className="text-gray-700 leading-relaxed">
              AfroVending charges a commission on each completed sale. The current commission rate is <strong>15%</strong> of the product sale price (excluding shipping). Commission rates may vary based on subscription tier and product category.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">4.2 Payment Processing</h3>
            <p className="text-gray-700 leading-relaxed">
              Payments are processed through Stripe Connect. Vendors must complete Stripe onboarding including bank account verification. Payment processing fees apply as per Stripe's fee schedule.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">4.3 Payout Schedule</h3>
            <p className="text-gray-700 leading-relaxed">
              Vendor earnings are paid out according to configured payout settings. Options include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Weekly payouts (default)</li>
              <li>Bi-weekly payouts</li>
              <li>Monthly payouts</li>
              <li>Manual payout requests (minimum $10)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              Payouts are subject to a holding period to allow for dispute resolution and chargeback processing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">5. Returns and Refunds</h2>
            <p className="text-gray-700 leading-relaxed">
              Vendors must maintain a fair return and refund policy that complies with applicable consumer protection laws. At minimum, vendors must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Accept returns for defective or misrepresented products</li>
              <li>Process refunds within 5-7 business days of receiving returned items</li>
              <li>Clearly communicate return policies in product listings</li>
              <li>Participate in AfroVending's dispute resolution process when required</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">6. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              Vendors agree to indemnify, defend, and hold harmless AfroVending, its officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Products sold by the Vendor</li>
              <li>Vendor's breach of this Agreement</li>
              <li>Vendor's violation of any applicable laws</li>
              <li>Vendor's infringement of third-party rights</li>
              <li>Any disputes between Vendor and Buyers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">7. Termination</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">7.1 Termination by Vendor</h3>
            <p className="text-gray-700 leading-relaxed">
              Vendors may terminate this Agreement at any time by closing their account. Outstanding orders must be fulfilled, and pending transactions will be completed according to their terms.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">7.2 Termination by AfroVending</h3>
            <p className="text-gray-700 leading-relaxed">
              AfroVending may suspend or terminate Vendor accounts immediately for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Violation of this Agreement or Terms of Service</li>
              <li>Fraudulent activity or suspected fraud</li>
              <li>Excessive chargebacks or disputes</li>
              <li>Failure to maintain quality standards</li>
              <li>Legal or regulatory requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">8. Amendments</h2>
            <p className="text-gray-700 leading-relaxed">
              AfroVending reserves the right to modify this Agreement at any time. Vendors will be notified of material changes via email and/or platform notification at least 30 days before the changes take effect. Continued use of the platform after the effective date constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">9. Contact</h2>
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <p className="text-gray-700"><strong>Vendor Support</strong></p>
              <p className="text-gray-700">Email: vendors@afrovending.com</p>
              <p className="text-gray-700">Vendor Portal: afrovending.com/vendor</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default VendorAgreement;
