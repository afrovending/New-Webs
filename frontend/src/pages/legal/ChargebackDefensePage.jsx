import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  ArrowLeft, 
  Calendar, 
  Building2,
  FileText,
  ShieldAlert,
  RefreshCcw,
  Send,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

const ChargebackDefensePage = () => {
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
            <CreditCard className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Chargeback Defense Policy</h1>
              <p className="text-red-200 flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                Elite Marketplace Version - Last Updated: February 19, 2026
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
              This Chargeback Defense Policy is designed to protect AfroVending as a multi-vendor marketplace by reducing payment disputes, minimizing fraud risk, and improving success rates when responding to chargebacks through payment processors such as Stripe, PayPal, and credit card networks.
            </p>
          </div>

          {/* Section 1: Marketplace Structure */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-red-600" />
              1. Marketplace Structure and Role
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Understanding the structure of our marketplace is essential for chargeback defense:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Marketplace Facilitator:</strong> AfroVending operates as a marketplace facilitator connecting buyers and independent vendors</li>
              <li><strong>Vendor Responsibility:</strong> Vendors remain responsible for product fulfillment, shipping, and product accuracy</li>
              <li><strong>Platform Services:</strong> AfroVending provides transaction processing and dispute mediation</li>
              <li><strong>Clear Distinction:</strong> Clear distinction between platform and vendor responsibilities helps defend against chargebacks</li>
            </ul>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
              <p className="text-blue-800 text-sm">
                <strong>Important:</strong> This structure allows us to clearly demonstrate to payment processors that we operate as a facilitator, not the direct seller of products.
              </p>
            </div>
          </section>

          {/* Section 2: Documentation Requirements */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <FileText className="h-6 w-6 text-red-600" />
              2. Order Documentation Requirements
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Comprehensive documentation is crucial for defending against chargebacks:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Proof of Purchase:</strong> Maintain transaction ID and payment confirmation for all orders</li>
              <li><strong>Shipping Records:</strong> Store shipping confirmation and tracking numbers</li>
              <li><strong>Delivery Confirmation:</strong> Retain delivery confirmation when available</li>
              <li><strong>Communication Records:</strong> Keep all communication records between buyer and vendor for dispute evidence</li>
            </ul>
            
            <div className="bg-gray-100 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Documentation Retention Period:</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>Transaction records: 7 years</li>
                <li>Shipping/Delivery records: 3 years</li>
                <li>Communication logs: 2 years</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Fraud Prevention */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-600" />
              3. Fraud Prevention Measures
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement proactive measures to prevent fraudulent transactions:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Secure Checkout:</strong> Use secure checkout with verified payment processing (Stripe)</li>
              <li><strong>Behavior Monitoring:</strong> Monitor unusual purchasing behavior or high-risk transactions</li>
              <li><strong>Information Verification:</strong> Require accurate customer contact and shipping information</li>
              <li><strong>Manual Review:</strong> Flag suspicious orders for manual review when necessary</li>
            </ul>
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800">High-Risk Indicators</h4>
                <ul className="text-red-700 text-sm mt-2 space-y-1">
                  <li>Mismatched billing/shipping addresses</li>
                  <li>Multiple orders in short timeframe</li>
                  <li>Unusual order quantities</li>
                  <li>New account with large order</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800">Low-Risk Indicators</h4>
                <ul className="text-green-700 text-sm mt-2 space-y-1">
                  <li>Verified account with history</li>
                  <li>Consistent shipping address</li>
                  <li>Normal order patterns</li>
                  <li>Complete profile information</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: Refund and Dispute Handling */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <RefreshCcw className="h-6 w-6 text-red-600" />
              4. Refund and Dispute Handling Procedures
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our dispute handling process aims to resolve issues before they escalate to chargebacks:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Support First:</strong> Encourage customers to contact support before filing chargebacks</li>
              <li><strong>Investigation:</strong> Investigate claims using order records and tracking information</li>
              <li><strong>Clear Policies:</strong> Provide clear return and refund policies to reduce disputes</li>
              <li><strong>Mediation:</strong> Offer mediation between buyer and vendor to resolve issues quickly</li>
            </ul>
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mt-4">
              <p className="text-amber-800 text-sm">
                <strong>Customer Notice:</strong> If you have an issue with your order, please contact our support team first. We can often resolve issues faster than going through your bank, and you'll get a quicker resolution.
              </p>
            </div>
          </section>

          {/* Section 5: Chargeback Response Strategy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Send className="h-6 w-6 text-red-600" />
              5. Chargeback Response Strategy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              When chargebacks occur, we respond with comprehensive evidence:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Delivery Evidence:</strong> Submit delivery confirmation, tracking records, and proof of customer communication</li>
              <li><strong>Policy Compliance:</strong> Provide clear evidence that marketplace policies were followed</li>
              <li><strong>Order Documentation:</strong> Include screenshots or logs showing order approval and shipment</li>
              <li><strong>Timely Response:</strong> Respond within payment processor deadlines to maximize success rate</li>
            </ul>
            
            <div className="bg-gray-100 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Response Deadlines by Processor:</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                <li><strong>Stripe:</strong> 7-21 days depending on card network</li>
                <li><strong>PayPal:</strong> 10 days from dispute notification</li>
                <li><strong>Visa/Mastercard:</strong> 30 days (via Stripe)</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Customer Communication */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-red-600" />
              6. Customer Communication Standards
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Clear communication helps prevent disputes from escalating:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Shipping Timelines:</strong> Provide transparent shipping timelines and expectations at checkout</li>
              <li><strong>Delay Notifications:</strong> Notify customers immediately of any delays or issues</li>
              <li><strong>Documented Communication:</strong> Maintain polite and documented communication to support dispute defense</li>
            </ul>
          </section>

          {/* Section 7: Liability Protection */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              7. Liability Protection Notice
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Important information about marketplace liability:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Facilitator Status:</strong> AfroVending acts as a marketplace facilitator and may not be the direct seller</li>
              <li><strong>Vendor Responsibility:</strong> Vendor responsibility clauses reduce platform exposure during disputes</li>
              <li><strong>Compliance Standards:</strong> Policies are structured to align with payment processor compliance standards</li>
            </ul>
            
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-4">
              <p className="text-red-800 text-sm">
                <strong>Vendor Notice:</strong> Vendors are required to maintain accurate product listings and fulfill orders as described. Vendors may be held responsible for chargebacks resulting from product issues, shipping failures, or misrepresentation.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about chargebacks or dispute resolution:
            </p>
            <div className="bg-red-50 p-4 rounded-lg mt-4">
              <p className="text-red-800"><strong>Disputes Team</strong></p>
              <p className="text-red-700">Email: disputes@afrovending.com</p>
              <p className="text-red-700">Support: support@afrovending.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ChargebackDefensePage;
