import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ArrowLeft, Calendar, AlertTriangle, Info } from 'lucide-react';

const LiabilityLimitations = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/legal" className="inline-flex items-center text-orange-200 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Legal
          </Link>
          <div className="flex items-center gap-4">
            <Scale className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Liability Limitations</h1>
              <p className="text-orange-200 flex items-center gap-2 mt-1">
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
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-800 mt-0">Important Legal Notice</h3>
                <p className="text-amber-700 mt-2 mb-0">
                  This document outlines the limitations of liability for AfroVending as a marketplace platform. Please read carefully to understand the scope of our responsibilities and yours as a user.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">1. Platform Role Clarification</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>AfroVending operates as a marketplace facilitator, not a retailer.</strong> We provide the technology platform that connects independent vendors (sellers) with buyers. Understanding this distinction is crucial to understanding our liability limitations.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                <Info className="h-5 w-5" />
                What This Means
              </h4>
              <ul className="list-disc pl-6 text-blue-700 space-y-1 mt-2 mb-0">
                <li>We do not manufacture, own, or inspect products sold on our platform</li>
                <li>We do not warehouse or ship products (unless using our fulfillment service)</li>
                <li>The sales contract is directly between the buyer and seller</li>
                <li>We facilitate, but are not a party to, individual transactions</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">2. Product-Related Liability</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4">2.1 Manufacturing Defects</h3>
            <p className="text-gray-700 leading-relaxed">
              AfroVending is <strong>not liable</strong> for manufacturing defects, product quality issues, or safety concerns with products sold by third-party vendors. Vendors bear full responsibility for the products they list and sell.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">2.2 Product Descriptions</h3>
            <p className="text-gray-700 leading-relaxed">
              We do not verify the accuracy of product listings. Vendors are solely responsible for ensuring their listings are accurate, complete, and not misleading. While we may remove clearly fraudulent listings, we do not guarantee the accuracy of any listing.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">2.3 Product Safety</h3>
            <p className="text-gray-700 leading-relaxed">
              We do not test products for safety compliance. Vendors must ensure their products comply with all applicable safety standards and regulations. AfroVending disclaims liability for injuries or damages caused by unsafe products.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">3. Shipping and Delivery Liability</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.1 Shipping Delays</h3>
            <p className="text-gray-700 leading-relaxed">
              AfroVending is <strong>not liable</strong> for delays caused by:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Shipping carriers (FedEx, UPS, DHL, national postal services, etc.)</li>
              <li>Weather events, natural disasters, or force majeure</li>
              <li>Customs inspections or import/export procedures</li>
              <li>Incorrect shipping addresses provided by buyers</li>
              <li>Failed delivery attempts due to recipient unavailability</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.2 Lost or Damaged Shipments</h3>
            <p className="text-gray-700 leading-relaxed">
              Responsibility for lost or damaged shipments lies with the shipping carrier and/or the vendor. Buyers should contact the vendor first, then file a claim under our Buyer Protection Policy if the vendor is unresponsive.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.3 Customs and Duties</h3>
            <p className="text-gray-700 leading-relaxed">
              AfroVending is not responsible for customs duties, import taxes, or fees imposed by destination countries. These charges are the responsibility of the buyer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">4. User Conduct Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              AfroVending is <strong>not liable</strong> for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Actions, omissions, or conduct of any user (buyer or seller)</li>
              <li>User-generated content, including reviews, messages, and listings</li>
              <li>Disputes between users that arise outside our platform</li>
              <li>Fraud committed by users against other users</li>
              <li>Misuse of products by buyers after purchase</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">5. Disclaimer of Warranties</h2>
            <div className="bg-gray-100 p-4 rounded-lg border-l-4 border-gray-500">
              <p className="text-gray-800 font-mono text-sm leading-relaxed mb-0">
                THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mt-4">
              We do not warrant that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>The Services will be uninterrupted, secure, or error-free</li>
              <li>Any defects will be corrected</li>
              <li>Products purchased will meet your expectations</li>
              <li>Results obtained from using the Services will be accurate or reliable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">6. Limitation of Damages</h2>
            <div className="bg-gray-100 p-4 rounded-lg border-l-4 border-gray-500">
              <p className="text-gray-800 font-mono text-sm leading-relaxed mb-0">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL AFROVENDING BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className="list-disc pl-6 text-gray-800 font-mono text-sm mt-2 mb-0">
                <li>YOUR ACCESS TO OR USE OF (OR INABILITY TO USE) THE SERVICES</li>
                <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES</li>
                <li>ANY PRODUCTS PURCHASED THROUGH THE SERVICES</li>
                <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR DATA</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">7. Maximum Liability Cap</h2>
            <p className="text-gray-700 leading-relaxed">
              In jurisdictions that do not allow the exclusion or limitation of liability for certain damages, our liability shall be limited to the maximum extent permitted by law.
            </p>
            <div className="bg-orange-50 p-4 rounded-lg mt-4 border-l-4 border-orange-500">
              <p className="text-orange-800 font-semibold">
                In no event shall AfroVending's total liability to you for all claims exceed the greater of:
              </p>
              <ul className="list-disc pl-6 text-orange-700 mt-2 mb-0">
                <li>The amount you paid to AfroVending in the past 12 months, OR</li>
                <li>One hundred U.S. dollars ($100.00)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">8. User Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify, defend, and hold harmless AfroVending and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Your use of the Services</li>
              <li>Your violation of these Terms or any applicable law</li>
              <li>Your violation of any third-party rights</li>
              <li>Any content you post or submit</li>
              <li>Your conduct in connection with the Services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">9. Force Majeure</h2>
            <p className="text-gray-700 leading-relaxed">
              AfroVending shall not be liable for any failure or delay in performing our obligations where such failure or delay results from circumstances beyond our reasonable control, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Natural disasters, acts of God, or severe weather</li>
              <li>War, terrorism, civil unrest, or government actions</li>
              <li>Epidemics, pandemics, or public health emergencies</li>
              <li>Infrastructure failures (power, internet, telecommunications)</li>
              <li>Third-party service provider failures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">10. Severability</h2>
            <p className="text-gray-700 leading-relaxed">
              If any provision of these liability limitations is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">11. Questions</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these liability limitations, please contact our legal team:
            </p>
            <div className="bg-orange-50 p-4 rounded-lg mt-4">
              <p className="text-orange-800"><strong>Legal Department</strong></p>
              <p className="text-orange-700">Email: legal@afrovending.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default LiabilityLimitations;
