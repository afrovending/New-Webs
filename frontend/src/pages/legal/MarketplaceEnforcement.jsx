import React from 'react';
import { Link } from 'react-router-dom';
import { Gavel, ArrowLeft, Calendar, AlertTriangle, ShieldCheck, Ban, Eye } from 'lucide-react';

const MarketplaceEnforcement = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/legal" className="inline-flex items-center text-indigo-200 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Legal
          </Link>
          <div className="flex items-center gap-4">
            <Gavel className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Marketplace Enforcement Rights</h1>
              <p className="text-indigo-200 flex items-center gap-2 mt-1">
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
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-8 rounded-r-lg">
            <p className="text-indigo-800 mb-0">
              To maintain a safe, fair, and trustworthy marketplace for all users, AfroVending reserves certain enforcement rights. This document outlines our authority to take action against policy violations and our commitment to marketplace integrity.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
              1. Our Commitment to Marketplace Integrity
            </h2>
            <p className="text-gray-700 leading-relaxed">
              AfroVending is committed to providing a marketplace where:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Buyers can shop with confidence, knowing they're protected</li>
              <li>Legitimate vendors can grow their businesses fairly</li>
              <li>African artisans and businesses can reach global markets</li>
              <li>Cultural authenticity and quality are valued</li>
              <li>Fraudulent activity is actively prevented and addressed</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Our enforcement rights enable us to uphold these values and protect our community.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">2. Enforcement Authority</h2>
            <p className="text-gray-700 leading-relaxed">
              AfroVending reserves the right, at our sole discretion, to:
            </p>
            
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-semibold text-gray-800">2.1 Content Removal</h4>
                <p className="text-gray-600 mt-2">
                  Remove, edit, or disable access to any content, listings, reviews, or other materials that violate our policies, without prior notice.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-semibold text-gray-800">2.2 Account Suspension</h4>
                <p className="text-gray-600 mt-2">
                  Temporarily or permanently suspend user accounts that engage in prohibited activities or repeatedly violate our policies.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-semibold text-gray-800">2.3 Fund Holds</h4>
                <p className="text-gray-600 mt-2">
                  Place holds on vendor payouts pending investigation of suspected fraud, chargebacks, or policy violations.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-semibold text-gray-800">2.4 Investigation</h4>
                <p className="text-gray-600 mt-2">
                  Investigate suspected violations, including reviewing transaction history, communications, and account activity.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-semibold text-gray-800">2.5 Cooperation with Authorities</h4>
                <p className="text-gray-600 mt-2">
                  Report illegal activity to law enforcement and cooperate with legal investigations as required by law.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Ban className="h-6 w-6 text-red-600" />
              3. Violations Subject to Enforcement
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.1 Severe Violations (Immediate Action)</h3>
            <p className="text-gray-700 leading-relaxed">
              The following may result in immediate account suspension or termination without warning:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Selling counterfeit, stolen, or illegal products</li>
              <li>Fraud or attempted fraud against buyers, sellers, or AfroVending</li>
              <li>Identity theft or impersonation</li>
              <li>Harassment, threats, or abusive behavior</li>
              <li>Circumventing platform systems or security measures</li>
              <li>Money laundering or financing illegal activities</li>
              <li>Selling prohibited items (weapons, drugs, etc.)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.2 Moderate Violations (Warning May Precede Action)</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Repeated late shipments or fulfillment failures</li>
              <li>Misleading product descriptions or images</li>
              <li>Excessive chargebacks or buyer complaints</li>
              <li>Manipulation of reviews or ratings</li>
              <li>Conducting transactions outside the platform</li>
              <li>Excessive returns due to product quality issues</li>
              <li>Creating multiple accounts to evade restrictions</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.3 Minor Violations (Warnings Issued First)</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Inaccurate inventory management</li>
              <li>Slow response to customer inquiries</li>
              <li>Minor policy infractions</li>
              <li>Listing optimization issues</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">4. Enforcement Process</h2>
            
            <div className="space-y-4 mt-4">
              <div className="flex gap-4 items-start">
                <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Detection</h4>
                  <p className="text-gray-600">
                    Violations are detected through automated systems, user reports, manual review, or external notifications.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Investigation</h4>
                  <p className="text-gray-600">
                    Our Trust & Safety team investigates the reported activity, reviewing relevant evidence and account history.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Decision</h4>
                  <p className="text-gray-600">
                    Based on the investigation, appropriate action is determined according to the severity and nature of the violation.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">4</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Notification</h4>
                  <p className="text-gray-600">
                    Users are notified of enforcement actions via email and in-platform notification (unless disclosure would compromise security or ongoing investigations).
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">5</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Appeal (if applicable)</h4>
                  <p className="text-gray-600">
                    Users may appeal certain enforcement decisions within 14 days of notification.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">5. Enforcement Actions</h2>
            
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="text-left p-3 border font-semibold">Action</th>
                    <th className="text-left p-3 border font-semibold">Description</th>
                    <th className="text-left p-3 border font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border font-medium">Warning</td>
                    <td className="p-3 border text-gray-600">Notification of policy violation with corrective guidance</td>
                    <td className="p-3 border text-gray-600">N/A</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border font-medium">Listing Removal</td>
                    <td className="p-3 border text-gray-600">Removal of specific product listings</td>
                    <td className="p-3 border text-gray-600">Permanent (can relist if issue fixed)</td>
                  </tr>
                  <tr>
                    <td className="p-3 border font-medium">Selling Restriction</td>
                    <td className="p-3 border text-gray-600">Temporary restriction on listing new products</td>
                    <td className="p-3 border text-gray-600">7-30 days</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border font-medium">Payout Hold</td>
                    <td className="p-3 border text-gray-600">Temporary hold on vendor earnings</td>
                    <td className="p-3 border text-gray-600">Until investigation complete</td>
                  </tr>
                  <tr>
                    <td className="p-3 border font-medium">Account Suspension</td>
                    <td className="p-3 border text-gray-600">Temporary deactivation of account access</td>
                    <td className="p-3 border text-gray-600">14-90 days</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border font-medium">Account Termination</td>
                    <td className="p-3 border text-gray-600">Permanent removal from the platform</td>
                    <td className="p-3 border text-gray-600">Permanent</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">6. Chargeback Defense Rights</h2>
            <p className="text-gray-700 leading-relaxed">
              AfroVending actively defends against fraudulent chargebacks. Our rights include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Retaining and using transaction records, tracking information, and communications as evidence</li>
              <li>Disputing chargebacks with payment processors on behalf of vendors</li>
              <li>Sharing relevant evidence with financial institutions</li>
              <li>Taking action against buyers who file fraudulent chargebacks</li>
              <li>Recovering funds from vendors in cases of legitimate chargebacks due to vendor fault</li>
            </ul>
            <div className="bg-amber-50 p-4 rounded-lg mt-4 border-l-4 border-amber-500">
              <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Evidence We Retain
              </h4>
              <ul className="list-disc pl-6 text-amber-700 mt-2 mb-0">
                <li>Shipping and delivery confirmations with tracking numbers</li>
                <li>Proof of delivery signatures</li>
                <li>Communication records between buyers and sellers</li>
                <li>Transaction timestamps and IP addresses</li>
                <li>Product photos and listing details at time of purchase</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Eye className="h-6 w-6 text-indigo-600" />
              7. Monitoring and Detection
            </h2>
            <p className="text-gray-700 leading-relaxed">
              To protect our marketplace, we employ various monitoring methods:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Automated Systems:</strong> AI and rule-based systems that detect suspicious patterns</li>
              <li><strong>User Reports:</strong> Reports from community members about policy violations</li>
              <li><strong>Manual Review:</strong> Human review of flagged accounts and listings</li>
              <li><strong>Third-Party Services:</strong> Fraud detection and identity verification services</li>
              <li><strong>Transaction Analysis:</strong> Review of transaction patterns and behaviors</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">8. Appeals Process</h2>
            <p className="text-gray-700 leading-relaxed">
              If you believe an enforcement action was made in error, you may appeal:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 space-y-2">
              <li>Submit an appeal within 14 days of the enforcement notification</li>
              <li>Provide any relevant evidence or explanation supporting your appeal</li>
              <li>Our Trust & Safety team will review your appeal within 5-7 business days</li>
              <li>You will be notified of the appeal decision via email</li>
              <li>Appeal decisions are final</li>
            </ol>
            <p className="text-gray-700 leading-relaxed mt-4">
              To submit an appeal, email <a href="mailto:appeals@afrovending.com" className="text-indigo-600 hover:underline">appeals@afrovending.com</a> with your account information and the details of your appeal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">9. Contact</h2>
            <div className="bg-indigo-50 p-4 rounded-lg mt-4">
              <p className="text-indigo-800"><strong>Trust & Safety Team</strong></p>
              <p className="text-indigo-700">Email: trust@afrovending.com</p>
              <p className="text-indigo-700">Appeals: appeals@afrovending.com</p>
              <p className="text-indigo-700">Report Abuse: report@afrovending.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default MarketplaceEnforcement;
