'use client';

import Link from 'next/link';
import { PageSection, Hotspot } from '@/lib/pageSections';
import ReactMarkdown from 'react-markdown';
import { Star, MapPin, Phone, Mail, CheckCircle, AlertCircle, Info, AlertTriangle, ChevronDown, ChevronUp, Calendar, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { formatDate as formatDateUtil } from '@/lib/utils/date';
import { RevealOnScroll } from '@/components/brand/RevealOnScroll';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PriceTag } from '@/components/ui/PriceTag';
import { useProductById } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { getProductImageUrl } from '@/lib/image-url';

interface SectionRendererProps {
  section: PageSection;
  isPreview?: boolean;
}

export default function SectionRenderer({ section, isPreview = false }: SectionRendererProps) {
  const { type, settings } = section;

  switch (type) {
    case 'hero':
      return <HeroSection settings={settings} />;
    case 'features':
      return <FeaturesSection settings={settings} />;
    case 'content':
      return <ContentSection settings={settings} />;
    case 'gallery':
      return <GallerySection settings={settings} />;
    case 'testimonials':
      return <TestimonialsSection settings={settings} />;
    case 'faq':
      return <FAQSection settings={settings} />;
    case 'contact':
      return <ContactSection settings={settings} />;
    case 'team':
      return <TeamSection settings={settings} />;
    case 'pricing':
      return <PricingSection settings={settings} />;
    case 'stats':
      return <StatsSection settings={settings} />;
    case 'cta':
      return <CTASection settings={settings} />;
    case 'textBlock':
      return <TextBlockSection settings={settings} />;
    case 'list':
      return <ListSection settings={settings} />;
    case 'table':
      return <TableSection settings={settings} />;
    case 'alert':
      return <AlertSection settings={settings} />;
    case 'accordion':
      return <AccordionSection settings={settings} />;
    case 'divider':
      return <DividerSection settings={settings} />;
    case 'lastUpdated':
      return <LastUpdatedSection settings={settings} />;
    case 'lookbook-hero':
      return <LookbookHeroSection settings={settings} />;
    case 'shoppable-image':
      return <ShoppableImageSection settings={settings} isPreview={isPreview} />;
    default:
      return null;
  }
}

