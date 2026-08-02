// Shopify-style page section types and templates

export type SectionType = 
  | 'hero'
  | 'features'
  | 'content'
  | 'gallery'
  | 'testimonials'
  | 'faq'
  | 'contact'
  | 'team'
  | 'pricing'
  | 'cta'
  | 'stats'
  | 'textBlock'
  | 'list'
  | 'table'
  | 'alert'
  | 'accordion'
  | 'divider'
  | 'lastUpdated'
  | 'lookbook-hero'
  | 'shoppable-image';

export interface Hotspot {
  id: string;
  x: number; // percent, 0-100
  y: number; // percent, 0-100
  productId: string;
  productName?: string; // cached label for the editor
}

export interface PageSection {
  id: string;
  type: SectionType;
  title: string;
  settings: Record<string, any>;
  order: number;
  visible: boolean;
}

export interface SectionTemplate {
  type: SectionType;
  name: string;
  description: string;
  icon: string;
  category: 'header' | 'content' | 'footer' | 'lookbook';
  defaultSettings: Record<string, any>;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  // HEADER SECTIONS
  {
    type: 'hero',
    name: 'Hero Banner',
    description: 'Large banner with headline, description, and CTA button',
    icon: '🎯',
    category: 'header',
    defaultSettings: {
      headline: 'Welcome to Our Store',
      subheadline: 'Discover amazing products and services',
      buttonText: 'Shop Now',
      buttonLink: '/products',
      backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
      backgroundColor: '#f3f4f6',
      textColor: '#111827',
      alignment: 'center',
      height: 'large',
    },
  },
  
  // CONTENT SECTIONS
  {
    type: 'features',
    name: 'Features Grid',
    description: 'Showcase 3-4 key features or services in a grid',
    icon: '⭐',
    category: 'content',
    defaultSettings: {
      title: 'Why Choose Us',
      subtitle: 'What makes us special',
      features: [
        { icon: '🚀', title: 'Fast Delivery', description: 'Quick shipping worldwide' },
        { icon: '💎', title: 'Quality Products', description: 'Premium quality guaranteed' },
        { icon: '🔒', title: 'Secure Payment', description: '100% secure transactions' },
        { icon: '24/7', title: '24/7 Support', description: 'Always here to help' },
      ],
      columns: 4,
      backgroundColor: '#ffffff',
    },
  },
  
  {
    type: 'content',
    name: 'Content Block',
    description: 'Rich content section with optional image',
    icon: '📝',
    category: 'content',
    defaultSettings: {
      title: 'About Us',
      content: `## Our Story

We are passionate about delivering exceptional products and services to our customers.

Founded in 2020, we've grown from a small startup to serving thousands of happy customers worldwide.

### Our Mission
To provide the best shopping experience with quality products, great prices, and outstanding customer service.`,
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop',
      imagePosition: 'right',
      backgroundColor: '#ffffff',
    },
  },
  
