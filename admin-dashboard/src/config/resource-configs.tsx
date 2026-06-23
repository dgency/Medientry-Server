import { Badge } from '../components/ui/badge';
import {
  formatDateTime,
  formatLabel,
  getSiteBaseUrl,
  toDateTimeLocalValue,
  toJsonTextareaValue,
  toKeywordsValue,
} from '../lib/utils';
import type { ResourceConfig } from '../types/app';

type ResourceItem = { id: string; [key: string]: unknown };
const siteBaseUrl = getSiteBaseUrl();

const homeHeroFallbackContent = {
  badgeText: 'TRUSTED MBBS CONSULTANCY SINCE 2018',
  headingText: 'Your Gateway\nto MBBS\nAbroad',
  highlightedWord: 'MBBS',
  highlightedWordColor: '#5DFF72',
  description:
    'Expert guidance for MBBS admission in Bangladesh & Georgia. NMC-recognized colleges, transparent process, and support from application to graduation.',
  primaryCtaText: 'FREE CONSULTATION',
  primaryCtaLink: '/contact',
  secondaryCtaText: 'EXPLORE MBBS OPTION',
  secondaryCtaLink: '/mbbs-bangladesh',
  backgroundImage: '/images/home/Hero bg.webp',
  rightImage: '/images/home/hero-right-side.jpg',
} as const;

const homeSuccessStoriesFallbackContent = {
  label: 'SUCCESS STORIES',
  headingBeforeHighlight: 'Students',
  headingHighlight: 'Trusted',
  headingAfterHighlight: 'Medientry',
  subtitle:
    'Real stories from students and parents who chose Medientry for their medical education journey.',
  ctaText: 'READ MORE SUCCESS STORIES',
  ctaLink: '/success-stories',
} as const;

const homeWhyChooseUsFallbackContent = {
  eyebrow: 'WHY CHOOSE US',
  title: 'Trusted by Parents, Chosen by Students',
  subtitle:
    'We understand that choosing where to study medicine is a life-changing decision. Our commitment is to provide honest, comprehensive guidance every step of the way.',
  featureCards: [
    {
      icon: 'quality-based-recommendations',
      title: 'Quality-Based Recommendations',
      description:
        'College selection based on FMGE track record, facilities & your goals — not commissions.',
      sortOrder: 1,
      isActive: true,
    },
    {
      icon: 'years-of-trust',
      title: '7 Years of Trust',
      description:
        'Hundreds of parents have trusted Medientry since 2018 for honest, long-term guidance.',
      sortOrder: 2,
      isActive: true,
    },
    {
      icon: 'students-guided',
      title: '500+ Students Guided',
      description:
        'Successful admissions to carefully vetted NMC-recognized colleges in Bangladesh & Georgia.',
      sortOrder: 3,
      isActive: true,
    },
    {
      icon: 'complete-transparency',
      title: 'Complete Transparency',
      description:
        'No hidden fees, no pressure to overspend — clear explanation of all risks & limitations.',
      sortOrder: 4,
      isActive: true,
    },
    {
      icon: 'guidance-beyond-admission',
      title: 'Guidance Beyond Admission',
      description:
        'Our support continues throughout your 5-6 year journey, not just until payment.',
      sortOrder: 5,
      isActive: true,
    },
    {
      icon: 'honest-comparisons',
      title: 'Honest Comparisons',
      description:
        'We openly compare colleges so you can make an informed decision on your own.',
      sortOrder: 6,
      isActive: true,
    },
  ],
  apartTitle: 'What Sets Us Apart',
  apartItems: [
    {
      icon: 'local-presence',
      title: 'Local Presence in Bangladesh',
      description: 'On-ground support whenever your child needs help',
      sortOrder: 1,
      isActive: true,
    },
    {
      icon: 'parent-first-communication',
      title: 'Parent-First Communication',
      description: 'Direct contact with our team throughout the journey',
      sortOrder: 2,
      isActive: true,
    },
    {
      icon: 'fmge-focused-guidance',
      title: 'FMGE-Focused Guidance',
      description: 'We prioritize colleges with strong exam pass rates',
      sortOrder: 3,
      isActive: true,
    },
  ],
  rightEyebrow: 'FOR INDIAN STUDENTS & PARENTS',
  rightTitle: 'Trust & Transparency for Indian Medical Aspirants',
  rightParagraph:
    'Bangladesh has excellent medical colleges — but selection matters. We openly explain which colleges should be avoided and which suit which type of student.',
  checklistItems: [
    {
      text: `We recommend best-fit colleges, not "high commission colleges"`,
      sortOrder: 1,
      isActive: true,
    },
    {
      text: 'Clear explanation of why some colleges should be avoided',
      sortOrder: 2,
      isActive: true,
    },
    {
      text: 'Parents are fully informed before any decision',
      sortOrder: 3,
      isActive: true,
    },
    {
      text: 'No pressure tactics — take your time to decide',
      sortOrder: 4,
      isActive: true,
    },
  ],
  quoteText: `"Your child's 6 years matter more to us than a one-time commission."`,
} as const;

const homeAdmissionProcessFallbackContent = {
  eyebrow: 'ADMISSION PROCESS',
  headingText: 'Simple, Transparent Admission Journey',
  headingHighlight: 'Transparent Admission',
  subtitle:
    'From your first consultation to stepping into your medical college, we handle every detail so you can focus on your dream.',
  centerImage: '/images/home/admission process.png',
  cards: [
    {
      icon: '/home-page-icons/card icon.svg',
      title: 'Free Consultation',
      description: 'Discuss your goals, budget, and preferences with our expert counselors.',
      side: 'left',
      sortOrder: 1,
      isActive: true,
    },
    {
      icon: '/home-page-icons/card icon.svg',
      title: 'College Selection',
      description: 'We help you choose the right NMC-recognized medical college.',
      side: 'left',
      sortOrder: 2,
      isActive: true,
    },
    {
      icon: '/home-page-icons/card icon.svg',
      title: 'Documentation',
      description: 'Complete assistance with admission forms and required documents.',
      side: 'left',
      sortOrder: 3,
      isActive: true,
    },
    {
      icon: '/home-page-icons/card icon.svg',
      title: 'Admission Confirmation',
      description: 'Receive your official admission letter from the college.',
      side: 'right',
      sortOrder: 4,
      isActive: true,
    },
    {
      icon: '/home-page-icons/card icon.svg',
      title: 'Visa Processing',
      description: 'Full support for visa application and travel arrangements.',
      side: 'right',
      sortOrder: 5,
      isActive: true,
    },
    {
      icon: '/home-page-icons/card icon.svg',
      title: 'Arrival & Support',
      description: 'Airport pickup and ongoing support throughout your studies.',
      side: 'right',
      sortOrder: 6,
      isActive: true,
    },
  ],
} as const;

const homeStudyAbroadFallbackContent = {
  eyebrow: 'FOR BANGLADESHI STUDENTS',
  title: 'Study Abroad with Clarity',
  subtitle:
    'Medientry Bangladesh is the Official Representative of Alte University, Georgia. We guide Bangladeshi students through MBBS and non-MBBS pathways with complete transparency.',
  cards: [
    {
      icon: '',
      title: 'No IELTS Required',
      description: 'Admission without English proficiency tests',
      sortOrder: 1,
      isActive: true,
    },
    {
      icon: '',
      title: 'Affordable Tuition',
      description: 'Comparable to Bangladeshi private university fees',
      sortOrder: 2,
      isActive: true,
    },
    {
      icon: '',
      title: 'Updated Curriculum',
      description: 'Modern European education standards',
      sortOrder: 3,
      isActive: true,
    },
    {
      icon: '',
      title: 'Easy Visa Process',
      description: 'Transparent and straightforward application',
      sortOrder: 4,
      isActive: true,
    },
    {
      icon: '',
      title: 'MBBS',
      description: 'Medicine & Surgery',
      sortOrder: 5,
      isActive: true,
    },
    {
      icon: '',
      title: 'CSE',
      description: 'Computer Science',
      sortOrder: 6,
      isActive: true,
    },
    {
      icon: '',
      title: 'AI & Data Science',
      description: 'Future-Ready Programs',
      sortOrder: 7,
      isActive: true,
    },
    {
      icon: '',
      title: 'Hotel Management',
      description: 'Hospitality Industry',
      sortOrder: 8,
      isActive: true,
    },
  ],
} as const;

const homeVideoStoriesFallbackContent = {
  eyebrow: 'WATCH STORIES',
  title: 'Real Student Journeys in Motion',
  subtitle: 'Watch short videos from students, parents, and the Medientry team.',
} as const;

const homeWhyChooseUsIconKeys = [
  'quality-based-recommendations',
  'years-of-trust',
  'students-guided',
  'complete-transparency',
  'guidance-beyond-admission',
  'honest-comparisons',
  'local-presence',
  'parent-first-communication',
  'fmge-focused-guidance',
].join(', ');

