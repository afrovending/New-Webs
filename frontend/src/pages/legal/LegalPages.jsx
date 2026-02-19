import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Users, CreditCard, Scale, Lock, Gavel, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

const LegalPages = () => {
  const legalDocs = [
    {
      title: "Terms of Service",
      description: "General terms and conditions for using AfroVending marketplace",
      icon: FileText,
      path: "/legal/terms",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Vendor Agreement",
      description: "Framework and requirements for vendors selling on our platform",
      icon: Users,
      path: "/legal/vendor-agreement",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Buyer Protection Policy",
      description: "How we protect buyers and handle disputes",
      icon: Shield,
      path: "/legal/buyer-protection",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Privacy Policy",
      description: "How we collect, use, and protect your data",
      icon: Lock,
      path: "/legal/privacy",
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      title: "Liability Limitations",
      description: "Understanding the scope of our liability as a marketplace",
      icon: Scale,
      path: "/legal/liability",
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Marketplace Enforcement",
      description: "Our rights and procedures for maintaining marketplace integrity",
      icon: Gavel,
      path: "/legal/enforcement",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Scale className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-4xl font-bold mb-4">Legal & Policies</h1>
          <p className="text-xl text-gray-300">
            Transparency and trust are at the heart of AfroVending. Review our policies to understand how we operate.
          </p>
        </div>
      </div>

      {/* Legal Documents Grid */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {legalDocs.map((doc) => {
            const Icon = doc.icon;
            return (
              <Link key={doc.path} to={doc.path}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`${doc.bgColor} p-3 rounded-lg`}>
                        <Icon className={`h-6 w-6 ${doc.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-red-600 transition-colors flex items-center gap-2">
                          {doc.title}
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">{doc.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Last Updated */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Last updated: February 19, 2026</p>
          <p className="mt-2">
            Questions about our policies? Contact us at{' '}
            <a href="mailto:legal@afrovending.com" className="text-red-600 hover:underline">
              legal@afrovending.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalPages;
