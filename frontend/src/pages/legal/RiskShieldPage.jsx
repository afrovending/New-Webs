import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  ArrowLeft, 
  Calendar, 
  Users, 
  AlertTriangle, 
  FileCheck,
  Scale,
  Activity,
  CheckCircle,
  Target
} from 'lucide-react';

const RiskShieldPage = () => {
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
            <Shield className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Marketplace Risk Shield System</h1>
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
            <p className="text-red-800 font-medium">
              The AfroVending Risk Shield System is an advanced operational and legal framework designed to mitigate fraud, disputes, chargebacks, and operational risks across our multi-vendor marketplace.
            </p>
          </div>

          {/* Section 1: Overview */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Target className="h-6 w-6 text-red-600" />
              1. Risk Shield Overview
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our Risk Shield System integrates legal positioning, vendor controls, buyer protection, and automated safeguards to create a secure marketplace environment.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Dispute Prevention
                </h4>
                <p className="text-gray-600 text-sm mt-1">Clear policies and transparency to prevent issues before they occur</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Liability Separation
                </h4>
                <p className="text-gray-600 text-sm mt-1">Clearly defined platform vs. vendor responsibilities</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Trust Building
                </h4>
                <p className="text-gray-600 text-sm mt-1">Structured verification and communication protocols</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Scalable Safeguards
                </h4>
                <p className="text-gray-600 text-sm mt-1">Systems designed for marketplace growth</p>
              </div>
            </div>
          </section>

          {/* Section 2: Vendor Trust Scoring */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Users className="h-6 w-6 text-red-600" />
              2. Vendor Trust Scoring System
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We maintain a comprehensive vendor trust scoring system to ensure marketplace quality and reliability:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Fulfillment Tracking:</strong> Monitor vendor fulfillment speed and delivery reliability metrics</li>
              <li><strong>Dispute Monitoring:</strong> Track refund and dispute rates per vendor</li>
              <li><strong>Performance Ranking:</strong> Use performance metrics to rank vendor trust levels</li>
              <li><strong>Risk-Based Limits:</strong> Limit visibility or privileges for vendors exhibiting high-risk behavior</li>
            </ul>
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mt-4">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> Vendors with consistently poor performance may face reduced marketplace visibility, temporary suspension, or removal from the platform.
              </p>
            </div>
          </section>

          {/* Section 3: Fraud Prevention */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              3. Fraud Prevention Filters
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our platform employs multiple fraud detection and prevention mechanisms:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Order Analysis:</strong> Flag unusually large or repeated orders for review</li>
              <li><strong>Address Verification:</strong> Detect mismatched billing and shipping addresses</li>
              <li><strong>Enhanced Verification:</strong> Require additional verification for high-risk transactions</li>
              <li><strong>Location Monitoring:</strong> Monitor IP location inconsistencies and suspicious patterns</li>
            </ul>
          </section>

          {/* Section 4: Dispute Automation */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-red-600" />
              4. Dispute Automation Flow
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We have streamlined our dispute handling process for efficient resolution:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Support First:</strong> Encourage customers to contact support before initiating chargebacks</li>
              <li><strong>Automated Tickets:</strong> Automatic ticket creation when delivery issues are detected</li>
              <li><strong>Vendor Deadlines:</strong> Structured response deadlines for vendors to address issues</li>
              <li><strong>Evidence Collection:</strong> Automatic collection of evidence for dispute resolution</li>
            </ul>
          </section>

          {/* Section 5: Buyer Protection */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              5. Buyer Protection Layer
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our buyer protection measures ensure customer confidence:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Clear Timelines:</strong> Delivery timelines and expectations displayed during checkout</li>
              <li><strong>Policy Access:</strong> Easy access to return and refund policies</li>
              <li><strong>Transparent Communication:</strong> Clear communication channels between buyers and vendors</li>
              <li><strong>Escalation Path:</strong> Structured escalation process for unresolved issues</li>
            </ul>
            
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mt-4">
              <p className="text-green-800 text-sm">
                <strong>Buyer Assurance:</strong> If a vendor fails to resolve a legitimate issue, AfroVending will step in to mediate and ensure fair resolution.
              </p>
            </div>
          </section>

          {/* Section 6: Legal Positioning */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Scale className="h-6 w-6 text-red-600" />
              6. Legal Positioning and Liability Shield
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our legal framework protects all parties while maintaining clear accountability:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Facilitator Role:</strong> AfroVending operates as a marketplace facilitator rather than a direct seller</li>
              <li><strong>Vendor Liability:</strong> Vendors accept liability clauses in their agreements for their products and services</li>
              <li><strong>Dispute Resolution:</strong> Arbitration and dispute clauses to provide fair resolution processes</li>
              <li><strong>Compliance Alignment:</strong> Policies structured to meet payment processor requirements (Stripe, PayPal)</li>
            </ul>
          </section>

          {/* Section 7: Operational Monitoring */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Activity className="h-6 w-6 text-red-600" />
              7. Operational Risk Monitoring
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We continuously monitor marketplace operations to identify and address issues:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Refund Rate Tracking:</strong> Monitor high refund-rate products or categories</li>
              <li><strong>Shipping Analytics:</strong> Track shipping delays across vendors</li>
              <li><strong>Pattern Recognition:</strong> Use analytics to identify recurring problems</li>
              <li><strong>Proactive Communication:</strong> Reach out to customers when issues are detected</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">Questions About Our Risk Shield?</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about our Risk Shield System or how it protects you, please contact our support team:
            </p>
            <div className="bg-red-50 p-4 rounded-lg mt-4">
              <p className="text-red-800"><strong>Support Team</strong></p>
              <p className="text-red-700">Email: support@afrovending.com</p>
              <p className="text-red-700">Risk & Compliance: compliance@afrovending.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default RiskShieldPage;