  {
    type: 'gallery',
    name: 'Image Gallery',
    description: 'Display multiple images in a responsive grid',
    icon: '🖼️',
    category: 'content',
    defaultSettings: {
      title: 'Our Gallery',
      images: [
        { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', alt: 'Product 1' },
        { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', alt: 'Product 2' },
        { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', alt: 'Product 3' },
        { url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop', alt: 'Product 4' },
      ],
      columns: 4,
      spacing: 'medium',
    },
  },
  
  {
    type: 'testimonials',
    name: 'Customer Reviews',
    description: 'Display customer testimonials and ratings',
    icon: '💬',
    category: 'content',
    defaultSettings: {
      title: 'What Our Customers Say',
      subtitle: 'Trusted by thousands of happy customers',
      testimonials: [
        { name: 'John Doe', text: 'Excellent service and quality products. Highly recommended!', rating: 5, avatar: '' },
        { name: 'Jane Smith', text: 'Fast delivery and great customer support. Will buy again!', rating: 5, avatar: '' },
        { name: 'Mike Johnson', text: 'Best online shopping experience I\'ve had. Five stars!', rating: 5, avatar: '' },
      ],
      showRating: true,
      backgroundColor: '#f9fafb',
    },
  },
  
  {
    type: 'faq',
    name: 'FAQ Section',
    description: 'Frequently asked questions with expandable answers',
    icon: '❓',
    category: 'content',
    defaultSettings: {
      title: 'Frequently Asked Questions',
      subtitle: 'Find answers to common questions',
      faqs: [
        { question: 'How do I place an order?', answer: 'Simply browse our products, add items to your cart, and proceed to checkout. You\'ll need to create an account or login first.' },
        { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, debit cards, UPI, net banking, and cash on delivery.' },
        { question: 'How long does delivery take?', answer: 'Delivery typically takes 3-5 business days for metro cities and 5-7 days for other locations.' },
        { question: 'What is your return policy?', answer: 'We offer a 7-day return policy on most products. Items must be unused and in original packaging.' },
      ],
    },
  },
  
  {
    type: 'team',
    name: 'Team Members',
    description: 'Showcase your team with photos and bios',
    icon: '👥',
    category: 'content',
    defaultSettings: {
      title: 'Meet Our Team',
      subtitle: 'The people behind our success',
      members: [
        { name: 'John Smith', role: 'Founder & CEO', bio: 'Passionate about creating great products', photo: '', social: { linkedin: '', twitter: '' } },
        { name: 'Sarah Johnson', role: 'Head of Operations', bio: 'Ensuring smooth operations', photo: '', social: { linkedin: '', twitter: '' } },
        { name: 'Mike Williams', role: 'Customer Success', bio: 'Here to help you succeed', photo: '', social: { linkedin: '', twitter: '' } },
      ],
      columns: 3,
    },
  },
  
  {
    type: 'pricing',
    name: 'Pricing Plans',
    description: 'Display pricing tables for your services',
    icon: '💰',
    category: 'content',
    defaultSettings: {
      title: 'Choose Your Plan',
      subtitle: 'Flexible pricing for every need',
      plans: [
        { 
          name: 'Basic', 
          price: '$9', 
          period: 'month', 
          features: ['5 Products', 'Basic Support', 'Email Notifications'],
          highlighted: false,
          buttonText: 'Get Started',
        },
        { 
          name: 'Pro', 
          price: '$29', 
          period: 'month', 
          features: ['50 Products', 'Priority Support', 'Advanced Analytics', 'Custom Domain'],
          highlighted: true,
          buttonText: 'Most Popular',
        },
        { 
          name: 'Enterprise', 
          price: '$99', 
          period: 'month', 
          features: ['Unlimited Products', '24/7 Support', 'Advanced Features', 'Dedicated Manager'],
          highlighted: false,
          buttonText: 'Contact Us',
        },
      ],
    },
  },
  
  {
    type: 'stats',
    name: 'Statistics Counter',
    description: 'Display impressive numbers and achievements',
    icon: '📊',
    category: 'content',
    defaultSettings: {
      title: 'Our Impact',
      stats: [
        { number: '10,000+', label: 'Happy Customers' },
        { number: '500+', label: 'Products' },
        { number: '50+', label: 'Team Members' },
        { number: '24/7', label: 'Support' },
      ],
      backgroundColor: '#1f2937',
      textColor: '#ffffff',
    },
  },
  
  // FOOTER/CTA SECTIONS
  {
    type: 'cta',
    name: 'Call to Action',
    description: 'Encourage visitors to take action',
    icon: '📣',
    category: 'footer',
    defaultSettings: {
      headline: 'Ready to Get Started?',
      description: 'Join thousands of satisfied customers today and experience the difference.',
      buttonText: 'Get Started Now',
      buttonLink: '/signup',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
    },
  },
  
  {
    type: 'contact',
    name: 'Contact Information',
    description: 'Display contact details and form',
    icon: '📧',
    category: 'footer',
    defaultSettings: {
      title: 'Get in Touch',
      subtitle: 'We\'d love to hear from you',
      email: 'info@yourstore.com',
      phone: '+1 234 567 8900',
      address: '123 Business Street, City, Country',
      showMap: false,
      mapUrl: '',
    },
  },

  // LEGAL & DOCUMENT SECTIONS
  {
    type: 'textBlock',
    name: 'Text Block',
    description: 'Simple text section with heading - perfect for policy sections',
    icon: '📄',
    category: 'content',
    defaultSettings: {
      heading: 'Section Heading',
      headingLevel: 'h2',
      content: `This is a text block section. You can use it for any text content including:

• Privacy policy sections
• Terms and conditions
• Legal disclaimers
• About sections
• And more...

You can format this text using Markdown for **bold**, *italic*, and other formatting.`,
      backgroundColor: '#ffffff',
      textColor: '#111827',
      padding: 'normal',
    },
  },

  {
    type: 'list',
    name: 'List Section',
    description: 'Bulleted or numbered list - great for terms and policies',
    icon: '📋',
    category: 'content',
    defaultSettings: {
      title: 'Important Points',
      listType: 'bullet',
      items: [
        'First important point or term',
        'Second key point or condition',
        'Third essential item',
        'Fourth critical detail',
      ],
      icon: '✓',
      backgroundColor: '#ffffff',
    },
  },

  {
    type: 'table',
    name: 'Data Table',
    description: 'Structured table for displaying data or information',
    icon: '📊',
    category: 'content',
    defaultSettings: {
      title: 'Information Table',
      headers: ['Item', 'Description', 'Details'],
      rows: [
        ['Personal Data', 'Information we collect', 'Name, email, address'],
        ['Usage Data', 'How we use it', 'Service improvement, analytics'],
        ['Third Parties', 'Who we share with', 'Payment processors only'],
      ],
      striped: true,
      bordered: true,
    },
  },

  {
    type: 'alert',
    name: 'Alert/Notice Box',
    description: 'Highlight important information or warnings',
    icon: '⚠️',
    category: 'content',
    defaultSettings: {
      type: 'info',
      title: 'Important Notice',
      message: 'This is an important message that requires attention. Please read carefully.',
      icon: 'ℹ️',
      dismissible: false,
    },
  },

  {
    type: 'accordion',
    name: 'Accordion/Collapsible',
    description: 'Expandable sections for detailed information',
    icon: '📑',
    category: 'content',
    defaultSettings: {
      title: 'Detailed Information',
      items: [
        {
          title: 'What information do we collect?',
          content: 'We collect information that you provide directly to us, including name, email address, postal address, phone number, and payment information.',
        },
        {
          title: 'How do we use your information?',
          content: 'We use the information we collect to process transactions, send notifications, respond to inquiries, and improve our services.',
        },
        {
          title: 'How do we protect your information?',
          content: 'We implement security measures including encryption, secure servers, and regular security audits to protect your personal information.',
        },
      ],
      defaultExpanded: false,
      backgroundColor: '#ffffff',
    },
  },

  {
    type: 'divider',
    name: 'Divider',
    description: 'Visual separator between sections',
    icon: '➖',
    category: 'content',
    defaultSettings: {
      style: 'line',
      thickness: 'thin',
      color: '#e5e7eb',
      spacing: 'normal',
      text: '',
    },
  },

  // LOOKBOOK SECTIONS
  {
    type: 'lookbook-hero',
    name: 'Lookbook Hero',
    description: 'Full-bleed chapter opener for a lookbook story — image, title, CTA',
    icon: '✨',
    category: 'lookbook',
    defaultSettings: {
      title: 'Styled for the Season',
      subtitle: 'A story in kurtis and gold',
      image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1600&h=1400&fit=crop',
      ctaText: 'Explore the Look',
      ctaLink: '',
      height: 'large',
    },
  },

  {
    type: 'shoppable-image',
    name: 'Shoppable Image',
    description: 'Editorial photo with tappable hotspots that open a quick-shop card',
    icon: '📍',
    category: 'lookbook',
    defaultSettings: {
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&h=1750&fit=crop',
      alt: '',
      caption: '',
      hotspots: [] as Hotspot[],
    },
  },

  {
    type: 'lastUpdated',
    name: 'Last Updated Date',
    description: 'Display when the page/policy was last updated',
    icon: '📅',
    category: 'content',
    defaultSettings: {
      date: new Date().toISOString().split('T')[0],
      prefix: 'Last Updated:',
      format: 'MMMM DD, YYYY',
      alignment: 'left',
      backgroundColor: '#f9fafb',
    },
  },
];

export const SECTION_CATEGORIES = {
  header: { name: 'Header', icon: '🎯', description: 'Top sections for your page' },
  content: { name: 'Content', icon: '📄', description: 'Main content sections' },
  footer: { name: 'Footer', icon: '📍', description: 'Bottom sections and CTAs' },
  lookbook: { name: 'Lookbook', icon: '✨', description: 'Shoppable editorial storytelling' },
};

// Helper to create a new section from template
export function createSectionFromTemplate(template: SectionTemplate): PageSection {
  return {
    id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: template.type,
    title: template.name,
    settings: { ...template.defaultSettings },
    order: 0,
    visible: true,
  };
}
