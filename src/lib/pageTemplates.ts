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

  'tour-listings': {
    title: 'All Tours',
    slug: 'tours',
    description: 'Showcase all available tour packages',
    icon: '🎫',
    showInNavigation: true,
    excerpt: 'Discover amazing travel experiences and tour packages',
    metaTitle: 'Tour Packages - Explore Destinations',
    metaDescription: 'Browse our collection of curated tour packages and travel experiences',
    sections: [
      {
        id: generateId(),
        type: 'hero',
        title: 'Hero',
        order: 0,
        visible: true,
        settings: {
          headline: 'Explore Amazing Destinations',
          subheadline: 'Curated tour packages for unforgettable travel experiences',
          buttonText: 'Browse All Tours',
          buttonUrl: '/products?type=tour',
          backgroundImage: '',
          backgroundColor: '#9333EA',
          textColor: '#ffffff',
          alignment: 'center',
          height: 'large'
        }
      },
      {
        id: generateId(),
        type: 'features',
        title: 'Why Choose Our Tours',
        order: 1,
        visible: true,
        settings: {
          title: 'Why Book With Us?',
          subtitle: 'Experience travel the right way',
          features: [
            {
              icon: '🗺️',
              title: 'Expert Itineraries',
              description: 'Carefully planned routes covering the best attractions'
            },
            {
              icon: '👨‍✈️',
              title: 'Professional Guides',
              description: 'Experienced local guides who know the destinations inside out'
            },
            {
              icon: '🏨',
              title: 'Quality Accommodations',
              description: 'Comfortable stays at verified hotels and resorts'
            },
            {
              icon: '🍽️',
              title: 'Meals Included',
              description: 'Enjoy local cuisine with most meals included in the package'
            },
            {
              icon: '🚌',
              title: 'Comfortable Transport',
              description: 'Air-conditioned vehicles for all transfers and sightseeing'
            },
            {
              icon: '💰',
              title: 'Best Price Guarantee',
              description: 'Competitive pricing with no hidden costs'
            }
          ],
          columns: 3,
          backgroundColor: '#ffffff'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'Popular Destinations',
        order: 2,
        visible: true,
        settings: {
          heading: 'Popular Destinations',
          content: `## Domestic Tours

Explore the beauty of your own country with our carefully curated domestic tour packages. From scenic hill stations to cultural heritage sites, discover destinations that are close yet fascinating.

## International Tours

Venture beyond borders with our international tour packages. Experience different cultures, cuisines, and landscapes with expertly planned itineraries that take care of every detail.

## Adventure Tours

For thrill-seekers and adventure enthusiasts, our adventure tours offer trekking, camping, water sports, and more. Challenge yourself while exploring nature's wonders.

## Family Packages

Family-friendly tours designed for all ages. Create lasting memories with customized itineraries that balance fun, education, and relaxation.`,
          padding: 'normal',
          backgroundColor: '#f8f9fa',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'cta',
        title: 'Browse CTA',
        order: 3,
        visible: true,
        settings: {
          headline: 'Ready for Your Next Adventure?',
          description: 'Explore hundreds of tour packages across multiple destinations',
          buttonText: 'Browse All Tours',
          buttonLink: '/products?type=tour',
          backgroundColor: '#9333EA',
          textColor: '#ffffff'
        }
      }
    ]
  },

  'tour-destinations': {
    title: 'Tour Destinations',
    slug: 'destinations',
    description: 'Featured travel destinations guide',
    icon: '🌍',
    showInNavigation: true,
    excerpt: 'Explore our featured destinations and plan your perfect trip',
    metaTitle: 'Travel Destinations - Where To Go',
    metaDescription: 'Discover amazing destinations around the world with our travel guides',
    sections: [
      {
        id: generateId(),
        type: 'hero',
        title: 'Hero',
        order: 0,
        visible: true,
        settings: {
          headline: 'Discover Your Next Destination',
          subheadline: 'From mountains to beaches, cities to countryside - explore it all',
          buttonText: 'View All Destinations',
          buttonUrl: '#destinations',
          backgroundImage: '',
          backgroundColor: '#0ea5e9',
          textColor: '#ffffff',
          alignment: 'center',
          height: 'large'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'Featured Destinations',
        order: 1,
        visible: true,
        settings: {
          heading: 'Featured Destinations',
          content: `## Hill Stations

**Shimla & Manali** - Experience the Himalayan charm  
Perfect for: Summer getaways, honeymooners  
Best time: March to June, December to February

**Ooty & Kodaikanal** - South India's scenic retreats  
Perfect for: Nature lovers, families  
Best time: April to June, September to November

## Beach Destinations

**Goa** - Sun, sand, and endless fun  
Perfect for: Beach lovers, party enthusiasts  
Best time: November to February

**Andaman & Nicobar** - Tropical paradise  
Perfect for: Water sports, island hopping  
Best time: October to May

## Cultural Heritage

**Rajasthan** - Land of kings and palaces  
Perfect for: History buffs, photographers  
Best time: October to March

**Kerala** - God's own country  
Perfect for: Backwater cruises, Ayurveda  
Best time: September to March`,
          padding: 'normal',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'features',
        title: 'Destination Types',
        order: 2,
        visible: true,
        settings: {
          title: 'Choose Your Experience',
          subtitle: 'Different destinations for different moods',
          features: [
            {
              icon: '🏔️',
              title: 'Mountains',
              description: 'Scenic hill stations, trekking trails, and snow adventures'
            },
            {
              icon: '🏖️',
              title: 'Beaches',
              description: 'Tropical islands, water sports, and coastal relaxation'
            },
            {
              icon: '🏛️',
              title: 'Heritage',
              description: 'Historical monuments, museums, and cultural experiences'
            },
            {
              icon: '🌿',
              title: 'Wildlife',
              description: 'National parks, safaris, and nature reserves'
            },
            {
              icon: '🏙️',
              title: 'Cities',
              description: 'Urban exploration, shopping, and modern attractions'
            },
            {
              icon: '🧘',
              title: 'Wellness',
              description: 'Yoga retreats, spa resorts, and spiritual journeys'
            }
          ],
          columns: 3,
          backgroundColor: '#f8f9fa'
        }
      },
      {
        id: generateId(),
        type: 'cta',
        title: 'Plan CTA',
        order: 3,
        visible: true,
        settings: {
          headline: 'Start Planning Your Trip',
          description: 'Browse tour packages for your chosen destination',
          buttonText: 'View Tours',
          buttonLink: '/products?type=tour',
          backgroundColor: '#0ea5e9',
          textColor: '#ffffff'
        }
      }
    ]
  },

  'tour-travel-guide': {
    title: 'Travel Guide',
    slug: 'travel-guide',
    description: 'Essential travel tips and information',
    icon: '📖',
    showInNavigation: true,
    excerpt: 'Everything you need to know before you travel',
    metaTitle: 'Travel Guide - Tips & Information',
    metaDescription: 'Essential travel tips, packing guides, and destination information',
    sections: [
      {
        id: generateId(),
        type: 'hero',
        title: 'Hero',
        order: 0,
        visible: true,
        settings: {
          headline: 'Your Complete Travel Guide',
          subheadline: 'Tips, advice, and essential information for travelers',
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
        title: 'Before You Travel',
        order: 1,
        visible: true,
        settings: {
          heading: 'Before You Travel',
          content: `## Essential Documents

- Valid ID proof (Passport for international travel)
- Travel insurance documents
- Hotel booking confirmations
- Tour vouchers and tickets
- Emergency contact numbers

## Health & Safety

- Get necessary vaccinations
- Carry prescribed medications
- Purchase travel insurance
- Register with your embassy (international travel)
- Keep digital copies of important documents

## Packing Tips

**Clothing**: Pack according to destination weather and activities  
**Electronics**: Chargers, power banks, adapters  
**Toiletries**: Travel-sized essentials in ziplock bags  
**Money**: Mix of cash and cards, inform bank of travel dates`,
          padding: 'normal',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'During Your Tour',
        order: 2,
        visible: true,
        settings: {
          heading: 'During Your Tour',
          content: `## Stay Connected

- Share your itinerary with family
- Keep emergency contacts handy
- Download offline maps
- Get local SIM card if needed

## Respect Local Culture

- Dress appropriately for religious sites
- Learn basic local phrases
- Follow photography guidelines
- Respect customs and traditions

## Health & Hygiene

- Drink bottled water
- Be cautious with street food
- Carry hand sanitizer and wet wipes
- Take rest when needed

## Money Management

- Keep cash in multiple locations
- Use hotel safes for valuables
- Keep small denominations handy
- Track your expenses`,
          padding: 'normal',
          backgroundColor: '#f8f9fa',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'features',
        title: 'Travel Smart',
        order: 3,
        visible: true,
        settings: {
          title: 'Travel Smart',
          subtitle: 'Essential tips for a smooth journey',
          features: [
            {
              icon: '✈️',
              title: 'Booking Tips',
              description: 'Book flights and hotels in advance for better deals'
            },
            {
              icon: '💵',
              title: 'Budget Planning',
              description: 'Plan for 20% extra budget for unexpected expenses'
            },
            {
              icon: '📱',
              title: 'Stay Connected',
              description: 'Download essential apps before traveling'
            },
            {
              icon: '🎒',
              title: 'Pack Light',
              description: 'Travel with essentials only, avoid overpacking'
            }
          ],
          columns: 2,
          backgroundColor: '#ffffff'
        }
      },
      {
        id: generateId(),
        type: 'cta',
        title: 'Questions CTA',
        order: 4,
        visible: true,
        settings: {
          headline: 'Have Travel Questions?',
          description: 'Our travel experts are here to help',
          buttonText: 'Contact Us',
          buttonLink: '/contact',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff'
        }
      }
    ]
  },

  'tour-faq': {
    title: 'Tour FAQs',
    slug: 'tour-faq',
    description: 'Frequently asked questions about tours',
    icon: '❓',
    showInNavigation: true,
    excerpt: 'Get answers to common questions about booking and traveling',
    metaTitle: 'Tour FAQs - Your Questions Answered',
    metaDescription: 'Find answers to frequently asked questions about tours, bookings, and travel',
    sections: [
      {
        id: generateId(),
        type: 'hero',
        title: 'Hero',
        order: 0,
        visible: true,
        settings: {
          headline: 'Tour FAQs',
          subheadline: 'Find answers to commonly asked questions',
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
        title: 'Booking & Payment',
        order: 1,
        visible: true,
        settings: {
          heading: 'Booking & Payment',
          content: `## How do I book a tour?

Simply browse our tour packages, select your preferred departure date, and click "Book Now". Fill in traveler details and complete payment to confirm your booking.

## What payment methods do you accept?

We accept credit cards, debit cards, net banking, UPI, and digital wallets. All payments are processed through secure payment gateways.

## Can I pay in installments?

Yes, we offer EMI options for bookings above a certain amount. The option will be available during checkout.

## Is my booking confirmed immediately?

Yes, you'll receive instant confirmation via email and SMS once payment is successful. Some tours may require manual confirmation within 24 hours.

## Can I modify or cancel my booking?

Yes, modifications and cancellations are subject to our cancellation policy. Check the specific tour's cancellation terms before booking.`,
          padding: 'normal',
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'Tour Details',
        order: 2,
        visible: true,
        settings: {
          heading: 'Tour Details',
          content: `## What's included in the tour package?

Each tour package clearly lists inclusions like accommodation, meals, transfers, sightseeing, and guide services. Review the "Inclusions" section on the tour page.

## What should I bring on the tour?

A detailed packing list is provided after booking. Generally, bring comfortable clothing, toiletries, medications, valid ID, and travel documents.

## Are meals vegetarian/non-vegetarian?

Most tours offer both options. Specify your preference during booking. Special dietary requirements can be accommodated with advance notice.

## What if I need special assistance?

Please inform us during booking about any special requirements (wheelchair access, medical needs, etc.). We'll do our best to accommodate.

## Can I customize the itinerary?

Some tours offer customization options. Contact our team to discuss your requirements and we'll create a personalized package.`,
          padding: 'normal',
          backgroundColor: '#f8f9fa',
          textColor: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'textBlock',
        title: 'Travel & Safety',
        order: 3,
        visible: true,
        settings: {
          heading: 'Travel & Safety',
          content: `## Is travel insurance included?

Travel insurance is not automatically included but highly recommended. We can arrange insurance at an additional cost.

## What if there's a medical emergency?

Our tour managers are trained to handle emergencies. We provide 24/7 emergency contact numbers and assistance.

## Are tours suitable for children/elderly?

Tour difficulty levels are clearly marked. Choose tours rated "Easy" or "Moderate" for children and elderly travelers.

## What about COVID-19 safety measures?

We follow all government guidelines including sanitization, social distancing, and health checks. Requirements may vary by destination.

## What if weather affects the tour?

Itineraries may be adjusted for safety. Alternative arrangements are made, and you'll be informed of any changes.`,
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
          headline: 'Still Have Questions?',
          description: 'Our customer support team is ready to help',
          buttonText: 'Contact Support',
          buttonLink: '/contact',
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
