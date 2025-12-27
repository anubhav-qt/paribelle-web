import UnifiedHeader from '@/components/UnifiedHeader';

export default function CookiePolicyPage() {
  return (
    <>
      <UnifiedHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
          
          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
            <p className="text-sm text-gray-600">
              <strong>Last Updated:</strong> December 27, 2025
            </p>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
              <p className="text-gray-700 leading-relaxed">
                Cookies are small text files that are placed on your device when you visit a website. They are widely 
                used to make websites work more efficiently and provide information to website owners. Cookies help us 
                understand how you use our marketplace and improve your experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Essential Functionality:</strong> To enable core features like shopping cart and checkout</li>
                <li><strong>Authentication:</strong> To keep you logged in during your session</li>
                <li><strong>Preferences:</strong> To remember your settings and choices</li>
                <li><strong>Security:</strong> To detect and prevent fraudulent activity</li>
                <li><strong>Analytics:</strong> To understand how visitors use our website</li>
                <li><strong>Marketing:</strong> To deliver relevant advertisements and measure campaign effectiveness</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">3.1 Strictly Necessary Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                These cookies are essential for the website to function properly. They enable core functionality such as:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Shopping cart management</li>
                <li>Secure login and authentication</li>
                <li>Payment processing</li>
                <li>Security features</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3 italic">
                These cookies cannot be disabled as the website would not function without them.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">3.2 Performance and Analytics Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                These cookies help us understand how visitors interact with our website by collecting information about:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Pages visited and time spent on each page</li>
                <li>Links clicked and navigation paths</li>
                <li>Error messages encountered</li>
                <li>Device and browser information</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>Third-party services:</strong> Google Analytics, Mixpanel
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">3.3 Functionality Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                These cookies remember your preferences and choices to provide enhanced features:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Language and region preferences</li>
                <li>Currency selection</li>
                <li>Recently viewed products</li>
                <li>Customization settings</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">3.4 Targeting and Advertising Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                These cookies are used to deliver relevant advertisements and track campaign performance:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Personalized product recommendations</li>
                <li>Retargeting campaigns</li>
                <li>Social media integration</li>
                <li>Ad performance measurement</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>Third-party services:</strong> Google Ads, Facebook Pixel, Instagram
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We work with trusted third-party service providers who may also set cookies on your device. These include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Payment Processors:</strong> Stripe, PayPal, Razorpay for secure payment processing</li>
                <li><strong>Analytics Providers:</strong> Google Analytics for website usage analysis</li>
                <li><strong>Social Media:</strong> Facebook, Twitter, Instagram for social sharing features</li>
                <li><strong>Advertising Networks:</strong> Google Ads, Facebook Ads for targeted advertising</li>
                <li><strong>Customer Support:</strong> Live chat and support tools</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                These third parties have their own privacy and cookie policies. We recommend reviewing them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Cookie Duration</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Cookies can be either:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until you delete them</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Managing Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You have the right to accept or reject cookies. You can control cookies through:
              </p>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">6.1 Browser Settings</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Most browsers allow you to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>View and delete cookies</li>
                <li>Block third-party cookies</li>
                <li>Block all cookies</li>
                <li>Clear cookies when you close the browser</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Refer to your browser's help section for instructions on managing cookies.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">6.2 Cookie Consent Manager</h3>
              <p className="text-gray-700 leading-relaxed">
                When you first visit our website, you can choose which categories of cookies to accept through our 
                cookie consent banner. You can change your preferences at any time by clicking the cookie settings 
                icon at the bottom of the page.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">6.3 Impact of Disabling Cookies</h3>
              <p className="text-gray-700 leading-relaxed">
                Please note that disabling cookies may affect the functionality of our website. Some features, such as 
                the shopping cart and checkout process, require cookies to work properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Do Not Track Signals</h2>
              <p className="text-gray-700 leading-relaxed">
                Some browsers support "Do Not Track" (DNT) signals. Currently, there is no industry standard for 
                responding to DNT signals, so our website does not respond to them at this time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other 
                operational, legal, or regulatory reasons. Please check this page regularly for updates.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. More Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                For more information about cookies and how to manage them, visit:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">AllAboutCookies.org</a></li>
                <li><a href="https://www.youronlinechoices.eu" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">YourOnlineChoices.eu</a></li>
                <li><a href="https://www.networkadvertising.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Network Advertising Initiative</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about our use of cookies, please contact us at:
              </p>
              <div className="mt-3 text-gray-700 space-y-1">
                <p><strong>Email:</strong> privacy@marketplace.com</p>
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