const homeHeroStatFieldConfigs = [
  {
    key: 'yearsExperience',
    title: 'Years Experience',
    defaultValue: '7',
    defaultSuffix: '+',
    defaultLabel: 'Years Experience',
  },
  {
    key: 'partnerColleges',
    title: 'Partner Colleges',
    defaultValue: '30',
    defaultSuffix: '+',
    defaultLabel: 'Partner Colleges',
  },
  {
    key: 'successfulAdmissions',
    title: 'Successful Admissions',
    defaultValue: '500',
    defaultSuffix: '+',
    defaultLabel: 'Successful Admissions',
  },
  {
    key: 'transparentProcess',
    title: 'Transparent Process',
    defaultValue: '100',
    defaultSuffix: '%',
    defaultLabel: 'Transparent Process',
  },
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const isHomePageValues = (values: Record<string, unknown>) =>
  String(values.pageType ?? '').trim() === 'HOME' ||
  String(values.slug ?? '').trim().toLowerCase() === 'home';

const isValidHexColor = (value: string) => /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
const defaultPageHeroOverlayColor = '#052118';
const defaultPageHeroOverlayOpacity = 0.82;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parsePageContentObject = (value: unknown) => (isRecord(value) ? { ...value } : {});

const readContentString = (content: Record<string, unknown>, key: string) =>
  typeof content[key] === 'string' ? content[key] : null;

const readContentNumber = (content: Record<string, unknown>, key: string) => {
  const value = content[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const readHomeHeroStat = (content: Record<string, unknown>, index: number) => {
  const stats = Array.isArray(content.heroStats) ? content.heroStats : [];
  const stat = stats[index];
  return isRecord(stat) ? stat : null;
};

const publicationStatusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
];

const simpleStatusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const userStatusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
];

const userRoleOptions = [
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Admin', value: 'ADMIN' },
];

const pageTypeOptions = [
  'HOME',
  'ABOUT',
  'CONTACT',
  'STUDY_DESTINATION',
  'MEDICAL_COLLEGE',
  'BLOG',
  'NOTICE',
  'SUCCESS_STORY',
  'CUSTOM',
].map((value) => ({ label: formatLabel(value), value }));

const pageTemplateOptions = ['DEFAULT', 'DESTINATION', 'COLLEGE', 'LANDING'].map((value) => ({
  label: formatLabel(value),
  value,
}));

const galleryTypeOptions = ['IMAGE', 'VIDEO'].map((value) => ({
  label: formatLabel(value),
  value,
}));

const getStudyDestinationPreviewPath = (slug: string) => {
  switch (slug) {
    case 'mbbs-bangladesh':
      return '/mbbs-bangladesh';
    case 'mbbs-georgia':
      return '/mbbs-georgia';
    case 'mbbs-bangladesh-government':
      return '/mbbs-bangladesh-government';
    case 'georgia-for-bangladeshis':
      return '/georgia-for-bangladeshis';
    default:
      return `/study-destinations/${slug}`;
  }
};

const badgeForStatus = (value: unknown) => {
  const status = String(value ?? '');

  if (status === 'PUBLISHED' || status === 'ACTIVE') {
    return <Badge variant="success">{formatLabel(status)}</Badge>;
  }

  if (status === 'DRAFT' || status === 'INACTIVE') {
    return <Badge variant="warning">{formatLabel(status)}</Badge>;
  }

  return <Badge variant="outline">{formatLabel(status || 'Unknown')}</Badge>;
};

const defaultSeoFields = [
  {
    name: 'seoTitle',
    label: 'SEO Title',
    type: 'text',
    placeholder: 'SEO optimized title',
    colSpan: 2,
  },
  {
    name: 'seoDescription',
    label: 'SEO Description',
    type: 'textarea',
    placeholder: 'Short SEO description',
    rows: 3,
    colSpan: 2,
  },
  {
    name: 'seoKeywords',
    label: 'SEO Keywords',
    type: 'keywords',
    placeholder: 'mbbs, admission, medical college',
    colSpan: 2,
  },
  {
    name: 'ogImage',
    label: 'OG Image URL',
    type: 'url',
    placeholder: 'https://example.com/og-image.jpg',
    uploadKind: 'image',
    previewLabel: 'Preview OG image',
  },
  {
    name: 'canonicalUrl',
    label: 'Canonical URL',
    type: 'url',
    placeholder: 'https://medientry.com/page',
  },
] as const;

export const resourceConfigs: Record<string, ResourceConfig<ResourceItem>> = {
  pages: {
    key: 'pages',
    title: 'Pages',
    singular: 'Page',
    description: 'Manage content pages, hero sections, reusable blocks, and SEO metadata.',
    endpoint: '/pages',
    slugSourceField: 'title',
    slugField: 'slug',
    previewUrlBuilder: (item) => {
      const slug = String(item.slug ?? '').trim();

      if (!slug) {
        return null;
      }

      if (String(item.pageType ?? '') === 'HOME' || slug === 'home') {
        return `${siteBaseUrl}/`;
      }

      return `${siteBaseUrl}/${slug}`;
    },
    statusToggle: {
      fieldName: 'status',
      activeValue: 'PUBLISHED',
      inactiveValue: 'DRAFT',
    },
    createButtonLabel: 'New page',
    emptyTitle: 'No pages yet',
    emptyDescription: 'Create your first CMS page to start powering the frontend by slug.',
    defaultValues: {
      title: '',
      slug: '',
      pageType: 'CUSTOM',
      templateType: 'DEFAULT',
      status: 'DRAFT',
      heroTitle: '',
      heroSubtitle: '',
      heroImage: '',
      heroOverlayColor: defaultPageHeroOverlayColor,
      heroOverlayOpacity: defaultPageHeroOverlayOpacity,
      heroBadgeText: homeHeroFallbackContent.badgeText,
      heroHeadingText: homeHeroFallbackContent.headingText,
      heroHighlightWord: homeHeroFallbackContent.highlightedWord,
      heroHighlightColor: homeHeroFallbackContent.highlightedWordColor,
      heroDescription: homeHeroFallbackContent.description,
      heroPrimaryCtaText: homeHeroFallbackContent.primaryCtaText,
      heroPrimaryCtaLink: homeHeroFallbackContent.primaryCtaLink,
      heroSecondaryCtaText: homeHeroFallbackContent.secondaryCtaText,
      heroSecondaryCtaLink: homeHeroFallbackContent.secondaryCtaLink,
      heroBackgroundImage: homeHeroFallbackContent.backgroundImage,
      heroRightImage: homeHeroFallbackContent.rightImage,
      videoStoriesEnabled: true,
      videoStoriesEyebrow: homeVideoStoriesFallbackContent.eyebrow,
      videoStoriesTitle: homeVideoStoriesFallbackContent.title,
      videoStoriesSubtitle: homeVideoStoriesFallbackContent.subtitle,
      successStoriesLabel: homeSuccessStoriesFallbackContent.label,
      successStoriesHeadingBeforeHighlight:
        homeSuccessStoriesFallbackContent.headingBeforeHighlight,
      successStoriesHeadingHighlight:
        homeSuccessStoriesFallbackContent.headingHighlight,
      successStoriesHeadingAfterHighlight:
        homeSuccessStoriesFallbackContent.headingAfterHighlight,
      successStoriesSubtitle: homeSuccessStoriesFallbackContent.subtitle,
      successStoriesCtaText: homeSuccessStoriesFallbackContent.ctaText,
      successStoriesCtaLink: homeSuccessStoriesFallbackContent.ctaLink,
      whyChooseUsEyebrow: homeWhyChooseUsFallbackContent.eyebrow,
      whyChooseUsTitle: homeWhyChooseUsFallbackContent.title,
      whyChooseUsSubtitle: homeWhyChooseUsFallbackContent.subtitle,
      whyChooseUsFeatureCards: toJsonTextareaValue(homeWhyChooseUsFallbackContent.featureCards),
      whyChooseUsApartTitle: homeWhyChooseUsFallbackContent.apartTitle,
      whyChooseUsApartItems: toJsonTextareaValue(homeWhyChooseUsFallbackContent.apartItems),
      whyChooseUsRightEyebrow: homeWhyChooseUsFallbackContent.rightEyebrow,
      whyChooseUsRightTitle: homeWhyChooseUsFallbackContent.rightTitle,
      whyChooseUsRightParagraph: homeWhyChooseUsFallbackContent.rightParagraph,
      whyChooseUsChecklistItems: toJsonTextareaValue(homeWhyChooseUsFallbackContent.checklistItems),
      whyChooseUsQuoteText: homeWhyChooseUsFallbackContent.quoteText,
      admissionProcessEyebrow: homeAdmissionProcessFallbackContent.eyebrow,
      admissionProcessHeadingText: homeAdmissionProcessFallbackContent.headingText,
      admissionProcessHeadingHighlight: homeAdmissionProcessFallbackContent.headingHighlight,
      admissionProcessSubtitle: homeAdmissionProcessFallbackContent.subtitle,
      admissionProcessCenterImage: homeAdmissionProcessFallbackContent.centerImage,
      admissionProcessCards: homeAdmissionProcessFallbackContent.cards,
      studyAbroadEyebrow: homeStudyAbroadFallbackContent.eyebrow,
      studyAbroadTitle: homeStudyAbroadFallbackContent.title,
      studyAbroadSubtitle: homeStudyAbroadFallbackContent.subtitle,
      studyAbroadCards: homeStudyAbroadFallbackContent.cards,
      heroStatYearsExperienceValue: homeHeroStatFieldConfigs[0].defaultValue,
      heroStatYearsExperienceSuffix: homeHeroStatFieldConfigs[0].defaultSuffix,
      heroStatYearsExperienceLabel: homeHeroStatFieldConfigs[0].defaultLabel,
      heroStatYearsExperienceVisible: true,
      heroStatPartnerCollegesValue: homeHeroStatFieldConfigs[1].defaultValue,
      heroStatPartnerCollegesSuffix: homeHeroStatFieldConfigs[1].defaultSuffix,
      heroStatPartnerCollegesLabel: homeHeroStatFieldConfigs[1].defaultLabel,
      heroStatPartnerCollegesVisible: true,
      heroStatSuccessfulAdmissionsValue: homeHeroStatFieldConfigs[2].defaultValue,
      heroStatSuccessfulAdmissionsSuffix: homeHeroStatFieldConfigs[2].defaultSuffix,
      heroStatSuccessfulAdmissionsLabel: homeHeroStatFieldConfigs[2].defaultLabel,
      heroStatSuccessfulAdmissionsVisible: true,
      heroStatTransparentProcessValue: homeHeroStatFieldConfigs[3].defaultValue,
      heroStatTransparentProcessSuffix: homeHeroStatFieldConfigs[3].defaultSuffix,
      heroStatTransparentProcessLabel: homeHeroStatFieldConfigs[3].defaultLabel,
      heroStatTransparentProcessVisible: true,
      content: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      ogImage: '',
      canonicalUrl: '',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'about-medientry' },
      { name: 'pageType', label: 'Page Type', type: 'select', required: true, options: pageTypeOptions },
      { name: 'templateType', label: 'Template Type', type: 'select', required: true, options: pageTemplateOptions },
      { name: 'status', label: 'Status', type: 'select', required: true, options: publicationStatusOptions },
      {
        name: 'heroBadgeText',
        label: 'Hero Badge Text',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
        description: 'Displayed above the Home page hero heading.',
      },
      {
        name: 'heroHeadingText',
        label: 'Main Heading Text',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
        description: 'Supports CMS text. The frontend safely renders this heading into the required hero lines.',
      },
      {
        name: 'heroHighlightWord',
        label: 'Highlighted Word Text',
        type: 'text',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'heroHighlightColor',
        label: 'Highlighted Word Color',
        type: 'text',
        placeholder: '#5DFF72',
        visible: (values) => isHomePageValues(values),
        validate: (value) => {
          const normalized = normalizeString(value);
          if (!normalized) {
            return undefined;
          }

          return isValidHexColor(normalized)
            ? undefined
            : 'Highlighted Word Color must be a valid hex color like #5DFF72.';
        },
      },
      {
        name: 'heroDescription',
        label: 'Description Text',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'heroPrimaryCtaText',
        label: 'Primary Button Text',
        type: 'text',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'heroPrimaryCtaLink',
        label: 'Primary Button URL',
        type: 'url',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'heroSecondaryCtaText',
        label: 'Secondary Button Text',
        type: 'text',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'heroSecondaryCtaLink',
        label: 'Secondary Button URL',
        type: 'url',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'heroBackgroundImage',
        label: 'Hero Background Image',
        type: 'url',
        colSpan: 2,
        uploadKind: 'image',
        previewLabel: 'Preview hero background image',
        visible: (values) => isHomePageValues(values),
        requiredWhen: (values) => isHomePageValues(values),
      },
      {
        name: 'heroRightImage',
        label: 'Hero Right-side Image',
        type: 'url',
        colSpan: 2,
        uploadKind: 'image',
        previewLabel: 'Preview hero right-side image',
        visible: (values) => isHomePageValues(values),
        requiredWhen: (values) => isHomePageValues(values),
      },
      {
        name: 'videoStoriesEnabled',
        label: 'Show Reels Video Section',
        type: 'switch',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'videoStoriesEyebrow',
        label: 'Video Stories Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'videoStoriesTitle',
        label: 'Video Stories Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'videoStoriesSubtitle',
        label: 'Video Stories Subtitle',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'successStoriesLabel',
        label: 'Success Stories Top Label',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'successStoriesHeadingBeforeHighlight',
        label: 'Success Stories Heading Before Highlight',
        type: 'text',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'successStoriesHeadingHighlight',
        label: 'Success Stories Highlight Text',
        type: 'text',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'successStoriesHeadingAfterHighlight',
        label: 'Success Stories Heading After Highlight',
        type: 'text',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'successStoriesSubtitle',
        label: 'Success Stories Subtitle',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'successStoriesCtaText',
        label: 'Success Stories CTA Text',
        type: 'text',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'successStoriesCtaLink',
        label: 'Success Stories CTA URL',
        type: 'url',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'whyChooseUsEyebrow',
        label: 'Why Choose Us Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'whyChooseUsTitle',
        label: 'Why Choose Us Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'whyChooseUsSubtitle',
        label: 'Why Choose Us Subtitle',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'whyChooseUsFeatureCards',
        label: 'Why Choose Us Feature Cards JSON',
        type: 'json',
        rows: 16,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
        description: `Array of top cards with icon, title, description, sortOrder, and isActive. Available icon keys: ${homeWhyChooseUsIconKeys}.`,
      },
      {
        name: 'whyChooseUsApartTitle',
        label: 'What Sets Us Apart Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'whyChooseUsApartItems',
        label: 'What Sets Us Apart Items JSON',
        type: 'json',
        rows: 12,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
        description: `Array of left-panel cards with icon, title, description, sortOrder, and isActive. Available icon keys: ${homeWhyChooseUsIconKeys}.`,
      },
      {
        name: 'whyChooseUsRightEyebrow',
        label: 'Right Column Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'whyChooseUsRightTitle',
        label: 'Right Column Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'whyChooseUsRightParagraph',
        label: 'Right Column Paragraph',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'whyChooseUsChecklistItems',
        label: 'Right Column Checklist JSON',
        type: 'json',
        rows: 10,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
        description: 'Array of checklist items using text, sortOrder, and isActive.',
      },
      {
        name: 'whyChooseUsQuoteText',
        label: 'Quote Bar Text',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'admissionProcessEyebrow',
        label: 'Admission Process Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'admissionProcessHeadingText',
        label: 'Admission Process Heading Text',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'admissionProcessHeadingHighlight',
        label: 'Admission Process Highlight Text',
        type: 'text',
        visible: (values) => isHomePageValues(values),
        description: 'Only this part of the heading is highlighted and underlined on the frontend.',
      },
      {
        name: 'admissionProcessSubtitle',
        label: 'Admission Process Subtitle',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'admissionProcessCenterImage',
        label: 'Admission Process Center Image',
        type: 'url',
        colSpan: 2,
        uploadKind: 'image',
        previewLabel: 'Preview admission process image',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'admissionProcessCards',
        label: 'Admission Process Cards',
        type: 'admission-process-cards',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
        description:
          'Manage the process cards, including icon, title, description, side position, display order, and active status.',
      },
      {
        name: 'studyAbroadEyebrow',
        label: 'Study Abroad Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'studyAbroadTitle',
        label: 'Study Abroad Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'studyAbroadSubtitle',
        label: 'Study Abroad Subtitle',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'studyAbroadCards',
        label: 'Study Abroad Cards',
        type: 'study-abroad-cards',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
        description:
          'Manage the study abroad cards, including icon, title, description, display order, and active status.',
      },
      ...homeHeroStatFieldConfigs.flatMap((statConfig) => {
        const prefix =
          statConfig.key.charAt(0).toUpperCase() + statConfig.key.slice(1);

        return [
          {
            name: `heroStat${prefix}Value`,
            label: `${statConfig.title} Counter Value`,
            type: 'text' as const,
            visible: (values: Record<string, unknown>) => isHomePageValues(values),
          },
          {
            name: `heroStat${prefix}Suffix`,
            label: `${statConfig.title} Counter Suffix`,
            type: 'text' as const,
            placeholder: statConfig.defaultSuffix,
            visible: (values: Record<string, unknown>) => isHomePageValues(values),
          },
          {
            name: `heroStat${prefix}Label`,
            label: `${statConfig.title} Counter Label`,
            type: 'text' as const,
            colSpan: 2 as const,
            visible: (values: Record<string, unknown>) => isHomePageValues(values),
          },
          {
            name: `heroStat${prefix}Visible`,
            label: `${statConfig.title} Counter Visible`,
            type: 'switch' as const,
            visible: (values: Record<string, unknown>) => isHomePageValues(values),
          },
        ];
      }),
      {
        name: 'heroTitle',
        label: 'Hero Title',
        type: 'text',
        visible: (values) => !isHomePageValues(values),
      },
      {
        name: 'heroSubtitle',
        label: 'Hero Subtitle',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => !isHomePageValues(values),
      },
      {
        name: 'heroImage',
        label: 'Hero Image URL',
        type: 'url',
        colSpan: 2,
        uploadKind: 'image',
        previewLabel: 'Preview hero image',
        visible: (values) => !isHomePageValues(values),
      },
      {
        name: 'heroOverlayColor',
        label: 'Hero Overlay Color',
        type: 'text',
        placeholder: defaultPageHeroOverlayColor,
        description: 'Use a dark brand hex color like #052118.',
        visible: (values) => !isHomePageValues(values),
      },
      {
        name: 'heroOverlayOpacity',
        label: 'Hero Overlay Opacity',
        type: 'number',
        min: 0.15,
        max: 0.95,
        description: 'Set a value between 0.15 and 0.95.',
        visible: (values) => !isHomePageValues(values),
      },
      {
        name: 'content',
        label: 'Content Blocks JSON',
        type: 'json',
        rows: 10,
        colSpan: 2,
        placeholder: '{\n  "blocks": []\n}',
      },
      ...defaultSeoFields,
    ],
    columns: [
      { key: 'title', label: 'Title', render: (item) => <div className="font-semibold">{String(item.title ?? '-')}</div> },
      { key: 'slug', label: 'Slug', render: (item) => <span className="text-muted-foreground">{String(item.slug ?? '-')}</span> },
      { key: 'templateType', label: 'Template', render: (item) => badgeForStatus(item.templateType) },
      { key: 'status', label: 'Status', render: (item) => badgeForStatus(item.status) },
      { key: 'updatedAt', label: 'Updated', render: (item) => formatDateTime(String(item.updatedAt ?? '')) },
    ],
    getSearchText: (item) => `${String(item.title ?? '')} ${String(item.slug ?? '')}`,
    buildPayload: (values) => {
      const payload: Record<string, unknown> = {
        title: normalizeString(values.title),
        slug: normalizeString(values.slug),
        pageType: values.pageType,
        templateType: values.templateType,
        status: values.status,
        seoTitle: normalizeString(values.seoTitle),
        seoDescription: normalizeString(values.seoDescription),
        seoKeywords: Array.isArray(values.seoKeywords) ? values.seoKeywords : [],
        ogImage: normalizeString(values.ogImage),
        canonicalUrl: normalizeString(values.canonicalUrl),
      };

      if (!isHomePageValues(values)) {
        const content = parsePageContentObject(values.content);
        const heroOverlayColor =
          normalizeString(values.heroOverlayColor) || defaultPageHeroOverlayColor;
        const rawHeroOverlayOpacity =
          typeof values.heroOverlayOpacity === 'number'
            ? values.heroOverlayOpacity
            : Number.parseFloat(String(values.heroOverlayOpacity ?? ''));

        content.heroOverlayColor = isValidHexColor(heroOverlayColor)
          ? heroOverlayColor
          : defaultPageHeroOverlayColor;
        content.heroOverlayOpacity = Number.isFinite(rawHeroOverlayOpacity)
          ? clampNumber(rawHeroOverlayOpacity, 0.15, 0.95)
          : defaultPageHeroOverlayOpacity;

        return {
          ...payload,
          heroTitle: normalizeString(values.heroTitle),
          heroSubtitle: normalizeString(values.heroSubtitle),
          heroImage: normalizeString(values.heroImage),
          content,
        };
      }

      const heroBackgroundImage =
        normalizeString(values.heroBackgroundImage) || homeHeroFallbackContent.backgroundImage;
      const heroRightImage =
        normalizeString(values.heroRightImage) || homeHeroFallbackContent.rightImage;

      if (!heroBackgroundImage) {
        throw new Error('Hero background image is required for the Home page.');
      }

      if (!heroRightImage) {
        throw new Error('Hero right-side image is required for the Home page.');
      }

      const heroHighlightColor =
        normalizeString(values.heroHighlightColor) || homeHeroFallbackContent.highlightedWordColor;

      if (!isValidHexColor(heroHighlightColor)) {
        throw new Error('Highlighted word color must be a valid hex color like #5DFF72.');
      }

      const content = parsePageContentObject(values.content);
      const homeHeroStats = homeHeroStatFieldConfigs.map((statConfig) => {
        const prefix =
          statConfig.key.charAt(0).toUpperCase() + statConfig.key.slice(1);

        return {
          value:
            normalizeString(values[`heroStat${prefix}Value`]) || statConfig.defaultValue,
          suffix:
            normalizeString(values[`heroStat${prefix}Suffix`]) || statConfig.defaultSuffix,
          label:
            normalizeString(values[`heroStat${prefix}Label`]) || statConfig.defaultLabel,
          isVisible: values[`heroStat${prefix}Visible`] !== false,
        };
      });

      content.heroBadgeText =
        normalizeString(values.heroBadgeText) || homeHeroFallbackContent.badgeText;
      content.heroHeadingText =
        normalizeString(values.heroHeadingText) || homeHeroFallbackContent.headingText;
      content.heroHighlightWord =
        normalizeString(values.heroHighlightWord) || homeHeroFallbackContent.highlightedWord;
      content.heroHighlightColor = heroHighlightColor;
      content.heroDescription =
        normalizeString(values.heroDescription) || homeHeroFallbackContent.description;
      content.heroPrimaryCtaText =
        normalizeString(values.heroPrimaryCtaText) || homeHeroFallbackContent.primaryCtaText;
      content.heroPrimaryCtaLink =
        normalizeString(values.heroPrimaryCtaLink) || homeHeroFallbackContent.primaryCtaLink;
      content.heroSecondaryCtaText =
        normalizeString(values.heroSecondaryCtaText) || homeHeroFallbackContent.secondaryCtaText;
      content.heroSecondaryCtaLink =
        normalizeString(values.heroSecondaryCtaLink) || homeHeroFallbackContent.secondaryCtaLink;
      content.heroBackgroundImage = heroBackgroundImage;
      content.heroRightImage = heroRightImage;
      content.videoStoriesEnabled = values.videoStoriesEnabled !== false;
      content.videoStoriesEyebrow =
        normalizeString(values.videoStoriesEyebrow) ||
        homeVideoStoriesFallbackContent.eyebrow;
      content.videoStoriesTitle =
        normalizeString(values.videoStoriesTitle) ||
        homeVideoStoriesFallbackContent.title;
      content.videoStoriesSubtitle =
        normalizeString(values.videoStoriesSubtitle) ||
        homeVideoStoriesFallbackContent.subtitle;
      content.successStoriesLabel =
        normalizeString(values.successStoriesLabel) || homeSuccessStoriesFallbackContent.label;
      content.successStoriesHeadingBeforeHighlight =
        normalizeString(values.successStoriesHeadingBeforeHighlight) ||
        homeSuccessStoriesFallbackContent.headingBeforeHighlight;
      content.successStoriesHeadingHighlight =
        normalizeString(values.successStoriesHeadingHighlight) ||
        homeSuccessStoriesFallbackContent.headingHighlight;
      content.successStoriesHeadingAfterHighlight =
        normalizeString(values.successStoriesHeadingAfterHighlight) ||
        homeSuccessStoriesFallbackContent.headingAfterHighlight;
      content.successStoriesSubtitle =
        normalizeString(values.successStoriesSubtitle) ||
        homeSuccessStoriesFallbackContent.subtitle;
      content.successStoriesCtaText =
        normalizeString(values.successStoriesCtaText) ||
        homeSuccessStoriesFallbackContent.ctaText;
      content.successStoriesCtaLink =
        normalizeString(values.successStoriesCtaLink) ||
        homeSuccessStoriesFallbackContent.ctaLink;
      content.whyChooseUsEyebrow =
        normalizeString(values.whyChooseUsEyebrow) ||
        homeWhyChooseUsFallbackContent.eyebrow;
      content.whyChooseUsTitle =
        normalizeString(values.whyChooseUsTitle) ||
        homeWhyChooseUsFallbackContent.title;
      content.whyChooseUsSubtitle =
        normalizeString(values.whyChooseUsSubtitle) ||
        homeWhyChooseUsFallbackContent.subtitle;
      content.whyChooseUsFeatureCards =
        Array.isArray(values.whyChooseUsFeatureCards) &&
        values.whyChooseUsFeatureCards.length > 0
          ? values.whyChooseUsFeatureCards
          : homeWhyChooseUsFallbackContent.featureCards;
      content.whyChooseUsApartTitle =
        normalizeString(values.whyChooseUsApartTitle) ||
        homeWhyChooseUsFallbackContent.apartTitle;
      content.whyChooseUsApartItems =
        Array.isArray(values.whyChooseUsApartItems) &&
        values.whyChooseUsApartItems.length > 0
          ? values.whyChooseUsApartItems
          : homeWhyChooseUsFallbackContent.apartItems;
      content.whyChooseUsRightEyebrow =
        normalizeString(values.whyChooseUsRightEyebrow) ||
        homeWhyChooseUsFallbackContent.rightEyebrow;
      content.whyChooseUsRightTitle =
        normalizeString(values.whyChooseUsRightTitle) ||
        homeWhyChooseUsFallbackContent.rightTitle;
      content.whyChooseUsRightParagraph =
        normalizeString(values.whyChooseUsRightParagraph) ||
        homeWhyChooseUsFallbackContent.rightParagraph;
      content.whyChooseUsChecklistItems =
        Array.isArray(values.whyChooseUsChecklistItems) &&
        values.whyChooseUsChecklistItems.length > 0
          ? values.whyChooseUsChecklistItems
          : homeWhyChooseUsFallbackContent.checklistItems;
      content.whyChooseUsQuoteText =
        normalizeString(values.whyChooseUsQuoteText) ||
        homeWhyChooseUsFallbackContent.quoteText;
      content.admissionProcessEyebrow =
        normalizeString(values.admissionProcessEyebrow) ||
        homeAdmissionProcessFallbackContent.eyebrow;
      content.admissionProcessHeadingText =
        normalizeString(values.admissionProcessHeadingText) ||
        homeAdmissionProcessFallbackContent.headingText;
      content.admissionProcessHeadingHighlight =
        normalizeString(values.admissionProcessHeadingHighlight) ||
        homeAdmissionProcessFallbackContent.headingHighlight;
      content.admissionProcessSubtitle =
        normalizeString(values.admissionProcessSubtitle) ||
        homeAdmissionProcessFallbackContent.subtitle;
      content.admissionProcessCenterImage =
        normalizeString(values.admissionProcessCenterImage) ||
        homeAdmissionProcessFallbackContent.centerImage;
      content.admissionProcessCards =
        Array.isArray(values.admissionProcessCards) &&
        values.admissionProcessCards.length > 0
          ? values.admissionProcessCards
          : homeAdmissionProcessFallbackContent.cards;
      content.studyAbroadEyebrow =
        normalizeString(values.studyAbroadEyebrow) ||
        homeStudyAbroadFallbackContent.eyebrow;
      content.studyAbroadTitle =
        normalizeString(values.studyAbroadTitle) ||
        homeStudyAbroadFallbackContent.title;
      content.studyAbroadSubtitle =
        normalizeString(values.studyAbroadSubtitle) ||
        homeStudyAbroadFallbackContent.subtitle;
      content.studyAbroadCards =
        Array.isArray(values.studyAbroadCards) &&
        values.studyAbroadCards.length > 0
          ? values.studyAbroadCards
          : homeStudyAbroadFallbackContent.cards;
      content.heroStats = homeHeroStats;

      return {
        ...payload,
        heroTitle: normalizeString(values.heroHeadingText) || homeHeroFallbackContent.headingText,
        heroSubtitle:
          normalizeString(values.heroDescription) || homeHeroFallbackContent.description,
        content,
      };
    },
    getEditValues: (item) => {
      const content = parsePageContentObject(item.content);
      const pageHeroTitle = normalizeString(item.heroTitle);
      const pageHeroSubtitle = normalizeString(item.heroSubtitle);

      return {
        ...item,
        content: toJsonTextareaValue(item.content),
        seoKeywords: toKeywordsValue(item.seoKeywords),
        heroOverlayColor:
          readContentString(content, 'heroOverlayColor') ??
          defaultPageHeroOverlayColor,
        heroOverlayOpacity:
          readContentNumber(content, 'heroOverlayOpacity') ??
          defaultPageHeroOverlayOpacity,
        heroBadgeText:
          readContentString(content, 'heroBadgeText') ?? homeHeroFallbackContent.badgeText,
        heroHeadingText:
          readContentString(content, 'heroHeadingText') ||
          pageHeroTitle ||
          homeHeroFallbackContent.headingText,
        heroHighlightWord:
          readContentString(content, 'heroHighlightWord') ??
          homeHeroFallbackContent.highlightedWord,
        heroHighlightColor:
          readContentString(content, 'heroHighlightColor') ??
          homeHeroFallbackContent.highlightedWordColor,
        heroDescription:
          readContentString(content, 'heroDescription') ||
          pageHeroSubtitle ||
          homeHeroFallbackContent.description,
        heroPrimaryCtaText:
          readContentString(content, 'heroPrimaryCtaText') ??
          homeHeroFallbackContent.primaryCtaText,
        heroPrimaryCtaLink:
          readContentString(content, 'heroPrimaryCtaLink') ??
          homeHeroFallbackContent.primaryCtaLink,
        heroSecondaryCtaText:
          readContentString(content, 'heroSecondaryCtaText') ??
          homeHeroFallbackContent.secondaryCtaText,
        heroSecondaryCtaLink:
          readContentString(content, 'heroSecondaryCtaLink') ??
          homeHeroFallbackContent.secondaryCtaLink,
        heroBackgroundImage:
          readContentString(content, 'heroBackgroundImage') ??
          homeHeroFallbackContent.backgroundImage,
        heroRightImage:
          readContentString(content, 'heroRightImage') ??
          homeHeroFallbackContent.rightImage,
        videoStoriesEnabled:
          typeof content.videoStoriesEnabled === 'boolean'
            ? content.videoStoriesEnabled
            : true,
        videoStoriesEyebrow:
          readContentString(content, 'videoStoriesEyebrow') ??
          homeVideoStoriesFallbackContent.eyebrow,
        videoStoriesTitle:
          readContentString(content, 'videoStoriesTitle') ??
          homeVideoStoriesFallbackContent.title,
        videoStoriesSubtitle:
          readContentString(content, 'videoStoriesSubtitle') ??
          homeVideoStoriesFallbackContent.subtitle,
        successStoriesLabel:
          readContentString(content, 'successStoriesLabel') ??
          homeSuccessStoriesFallbackContent.label,
        successStoriesHeadingBeforeHighlight:
          readContentString(content, 'successStoriesHeadingBeforeHighlight') ??
          homeSuccessStoriesFallbackContent.headingBeforeHighlight,
        successStoriesHeadingHighlight:
          readContentString(content, 'successStoriesHeadingHighlight') ??
          homeSuccessStoriesFallbackContent.headingHighlight,
        successStoriesHeadingAfterHighlight:
          readContentString(content, 'successStoriesHeadingAfterHighlight') ??
          homeSuccessStoriesFallbackContent.headingAfterHighlight,
        successStoriesSubtitle:
          readContentString(content, 'successStoriesSubtitle') ??
          homeSuccessStoriesFallbackContent.subtitle,
        successStoriesCtaText:
          readContentString(content, 'successStoriesCtaText') ??
          homeSuccessStoriesFallbackContent.ctaText,
        successStoriesCtaLink:
          readContentString(content, 'successStoriesCtaLink') ??
          homeSuccessStoriesFallbackContent.ctaLink,
        whyChooseUsEyebrow:
          readContentString(content, 'whyChooseUsEyebrow') ??
          homeWhyChooseUsFallbackContent.eyebrow,
        whyChooseUsTitle:
          readContentString(content, 'whyChooseUsTitle') ??
          homeWhyChooseUsFallbackContent.title,
        whyChooseUsSubtitle:
          readContentString(content, 'whyChooseUsSubtitle') ??
          homeWhyChooseUsFallbackContent.subtitle,
        whyChooseUsFeatureCards: toJsonTextareaValue(
          content.whyChooseUsFeatureCards ?? homeWhyChooseUsFallbackContent.featureCards,
        ),
        whyChooseUsApartTitle:
          readContentString(content, 'whyChooseUsApartTitle') ??
          homeWhyChooseUsFallbackContent.apartTitle,
        whyChooseUsApartItems: toJsonTextareaValue(
          content.whyChooseUsApartItems ?? homeWhyChooseUsFallbackContent.apartItems,
        ),
        whyChooseUsRightEyebrow:
          readContentString(content, 'whyChooseUsRightEyebrow') ??
          homeWhyChooseUsFallbackContent.rightEyebrow,
        whyChooseUsRightTitle:
          readContentString(content, 'whyChooseUsRightTitle') ??
          homeWhyChooseUsFallbackContent.rightTitle,
        whyChooseUsRightParagraph:
          readContentString(content, 'whyChooseUsRightParagraph') ??
          homeWhyChooseUsFallbackContent.rightParagraph,
        whyChooseUsChecklistItems: toJsonTextareaValue(
          content.whyChooseUsChecklistItems ?? homeWhyChooseUsFallbackContent.checklistItems,
        ),
        whyChooseUsQuoteText:
          readContentString(content, 'whyChooseUsQuoteText') ??
          homeWhyChooseUsFallbackContent.quoteText,
        admissionProcessEyebrow:
          readContentString(content, 'admissionProcessEyebrow') ??
          homeAdmissionProcessFallbackContent.eyebrow,
        admissionProcessHeadingText:
          readContentString(content, 'admissionProcessHeadingText') ??
          homeAdmissionProcessFallbackContent.headingText,
        admissionProcessHeadingHighlight:
          readContentString(content, 'admissionProcessHeadingHighlight') ??
          homeAdmissionProcessFallbackContent.headingHighlight,
        admissionProcessSubtitle:
          readContentString(content, 'admissionProcessSubtitle') ??
          homeAdmissionProcessFallbackContent.subtitle,
        admissionProcessCenterImage:
          readContentString(content, 'admissionProcessCenterImage') ??
          homeAdmissionProcessFallbackContent.centerImage,
        admissionProcessCards:
          content.admissionProcessCards ?? homeAdmissionProcessFallbackContent.cards,
        studyAbroadEyebrow:
          readContentString(content, 'studyAbroadEyebrow') ??
          homeStudyAbroadFallbackContent.eyebrow,
        studyAbroadTitle:
          readContentString(content, 'studyAbroadTitle') ??
          homeStudyAbroadFallbackContent.title,
        studyAbroadSubtitle:
          readContentString(content, 'studyAbroadSubtitle') ??
          homeStudyAbroadFallbackContent.subtitle,
        studyAbroadCards:
          content.studyAbroadCards ?? homeStudyAbroadFallbackContent.cards,
        heroStatYearsExperienceValue:
          normalizeString(readHomeHeroStat(content, 0)?.value) ||
          homeHeroStatFieldConfigs[0].defaultValue,
        heroStatYearsExperienceSuffix:
          normalizeString(readHomeHeroStat(content, 0)?.suffix) ||
          homeHeroStatFieldConfigs[0].defaultSuffix,
        heroStatYearsExperienceLabel:
          normalizeString(readHomeHeroStat(content, 0)?.label) ||
          homeHeroStatFieldConfigs[0].defaultLabel,
        heroStatYearsExperienceVisible:
          readHomeHeroStat(content, 0)?.isVisible !== false,
        heroStatPartnerCollegesValue:
          normalizeString(readHomeHeroStat(content, 1)?.value) ||
          homeHeroStatFieldConfigs[1].defaultValue,
        heroStatPartnerCollegesSuffix:
          normalizeString(readHomeHeroStat(content, 1)?.suffix) ||
          homeHeroStatFieldConfigs[1].defaultSuffix,
        heroStatPartnerCollegesLabel:
          normalizeString(readHomeHeroStat(content, 1)?.label) ||
          homeHeroStatFieldConfigs[1].defaultLabel,
        heroStatPartnerCollegesVisible:
          readHomeHeroStat(content, 1)?.isVisible !== false,
        heroStatSuccessfulAdmissionsValue:
          normalizeString(readHomeHeroStat(content, 2)?.value) ||
          homeHeroStatFieldConfigs[2].defaultValue,
        heroStatSuccessfulAdmissionsSuffix:
          normalizeString(readHomeHeroStat(content, 2)?.suffix) ||
          homeHeroStatFieldConfigs[2].defaultSuffix,
        heroStatSuccessfulAdmissionsLabel:
          normalizeString(readHomeHeroStat(content, 2)?.label) ||
          homeHeroStatFieldConfigs[2].defaultLabel,
        heroStatSuccessfulAdmissionsVisible:
          readHomeHeroStat(content, 2)?.isVisible !== false,
        heroStatTransparentProcessValue:
          normalizeString(readHomeHeroStat(content, 3)?.value) ||
          homeHeroStatFieldConfigs[3].defaultValue,
        heroStatTransparentProcessSuffix:
          normalizeString(readHomeHeroStat(content, 3)?.suffix) ||
          homeHeroStatFieldConfigs[3].defaultSuffix,
        heroStatTransparentProcessLabel:
          normalizeString(readHomeHeroStat(content, 3)?.label) ||
          homeHeroStatFieldConfigs[3].defaultLabel,
        heroStatTransparentProcessVisible:
          readHomeHeroStat(content, 3)?.isVisible !== false,
      };
    },
  },
  'study-destinations': {
    key: 'study-destinations',
    title: 'Study Destinations',
    singular: 'Destination',
    description: 'Control destination cards, menu visibility, landing content, and SEO.',
    endpoint: '/study-destinations',
    slugSourceField: 'title',
    slugField: 'slug',
    previewUrlBuilder: (item) => {
      const slug = String(item.slug ?? '').trim();
      return slug ? `${siteBaseUrl}${getStudyDestinationPreviewPath(slug)}` : null;
    },
    statusToggle: {
      fieldName: 'status',
      activeValue: 'PUBLISHED',
      inactiveValue: 'DRAFT',
    },
    createButtonLabel: 'New destination',
    emptyTitle: 'No destinations yet',
    emptyDescription: 'Add a study destination to populate menus and destination cards.',
    defaultValues: {
      title: '',
      slug: '',
      country: '',
      shortDescription: '',
      featuredImage: '',
      heroOverlayColor: defaultPageHeroOverlayColor,
      heroOverlayOpacity: defaultPageHeroOverlayOpacity,
      homepageHighlights: '',
      homepageButtonText: '',
      homepageButtonUrl: '',
      content: '',
      isFeatured: false,
      showInMenu: false,
      sortOrder: 0,
      status: 'DRAFT',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      ogImage: '',
      canonicalUrl: '',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'country', label: 'Country', type: 'text', required: true },
      { name: 'shortDescription', label: 'Short Description', type: 'textarea', rows: 4, colSpan: 2 },
      { name: 'featuredImage', label: 'Featured Image URL', type: 'url', colSpan: 2, uploadKind: 'image', previewLabel: 'Preview featured image' },
      {
        name: 'heroOverlayColor',
        label: 'Hero Overlay Color',
        type: 'text',
        colSpan: 1,
        description: 'Hex color like #052118 used on destination hero image.',
      },
      {
        name: 'heroOverlayOpacity',
        label: 'Hero Overlay Opacity',
        type: 'number',
        colSpan: 1,
        min: 0.35,
        max: 0.96,
      },
      {
        name: 'homepageHighlights',
        label: 'Homepage Features',
        type: 'keywords',
        colSpan: 2,
        description: 'Comma-separated feature list shown inside the homepage destination card.',
      },
      {
        name: 'homepageButtonText',
        label: 'Homepage Button Text',
        type: 'text',
        colSpan: 2,
      },
      {
        name: 'homepageButtonUrl',
        label: 'Homepage Button URL',
        type: 'text',
        colSpan: 2,
        description: 'Supports internal paths like /mbbs-bangladesh or full external URLs.',
      },
      { name: 'status', label: 'Active Status', type: 'select', required: true, options: publicationStatusOptions },
      { name: 'sortOrder', label: 'Display Order', type: 'number', min: 0, required: true },
      { name: 'isFeatured', label: 'Featured', type: 'switch' },
      { name: 'showInMenu', label: 'Show In Menu', type: 'switch' },
      { name: 'content', label: 'Page Content JSON', type: 'json', rows: 10, colSpan: 2 },
      ...defaultSeoFields,
    ],
    columns: [
      { key: 'title', label: 'Title', render: (item) => <div className="font-semibold">{String(item.title ?? '-')}</div> },
      { key: 'country', label: 'Country', render: (item) => String(item.country ?? '-') },
      { key: 'showInMenu', label: 'Menu', render: (item) => <Badge variant={item.showInMenu ? 'success' : 'outline'}>{item.showInMenu ? 'Visible' : 'Hidden'}</Badge> },
      { key: 'status', label: 'Status', render: (item) => badgeForStatus(item.status) },
      { key: 'sortOrder', label: 'Order', render: (item) => String(item.sortOrder ?? 0) },
    ],
    getSearchText: (item) => `${String(item.title ?? '')} ${String(item.country ?? '')} ${String(item.slug ?? '')}`,
    getEditValues: (item) => ({
      ...item,
      homepageHighlights: toKeywordsValue(
        Array.isArray((item.content as Record<string, unknown> | null)?.highlights)
          ? ((item.content as Record<string, unknown>).highlights as string[])
          : [],
      ),
      homepageButtonText: readContentString(
        isRecord(item.content) ? item.content : {},
        'ctaText',
      ) ?? '',
      homepageButtonUrl: readContentString(
        isRecord(item.content) ? item.content : {},
        'ctaUrl',
      ) ?? '',
      heroOverlayColor:
        readContentString(isRecord(item.content) ? item.content : {}, 'heroOverlayColor') ??
        defaultPageHeroOverlayColor,
      heroOverlayOpacity:
        readContentNumber(isRecord(item.content) ? item.content : {}, 'heroOverlayOpacity') ??
        defaultPageHeroOverlayOpacity,
      content: toJsonTextareaValue(item.content),
      seoKeywords: toKeywordsValue(item.seoKeywords),
    }),
    buildPayload: (values) => {
      const {
        homepageHighlights: _homepageHighlights,
        homepageButtonText: _homepageButtonText,
        homepageButtonUrl: _homepageButtonUrl,
        heroOverlayColor: _heroOverlayColor,
        heroOverlayOpacity: _heroOverlayOpacity,
        ...baseValues
      } = values;
      const existingContent =
        baseValues.content && typeof baseValues.content === 'object' && !Array.isArray(baseValues.content)
          ? { ...(baseValues.content as Record<string, unknown>) }
          : {};
      const homepageHighlights = Array.isArray(_homepageHighlights)
        ? _homepageHighlights.filter(
            (item): item is string => typeof item === 'string' && item.trim().length > 0,
          )
        : [];
      const homepageButtonText = normalizeString(_homepageButtonText);
      const homepageButtonUrl = normalizeString(_homepageButtonUrl);
      const heroOverlayColor =
        normalizeString(_heroOverlayColor) || defaultPageHeroOverlayColor;
      const rawHeroOverlayOpacity =
        typeof _heroOverlayOpacity === 'number'
          ? _heroOverlayOpacity
          : Number.parseFloat(String(_heroOverlayOpacity ?? ''));

      const content = {
        ...existingContent,
        highlights: homepageHighlights,
        ctaText: homepageButtonText,
        ctaUrl: homepageButtonUrl,
        heroOverlayColor: isValidHexColor(heroOverlayColor)
          ? heroOverlayColor
          : defaultPageHeroOverlayColor,
        heroOverlayOpacity: Number.isFinite(rawHeroOverlayOpacity)
          ? clampNumber(rawHeroOverlayOpacity, 0.35, 0.96)
          : defaultPageHeroOverlayOpacity,
      };

      return {
        ...baseValues,
        content,
      };
    },
  },
  'medical-colleges': {
    key: 'medical-colleges',
    title: 'Medical Colleges',
    singular: 'Medical College',
    description: 'Manage fee structure cards, detailed college pages, and featured selections.',
    endpoint: '/medical-colleges',
    slugSourceField: 'name',
    slugField: 'slug',
    previewUrlBuilder: (item) => {
      const slug = String(item.slug ?? '').trim();
      return slug ? `${siteBaseUrl}/medical-colleges/${slug}` : null;
    },
    statusToggle: {
      fieldName: 'status',
      activeValue: 'PUBLISHED',
      inactiveValue: 'DRAFT',
    },
    createButtonLabel: 'New college',
    emptyTitle: 'No colleges yet',
    emptyDescription: 'Add a medical college to power the fee structure and college detail pages.',
    defaultValues: {
      studyDestinationId: '',
      name: '',
      slug: '',
      country: '',
      city: '',
      image: '',
      establishedYear: '',
      shortDescription: '',
      tuitionFee: '',
      hostelFee: '',
      totalFee: '',
      sortOrder: 0,
      eligibility: '',
      admissionProcess: '',
      facilities: '',
      gallery: '',
      contentBlocks: '',
      isFeatured: false,
      status: 'DRAFT',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      ogImage: '',
      canonicalUrl: '',
    },
    fields: [
      { name: 'name', label: 'College Name', type: 'text', required: true },
      { name: 'slug', label: 'Details Page Slug', type: 'text', required: true },
      { name: 'country', label: 'Country', type: 'text', required: true },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'studyDestinationId', label: 'Study Destination ID', type: 'text', placeholder: 'Optional destination UUID' },
      { name: 'image', label: 'College Image', type: 'url', colSpan: 2, uploadKind: 'image', previewLabel: 'Preview college image' },
      { name: 'establishedYear', label: 'Established Year', type: 'text' },
      { name: 'sortOrder', label: 'Display Order', type: 'number', required: true, min: 0 },
      { name: 'shortDescription', label: 'Description', type: 'textarea', rows: 4, colSpan: 2 },
      { name: 'tuitionFee', label: 'Indicative Fee', type: 'number', min: 0 },
      { name: 'hostelFee', label: 'Hostel Fee', type: 'number', min: 0 },
      { name: 'totalFee', label: 'Total Fee', type: 'number', min: 0 },
      { name: 'eligibility', label: 'Eligibility', type: 'textarea', rows: 3, colSpan: 2 },
      { name: 'status', label: 'Status', type: 'select', required: true, options: publicationStatusOptions },
      { name: 'isFeatured', label: 'Featured / Homepage Visible', type: 'switch' },
      { name: 'admissionProcess', label: 'Admission Process JSON', type: 'json', rows: 8, colSpan: 2 },
      { name: 'facilities', label: 'Badges / Features', type: 'keywords', colSpan: 2, description: 'Comma-separated badges shown on the homepage card.' },
      { name: 'gallery', label: 'Gallery JSON', type: 'json', rows: 8, colSpan: 2 },
      { name: 'contentBlocks', label: 'Advanced Content Blocks JSON', type: 'json', rows: 10, colSpan: 2 },
      ...defaultSeoFields,
    ],
    columns: [
      { key: 'name', label: 'College', render: (item) => <div className="font-semibold">{String(item.name ?? '-')}</div> },
      { key: 'location', label: 'Location', render: (item) => [String(item.city ?? '').trim(), String(item.country ?? '').trim()].filter(Boolean).join(', ') || '-' },
      { key: 'fee', label: 'Indicative Fee', render: (item) => item.tuitionFee != null ? `$${Number(item.tuitionFee).toLocaleString('en-US')}` : '-' },
      { key: 'featured', label: 'Homepage', render: (item) => <Badge variant={item.isFeatured ? 'success' : 'outline'}>{item.isFeatured ? 'Visible' : 'Hidden'}</Badge> },
      { key: 'sortOrder', label: 'Order', render: (item) => String(item.sortOrder ?? 0) },
      { key: 'status', label: 'Status', render: (item) => badgeForStatus(item.status) },
    ],
    getSearchText: (item) => `${String(item.name ?? '')} ${String(item.country ?? '')} ${String(item.city ?? '')}`,
    getEditValues: (item) => ({
      ...item,
      studyDestinationId: String(item.studyDestinationId ?? ''),
      image: String(item.image ?? item.featuredImage ?? ''),
      establishedYear: String(((item.contentBlocks as Record<string, unknown> | null)?.established) ?? ''),
      admissionProcess: toJsonTextareaValue(item.admissionProcess),
      facilities: toKeywordsValue(item.facilities),
      gallery: toJsonTextareaValue(item.gallery),
      contentBlocks: toJsonTextareaValue(item.contentBlocks),
      seoKeywords: toKeywordsValue(item.seoKeywords),
    }),
    buildPayload: (values) => {
      const existingContentBlocks =
        values.contentBlocks && typeof values.contentBlocks === 'object' && !Array.isArray(values.contentBlocks)
          ? { ...(values.contentBlocks as Record<string, unknown>) }
          : {};
      const badgeFeatures = Array.isArray(values.facilities)
        ? values.facilities.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];
      const establishedYear =
        typeof values.establishedYear === 'string' ? values.establishedYear.trim() : '';

      const contentBlocks = {
        ...existingContentBlocks,
        ...(establishedYear ? { established: establishedYear } : {}),
      };

      return {
        ...values,
        facilities: badgeFeatures,
        contentBlocks,
      };
    },
  },
  gallery: {
    key: 'gallery',
    title: 'Gallery',
    singular: 'Gallery Item',
    description: 'Upload-ready gallery items for images and videos shown across the frontend.',
    endpoint: '/gallery',
    statusToggle: {
      fieldName: 'status',
      activeValue: 'ACTIVE',
      inactiveValue: 'INACTIVE',
    },
    createButtonLabel: 'New gallery item',
    emptyTitle: 'No gallery items yet',
    emptyDescription: 'Add images or video items for the gallery page.',
    defaultValues: {
      title: '',
      type: 'IMAGE',
      url: '',
      thumbnail: '',
      category: '',
      sortOrder: 0,
      status: 'ACTIVE',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', required: true, options: galleryTypeOptions },
      { name: 'url', label: 'Asset URL', type: 'url', required: true, colSpan: 2, uploadKind: 'image', previewLabel: 'Preview asset' },
      { name: 'thumbnail', label: 'Thumbnail URL', type: 'url', colSpan: 2, uploadKind: 'videoThumbnail', previewLabel: 'Preview thumbnail' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'sortOrder', label: 'Sort Order', type: 'number', required: true, min: 0 },
      { name: 'status', label: 'Status', type: 'select', required: true, options: simpleStatusOptions },
    ],
    columns: [
      { key: 'title', label: 'Title', render: (item) => <div className="font-semibold">{String(item.title ?? '-')}</div> },
      { key: 'type', label: 'Type', render: (item) => <Badge variant="info">{formatLabel(String(item.type ?? ''))}</Badge> },
      { key: 'category', label: 'Category', render: (item) => String(item.category ?? '-') },
      { key: 'status', label: 'Status', render: (item) => badgeForStatus(item.status) },
      { key: 'sortOrder', label: 'Order', render: (item) => String(item.sortOrder ?? 0) },
    ],
    getSearchText: (item) => `${String(item.title ?? '')} ${String(item.category ?? '')}`,
  },
  'home-reels': {
    key: 'home-reels',
    title: 'Reels Videos',
    singular: 'Reel Video',
    description: 'Manage homepage reel cards with thumbnails, future Wistia fields, status, and display order.',
    endpoint: '/home-reels',
    statusToggle: {
      fieldName: 'status',
      activeValue: 'ACTIVE',
      inactiveValue: 'INACTIVE',
    },
    createButtonLabel: 'Add reel',
    emptyTitle: 'No reels videos yet',
    emptyDescription: 'Add reel cards to populate the homepage video stories slider.',
    defaultValues: {
      title: '',
      thumbnail: '',
      wistiaVideoId: '',
      wistiaEmbedCode: '',
      sortOrder: 0,
      status: 'ACTIVE',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      {
        name: 'thumbnail',
        label: 'Thumbnail Image',
        type: 'url',
        colSpan: 2,
        uploadKind: 'image',
        previewLabel: 'Preview thumbnail',
      },
      {
        name: 'wistiaVideoId',
        label: 'Wistia Video ID',
        type: 'text',
        description: 'Optional for now. Example: ab12cd34ef',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: simpleStatusOptions,
      },
      {
        name: 'wistiaEmbedCode',
        label: 'Wistia Embed Code',
        type: 'textarea',
        rows: 5,
        colSpan: 2,
        description: 'Optional for now. Paste the full Wistia embed snippet when ready.',
      },
      { name: 'sortOrder', label: 'Display Order', type: 'number', required: true, min: 0 },
    ],
    columns: [
      { key: 'title', label: 'Title', render: (item) => <div className="font-semibold">{String(item.title ?? '-')}</div> },
      {
        key: 'thumbnail',
        label: 'Thumbnail',
        render: (item) => (String(item.thumbnail ?? '').trim() ? 'Uploaded' : 'Not set'),
      },
      {
        key: 'wistia',
        label: 'Wistia',
        render: (item) =>
          String(item.wistiaVideoId ?? '').trim() || String(item.wistiaEmbedCode ?? '').trim()
            ? 'Ready'
            : 'Placeholder',
      },
      { key: 'status', label: 'Status', render: (item) => badgeForStatus(item.status) },
      { key: 'sortOrder', label: 'Order', render: (item) => String(item.sortOrder ?? 0) },
    ],
    getSearchText: (item) =>
      `${String(item.title ?? '')} ${String(item.wistiaVideoId ?? '')} ${String(item.wistiaEmbedCode ?? '')}`,
  },
  blogs: {
    key: 'blogs',
    title: 'Knowledge Hub',
    singular: 'Blog',
    description: 'Publish knowledge hub articles with pinned sorting and SEO metadata.',
    endpoint: '/blogs',
    listEndpoint: '/blogs?pageSize=50',
    slugSourceField: 'title',
    slugField: 'slug',
    previewUrlBuilder: (item) => {
      const slug = String(item.slug ?? '').trim();
      return slug ? `${siteBaseUrl}/blog/${slug}` : null;
    },
    statusToggle: {
      fieldName: 'status',
      activeValue: 'PUBLISHED',
      inactiveValue: 'DRAFT',
    },
    createButtonLabel: 'New blog',
    emptyTitle: 'No blog posts yet',
    emptyDescription: 'Create a knowledge hub article to populate the blog listing.',
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      featuredImage: '',
      content: '',
      category: '',
      author: '',
      isPinned: false,
      status: 'DRAFT',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      ogImage: '',
      canonicalUrl: '',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'author', label: 'Author', type: 'text' },
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 4, colSpan: 2 },
      { name: 'featuredImage', label: 'Featured Image URL', type: 'url', colSpan: 2, uploadKind: 'image', previewLabel: 'Preview featured image' },
      { name: 'status', label: 'Status', type: 'select', required: true, options: publicationStatusOptions },
      { name: 'isPinned', label: 'Pinned', type: 'switch' },
      { name: 'content', label: 'Content JSON', type: 'json', rows: 10, colSpan: 2 },
      ...defaultSeoFields,
    ],
    columns: [
      { key: 'title', label: 'Title', render: (item) => <div className="font-semibold">{String(item.title ?? '-')}</div> },
      { key: 'category', label: 'Category', render: (item) => String(item.category ?? '-') },
      { key: 'author', label: 'Author', render: (item) => String(item.author ?? '-') },
      { key: 'pinned', label: 'Pinned', render: (item) => <Badge variant={item.isPinned ? 'success' : 'outline'}>{item.isPinned ? 'Pinned' : 'Normal'}</Badge> },
      { key: 'status', label: 'Status', render: (item) => badgeForStatus(item.status) },
    ],
    getSearchText: (item) => `${String(item.title ?? '')} ${String(item.category ?? '')} ${String(item.author ?? '')}`,
    getListItems: (payload) =>
      Array.isArray((payload as { items?: ResourceItem[] } | undefined)?.items)
        ? ((payload as { items: ResourceItem[] }).items ?? [])
        : [],
    getEditValues: (item) => ({
      ...item,
      content: toJsonTextareaValue(item.content),
      seoKeywords: toKeywordsValue(item.seoKeywords),
    }),
  },
  notices: {
    key: 'notices',
    title: 'Notices & Downloads',
    singular: 'Notice',
    description: 'Publish admission notices, attach PDFs, and control pinned ordering.',
    endpoint: '/notices',
    slugSourceField: 'title',
    slugField: 'slug',
    previewUrlBuilder: (item) => {
      const slug = String(item.slug ?? '').trim();
      return slug ? `${siteBaseUrl}/admission-notices/${slug}` : null;
    },
    statusToggle: {
      fieldName: 'status',
      activeValue: 'PUBLISHED',
      inactiveValue: 'DRAFT',
    },
    createButtonLabel: 'New notice',
    emptyTitle: 'No notices yet',
    emptyDescription: 'Create a notice to power the listing and detail flow.',
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      fileUrl: '',
      isPinned: false,
      publishedAt: '',
      status: 'DRAFT',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      ogImage: '',
      canonicalUrl: '',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', required: true, options: publicationStatusOptions },
      { name: 'isPinned', label: 'Pinned', type: 'switch' },
      { name: 'publishedAt', label: 'Published At', type: 'datetime-local' },
      { name: 'fileUrl', label: 'PDF File URL', type: 'url', colSpan: 2, uploadKind: 'document', accept: 'application/pdf', previewLabel: 'Open attached PDF' },
      { name: 'content', label: 'Description / Content', type: 'textarea', rows: 8, colSpan: 2 },
      ...defaultSeoFields,
    ],
    columns: [
      { key: 'title', label: 'Title', render: (item) => <div className="font-semibold">{String(item.title ?? '-')}</div> },
      { key: 'pinned', label: 'Pinned', render: (item) => <Badge variant={item.isPinned ? 'success' : 'outline'}>{item.isPinned ? 'Pinned' : 'Normal'}</Badge> },
      { key: 'file', label: 'PDF', render: (item) => <Badge variant={item.hasFile ? 'info' : 'outline'}>{item.hasFile ? 'Attached' : 'None'}</Badge> },
      { key: 'status', label: 'Status', render: (item) => badgeForStatus(item.status) },
      { key: 'publishedAt', label: 'Published', render: (item) => formatDateTime(String(item.publishedAt ?? '')) },
    ],
    getSearchText: (item) => `${String(item.title ?? '')} ${String(item.slug ?? '')}`,
    getEditValues: (item) => ({
      ...item,
      content: String(item.content ?? item.description ?? ''),
      seoKeywords: toKeywordsValue(item.seoKeywords),
      publishedAt: toDateTimeLocalValue(String(item.publishedAt ?? '')),
    }),
  },
  'college-fee-inquiries': {
    key: 'college-fee-inquiries',
    title: 'College Fee Inquiries',
    singular: 'College Fee Inquiry',
    description: 'Review fee-detail leads submitted from college cards across the website.',
    endpoint: '/college-fee-inquiries',
    updateMethod: 'patch',
    createButtonLabel: 'New inquiry',
    emptyTitle: 'No college fee inquiries yet',
    emptyDescription: 'Submitted fee requests from college cards will appear here.',
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      emailAddress: '',
      country: '',
      preferredStudyDestination: '',
      interestedCollegeName: '',
      message: '',
      source: 'College Fee Inquiry',
      sourcePage: '',
    },
    fields: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true },
      { name: 'phoneNumber', label: 'Phone Number', type: 'text', required: true },
      { name: 'emailAddress', label: 'Email Address', type: 'email' },
      { name: 'country', label: 'Country', type: 'text' },
      { name: 'preferredStudyDestination', label: 'Preferred Study Destination', type: 'text' },
      { name: 'interestedCollegeName', label: 'Interested College', type: 'text', required: true },
      { name: 'message', label: 'Message / Question', type: 'textarea', rows: 5, colSpan: 2 },
      { name: 'source', label: 'Source', type: 'text' },
      { name: 'sourcePage', label: 'Source Page', type: 'text', colSpan: 2 },
    ],
    columns: [
      { key: 'fullName', label: 'Name', render: (item) => <div className="font-semibold">{String(item.fullName ?? '-')}</div> },
      { key: 'phoneNumber', label: 'Phone', render: (item) => String(item.phoneNumber ?? '-') },
      { key: 'emailAddress', label: 'Email', render: (item) => String(item.emailAddress ?? '-') },
      { key: 'preferredStudyDestination', label: 'Destination', render: (item) => String(item.preferredStudyDestination ?? item.country ?? '-') },
      { key: 'interestedCollegeName', label: 'College', render: (item) => String(item.interestedCollegeName ?? '-') },
      { key: 'source', label: 'Source', render: (item) => <Badge variant="info">{String(item.source ?? 'College Fee Inquiry')}</Badge> },
      { key: 'createdAt', label: 'Submitted', render: (item) => formatDateTime(String(item.createdAt ?? '')) },
    ],
    getSearchText: (item) =>
      `${String(item.fullName ?? '')} ${String(item.phoneNumber ?? '')} ${String(item.emailAddress ?? '')} ${String(item.country ?? '')} ${String(item.preferredStudyDestination ?? '')} ${String(item.interestedCollegeName ?? '')} ${String(item.sourcePage ?? '')}`,
  },
  'success-stories': {
    key: 'success-stories',
    title: 'Success Stories',
    singular: 'Success Story',
    description: 'Manage student and parent testimonials, homepage visibility, and display order.',
    endpoint: '/success-stories',
    statusToggle: {
      fieldName: 'status',
      activeValue: 'ACTIVE',
      inactiveValue: 'INACTIVE',
    },
    createButtonLabel: 'New story',
    emptyTitle: 'No success stories yet',
    emptyDescription: 'Add a student review to populate the success stories section.',
    defaultValues: {
      studentName: '',
      roleType: 'Student',
      country: '',
      city: '',
      university: '',
      batch: '',
      image: '',
      reviewText: '',
      fullStory: '',
      showOnHomepage: true,
      status: 'ACTIVE',
      sortOrder: 0,
    },
    fields: [
      { name: 'studentName', label: 'Name', type: 'text', required: true },
      { name: 'roleType', label: 'Role / Type', type: 'text', required: true, description: 'Examples: Student, Parent' },
      { name: 'university', label: 'College Name', type: 'text', required: true },
      { name: 'batch', label: 'Batch Year', type: 'text' },
      { name: 'country', label: 'Country', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'image', label: 'Student/Parent Image', type: 'url', colSpan: 2, uploadKind: 'image', previewLabel: 'Preview story image' },
      { name: 'sortOrder', label: 'Display Order', type: 'number', required: true, min: 0 },
      { name: 'showOnHomepage', label: 'Homepage Visible', type: 'switch' },
      { name: 'status', label: 'Status', type: 'select', required: true, options: simpleStatusOptions },
      { name: 'reviewText', label: 'Short Testimonial', type: 'textarea', rows: 5, colSpan: 2, required: true },
      { name: 'fullStory', label: 'Full Story', type: 'textarea', rows: 8, colSpan: 2 },
    ],
    columns: [
      { key: 'studentName', label: 'Name', render: (item) => <div className="font-semibold">{String(item.studentName ?? '-')}</div> },
      { key: 'roleType', label: 'Type', render: (item) => <Badge variant="outline">{String(item.roleType ?? 'Student')}</Badge> },
      { key: 'university', label: 'College', render: (item) => String(item.university ?? '-') },
      { key: 'batch', label: 'Batch', render: (item) => String(item.batch ?? '-') },
      { key: 'location', label: 'Location', render: (item) => [String(item.city ?? '').trim(), String(item.country ?? '').trim()].filter(Boolean).join(', ') || '-' },
      { key: 'homepage', label: 'Homepage', render: (item) => <Badge variant={item.showOnHomepage ? 'success' : 'outline'}>{item.showOnHomepage ? 'Visible' : 'Hidden'}</Badge> },
      { key: 'sortOrder', label: 'Order', render: (item) => String(item.sortOrder ?? 0) },
      { key: 'status', label: 'Status', render: (item) => badgeForStatus(item.status) },
    ],
    getSearchText: (item) =>
      `${String(item.studentName ?? '')} ${String(item.roleType ?? '')} ${String(item.university ?? '')} ${String(item.batch ?? '')} ${String(item.city ?? '')} ${String(item.country ?? '')}`,
  },
  users: {
    key: 'users',
    title: 'Users',
    singular: 'User',
    description: 'Manage admin accounts, roles, and access status.',
    endpoint: '/users',
    updateMethod: 'patch',
    statusToggle: {
      fieldName: 'status',
      activeValue: 'ACTIVE',
      inactiveValue: 'INACTIVE',
    },
    createButtonLabel: 'New admin user',
    emptyTitle: 'No admin users yet',
    emptyDescription: 'Create an admin user to grant dashboard access.',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', requiredOnCreate: true, omitIfEmptyOnUpdate: true },
      { name: 'role', label: 'Role', type: 'select', required: true, options: userRoleOptions },
      { name: 'status', label: 'Status', type: 'select', required: true, options: userStatusOptions },
    ],
    columns: [
      { key: 'name', label: 'Name', render: (item) => <div className="font-semibold">{String(item.name ?? '-')}</div> },
      { key: 'email', label: 'Email', render: (item) => String(item.email ?? '-') },
      { key: 'role', label: 'Role', render: (item) => <Badge variant="info">{formatLabel(String(item.role ?? ''))}</Badge> },
      { key: 'status', label: 'Status', render: (item) => badgeForStatus(item.status) },
      { key: 'updatedAt', label: 'Updated', render: (item) => formatDateTime(String(item.updatedAt ?? '')) },
    ],
    getSearchText: (item) => `${String(item.name ?? '')} ${String(item.email ?? '')}`,
  },
};