// Hero Section
function HeroSection({ settings }: { settings: any }) {
  const heightClasses: Record<string, string> = {
    small: 'min-h-[300px]',
    medium: 'min-h-[400px]',
    large: 'min-h-[500px]',
  };

  const height = settings.height || 'large';
  const heightClass = heightClasses[height] || heightClasses.large;

  return (
    <div 
      className={`relative ${heightClass} flex items-center justify-center text-${settings.alignment || 'center'}`}
      style={{
        backgroundColor: settings.backgroundColor,
        backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: settings.textColor,
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 container mx-auto px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">{settings.headline}</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">{settings.subheadline}</p>
        {settings.buttonText && (
          <a
            href={settings.buttonLink}
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            {settings.buttonText}
          </a>
        )}
      </div>
    </div>
  );
}

// Features Section
function FeaturesSection({ settings }: { settings: any }) {
  const gridCols: Record<number, string> = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  const columns = settings.columns || 3;
  const gridColClass = gridCols[columns] || gridCols[3];

  return (
    <div className="py-16" style={{ backgroundColor: settings.backgroundColor }}>
      <div className="container mx-auto px-4">
        {settings.title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{settings.title}</h2>
            {settings.subtitle && (
              <p className="text-lg text-muted-foreground">{settings.subtitle}</p>
            )}
          </div>
        )}
        <div className={`grid grid-cols-1 ${gridColClass} gap-8`}>
          {settings.features?.map((feature: any, index: number) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Content Section
function ContentSection({ settings }: { settings: any }) {
  const isImageRight = settings.imagePosition === 'right';

  return (
    <div className="py-16" style={{ backgroundColor: settings.backgroundColor }}>
      <div className="container mx-auto px-4">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${isImageRight ? '' : 'md:flex-row-reverse'}`}>
          <div className={isImageRight ? '' : 'md:order-2'}>
            <h2 className="text-3xl font-bold mb-6">{settings.title}</h2>
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{settings.content}</ReactMarkdown>
            </div>
          </div>
          {settings.image && (
            <div className={isImageRight ? 'md:order-2' : ''}>
              <img
                src={settings.image}
                alt={settings.title}
                className="rounded-lg shadow-lg w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Gallery Section
function GallerySection({ settings }: { settings: any }) {
  const gridCols: Record<number, string> = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  const spacing: Record<string, string> = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-8',
  };

  const columns = settings.columns || 4;
  const spacingValue = settings.spacing || 'medium';
  const gridColClass = gridCols[columns] || gridCols[4];
  const spacingClass = spacing[spacingValue] || spacing.medium;

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        {settings.title && (
          <h2 className="text-3xl font-bold text-center mb-12">{settings.title}</h2>
        )}
        <div className={`grid grid-cols-2 ${gridColClass} ${spacingClass}`}>
          {settings.images?.map((image: any, index: number) => (
            <div key={index} className="aspect-square overflow-hidden rounded-lg">
              <img
                src={image.url}
                alt={image.alt || `Gallery image ${index + 1}`}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Testimonials Section
function TestimonialsSection({ settings }: { settings: any }) {
  return (
    <div className="py-16" style={{ backgroundColor: settings.backgroundColor }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{settings.title}</h2>
          {settings.subtitle && (
            <p className="text-lg text-muted-foreground">{settings.subtitle}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {settings.testimonials?.map((testimonial: any, index: number) => (
            <div key={index} className="bg-background p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-4 mb-4">
                {testimonial.avatar ? (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  {settings.showRating && (
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground italic">&quot;{testimonial.text}&quot;</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// FAQ Section
function FAQSection({ settings }: { settings: any }) {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{settings.title}</h2>
          {settings.subtitle && (
            <p className="text-lg text-muted-foreground">{settings.subtitle}</p>
          )}
        </div>
        <div className="space-y-4">
          {settings.faqs?.map((faq: any, index: number) => (
            <details key={index} className="bg-background p-6 rounded-lg shadow-sm border border-border">
              <summary className="font-semibold cursor-pointer text-lg">
                {faq.question}
              </summary>
              <p className="mt-4 text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

// Contact Section
function ContactSection({ settings }: { settings: any }) {
  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{settings.title}</h2>
          {settings.subtitle && (
            <p className="text-lg text-muted-foreground">{settings.subtitle}</p>
          )}
        </div>
        <div className="bg-background rounded-lg shadow-md p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 text-primary mt-1" />
                <div>
                  <div className="font-semibold mb-1">Email</div>
                  <a href={`mailto:${settings.email}`} className="text-primary hover:underline">
                    {settings.email}
                  </a>
                </div>
              </div>
            )}
            {settings.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-6 h-6 text-primary mt-1" />
                <div>
                  <div className="font-semibold mb-1">Phone</div>
                  <a href={`tel:${settings.phone}`} className="text-primary hover:underline">
                    {settings.phone}
                  </a>
                </div>
              </div>
            )}
            {settings.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-6 h-6 text-primary mt-1" />
                <div>
                  <div className="font-semibold mb-1">Address</div>
                  <p className="text-muted-foreground">{settings.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Team Section
function TeamSection({ settings }: { settings: any }) {
  const gridCols: Record<number, string> = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  const columns = settings.columns || 3;
  const gridColClass = gridCols[columns] || gridCols[3];

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{settings.title}</h2>
          {settings.subtitle && (
            <p className="text-lg text-muted-foreground">{settings.subtitle}</p>
          )}
        </div>
        <div className={`grid grid-cols-1 ${gridColClass} gap-8`}>
          {settings.members?.map((member: any, index: number) => (
            <div key={index} className="text-center">
              {member.photo ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-primary">
                  {member.name.charAt(0)}
                </div>
              )}
              <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
              <p className="text-primary mb-2">{member.role}</p>
              {member.bio && <p className="text-sm text-muted-foreground">{member.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pricing Section
function PricingSection({ settings }: { settings: any }) {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{settings.title}</h2>
          {settings.subtitle && (
            <p className="text-lg text-muted-foreground">{settings.subtitle}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {settings.plans?.map((plan: any, index: number) => (
            <div
              key={index}
              className={`rounded-lg p-8 ${
                plan.highlighted
                  ? 'bg-primary text-primary-foreground shadow-xl scale-105'
                  : 'bg-background border border-border'
              }`}
            >
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-lg">/{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features?.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <span>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-semibold ${
                  plan.highlighted
                    ? 'bg-white text-primary hover:bg-gray-100'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {plan.buttonText || 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stats Section
function StatsSection({ settings }: { settings: any }) {
  return (
    <div
      className="py-16"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
    >
      <div className="container mx-auto px-4">
        {settings.title && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {settings.title}
          </h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {settings.stats?.map((stat: any, index: number) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
              <div className="text-lg opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// CTA Section
function CTASection({ settings }: { settings: any }) {
  return (
    <div
      className="py-20"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
    >
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">{settings.headline}</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">{settings.description}</p>
        <a
          href={settings.buttonLink}
          className="inline-block px-8 py-4 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
        >
          {settings.buttonText}
        </a>
      </div>
    </div>
  );
}

// Text Block Section - Perfect for legal documents
function TextBlockSection({ settings }: { settings: any }) {
  const HeadingTag = settings.headingLevel || 'h2';
  const paddingClasses: Record<string, string> = {
    none: 'py-0',
    small: 'py-6',
    normal: 'py-12',
    large: 'py-20',
  };

  const padding = settings.padding || 'normal';
  const paddingClass = paddingClasses[padding] || paddingClasses.normal;

  return (
    <div
      className={paddingClass}
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        {settings.heading && (
          <HeadingTag className="text-2xl md:text-3xl font-bold mb-6">
            {settings.heading}
          </HeadingTag>
        )}
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown>{settings.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// List Section
function ListSection({ settings }: { settings: any }) {
  const ListTag = settings.listType === 'numbered' ? 'ol' : 'ul';
  
  return (
    <div
      className="py-12"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        {settings.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-8">{settings.title}</h2>
        )}
        <ListTag className={`space-y-3 ${settings.listType === 'numbered' ? 'list-decimal list-inside' : 'list-none'}`}>
          {settings.items?.map((item: string, index: number) => (
            <li key={index} className="flex items-start gap-3 text-lg">
              {settings.listType !== 'numbered' && settings.icon && (
                <span className="text-primary mt-1">{settings.icon}</span>
              )}
              <span>{item}</span>
            </li>
          ))}
        </ListTag>
      </div>
    </div>
  );
}

// Table Section
function TableSection({ settings }: { settings: any }) {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {settings.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-8">{settings.title}</h2>
        )}
        <div className="overflow-x-auto">
          <table className={`w-full ${settings.bordered ? 'border border-border' : ''}`}>
            <thead className="bg-muted">
              <tr>
                {settings.headers?.map((header: string, index: number) => (
                  <th key={index} className="px-6 py-3 text-left font-semibold border-b-2 border-border">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settings.rows?.map((row: string[], rowIndex: number) => (
                <tr 
                  key={rowIndex}
                  className={settings.striped && rowIndex % 2 === 1 ? 'bg-muted/50' : ''}
                >
                  {row.map((cell: string, cellIndex: number) => (
                    <td key={cellIndex} className="px-6 py-4 border-b border-border">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Alert Section
function AlertSection({ settings }: { settings: any }) {
  const alertStyles: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    success: 'bg-green-50 border-green-200 text-green-900',
  };

  const alertIcons: Record<string, JSX.Element> = {
    info: <Info className="w-6 h-6" />,
    warning: <AlertTriangle className="w-6 h-6" />,
    error: <AlertCircle className="w-6 h-6" />,
    success: <CheckCircle className="w-6 h-6" />,
  };

  const type = settings.type || 'info';
  const alertStyle = alertStyles[type] || alertStyles.info;
  const alertIcon = alertIcons[type] || alertIcons.info;

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className={`${alertStyle} border-2 rounded-lg p-6`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {settings.icon || alertIcon}
            </div>
            <div className="flex-1">
              {settings.title && (
                <h3 className="text-lg font-semibold mb-2">{settings.title}</h3>
              )}
              <p className="text-base">{settings.message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Accordion Section
function AccordionSection({ settings }: { settings: any }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    settings.defaultExpanded ? 0 : null
  );

  return (
    <div
      className="py-12"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        {settings.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-8">{settings.title}</h2>
        )}
        <div className="space-y-4">
          {settings.items?.map((item: any, index: number) => (
            <div key={index} className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-lg text-left">{item.title}</span>
                {expandedIndex === index ? (
                  <ChevronUp className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 flex-shrink-0" />
                )}
              </button>
              {expandedIndex === index && (
                <div className="px-6 py-4 bg-muted/30 border-t border-border">
                  <div className="prose max-w-none">
                    <ReactMarkdown>{item.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Divider Section
function DividerSection({ settings }: { settings: any }) {
  const spacingClasses: Record<string, string> = {
    small: 'py-4',
    normal: 'py-8',
    large: 'py-12',
  };

  const thicknessClasses: Record<string, string> = {
    thin: 'border-t',
    medium: 'border-t-2',
    thick: 'border-t-4',
  };

  const spacing = settings.spacing || 'normal';
  const spacingClass = spacingClasses[spacing] || spacingClasses.normal;
  const thickness = settings.thickness || 'thin';
  const thicknessClass = thicknessClasses[thickness] || thicknessClasses.thin;

  if (settings.style === 'space') {
    return <div className={spacingClass}></div>;
  }

  return (
    <div className={spacingClass}>
      <div className="container mx-auto px-4">
        {settings.text ? (
          <div className="flex items-center gap-4">
            <div className={`flex-1 ${thicknessClass}`} style={{ borderColor: settings.color }}></div>
            <span className="text-muted-foreground font-medium">{settings.text}</span>
            <div className={`flex-1 ${thicknessClass}`} style={{ borderColor: settings.color }}></div>
          </div>
        ) : (
          <div className={thicknessClass} style={{ borderColor: settings.color }}></div>
        )}
      </div>
    </div>
  );
}

// Last Updated Section
function LastUpdatedSection({ settings }: { settings: any }) {
  const formatDate = formatDateUtil; // Using centralized utility

  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const alignment = settings.alignment || 'left';
  const alignmentClass = alignmentClasses[alignment] || alignmentClasses.left;

  return (
    <div
      className="py-6"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <div className={`flex items-center gap-2 ${alignmentClass}`}>
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            <strong>{settings.prefix}</strong> {formatDate(settings.date)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Lookbook Hero — full-bleed chapter opener
function LookbookHeroSection({ settings }: { settings: any }) {
  const heightClasses: Record<string, string> = {
    small: 'h-[60vh]',
    medium: 'h-[75vh]',
    large: 'h-[92vh]',
  };
  const heightClass = heightClasses[settings.height] || heightClasses.large;

  return (
    <section
      className={`relative flex ${heightClass} items-end overflow-hidden bg-[hsl(var(--pb-wine))]`}
    >
      {settings.image && (
        <img
          src={settings.image}
          alt={settings.title || ''}
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--pb-wine)/0.85)] via-transparent to-transparent" />
      <RevealOnScroll className="relative z-10 w-full px-6 pb-16 text-center md:px-12">
        {settings.subtitle && (
          <p className="text-eyebrow text-[hsl(var(--pb-gold-soft))]">{settings.subtitle}</p>
        )}
        <h2 className="mt-3 text-display-xl italic text-white">{settings.title}</h2>
        {settings.ctaText && (
          <a href={settings.ctaLink || '#'} className="mt-8 inline-block">
            <Button variant="gold-outline" className="border-white/40 text-white hover:bg-white/10">
              {settings.ctaText}
            </Button>
          </a>
        )}
      </RevealOnScroll>
    </section>
  );
}

// Shoppable Image — editorial photo with quick-shop hotspots
function ShoppableImageSection({ settings, isPreview }: { settings: any; isPreview?: boolean }) {
  const hotspots: Hotspot[] = settings.hotspots || [];
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  return (
    <section className="relative mx-auto max-w-3xl px-4 py-8" data-shoppable-image>
      <div className="relative overflow-hidden rounded-sm">
        {settings.image && (
          <img src={settings.image} alt={settings.alt || ''} className="w-full object-cover" />
        )}
        {hotspots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            aria-label="Shop this item"
            onClick={() => !isPreview && setActiveHotspot(spot)}
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            className="group absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[hsl(var(--pb-gold))] shadow-pb-md"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-[hsl(var(--pb-gold))] opacity-75 group-hover:opacity-90" />
          </button>
        ))}
      </div>
      {settings.caption && (
        <p className="mt-3 text-center text-caption text-[hsl(var(--pb-ink-faint))]">{settings.caption}</p>
      )}

      <Modal open={!!activeHotspot} onClose={() => setActiveHotspot(null)} maxWidthClassName="max-w-sm">
        {activeHotspot && <QuickShopCard productId={activeHotspot.productId} />}
      </Modal>
    </section>
  );
}

function QuickShopCard({ productId }: { productId: string }) {
  const { data: product, isLoading } = useProductById(productId);
  const { addToCart } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [added, setAdded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--pb-ink-faint))]" />
      </div>
    );
  }

  if (!product) {
    return <p className="py-8 text-center text-sm text-[hsl(var(--pb-ink-faint))]">Item unavailable.</p>;
  }

  const variants = product.productVariants?.filter((v) => v.isActive) || [];
  const activeVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
  const price = Number(activeVariant?.price ?? product.price);
  const compareAtPrice = activeVariant?.compareAtPrice ?? product.compareAtPrice;
  const image = activeVariant?.featuredImage || getProductImageUrl(product);
  const outOfStock = variants.length
    ? variants.every((v) => v.stockQuantity <= 0)
    : (product.stockQuantity ?? 0) <= 0;

  const handleAddToBag = () => {
    addToCart({
      productId: product.id,
      variantId: activeVariant?.id,
      variantSku: activeVariant?.sku,
      variantAttributes: activeVariant?.variantAttributes,
      name: product.name,
      slug: product.slug,
      price,
      quantity: 1,
      image,
      vendorId: product.vendorId || product.vendor?.id || '',
      stockQuantity: activeVariant?.stockQuantity ?? product.stockQuantity,
      maxQuantity: activeVariant?.stockQuantity ?? product.stockQuantity,
    });
    setAdded(true);
  };

  return (
    <div>
      <div className="aspect-[4/5] w-full overflow-hidden rounded-sm bg-[hsl(var(--pb-shell))]">
        <img src={image} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <h3 className="mt-4 font-display text-lg text-[hsl(var(--pb-ink))]">{product.name}</h3>
      <PriceTag price={price} compareAtPrice={compareAtPrice} className="mt-1" />

      {variants.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {variants.map((v) => {
            const label = Object.values(v.variantAttributes || {}).join(' / ') || v.sku;
            const isSelected = v.id === activeVariant?.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                disabled={v.stockQuantity <= 0}
                className={`rounded-sm border px-3 py-1.5 text-xs transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                  isSelected
                    ? 'border-[hsl(var(--pb-rose))] bg-[hsl(var(--pb-rose)/0.08)] text-[hsl(var(--pb-rose-deep))]'
                    : 'border-[hsl(var(--pb-linen))] text-[hsl(var(--pb-ink-muted))]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <Button variant="primary" fullWidth disabled={outOfStock} onClick={handleAddToBag}>
          <Plus className="h-4 w-4" />
          {outOfStock ? 'Sold Out' : added ? 'Added ✓' : 'Add to Bag'}
        </Button>
      </div>
      <Link href={`/products/${product.slug}`} className="mt-3 block text-center text-caption underline text-[hsl(var(--pb-ink-faint))]">
        View full details
      </Link>
    </div>
  );
}
