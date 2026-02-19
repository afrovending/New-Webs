import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, Calendar } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/legal" className="inline-flex items-center text-blue-200 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Legal
          </Link>
          <div className="flex items-center gap-4">
            <FileText className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-blue-200 flex items-center gap-2 mt-1">
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
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">1. Introduction and Acceptance</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to AfroVending ("Platform," "we," "us," or "our"). These Terms of Service ("Terms") govern your access to and use of the AfroVending marketplace, including our website, mobile applications, and all related services (collectively, the "Services").
            </p>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services. We may modify these Terms at any time, and such modifications will be effective immediately upon posting. Your continued use of the Services following any modifications indicates your acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">2. Platform Role and Relationship</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">2.1 Marketplace Facilitator</h3>
            <p className="text-gray-700 leading-relaxed">
              AfroVending operates as an online marketplace connecting independent vendors ("Sellers") and buyers ("Buyers") for the sale and purchase of products, primarily African and African-inspired goods. We act as a facilitator of transactions between Sellers and Buyers.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">2.2 Not a Party to Transactions</h3>
            <p className="text-gray-700 leading-relaxed">
              AfroVending is not the seller of products listed on the Platform. We do not own, manufacture, store, or inspect the products sold by Sellers. The contract for the sale of products is directly between the Seller and the Buyer. We are not a party to that contract and have no obligations arising from it, except as expressly provided in these Terms.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">2.3 No Endorsement</h3>
            <p className="text-gray-700 leading-relaxed">
              The listing of a product on the Platform does not constitute an endorsement, guarantee, or warranty by AfroVending regarding the quality, safety, legality, or any other aspect of such product.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">3. User Accounts</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.1 Account Registration</h3>
            <p className="text-gray-700 leading-relaxed">
              To use certain features of the Services, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.2 Account Security</h3>
            <p className="text-gray-700 leading-relaxed">
              You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.3 Account Eligibility</h3>
            <p className="text-gray-700 leading-relaxed">
              You must be at least 18 years of age to create an account and use the Services. By creating an account, you represent and warrant that you meet this age requirement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">4. User Conduct</h2>
            <p className="text-gray-700 leading-relaxed">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Use the Services for any illegal purpose or in violation of any applicable laws</li>
              <li>Violate or infringe upon the intellectual property rights of others</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Engage in harassment, abuse, or harmful conduct toward other users</li>
              <li>Attempt to circumvent any security measures or access controls</li>
              <li>Use automated systems or bots to access the Services without permission</li>
              <li>Interfere with or disrupt the Services or servers</li>
              <li>Manipulate prices, feedback, or ratings</li>
              <li>Create multiple accounts for fraudulent purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">5. Transactions and Payments</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">5.1 Payment Processing</h3>
            <p className="text-gray-700 leading-relaxed">
              Payments on the Platform are processed through our third-party payment processor, Stripe. By making a purchase, you agree to Stripe's terms of service and privacy policy.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">5.2 Pricing and Fees</h3>
            <p className="text-gray-700 leading-relaxed">
              All prices displayed on the Platform are set by Sellers. AfroVending charges Sellers a commission on completed transactions. Buyers may be subject to shipping costs, taxes, and customs duties depending on their location.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">5.3 Currency</h3>
            <p className="text-gray-700 leading-relaxed">
              Prices may be displayed in various currencies for convenience. The actual charge will be processed in the currency specified at checkout, and currency conversion fees may apply.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">6. Intellectual Property</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">6.1 Platform Content</h3>
            <p className="text-gray-700 leading-relaxed">
              The Platform and its original content, features, and functionality are owned by AfroVending and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">6.2 User Content</h3>
            <p className="text-gray-700 leading-relaxed">
              By posting content on the Platform, you grant AfroVending a non-exclusive, royalty-free, worldwide license to use, display, reproduce, and distribute such content in connection with the Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">7. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may suspend or terminate your account and access to the Services at any time, with or without cause, with or without notice. Upon termination, your right to use the Services will immediately cease. Provisions of these Terms that by their nature should survive termination will survive.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">8. Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed">
              Any disputes arising out of or relating to these Terms or the Services will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration will be conducted in Delaware, USA. You agree to waive any right to participate in a class action lawsuit or class-wide arbitration.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">9. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">10. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <p className="text-gray-700"><strong>AfroVending Legal Department</strong></p>
              <p className="text-gray-700">Email: legal@afrovending.com</p>
              <p className="text-gray-700">Address: 123 Marketplace Drive, Wilmington, DE 19801, USA</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
