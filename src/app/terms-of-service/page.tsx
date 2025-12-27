import UnifiedHeader from '@/components/UnifiedHeader';

export default function TermsOfServicePage() {
  return (
    <>
      <UnifiedHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          
          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
            <p className="text-sm text-gray-600">
              <strong>Last Updated:</strong> December 27, 2025
            </p>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using this marketplace platform, you accept and agree to be bound by the terms and 
                provisions of this agreement. If you do not agree to these Terms of Service, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Use of the Platform</h2>
              <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Eligibility</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                You must be at least 18 years old to use our services. By using our platform, you represent and 
                warrant that you meet this age requirement.
              </p>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Account Registration</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                To access certain features, you may be required to create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Purchases and Payments</h2>
              <h3 className="text-xl font-semibold mb-3 mt-4">3.1 Orders</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                When you place an order through our marketplace:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>You are making an offer to purchase products from vendors</li>
                <li>All orders are subject to acceptance and availability</li>
                <li>We reserve the right to refuse or cancel any order</li>
                <li>Prices and availability are subject to change without notice</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">3.2 Payment</h3>
              <p className="text-gray-700 leading-relaxed">
                Payment must be made at the time of purchase using accepted payment methods. You agree to provide 
                current, complete, and accurate payment information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Vendor Responsibilities</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Vendors on our platform are independent sellers responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Product quality, descriptions, and pricing</li>
                <li>Order fulfillment and shipping</li>
                <li>Customer service for their products</li>
                <li>Compliance with applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Returns and Refunds</h2>
              <p className="text-gray-700 leading-relaxed">
                Return and refund policies are set by individual vendors. Please review the vendor's policy before 
                making a purchase. In case of disputes, we may facilitate resolution between buyers and vendors.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Prohibited Activities</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Violate any laws or regulations</li>
                <li>Infringe upon intellectual property rights</li>
                <li>Post false, misleading, or fraudulent content</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use automated systems to access the platform</li>
                <li>Resell or exploit our services without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All content on this platform, including text, graphics, logos, images, and software, is the property 
                of the marketplace or its content suppliers and is protected by intellectual property laws. You may not 
                reproduce, distribute, or create derivative works without express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or 
                indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify and hold harmless the marketplace, its affiliates, and their respective officers, 
                directors, employees, and agents from any claims, damages, obligations, losses, liabilities, costs, or 
                debt arising from your use of the platform or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Dispute Resolution</h2>
              <p className="text-gray-700 leading-relaxed">
                Any disputes arising from these Terms or your use of the platform shall be resolved through binding 
                arbitration in accordance with the rules of [Arbitration Association], except where prohibited by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Modifications to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon 
                posting. Your continued use of the platform constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your account and access to the platform immediately, without prior notice, 
                for any reason, including breach of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], 
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-3 text-gray-700 space-y-1">
                <p><strong>Email:</strong> legal@marketplace.com</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p><strong>Address:</strong> 123 Market Street, City, State 12345</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
