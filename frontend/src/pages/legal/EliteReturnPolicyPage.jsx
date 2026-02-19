import React from 'react';
import { Link } from 'react-router-dom';
import { 
  RotateCcw, 
  ArrowLeft, 
  Calendar, 
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  FileQuestion,
  Users,
  Wallet,
  Truck,
  Scale,
  AlertTriangle
} from 'lucide-react';

const EliteReturnPolicyPage = () => {
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
            <RotateCcw className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Elite Marketplace Return Policy</h1>
              <p className="text-red-200 flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                Legal-Optimized Version - Last Updated: February 19, 2026
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
              This Return Policy governs returns for AfroVending, a multi-vendor marketplace. Our policy balances robust buyer protection with essential legal safeguards, following successful marketplace models like Amazon and Etsy.
            </p>
          </div>

          {/* Section 1: Marketplace Structure */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-red-600" />
              1. Marketplace Structure
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Understanding our marketplace structure is important for the return process:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Facilitator Role:</strong> AfroVending acts as an intermediary connecting buyers and independent vendors</li>
              <li><strong>Vendor Responsibility:</strong> Vendors are directly responsible for their products and order fulfillment</li>
              <li><strong>Platform Support:</strong> AfroVending provides platform services and dispute mediation</li>
            </ul>
          </section>

          {/* Section 2: Return Eligibility */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-red-600" />
              2. Return Eligibility
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You may be eligible for a return if your item meets one of the following conditions:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Damaged or Defective
                </h4>
                <p className="text-green-700 text-sm mt-1">Item arrives damaged or with manufacturing defects</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Incorrect Item
                </h4>
                <p className="text-green-700 text-sm mt-1">You received an item different from what you ordered</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Not as Described
                </h4>
                <p className="text-green-700 text-sm mt-1">Item significantly differs from the product listing</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Non-Delivery
                </h4>
                <p className="text-green-700 text-sm mt-1">Item not received after delivery investigation</p>
              </div>
            </div>
          </section>

          {/* Section 3: Return Window */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Clock className="h-6 w-6 text-red-600" />
              3. Return Window
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Return requests must be submitted within the specified timeframe:
            </p>
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-amber-800 text-lg">Standard Return Window: 7-14 Days</h4>
              <p className="text-amber-700 mt-2">
                Returns must be requested within <strong>7-14 days from confirmed delivery</strong>. Individual product listings may specify different terms, so please check the product page for specific return windows.
              </p>
            </div>
          </section>

          {/* Section 4: Non-Returnable Items */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-600" />
              4. Non-Returnable Items
            </h2>
            <p className="text-gray-700 leading-relaxed">
              The following categories are generally not eligible for returns:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Perishable Goods
                </h4>
                <p className="text-red-700 text-sm mt-1">Food items and products with expiration dates</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Custom Products
                </h4>
                <p className="text-red-700 text-sm mt-1">Made-to-order or personalized items</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Personal Care Items
                </h4>
                <p className="text-red-700 text-sm mt-1">Opened hygiene or personal care products</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Digital Products
                </h4>
                <p className="text-red-700 text-sm mt-1">Downloadable content and digital goods</p>
              </div>
            </div>
          </section>

          {/* Section 5: Return Request Process */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <FileQuestion className="h-6 w-6 text-red-600" />
              5. Return Request Process
            </h2>
            <p className="text-gray-700 leading-relaxed">
              To initiate a return, follow these steps:
            </p>
            
            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Contact Support</h4>
                  <p className="text-gray-600 text-sm">Contact AfroVending support with your order number</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Provide Reason</h4>
                  <p className="text-gray-600 text-sm">Explain the reason for your return request</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Upload Evidence</h4>
                  <p className="text-gray-600 text-sm">Provide photo evidence when applicable (damaged items, incorrect products)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Vendor Responsibilities */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Users className="h-6 w-6 text-red-600" />
              6. Vendor Responsibilities
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Vendors on our platform are obligated to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li><strong>Accurate Descriptions:</strong> Provide accurate product descriptions, images, and specifications</li>
              <li><strong>Secure Shipping:</strong> Ship items securely and on time with proper packaging</li>
              <li><strong>Respond Promptly:</strong> Respond to approved return requests within 48 hours</li>
              <li><strong>Policy Compliance:</strong> Adhere to AfroVending marketplace standards and policies</li>
            </ul>
          </section>

          {/* Section 7: Refund Handling */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Wallet className="h-6 w-6 text-red-600" />
              7. Refund Handling
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Once your return is approved:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li>Refunds are processed after return approval or investigation completion</li>
              <li>Processing time: <strong>3-10 business days</strong> depending on your payment provider</li>
              <li>Refunds are issued to the original payment method</li>
              <li>You will receive email confirmation when the refund is processed</li>
            </ul>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Bank processing times vary. Credit card refunds typically appear within 5-7 business days, while bank transfers may take up to 10 business days.
              </p>
            </div>
          </section>

          {/* Section 8: Return Shipping Costs */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Truck className="h-6 w-6 text-red-600" />
              8. Return Shipping Costs
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Return shipping cost responsibility depends on the reason for return:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-800">Vendor Covers Shipping</h4>
                <ul className="text-green-700 text-sm mt-2 space-y-1">
                  <li>Defective or damaged items</li>
                  <li>Incorrect item sent</li>
                  <li>Item not as described</li>
                </ul>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
                <h4 className="font-semibold text-amber-800">Customer May Cover Shipping</h4>
                <ul className="text-amber-700 text-sm mt-2 space-y-1">
                  <li>Change of mind</li>
                  <li>Ordered by mistake</li>
                  <li>No longer needed</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 9: Dispute Resolution */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Scale className="h-6 w-6 text-red-600" />
              9. Dispute Resolution
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If there's a disagreement about a return:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li>AfroVending will mediate disputes between buyers and vendors</li>
              <li>Decisions are based on evidence, policies, and fairness guidelines</li>
              <li>Both parties will be given opportunity to present their case</li>
              <li>Final decisions are made by our dispute resolution team</li>
            </ul>
          </section>

          {/* Section 10: Marketplace Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              10. Marketplace Liability Notice
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Important information about marketplace liability:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li>AfroVending acts as a facilitator, not the direct seller</li>
              <li>Vendors remain responsible for product quality and fulfillment</li>
              <li>The platform provides mediation and support services</li>
            </ul>
            
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-4">
              <p className="text-red-800 text-sm">
                <strong>Disclaimer:</strong> While we strive to protect all buyers, AfroVending's liability is limited to facilitating dispute resolution and enforcing vendor compliance with our policies.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">Need Help With a Return?</h2>
            <p className="text-gray-700 leading-relaxed">
              Our support team is here to help with your return requests:
            </p>
            <div className="bg-red-50 p-4 rounded-lg mt-4">
              <p className="text-red-800"><strong>Returns & Support Team</strong></p>
              <p className="text-red-700">Email: returns@afrovending.com</p>
              <p className="text-red-700">General Support: support@afrovending.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default EliteReturnPolicyPage;
