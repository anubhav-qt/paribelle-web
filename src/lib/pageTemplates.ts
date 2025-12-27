import { PageSection } from './pageSections';

interface PageTemplate {
  title: string;
  slug: string;
  description: string;
  icon: string;
  sections: PageSection[];
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  showInNavigation?: boolean;
}

const generateId = () => crypto.randomUUID();

export const pageTemplates: Record<string, PageTemplate> = {
  'privacy-policy': {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    description: 'GDPR-compliant privacy policy template',
    icon: '🔒',
    showInNavigation: true,
    excerpt: 'Our commitment to protecting your privacy and personal information',
    metaTitle: 'Privacy Policy',
    metaDescription: 'Learn how we collect, use, and protect your personal information',
    sections: [
      {
        id: generateId(),
        type: 'hero',
        title: 'Hero',
        order: 0,
        visible: true,
        settings: {
          headline: 'Privacy Policy',
          subheadline: 'Last Updated: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          buttonText: '',
          buttonUrl: '',
          backgroundImage: '',
          backgroundColor: '#f8f9fa',
          textColor: '#1f2937',
          alignment: 'center',
          height: 'medium'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'Introduction',
        order: 1,
        visible: true,
        settings: {
          heading: 'Introduction',
          content: `Welcome to our marketplace. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.`,
          padding: 'normal',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'Information We Collect',
        order: 2,
        visible: true,
        settings: {
          heading: 'Information We Collect',
          content: `## Personal Information

We may collect personal information that you voluntarily provide to us when you:
- Register for an account
- Make a purchase
- Subscribe to our newsletter
- Contact customer support

This information may include:
- Name and contact information
- Payment information
- Account credentials
- Profile preferences

## Automatically Collected Information

When you visit our website, we automatically collect:
- IP address and browser type
- Pages viewed and time spent
- Device information
- Cookies and tracking data`,
          padding: 'normal',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'How We Use Your Information',
        order: 3,
        visible: true,
        settings: {
          heading: 'How We Use Your Information',
          content: `We use the collected information for various purposes:

- **Order Processing**: To process and fulfill your orders
- **Account Management**: To create and maintain your account
- **Communication**: To send promotional emails and updates
- **Personalization**: To customize your shopping experience
- **Analytics**: To analyze usage patterns and improve our services
- **Security**: To protect against fraud and unauthorized access`,
          padding: 'normal',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'cta',
        title: 'Contact CTA',
        order: 4,
        visible: true,
        settings: {
          headline: 'Questions About Privacy?',
          description: 'Contact our privacy team for any concerns',
          buttonText: 'Contact Us',
          buttonLink: '/contact',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff'
        }
      }
    ]
  },

  'terms-of-service': {
    title: 'Terms of Service',
    slug: 'terms-of-service',
    description: 'Complete terms and conditions',
    icon: '📜',
    showInNavigation: true,
    excerpt: 'Terms and conditions for using our marketplace platform',
    metaTitle: 'Terms of Service',
    metaDescription: 'Read our terms and conditions for using our marketplace',
    sections: [
      {
        id: generateId(),
        type: 'hero',
        title: 'Hero',
        order: 0,
        visible: true,
        settings: {
          headline: 'Terms of Service',
          subheadline: 'Please read these terms carefully before using our platform',
          buttonText: '',
          buttonUrl: '',
          backgroundImage: '',
          backgroundColor: '#f8f9fa',
          textColor: '#1f2937',
          alignment: 'center',
          height: 'medium'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'Agreement to Terms',
        order: 1,
        visible: true,
        settings: {
          heading: 'Agreement to Terms',
          content: `By accessing and using this marketplace website ("Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, please do not use our Service.`,
          padding: 'normal',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'Use of Service',
        order: 2,
        visible: true,
        settings: {
          heading: 'Use of Service',
          content: `## Eligibility

You must be at least 18 years old to use our Service.

## Account Registration

To access certain features, you must register for an account. You agree to:
- Provide accurate, current, and complete information
- Maintain the security of your password
- Accept responsibility for all activities under your account

## Prohibited Activities

You agree not to:
- Violate any laws or regulations
- Infringe on intellectual property rights
- Transmit viruses or harmful code
- Engage in fraudulent activities
- Harass or harm other users`,
          padding: 'normal',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'cta',
        title: 'Contact CTA',
        order: 3,
        visible: true,
        settings: {
          headline: 'Need Help Understanding?',
          description: 'Our support team is here to answer your questions',
          buttonText: 'Contact Support',
          buttonLink: '/contact',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff'
        }
      }
    ]
  },

  'cookie-policy': {
    title: 'Cookie Policy',
    slug: 'cookie-policy',
    description: 'Detailed cookie usage disclosure',
    icon: '🍪',
    showInNavigation: true,
    excerpt: 'Learn about how we use cookies and tracking technologies',
    metaTitle: 'Cookie Policy',
    metaDescription: 'Information about cookies and tracking technologies we use',
    sections: [
      {
        id: generateId(),
        type: 'hero',
        title: 'Hero',
        order: 0,
        visible: true,
        settings: {
          headline: 'Cookie Policy',
          subheadline: 'Understanding how we use cookies on our website',
          buttonText: '',
          buttonUrl: '',
          backgroundImage: '',
          backgroundColor: '#f8f9fa',
          textColor: '#1f2937',
          alignment: 'center',
          height: 'medium'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'What Are Cookies',
        order: 1,
        visible: true,
        settings: {
          heading: 'What Are Cookies?',
          content: `Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.`,
          padding: 'normal',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'Types of Cookies',
        order: 2,
        visible: true,
        settings: {
          heading: 'Types of Cookies We Use',
          content: `## Essential Cookies
Required for the website to function properly (session, authentication, shopping cart)

## Performance Cookies
Help us understand how visitors interact with our website (analytics, page views)

## Functionality Cookies
Remember your preferences and settings (language, currency, recently viewed)

## Advertising Cookies
Deliver relevant advertisements and track campaign effectiveness

All non-essential cookies require your consent before being placed on your device.`,
          padding: 'normal',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'cta',
        title: 'Cookie Settings CTA',
        order: 3,
        visible: true,
        settings: {
          headline: 'Manage Your Cookie Preferences',
          description: 'Update your cookie settings anytime',
          buttonText: 'Cookie Settings',
          buttonLink: '#',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff'
        }
      }
    ]
  },

  'become-vendor': {
    title: 'Become a Vendor',
    slug: 'become-a-vendor',
    description: 'Vendor onboarding and benefits page',
    icon: '🏪',
    showInNavigation: true,
    excerpt: 'Join our marketplace and reach thousands of customers',
    metaTitle: 'Become a Vendor - Start Selling Today',
    metaDescription: 'Join our thriving marketplace community and grow your business with our platform',
    sections: [
      {
        id: generateId(),
        type: 'hero',
        title: 'Hero',
        order: 0,
        visible: true,
        settings: {
          headline: 'Become a Vendor',
          subheadline: 'Join our thriving marketplace community and reach thousands of customers',
          buttonText: 'Start Application',
          buttonUrl: '/vendor/register',
          backgroundImage: '',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          alignment: 'center',
          height: 'large'
        }
      },
      {
        id: generateId(),
        type: 'features',
        title: 'Why Sell With Us',
        order: 1,
        visible: true,
        settings: {
          title: 'Why Sell With Us?',
          subtitle: 'Everything you need to succeed in online selling',
          features: [
            {
              icon: '👥',
              title: 'Large Customer Base',
              description: 'Access thousands of engaged shoppers actively looking for products'
            },
            {
              icon: '📈',
              title: 'Easy to Use Platform',
              description: 'Intuitive vendor dashboard makes managing your store simple'
            },
            {
              icon: '💰',
              title: 'Secure Payments',
              description: 'Get paid reliably with our integrated payment processing'
            },
            {
              icon: '📊',
              title: 'Analytics & Insights',
              description: 'Track performance with detailed analytics and reports'
            },
            {
              icon: '🚀',
              title: 'Marketing Support',
              description: 'Benefit from our marketing efforts and promotional campaigns'
            },
            {
              icon: '🎨',
              title: 'Customizable Storefront',
              description: 'Create your unique brand identity with custom pages'
            }
          ],
          columns: 3,
          backgroundColor: '#ffffff'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'How It Works',
        order: 2,
        visible: true,
        settings: {
          heading: 'How It Works',
          content: `## 1. Apply to Become a Vendor

Fill out our simple application form with basic business information.

## 2. Review & Approval

Our team reviews your application within 2-3 business days.

## 3. Set Up Your Store

Access your vendor dashboard and start building your storefront.

## 4. Start Selling

Your products go live and customers can start purchasing immediately!`,
          padding: 'normal',
          backgroundColor: '#f8f9fa',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'cta',
        title: 'Apply CTA',
        order: 3,
        visible: true,
        settings: {
          headline: 'Ready to Get Started?',
          description: 'Join hundreds of successful vendors already selling on our platform',
          buttonText: 'Apply Now',
          buttonLink: '/vendor/register',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff'
        }
      }
    ]
  },

  'about-us': {
    title: 'About Us',
    slug: 'about-us',
    description: 'Company story and mission',
    icon: '🏢',
    showInNavigation: true,
    excerpt: 'Learn about our mission, vision, and values',
    metaTitle: 'About Us',
    metaDescription: 'Learn more about our company, mission, and team',
    sections: [
      {
        id: generateId(),
        type: 'hero',
        title: 'Hero',
        order: 0,
        visible: true,
        settings: {
          headline: 'About Us',
          subheadline: 'Building the future of online commerce',
          buttonText: '',
          buttonUrl: '',
          backgroundImage: '',
          backgroundColor: '#f8f9fa',
          textColor: '#1f2937',
          alignment: 'center',
          height: 'medium'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'Our Story',
        order: 1,
        visible: true,
        settings: {
          heading: 'Our Story',
          content: `Founded in 2024, our marketplace was created with a simple mission: to connect buyers and sellers in a trusted, secure, and efficient platform. We believe in empowering small businesses and individual vendors to reach a global audience while providing customers with access to unique, quality products.

Our platform has grown to serve thousands of vendors and millions of customers worldwide, becoming a trusted destination for online shopping.`,
          padding: 'normal',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'features',
        title: 'Our Values',
        order: 2,
        visible: true,
        settings: {
          title: 'Our Values',
          subtitle: 'What drives us every day',
          features: [
            {
              icon: '🤝',
              title: 'Trust',
              description: 'Building lasting relationships through transparency and reliability'
            },
            {
              icon: '🌟',
              title: 'Quality',
              description: 'Committed to excellence in every product and service'
            },
            {
              icon: '💡',
              title: 'Innovation',
              description: 'Constantly improving to serve our community better'
            },
            {
              icon: '🌍',
              title: 'Community',
              description: 'Supporting vendors and customers in their success'
            }
          ],
          columns: 2,
          backgroundColor: '#f8f9fa'
        }
      },
      {
        id: generateId(),
        type: 'cta',
        title: 'Join CTA',
        order: 3,
        visible: true,
        settings: {
          headline: 'Join Our Community',
          description: 'Whether you\'re a buyer or seller, we\'d love to have you',
          buttonText: 'Get Started',
          buttonLink: '/signup',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff'
        }
      }
    ]
  },

  'contact': {
    title: 'Contact Us',
    slug: 'contact',
    description: 'Get in touch with our team',
    icon: '📧',
    showInNavigation: true,
    excerpt: 'Get in touch with our support team',
    metaTitle: 'Contact Us',
    metaDescription: 'Have questions? Get in touch with our support team',
    sections: [
      {
        id: generateId(),
        type: 'hero',
        title: 'Hero',
        order: 0,
        visible: true,
        settings: {
          headline: 'Contact Us',
          subheadline: 'We\'re here to help! Get in touch with any questions',
          buttonText: '',
          buttonUrl: '',
          backgroundImage: '',
          backgroundColor: '#f8f9fa',
          textColor: '#1f2937',
          alignment: 'center',
          height: 'medium'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'Contact Info',
        order: 1,
        visible: true,
        settings: {
          heading: 'Get In Touch',
          content: `## Email
support@yourmarketplace.com

## Phone
+1 (555) 123-4567

## Business Hours
Monday - Friday: 9:00 AM - 6:00 PM  
Saturday: 10:00 AM - 4:00 PM  
Sunday: Closed

## Address
123 Marketplace Street  
City, State 12345  
Country`,
          padding: 'normal',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'cta',
        title: 'Live Chat CTA',
        order: 2,
        visible: true,
        settings: {
          headline: 'Live Chat Available',
          description: 'Chat with our support team during business hours',
          buttonText: 'Start Chat',
          buttonLink: '#',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff'
        }
      }
    ]
  }
};
