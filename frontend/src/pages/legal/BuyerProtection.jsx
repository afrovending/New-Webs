import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const BuyerProtection = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/legal" className="inline-flex items-center text-purple-200 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Legal
          </Link>
          <div className="flex items-center gap-4">
            <Shield className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Buyer Protection Policy</h1>
              <p className="text-purple-200 flex items-center gap-2 mt-1">
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
          
          {/* Trust Banner */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-8 rounded-r-lg">
            <h3 className="text-purple-800 font-bold text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Purchase is Protected
            </h3>
            <p className="text-purple-700 mt-2">
              At AfroVending, we're committed to ensuring every buyer has a safe and satisfying shopping experience. Our Buyer Protection Policy is designed to give you peace of mind when purchasing from our marketplace.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">1. What's Covered</h2>
            <p className="text-gray-700 leading-relaxed">Our Buyer Protection covers you in the following situations:</p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Item Not Received
                </h4>
                <p className="text-green-700 text-sm mt-2">
                  Your order doesn't arrive within the estimated delivery window, or tracking shows it was never shipped.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Item Not as Described
                </h4>
                <p className="text-green-700 text-sm mt-2">
                  The item received is significantly different from the listing description, photos, or specifications.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Damaged Items
                </h4>
                <p className="text-green-700 text-sm mt-2">
                  The item arrives damaged or defective through no fault of your own.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Wrong Item
                </h4>
                <p className="text-green-700 text-sm mt-2">
                  You receive an entirely different item than what you ordered.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">2. How to Report an Issue</h2>
            
            <div className="space-y-4 mt-4">
              <div className="flex gap-4 items-start">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Contact the Seller First</h4>
                  <p className="text-gray-600">
                    Before opening a dispute, we encourage you to message the seller through your order page. Many issues can be resolved quickly through direct communication.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Open a Case</h4>
                  <p className="text-gray-600">
                    If the seller doesn't respond within 48 hours or you can't reach a resolution, open a case through your Order History page by clicking "Report a Problem."
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Provide Evidence</h4>
                  <p className="text-gray-600">
                    Upload photos, screenshots, or other documentation supporting your claim. Clear evidence helps us resolve your case faster.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">4</div>
                <div>
                  <h4 className="font-semibold text-gray-800">AfroVending Review</h4>
                  <p className="text-gray-600">
                    Our team will review your case, communicate with both parties, and make a fair determination based on the evidence provided.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">3. Resolution Timeline</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-6 w-6 text-purple-600" />
                <h4 className="font-semibold text-gray-800">Expected Resolution Times</h4>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">Initial Response</td>
                    <td className="py-2 font-medium text-right">Within 24 hours</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">Seller Response Period</td>
                    <td className="py-2 font-medium text-right">3 business days</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">Investigation & Decision</td>
                    <td className="py-2 font-medium text-right">5-7 business days</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600">Refund Processing</td>
                    <td className="py-2 font-medium text-right">3-5 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">4. Resolution Options</h2>
            <p className="text-gray-700 leading-relaxed">Depending on your case, resolution may include:</p>
            <ul className="space-y-3 mt-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <strong>Full Refund:</strong> If the item was not received or was significantly not as described, you may receive a full refund including original shipping costs.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <strong>Partial Refund:</strong> For items received in less than perfect condition or with minor discrepancies, a partial refund may be appropriate.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <strong>Replacement:</strong> The seller may offer to send a replacement item at no additional cost.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <strong>Return for Refund:</strong> You may be required to return the item to receive a refund. Return shipping costs depend on the reason for return.
                </div>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">5. Eligibility Requirements</h2>
            <p className="text-gray-700 leading-relaxed">To be eligible for Buyer Protection, you must:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
              <li>Complete your purchase through the AfroVending platform</li>
              <li>Pay using an approved payment method (credit card, debit card, or AfroVending credit)</li>
              <li>Report the issue within <strong>30 days</strong> of the expected delivery date</li>
              <li>Provide accurate information and evidence supporting your claim</li>
              <li>Cooperate with our investigation process</li>
              <li>Not have violated our Terms of Service or abused the protection program</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">6. What's Not Covered</h2>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mt-4">
              <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Exclusions
              </h4>
              <ul className="list-disc pl-6 text-amber-700 space-y-1 mt-2">
                <li>Buyer's remorse or change of mind after purchase</li>
                <li>Items that match the listing description but don't meet personal expectations</li>
                <li>Transactions conducted outside AfroVending's platform</li>
                <li>Issues reported more than 30 days after expected delivery</li>
                <li>Damage caused by buyer after receipt</li>
                <li>Items prohibited by our Terms of Service</li>
                <li>Customs duties, import taxes, or fees</li>
                <li>Items correctly marked as "final sale" or "non-returnable"</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">7. Abuse Prevention</h2>
            <p className="text-gray-700 leading-relaxed">
              To ensure fairness for all users, we monitor for abuse of our Buyer Protection program. Patterns of abuse may result in:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
              <li>Denial of protection claims</li>
              <li>Temporary suspension of buying privileges</li>
              <li>Permanent account termination in severe cases</li>
              <li>Recovery of refunds issued based on false claims</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">8. Chargebacks</h2>
            <p className="text-gray-700 leading-relaxed">
              If you file a chargeback with your bank or credit card company while a case is open with us, your AfroVending case will be closed. We encourage you to use our resolution process first, as it's often faster and preserves your relationship with the seller. Filing a fraudulent chargeback may result in account suspension.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">9. Contact Us</h2>
            <div className="bg-purple-50 p-4 rounded-lg mt-4">
              <p className="text-purple-800"><strong>Buyer Support Team</strong></p>
              <p className="text-purple-700">Email: support@afrovending.com</p>
              <p className="text-purple-700">Help Center: afrovending.com/help</p>
              <p className="text-purple-700 mt-2 text-sm">Response time: Within 24 hours</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default BuyerProtection;
