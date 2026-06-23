import 'dotenv/config';

import {
  GalleryItemType,
  PageTemplateType,
  PageType,
  Prisma,
  PrismaClient,
  PublicationStatus,
  SimpleStatus,
  StudyDestinationTemplateType,
} from '@prisma/client';

import { footerDestinations, footerQuickLinks, navigation } from '../../Medientry-Client/src/constants/navigation';
import { collegeSelectionTips } from '../../Medientry-Client/src/constants/colleges';
import { offices, siteConfig, siteImages } from '../../Medientry-Client/src/constants/site-content';
import { admissionNotices } from '../../Medientry-Client/src/data/admissionNotices';
import { blogPosts } from '../../Medientry-Client/src/data/blogPosts';
import { successStories } from '../../Medientry-Client/src/data/successStories';
import { universities } from '../../Medientry-Client/src/data/universities';

const prisma = new PrismaClient();

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const buildExcerpt = (value: string, maxLength = 180) => {
  const text = stripHtml(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 3).trim()}...` : text;
};

const uniqueStrings = (values: Array<string | null | undefined>) => [
  ...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))),
];

const absoluteCanonical = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.url.replace(/\/+$/, '')}${normalizedPath}`;
};

const toPublicationStatus = (value: string | undefined) =>
  value?.toLowerCase() === 'published'
    ? PublicationStatus.PUBLISHED
    : PublicationStatus.DRAFT;

const findBangladeshFeeAmount = (
  feeItems: Array<{ item: string; amountUSD: number | 'Included' }>,
  matcher: RegExp,
) => {
  const match = feeItems.find((item) => matcher.test(item.item));
  return typeof match?.amountUSD === 'number' ? match.amountUSD : null;
};

const findGeorgiaFeeAmount = (
  feeItems: Array<{ item: string; amountUSD: number; amountINR: number }>,
  matcher: RegExp,
) => {
  const match = feeItems.find((item) => matcher.test(item.item));
  return typeof match?.amountUSD === 'number' ? match.amountUSD : null;
};

const homePageContent = {
  heroBadge: 'Trusted MBBS Consultancy Since 2018',
  heroTitle: 'Your Gateway to MBBS Abroad',
  heroSubtitle:
    'Expert guidance for MBBS admission in Bangladesh and Georgia. NMC-recognized colleges, transparent process, and support from application to graduation.',
  heroImage: siteImages.heroCampusStudents,
  whyChooseUsEyebrow: 'WHY CHOOSE US',
  whyChooseUsTitle: 'Trusted by Parents, Chosen by Students',
  whyChooseUsSubtitle:
    'We understand that choosing where to study medicine is a life-changing decision. Our commitment is to provide honest, comprehensive guidance every step of the way.',
  whyChooseUsFeatureCards: [
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
  whyChooseUsApartTitle: 'What Sets Us Apart',
  whyChooseUsApartItems: [
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
  whyChooseUsRightEyebrow: 'FOR INDIAN STUDENTS & PARENTS',
  whyChooseUsRightTitle: 'Trust & Transparency for Indian Medical Aspirants',
  whyChooseUsRightParagraph:
    'Bangladesh has excellent medical colleges — but selection matters. We openly explain which colleges should be avoided and which suit which type of student.',
  whyChooseUsChecklistItems: [
    {
      text: 'We recommend best-fit colleges, not "high commission colleges"',
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
  whyChooseUsQuoteText:
    `"Your child's 6 years matter more to us than a one-time commission."`,
  admissionSteps: [
    {
      step: 1,
      title: 'Free Consultation',
      description: 'Discuss your goals, budget, and preferences with our expert counselors.',
    },
    {
      step: 2,
      title: 'College Selection',
      description: 'We help you choose the right NMC-recognized medical college.',
    },
    {
      step: 3,
      title: 'Documentation',
      description: 'Complete assistance with admission forms and required documents.',
    },
    {
      step: 4,
      title: 'Admission Confirmation',
      description: 'Receive your official admission letter from the college.',
    },
    {
      step: 5,
      title: 'Visa Processing',
      description: 'Full support for visa application and travel arrangements.',
    },
    {
      step: 6,
      title: 'Arrival and Support',
      description: 'Airport pickup and ongoing support throughout your studies.',
    },
  ],
  philosophyHighlights: [
    'Quality-Based Selection',
    'Budget-Conscious Shortlisting',
    'Honest Comparisons',
    'Clear Risk Explanation',
    'Long-Term Guidance',
    'Career Over Commission',
  ],
  footerQuickLinks,
  footerDestinations,
  navigation,
};

const homeReelSeeds = [
  {
    title: 'Student Story 1',
    thumbnail: '/images/hero-campus-students.jpeg',
    sortOrder: 1,
  },
  {
    title: 'Student Story 2',
    thumbnail: '/images/bangladesh-parliament-students.jpg',
    sortOrder: 2,
  },
  {
    title: 'Student Story 3',
    thumbnail: '/images/georgia-city.jpg',
    sortOrder: 3,
  },
  {
    title: 'Student Story 4',
    thumbnail: '/images/georgia-tbilisi-hero.jpg',
    sortOrder: 4,
  },
  {
    title: 'Parent Experience',
    thumbnail: '/images/mbbs-bangladesh-hero.jpg',
    sortOrder: 5,
  },
  {
    title: 'Campus Life',
    thumbnail: '/images/contact-hero.jpg',
    sortOrder: 6,
  },
  {
    title: 'Admission Guidance',
    thumbnail: '/images/hero-medical-campus.jpg',
    sortOrder: 7,
  },
  {
    title: 'Bangladesh MBBS Journey',
    thumbnail: '/images/study-bangladesh-card.jpg',
    sortOrder: 8,
  },
] as const;

const bangladeshDestinationContent = {
  heroTitle: 'Study MBBS in Bangladesh',
  heroSubtitle:
    'Your closest gateway to quality medical education. NMC-recognized colleges, high FMGE pass rates, and a familiar cultural environment.',
  badgeText: 'MBBS in Bangladesh is fully aligned with NMC 2021 guidelines',
  highlights: [
    'NMC Recognized Colleges',
    'High FMGE Pass Rate',
    'Similar Culture and Food',
    'Total Cost: INR 32-48 Lakh',
  ],
  advantages: [
    {
      title: 'NMC Recognition',
      description:
        'Most medical colleges in Bangladesh are recognized by NMC and align with the 2021 guidelines.',
    },
    {
      title: 'High FMGE Pass Rate',
      description:
        'Bangladesh has one of the highest FMGE passing rates among foreign medical graduates.',
    },
    {
      title: 'Similar Syllabus',
      description:
        'The MBBS curriculum closely mirrors India with English-medium medical education.',
    },
    {
      title: 'Quality Education',
      description:
        'Well-equipped hospitals, modern laboratories, and experienced faculty support clinical learning.',
    },
    {
      title: 'Affordable Fees',
      description:
        'Costs are significantly lower than many Indian private medical colleges for similar quality.',
    },
    {
      title: 'Similar Disease Pattern',
      description:
        'Clinical exposure stays highly relevant for students planning to return to India.',
    },
    {
      title: 'Close to Home',
      description:
        'Bangladesh is a short flight away from major Indian cities with additional train and bus options.',
    },
    {
      title: 'Cultural Familiarity',
      description:
        'Similar food, climate, and cultural practices make adaptation easier for Indian students.',
    },
  ],
  factsToKnow: [
    {
      question: 'Is Bangladesh suitable for non-Muslim students?',
      answer:
        'Students from all backgrounds study safely in Bangladesh, and religious harmony is actively promoted.',
    },
    {
      question: 'Is Bangladesh safe for female students?',
      answer:
        'Bangladesh is widely considered one of the safer South Asian environments for female students with protective campus support.',
    },
    {
      question: 'Are Bangladeshi people welcoming?',
      answer:
        'Students commonly experience a friendly and welcoming environment with local support when they arrive from abroad.',
    },
    {
      question: 'What about food and climate?',
      answer:
        'The climate and food habits are familiar for many Indian students, with rice-based meals and spicy curries widely available.',
    },
    {
      question: 'Is language a barrier?',
      answer:
        'Medical education is delivered in English, while everyday adaptation is eased by familiarity with Bangla and Hindi.',
    },
  ],
  challenges: [
    {
      title: 'Fee Comparison',
      description:
        'Some countries offer lower headline fees, but often with tradeoffs around recognition and exam readiness.',
    },
    {
      title: 'College Quality Varies',
      description:
        'Not every private college offers the same academic environment, so careful selection matters.',
    },
    {
      title: 'Language Adaptation',
      description:
        'Basic Bangla can help during patient interaction in later clinical years.',
    },
  ],
  feeOverview: {
    duration: '5 Years + 1 Year Internship',
    totalCostRange: 'INR 32 - 48 Lakh',
    hostelAndFoodMonthly: 'INR 4,000 - 10,000',
    indianPrivateCost: 'INR 70 Lakh - 1 Crore+',
    included: [
      'Tuition fees for 5 years',
      'Registration and admission charges',
      'Library and laboratory access',
      'Clinical training at affiliated hospitals',
      'Examination fees',
      'Student visa support',
    ],
  },
};

const georgiaDestinationContent = {
  heroTitle: 'Study MBBS in Georgia',
  heroSubtitle:
    'European quality medical education at affordable costs. WHO and NMC recognized universities with global career opportunities.',
  highlights: [
    'WHO and NMC Approved',
    'ECFMG Certified',
    'European Standards',
    'Safe and Affordable Living',
  ],
  advantages: [
    {
      title: 'WHO and NMC Approved',
      description:
        'Georgian medical universities are recognized internationally and listed for Indian students.',
    },
    {
      title: 'ECFMG Certified',
      description:
        'Graduates remain eligible for ECFMG-related pathways and global licensing opportunities.',
    },
    {
      title: 'European Standards',
      description:
        'Medical education follows modern European methods, infrastructure, and curriculum structures.',
    },
    {
      title: 'English Medium',
      description:
        'Programs are delivered in English, making the environment accessible for international students.',
    },
    {
      title: 'Safe Country',
      description:
        'Georgia offers a welcoming international student environment with strong safety perception.',
    },
    {
      title: 'Modern Infrastructure',
      description:
        'Advanced hospitals and laboratory facilities support practical clinical training.',
    },
    {
      title: 'Affordable Living',
      description:
        'Living costs stay relatively manageable compared with many European destinations.',
    },
    {
      title: 'Easy Travel',
      description:
        'Student travel and visa processes are comparatively straightforward for the destination.',
    },
  ],
  recognitions: [
    'World Health Organization (WHO)',
    'National Medical Commission (NMC), India',
    'Educational Commission for Foreign Medical Graduates (ECFMG)',
    'World Directory of Medical Schools (WDOMS)',
    'Foundation for Advancement of International Medical Education and Research (FAIMER)',
  ],
  careerProspects: [
    {
      title: 'Practice in India',
      description:
        'Graduates can prepare for Indian licensing requirements after completing the program.',
    },
    {
      title: 'Practice in USA',
      description:
        'Students can pursue US-focused pathways and examinations where eligible.',
    },
    {
      title: 'Practice in Europe',
      description:
        'European-standard education helps support future recognition and postgraduate mobility.',
    },
    {
      title: 'Higher Studies',
      description:
        'Students can continue with postgraduate specializations in Georgia, Europe, or India.',
    },
  ],
  programOverview: {
    duration: '6 Years (5+1 Internship)',
    medium: 'English',
    intakePeriod: 'September / February',
    eligibility: '50% in PCB (Class 12)',
  },
  feeOverview: {
    tuition: [
      { label: 'Annual Tuition', value: '$5,000 - $6,000' },
      { label: 'Total Course Fee (6 Years)', value: '$30,000 - $36,000' },
      { label: 'INR Equivalent', value: 'INR 27 - 33 Lakh' },
    ],
    living: [
      { label: 'Hostel/Apartment', value: '$100 - $200/month' },
      { label: 'Food & Groceries', value: '$100 - $200/month' },
      { label: 'Total Monthly', value: '$200 - $400/month' },
    ],
  },
};

const pageSeeds = [
  {
    title: 'Home',
    slug: 'home',
    pageType: PageType.HOME,
    templateType: PageTemplateType.DEFAULT,
    heroTitle: 'Your Gateway to MBBS Abroad',
    heroSubtitle:
      'Expert guidance for MBBS admission in Bangladesh and Georgia with transparent support from application to graduation.',
    heroImage: siteImages.heroCampusStudents,
    content: homePageContent,
    seoTitle: 'MBBS Admission in Bangladesh and Study Abroad in Georgia',
    seoDescription:
      'Trusted MBBS admission consultancy for Indian students in Bangladesh and study abroad guidance for Bangladeshi students exploring Georgia.',
    seoKeywords: [
      'MBBS in Bangladesh',
      'MBBS admission Bangladesh',
      'study abroad from Bangladesh',
      'MBBS in Georgia',
    ],
    ogImage: siteImages.heroCampusStudents,
    canonicalUrl: absoluteCanonical('/'),
  },
  {
    title: 'About Medientry Bangladesh',
    slug: 'about',
    pageType: PageType.ABOUT,
    templateType: PageTemplateType.DEFAULT,
    heroTitle: 'Your Trusted Partner in Medical Education',
    heroSubtitle:
      'Founded in 2018, Medientry Bangladesh has been helping Indian students realize their dream of becoming doctors.',
    heroImage: siteImages.teamPhoto,
    content: {
      values: [
        {
          title: 'Transparency First',
          description: 'We provide only genuine, verified information with no hidden fees and no false promises.',
        },
        {
          title: 'Student-Centric Approach',
          description: 'Guidance is based on what is best for the student, not on commissions.',
        },
        {
          title: 'Specialized Expertise',
          description: 'We focus deeply on MBBS pathways in Bangladesh and study-abroad decisions.',
        },
        {
          title: 'Long-term Partnership',
          description: 'Support continues after admission throughout the student journey.',
        },
      ],
      trustPoints: [
        'Over 500 successful student admissions since 2018',
        'Direct partnerships with 30+ medical colleges',
        'Local presence in Bangladesh for immediate support',
        'Zero upfront payment policy',
        'Comprehensive visa and documentation assistance',
        'Emergency support throughout the study period',
      ],
      overview: [
        'Led by professionals with over 10 years of education-sector experience, Medientry Bangladesh was established to help students find the right-fit medical college.',
        'We specialize in MBBS admission in Bangladesh, allowing us to maintain updated, practical information on colleges, fees, and student support realities.',
        'As a local consultancy with direct relationships with medical colleges, we are capable of helping students secure admission into their chosen institutions.',
      ],
      metrics: {
        studentsPlaced: '500+',
        partnerColleges: '30+',
        yearsExperience: '7+',
        admissionSuccess: '100%',
      },
    },
    seoTitle: 'About Medientry Bangladesh - Trusted MBBS Consultancy Since 2018',
    seoDescription:
      'Learn about Medientry Bangladesh, our mission, and why families trust us for transparent MBBS admission guidance.',
    seoKeywords: ['about Medientry', 'MBBS consultancy', 'study abroad consultant'],
    ogImage: siteImages.teamPhoto,
    canonicalUrl: absoluteCanonical('/about'),
  },
  {
    title: 'Contact Medientry Bangladesh',
    slug: 'contact',
    pageType: PageType.CONTACT,
    templateType: PageTemplateType.DEFAULT,
    heroTitle: "Let's Discuss Your Future",
    heroSubtitle:
      'Book a free consultation with our expert counselors and get guidance on the right medical college pathway.',
    heroImage: siteImages.contactHero,
    content: {
      offices,
      contactMethods: [
        {
          title: 'Call Us',
          description: 'Speak directly with our counselors',
          value: siteConfig.phone,
          href: siteConfig.phoneHref,
          action: 'Call Now',
        },
        {
          title: 'WhatsApp',
          description: 'Quick responses on WhatsApp',
          value: siteConfig.phone,
          href: `https://wa.me/${siteConfig.whatsappNumber}`,
          action: 'Chat Now',
        },
        {
          title: 'Email Us',
          description: 'Detailed inquiries via email',
          value: siteConfig.email,
          href: siteConfig.emailHref,
          action: 'Send Email',
        },
      ],
      workingHours: {
        officeHours: 'Saturday - Thursday: 10:00 AM - 7:00 PM',
        friday: 'Friday: By Appointment Only',
      },
      whatToExpect: [
        'Quick response within 24 hours',
        'No-obligation free consultation',
        'Honest assessment of your options',
        'Detailed fee breakdown',
        'Complete admission roadmap',
      ],
    },
    seoTitle: 'Contact Us - Book Free MBBS Consultation',
    seoDescription:
      'Contact Medientry Bangladesh for free MBBS admission counseling, admission support, and study-abroad guidance.',
    seoKeywords: ['contact Medientry', 'MBBS consultation', 'medical admission help'],
    ogImage: siteImages.contactHero,
    canonicalUrl: absoluteCanonical('/contact'),
  },
  {
    title: 'Why Medientry',
    slug: 'why-medientry',
    pageType: PageType.CUSTOM,
    templateType: PageTemplateType.DEFAULT,
    heroTitle: 'We Are Not Here to Sell You a College',
    heroSubtitle:
      "We are here to protect your child's future with genuine guidance, complete transparency, and long-term support.",
    heroImage: siteImages.teamPhoto,
    content: {
      reasons: [
        {
          title: 'Genuine Information Only',
          description:
            'We provide verified overviews of colleges based on your budget and requirements with no misleading claims.',
        },
        {
          title: 'Quality-Based Selection',
          description:
            'Recommendations consider FMGE track record, facilities, teaching quality, and student goals.',
        },
        {
          title: 'Free One-on-One Consultation',
          description:
            'Ask detailed questions and receive local insight that goes beyond surface-level internet comparisons.',
        },
        {
          title: 'Admission to Any College',
          description:
            'We help students choose what fits them best rather than forcing a consultancy-preferred option.',
        },
        {
          title: 'Complete Paperwork and Visa Processing',
          description:
            'Documentation and visa support are handled from start to finish to reduce student stress.',
        },
        {
          title: 'Guidance Beyond Admission',
          description:
            'Support stays active throughout the full 5-6 year study period in Bangladesh.',
        },
      ],
      guarantees: [
        '100% admission guarantee to your chosen college',
        'Complete transparency in fees with no hidden charges',
        'Local presence in Bangladesh for immediate support',
        'Direct relationships with college administrations',
        'Emergency assistance throughout the study period',
        'Career guidance beyond just admission',
      ],
      metrics: {
        studentsGuided: '500+',
        yearsExperience: '7+',
        partnerColleges: '60+',
        successRate: '100%',
      },
    },
    seoTitle: 'Why Choose Medientry - Honest MBBS Admission Guidance',
    seoDescription:
      'See what makes Medientry different: transparent counseling, destination expertise, and end-to-end student support.',
    seoKeywords: ['why Medientry', 'trusted MBBS consultancy', 'transparent admission process'],
    ogImage: siteImages.teamPhoto,
    canonicalUrl: absoluteCanonical('/why-medientry'),
  },
  {
    title: 'Study in Georgia for Bangladeshi Students',
    slug: 'georgia-for-bangladeshis',
    pageType: PageType.CUSTOM,
    templateType: PageTemplateType.LANDING,
    heroTitle: 'Study in Georgia for Bangladeshi Students',
    heroSubtitle:
      'World-class education in Medicine, Computer Science, AI and Data Science with European standards and affordable fees.',
    heroImage: siteImages.georgiaTbilisiHero,
    content: {
      programs: [
        {
          title: 'MBBS in Georgia',
          duration: '6 Years',
          description:
            'Internationally recognized medical degree with WHO, NMC, and ECFMG-aligned recognition pathways.',
        },
        {
          title: 'Computer Science and Engineering',
          duration: '4 Years',
          description:
            'Industry-aligned curriculum with internship opportunities and practical learning.',
        },
        {
          title: 'AI and Data Science',
          duration: '4 Years',
          description:
            'Future-oriented programs in artificial intelligence, machine learning, and data analytics.',
        },
      ],
      whyGeorgia: [
        'European Education Standards',
        'Affordable Tuition',
        'Safe and Welcoming Environment',
        'English-medium Programs',
      ],
      whyAlte: [
        'Modern campus with state-of-the-art facilities',
        'Experienced faculty with international backgrounds',
        'Strong industry partnerships for internships',
        'Multicultural environment with students from 60+ countries',
        'Career development and placement support',
        'Affordable tuition with scholarship opportunities',
      ],
      recognition: [
        'World Health Organization (WHO)',
        'Bangladesh Medical and Dental Council (BM&DC)',
        'Educational Commission for Foreign Medical Graduates (ECFMG)',
        'World Federation for Medical Education (WFME)',
        'European Higher Education Area (EHEA)',
        'Ministry of Education, Georgia',
      ],
    },
    seoTitle: 'Study Abroad from Bangladesh - MBBS, AI, CSE in Georgia',
    seoDescription:
      'Programs, pathways, and study-abroad guidance for Bangladeshi students exploring Georgia for MBBS, AI, CSE, and related degrees.',
    seoKeywords: ['study in Georgia', 'MBBS in Georgia', 'study abroad from Bangladesh'],
    ogImage: siteImages.georgiaTbilisiHero,
    canonicalUrl: absoluteCanonical('/georgia-for-bangladeshis'),
  },
  {
    title: 'Bangladesh Government Medical Colleges for Foreign Students',
    slug: 'mbbs-bangladesh-government',
    pageType: PageType.CUSTOM,
    templateType: PageTemplateType.DEFAULT,
    heroTitle: 'MBBS in Bangladesh Government Medical Colleges',
    heroSubtitle:
      'Official-style guidance for SAARC and Non-SAARC admission pathways into Bangladesh government medical colleges.',
    heroImage: siteImages.mbbsBangladeshHero,
    content: {
      saarcSeats: [
        { country: 'India', mbbs: 22, bds: 2 },
        { country: 'Pakistan', mbbs: 21, bds: 2 },
        { country: 'Nepal', mbbs: 19, bds: 3 },
        { country: 'Sri Lanka', mbbs: 13, bds: 2 },
        { country: 'Bhutan', mbbs: 28, bds: 2 },
        { country: 'Maldives', mbbs: 6, bds: 1 },
        { country: 'Afghanistan', mbbs: 3, bds: 1 },
      ],
      nonSaarcSeats: [
        { country: 'Myanmar', mbbs: 5, bds: 2 },
        { country: 'Palestine', mbbs: 18, bds: 3 },
        { country: 'All other countries of the world', mbbs: 49, bds: 22 },
      ],
      eligibility: [
        'Minimum aggregated GPA of 8.50 combined in O-Level and A-Level equivalent',
        'Biology minimum 3.50 in A-Level or Class 12 equivalent',
        'Equivalent Certificate required from DG Health, Bangladesh',
      ],
    },
    seoTitle: 'Bangladesh Government Medical Colleges for Foreign Students',
    seoDescription:
      'Official-style guidance for SAARC and Non-SAARC admission pathways into Bangladesh government medical colleges.',
    seoKeywords: ['government MBBS Bangladesh', 'SAARC quota Bangladesh', 'DGME admission'],
    ogImage: siteImages.mbbsBangladeshHero,
    canonicalUrl: absoluteCanonical('/mbbs-bangladesh-government'),
  },
  {
    title: 'Gallery and Videos',
    slug: 'videos',
    pageType: PageType.CUSTOM,
    templateType: PageTemplateType.DEFAULT,
    heroTitle: 'Real Guidance. Real Students. Real Experiences.',
    heroSubtitle:
      'Watch helpful videos and browse photos from student journeys, campus visits, parent meetings, and university tours.',
    heroImage: siteImages.contactHero,
    content: {
      galleryNote:
        'The frontend keeps the current gallery design and now pulls gallery items from the CMS with these existing titles and categories as the initial seed.',
    },
    seoTitle: 'Gallery and Videos',
    seoDescription:
      "Browse Medientry's gallery and video section featuring student life, campus visits, and admission guidance content.",
    seoKeywords: ['gallery', 'medical campus photos', 'student videos'],
    ogImage: siteImages.contactHero,
    canonicalUrl: absoluteCanonical('/videos'),
  },
  {
    title: 'Knowledge Hub',
    slug: 'blog',
    pageType: PageType.BLOG,
    templateType: PageTemplateType.DEFAULT,
    heroTitle: 'MBBS Abroad Guides for Indian and Bangladeshi Students',
    heroSubtitle:
      'Stay updated with admission circulars, visa requirements, country guides, and expert insights on medical education abroad.',
    heroImage: siteImages.knowledgeHubHero,
    content: {
      categories: ['All Posts', 'Admissions', 'Visa & Documentation', 'Study in Bangladesh', 'Study in Georgia', 'University Updates'],
    },
    seoTitle: 'Knowledge Hub - MBBS and Study Abroad Guides',
    seoDescription:
      'Expert guides on MBBS admission, study abroad from Bangladesh, visa requirements, and European university pathways.',
    seoKeywords: ['knowledge hub', 'MBBS guide', 'study abroad guide'],
    ogImage: siteImages.knowledgeHubHero,
    canonicalUrl: absoluteCanonical('/blog'),
  },
  {
    title: 'Notices and Downloads',
    slug: 'admission-notices',
    pageType: PageType.NOTICE,
    templateType: PageTemplateType.DEFAULT,
    heroTitle: 'Notices and Downloads',
    heroSubtitle:
      'Official updates, downloadable circulars, and important admission notices from Medientry.',
    heroImage: siteImages.mbbsBangladeshHero,
    content: {
      note:
        'Read Notice opens the detail page, and Download PDF appears only when a file exists.',
    },
    seoTitle: 'Notices and Downloads',
    seoDescription:
      'Admission updates, circulars, and downloadable notice PDFs for students and parents.',
    seoKeywords: ['admission notice', 'download PDF', 'DGME circular'],
    ogImage: siteImages.mbbsBangladeshHero,
    canonicalUrl: absoluteCanonical('/admission-notices'),
  },
  {
    title: 'Success Stories',
    slug: 'success-stories',
    pageType: PageType.SUCCESS_STORY,
    templateType: PageTemplateType.DEFAULT,
    heroTitle: 'Students Who Trusted Medientry',
    heroSubtitle:
      'Real experiences from students and parents who chose Medientry for their medical education journey.',
    heroImage: siteImages.teamPhoto,
    content: {
      stats: {
        studentsPlaced: '500+',
        admissionSuccess: '100%',
        yearsOfTrust: '7+',
        parentSatisfaction: '4.9/5',
      },
    },
    seoTitle: 'Success Stories',
    seoDescription:
      "Read student and parent experiences from Medientry's MBBS admission and study-abroad guidance journey.",
    seoKeywords: ['success stories', 'student testimonials', 'Medientry reviews'],
    ogImage: siteImages.teamPhoto,
    canonicalUrl: absoluteCanonical('/success-stories'),
  },
  {
    title: 'Medical Colleges and Universities',
    slug: 'colleges',
    pageType: PageType.MEDICAL_COLLEGE,
    templateType: PageTemplateType.DEFAULT,
    heroTitle: 'Medical Colleges and Universities',
    heroSubtitle:
      'Explore published medical colleges in Bangladesh and universities in Georgia managed from the CMS.',
    heroImage: siteImages.mbbsBangladeshHero,
    content: {
      collegeSelectionTips,
    },
    seoTitle: 'Medical Colleges and Universities - Bangladesh and Georgia',
    seoDescription:
      'Explore NMC-recognized medical colleges in Bangladesh and European universities in Georgia.',
    seoKeywords: ['medical colleges', 'Bangladesh colleges', 'Georgia universities'],
    ogImage: siteImages.mbbsBangladeshHero,
    canonicalUrl: absoluteCanonical('/colleges'),
  },
];

const galleryImageSeeds = [
  { title: 'Student Orientation 2024', category: 'Student Photos', url: siteImages.heroCampusStudents },
  { title: 'Campus Visit - Dhaka Medical', category: 'Campus Visits', url: siteImages.mbbsBangladeshHero },
  { title: 'Parent Meeting Session', category: 'Parent Meetings', url: siteImages.teamPhoto },
  { title: 'Georgia University Tour', category: 'University Visits', url: siteImages.georgiaTbilisiHero },
  { title: 'Graduation Ceremony', category: 'Student Photos', url: siteImages.bangladeshParliamentStudents },
  { title: 'Counseling Session', category: 'Parent Meetings', url: siteImages.contactHero },
  { title: 'Alte University Campus', category: 'University Visits', url: siteImages.georgiaCity },
  { title: 'Student Group Photo', category: 'Student Photos', url: siteImages.studyBangladeshCard },
  { title: 'Medical College Lab Tour', category: 'Campus Visits', url: '/images/medical-college-1.jpg' },
];

const galleryVideoSeeds = [
  { title: 'MBBS Admission Process Explained', category: 'Admission Guidance', url: '' },
  { title: 'Student Life in Bangladesh Medical Colleges', category: 'Student Experience', url: '' },
  { title: 'Why Choose Georgia for MBBS', category: 'Destination Guide', url: '' },
  { title: 'Parent Testimonial: Choosing Medientry', category: 'Testimonials', url: '' },
  { title: 'Campus Tour: Top Medical Colleges', category: 'University Walkthroughs', url: '' },
  { title: 'FMGE Preparation Tips for Students', category: 'Exam Preparation', url: '' },
  { title: 'Visa Process for Bangladesh and Georgia', category: 'Visa Guidance', url: '' },
  { title: 'Interview: Successful Medical Graduate', category: 'Student Experience', url: '' },
  { title: 'Alte University Georgia Campus Tour', category: 'University Walkthroughs', url: '' },
];

const seedSiteSetting = async () => {
  const existing = await prisma.siteSetting.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  const data = {
    logoLight: siteConfig.logo,
    logoDark: siteConfig.logo,
    favicon: '/favicon.ico',
    primaryColor: 'hsl(145 63% 25%)',
    secondaryColor: 'hsl(120 10% 96%)',
    accentColor: 'hsl(354 85% 42%)',
    textColor: 'hsl(150 30% 12%)',
    phone: siteConfig.phone,
    contactEmail: siteConfig.email,
    address: siteConfig.addressLines.join('\n'),
    socialLinks: {
      facebook: siteConfig.socialLinks.find((item) => item.label === 'Facebook')?.href ?? '#',
      instagram: siteConfig.socialLinks.find((item) => item.label === 'Instagram')?.href ?? '#',
      linkedin: siteConfig.socialLinks.find((item) => item.label === 'LinkedIn')?.href ?? '#',
      youtube: siteConfig.socialLinks.find((item) => item.label === 'YouTube')?.href ?? '#',
    },
  };

  if (existing) {
    await prisma.siteSetting.update({
      where: { id: existing.id },
      data,
    });
    return;
  }

  await prisma.siteSetting.create({ data });
};

const seedPages = async () => {
  for (const page of pageSeeds) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        pageType: page.pageType,
        templateType: page.templateType,
        status: PublicationStatus.PUBLISHED,
        heroTitle: page.heroTitle,
        heroSubtitle: page.heroSubtitle,
        heroImage: page.heroImage,
        content: page.content,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        seoKeywords: page.seoKeywords,
        ogImage: page.ogImage,
        canonicalUrl: page.canonicalUrl,
      },
      create: {
        title: page.title,
        slug: page.slug,
        pageType: page.pageType,
        templateType: page.templateType,
        status: PublicationStatus.PUBLISHED,
        heroTitle: page.heroTitle,
        heroSubtitle: page.heroSubtitle,
        heroImage: page.heroImage,
        content: page.content,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        seoKeywords: page.seoKeywords,
        ogImage: page.ogImage,
        canonicalUrl: page.canonicalUrl,
      },
    });
  }
};

const seedStudyDestinations = async () => {
  const destinations = [
    {
      title: 'MBBS in Bangladesh',
      slug: 'mbbs-bangladesh',
      country: 'Bangladesh',
      shortDescription:
        'Closest to home with NMC-aligned colleges, familiar culture, and affordable medical education.',
      featuredImage: siteImages.mbbsBangladeshHero,
      content: bangladeshDestinationContent,
      isFeatured: true,
      showInMenu: true,
      sortOrder: 1,
      templateType: StudyDestinationTemplateType.FIXED_FRONTEND_CONTENT,
      seoTitle: 'MBBS in Bangladesh for Indian Students',
      seoDescription:
        'Explore MBBS admission in Bangladesh with transparent fee structure and complete guidance for Indian students.',
      seoKeywords: ['MBBS Bangladesh', 'Bangladesh medical colleges', 'NMC Bangladesh'],
      ogImage: siteImages.mbbsBangladeshHero,
      canonicalUrl: absoluteCanonical('/mbbs-bangladesh'),
    },
    {
      title: 'MBBS in Georgia',
      slug: 'mbbs-georgia',
      country: 'Georgia',
      shortDescription:
        'European-standard medical education with English-medium teaching and global career opportunities.',
      featuredImage: siteImages.georgiaCity,
      content: georgiaDestinationContent,
      isFeatured: true,
      showInMenu: true,
      sortOrder: 2,
      templateType: StudyDestinationTemplateType.DYNAMIC_TEMPLATE,
      seoTitle: 'MBBS in Georgia',
      seoDescription:
        'Discover MBBS in Georgia with English-medium teaching, European standards, and modern university options.',
      seoKeywords: ['MBBS Georgia', 'Study in Georgia', 'Georgia medical university'],
      ogImage: siteImages.georgiaCity,
      canonicalUrl: absoluteCanonical('/mbbs-georgia'),
    },
  ];

  for (const destination of destinations) {
    await prisma.studyDestination.upsert({
      where: { slug: destination.slug },
      update: {
        title: destination.title,
        country: destination.country,
        shortDescription: destination.shortDescription,
        featuredImage: destination.featuredImage,
        content: destination.content,
        isFeatured: destination.isFeatured,
        showInMenu: destination.showInMenu,
        sortOrder: destination.sortOrder,
        status: PublicationStatus.PUBLISHED,
        templateType: destination.templateType,
        seoTitle: destination.seoTitle,
        seoDescription: destination.seoDescription,
        seoKeywords: destination.seoKeywords,
        ogImage: destination.ogImage,
        canonicalUrl: destination.canonicalUrl,
      },
      create: {
        ...destination,
        status: PublicationStatus.PUBLISHED,
      },
    });
  }
};

const seedMedicalColleges = async () => {
  const destinationMap = new Map(
    (
      await prisma.studyDestination.findMany({
        where: { slug: { in: ['mbbs-bangladesh', 'mbbs-georgia'] } },
        select: { id: true, slug: true },
      })
    ).map((item) => [item.slug, item.id]),
  );

  for (const [index, university] of universities.entries()) {
    const bangladeshFeeItems =
      university.feeStructure.type === 'bangladesh' ? university.feeStructure.items : [];
    const georgiaFeeItems =
      university.feeStructure.type === 'georgia' ? university.feeStructure.items : [];
    const totalFee =
      university.feeStructure.type === 'bangladesh'
        ? findBangladeshFeeAmount(bangladeshFeeItems, /total/i)
        : findGeorgiaFeeAmount(georgiaFeeItems, /total/i);
    const hostelFee =
      university.feeStructure.type === 'bangladesh'
        ? findBangladeshFeeAmount(bangladeshFeeItems, /hostel/i)
        : findGeorgiaFeeAmount(georgiaFeeItems, /hostel|apartment|living/i);
    const tuitionFee =
      university.feeStructure.type === 'bangladesh'
        ? findBangladeshFeeAmount(bangladeshFeeItems, /remaining|tuition/i) ?? totalFee
        : findGeorgiaFeeAmount(georgiaFeeItems, /annual tuition/i) ?? totalFee;

    await prisma.medicalCollege.upsert({
      where: { slug: university.slug },
      update: {
        studyDestinationId:
          university.country === 'Bangladesh'
            ? destinationMap.get('mbbs-bangladesh') ?? null
            : destinationMap.get('mbbs-georgia') ?? null,
        name: university.name,
        country: university.country,
        city: university.location.split(',')[0]?.trim() ?? null,
        shortDescription: university.description,
        featuredImage: university.featuredImage ?? '/images/medical-college-1.jpg',
        gallery: university.gallery ?? [],
        tuitionFee,
        hostelFee,
        totalFee,
        ranking: university.highlights[0] ?? null,
        eligibility:
          university.country === 'Bangladesh'
            ? '50% in PCB, valid NEET qualification for Indian students, and supporting academic documents.'
            : '50% in PCB or equivalent for health sciences pathways, plus required documents for international admission.',
        admissionProcess: [
          'Free counseling and college shortlisting',
          'Document review and application preparation',
          'Admission letter and payment guidance',
          'Visa and travel support',
        ],
        facilities: university.highlights,
        content: {
          description: university.description,
          established: university.established,
          recognition: university.recognition,
          teachingMedium: university.teachingMedium,
          duration: university.duration,
          programsOffered: university.programsOffered,
          highlights: university.highlights,
          included: university.included,
          notIncluded: university.notIncluded,
          feeStructure: university.feeStructure,
        },
        isFeatured: ['dhaka-national-medical-college', 'medical-college-for-women', 'alte-university'].includes(
          university.slug,
        ),
        sortOrder: index + 1,
        status: toPublicationStatus(university.status),
        seoTitle: university.seoTitle,
        seoDescription: university.seoDescription,
        seoKeywords: university.seoKeywords ?? uniqueStrings([university.name, university.country, 'MBBS']),
        ogImage: university.ogImage ?? university.featuredImage ?? '/images/medical-college-1.jpg',
        canonicalUrl: university.canonicalUrl ?? absoluteCanonical(`/medical-colleges/${university.slug}`),
      },
      create: {
        slug: university.slug,
        studyDestination:
          (university.country === 'Bangladesh'
            ? destinationMap.get('mbbs-bangladesh') ?? null
            : destinationMap.get('mbbs-georgia') ?? null)
            ? {
                connect: {
                  id:
                    university.country === 'Bangladesh'
                      ? destinationMap.get('mbbs-bangladesh')!
                      : destinationMap.get('mbbs-georgia')!,
                },
              }
            : undefined,
        name: university.name,
        country: university.country,
        city: university.location.split(',')[0]?.trim() ?? null,
        shortDescription: university.description,
        featuredImage: university.featuredImage ?? '/images/medical-college-1.jpg',
        gallery: university.gallery ?? [],
        tuitionFee,
        hostelFee,
        totalFee,
        ranking: university.highlights[0] ?? null,
        eligibility:
          university.country === 'Bangladesh'
            ? '50% in PCB, valid NEET qualification for Indian students, and supporting academic documents.'
            : '50% in PCB or equivalent for health sciences pathways, plus required documents for international admission.',
        admissionProcess: [
          'Free counseling and college shortlisting',
          'Document review and application preparation',
          'Admission letter and payment guidance',
          'Visa and travel support',
        ],
        facilities: university.highlights,
        content: {
          description: university.description,
          established: university.established,
          recognition: university.recognition,
          teachingMedium: university.teachingMedium,
          duration: university.duration,
          programsOffered: university.programsOffered,
          highlights: university.highlights,
          included: university.included,
          notIncluded: university.notIncluded,
          feeStructure: university.feeStructure,
        },
        isFeatured: ['dhaka-national-medical-college', 'medical-college-for-women', 'alte-university'].includes(
          university.slug,
        ),
        sortOrder: index + 1,
        status: toPublicationStatus(university.status),
        seoTitle: university.seoTitle,
        seoDescription: university.seoDescription,
        seoKeywords: university.seoKeywords ?? uniqueStrings([university.name, university.country, 'MBBS']),
        ogImage: university.ogImage ?? university.featuredImage ?? '/images/medical-college-1.jpg',
        canonicalUrl: university.canonicalUrl ?? absoluteCanonical(`/medical-colleges/${university.slug}`),
      },
    });
  }
};

const seedGalleryItems = async () => {
  const createOrUpdateGalleryItem = async ({
    title,
    type,
    url,
    thumbnail,
    category,
    sortOrder,
  }: {
    title: string;
    type: GalleryItemType;
    url: string;
    thumbnail: string | null;
    category: string;
    sortOrder: number;
  }) => {
    const existing = await prisma.galleryItem.findFirst({
      where: { title, type, url },
      select: { id: true },
    });

    const data = {
      title,
      type,
      url,
      thumbnail,
      category,
      sortOrder,
      status: SimpleStatus.ACTIVE,
    };

    if (existing) {
      await prisma.galleryItem.update({
        where: { id: existing.id },
        data,
      });
      return;
    }

    await prisma.galleryItem.create({ data });
  };

  for (const [index, item] of galleryImageSeeds.entries()) {
    await createOrUpdateGalleryItem({
      title: item.title,
      type: GalleryItemType.IMAGE,
      url: item.url,
      thumbnail: item.url,
      category: item.category,
      sortOrder: index + 1,
    });
  }

  for (const [index, item] of galleryVideoSeeds.entries()) {
    await createOrUpdateGalleryItem({
      title: item.title,
      type: GalleryItemType.VIDEO,
      url: item.url,
      thumbnail: null,
      category: item.category,
      sortOrder: galleryImageSeeds.length + index + 1,
    });
  }
};

const seedBlogs = async () => {
  for (const [index, post] of blogPosts.entries()) {
    await prisma.blog.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt ?? buildExcerpt(post.content),
        featuredImage: post.featuredImage ?? null,
        content: post.content,
        category: post.category,
        author: post.author,
        isPinned: Boolean(post.featured),
        status: toPublicationStatus(post.status),
        seoTitle: post.seoTitle ?? post.title,
        seoDescription: post.seoDescription ?? post.excerpt ?? buildExcerpt(post.content),
        seoKeywords: post.seoKeywords ?? post.tags ?? uniqueStrings([post.category, post.title]),
        ogImage: post.ogImage ?? post.featuredImage ?? null,
        canonicalUrl: post.canonicalUrl ?? absoluteCanonical(`/blog/${post.slug}`),
        createdAt: new Date(post.publishDate),
      },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? buildExcerpt(post.content),
        featuredImage: post.featuredImage ?? null,
        content: post.content,
        category: post.category,
        author: post.author,
        isPinned: Boolean(post.featured),
        status: toPublicationStatus(post.status),
        seoTitle: post.seoTitle ?? post.title,
        seoDescription: post.seoDescription ?? post.excerpt ?? buildExcerpt(post.content),
        seoKeywords: post.seoKeywords ?? post.tags ?? uniqueStrings([post.category, post.title]),
        ogImage: post.ogImage ?? post.featuredImage ?? null,
        canonicalUrl: post.canonicalUrl ?? absoluteCanonical(`/blog/${post.slug}`),
        createdAt: new Date(post.publishDate),
        updatedAt: new Date(post.publishDate),
      },
    });
  }
};

const seedNotices = async () => {
  for (const [index, notice] of admissionNotices.entries()) {
    const isPinned = index < 2;

    await prisma.notice.upsert({
      where: { slug: notice.slug },
      update: {
        title: notice.title,
        description: notice.description,
        fileUrl: notice.pdfFile ?? null,
        isPinned,
        pinnedOrder: isPinned ? index + 1 : null,
        status: toPublicationStatus(notice.status),
        publishedAt: new Date(notice.publishDate),
        seoTitle: notice.seoTitle ?? notice.title,
        seoDescription: notice.seoDescription ?? notice.description,
        seoKeywords: notice.seoKeywords ?? uniqueStrings([notice.category, notice.intakeYear, notice.title]),
        ogImage: notice.ogImage ?? siteImages.mbbsBangladeshHero,
        canonicalUrl: notice.canonicalUrl ?? absoluteCanonical(`/admission-notices/${notice.slug}`),
      },
      create: {
        title: notice.title,
        slug: notice.slug,
        description: notice.description,
        fileUrl: notice.pdfFile ?? null,
        isPinned,
        pinnedOrder: isPinned ? index + 1 : null,
        status: toPublicationStatus(notice.status),
        publishedAt: new Date(notice.publishDate),
        seoTitle: notice.seoTitle ?? notice.title,
        seoDescription: notice.seoDescription ?? notice.description,
        seoKeywords: notice.seoKeywords ?? uniqueStrings([notice.category, notice.intakeYear, notice.title]),
        ogImage: notice.ogImage ?? siteImages.mbbsBangladeshHero,
        canonicalUrl: notice.canonicalUrl ?? absoluteCanonical(`/admission-notices/${notice.slug}`),
      },
    });
  }
};

const seedSuccessStories = async () => {
  for (const [index, story] of successStories.entries()) {
    const existing = await prisma.successStory.findFirst({
      where: {
        studentName: story.studentName,
        university: story.university,
      },
      select: { id: true },
    });

    const isParentStory = story.studentName.toLowerCase().includes('parent');

    const data = {
      studentName: story.studentName.replace('â€“', '-'),
      roleType: isParentStory ? 'Parent' : 'Student',
      country: story.country,
      city: story.location,
      university: story.university,
      batch: story.intakeYear,
      image: null,
      rating: 5,
      reviewText: story.testimonial,
      fullStory: story.testimonial,
      videoUrl: null,
      showOnHomepage: true,
      status: story.status === 'published' ? SimpleStatus.ACTIVE : SimpleStatus.INACTIVE,
      sortOrder: index + 1,
    };

    if (existing) {
      await prisma.successStory.update({
        where: { id: existing.id },
        data,
      });
      continue;
    }

    await prisma.successStory.create({ data });
  }
};

const seedHomeReels = async () => {
  for (const reel of homeReelSeeds) {
    const existing = await prisma.homeReel.findFirst({
      where: { title: reel.title },
      select: { id: true },
    });

    const data = {
      title: reel.title,
      thumbnail: reel.thumbnail,
      wistiaVideoId: null,
      wistiaEmbedCode: null,
      sortOrder: reel.sortOrder,
      status: SimpleStatus.ACTIVE,
    };

    if (existing) {
      await prisma.homeReel.update({
        where: { id: existing.id },
        data,
      });
      continue;
    }

    await prisma.homeReel.create({ data });
  }
};

const seedHomeSections = async () => {
  const [destinations, colleges, stories, blogs, notices] = await Promise.all([
    prisma.studyDestination.findMany({
      where: { slug: { in: ['mbbs-bangladesh', 'mbbs-georgia'] } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, slug: true },
    }),
    prisma.medicalCollege.findMany({
      where: {
        slug: {
          in: ['dhaka-national-medical-college', 'medical-college-for-women', 'alte-university'],
        },
      },
      orderBy: { name: 'asc' },
      select: { id: true, slug: true },
    }),
    prisma.successStory.findMany({
      orderBy: { sortOrder: 'asc' },
      take: 3,
      select: { id: true },
    }),
    prisma.blog.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 6,
      select: { id: true },
    }),
    prisma.notice.findMany({
      orderBy: [{ isPinned: 'desc' }, { pinnedOrder: 'asc' }, { publishedAt: 'desc' }],
      take: 4,
      select: { id: true },
    }),
  ]);

  const sectionSeeds = [
    {
      sectionKey: 'choose_your_path',
      title: 'Choose Your Path to Becoming a Doctor',
      subtitle:
        'We specialize in MBBS admission in Bangladesh and Georgia with recognized colleges and transparent guidance.',
      selectedItemIds: destinations.map((item) => item.id),
      itemLimit: 2,
      isEnabled: true,
    },
    {
      sectionKey: 'featured_medical_colleges',
      title: 'Featured Medical Colleges',
      subtitle:
        'Published colleges that Medientry highlights for quality, guidance, and student fit.',
      selectedItemIds: colleges.map((item) => item.id),
      itemLimit: 3,
      isEnabled: true,
    },
    {
      sectionKey: 'success_stories',
      title: 'Students Who Trusted Medientry',
      subtitle:
        'Real stories from students and parents who chose Medientry for their medical education journey.',
      selectedItemIds: stories.map((item) => item.id),
      itemLimit: 3,
      isEnabled: true,
    },
    {
      sectionKey: 'latest_blogs',
      title: 'Latest from the Knowledge Hub',
      subtitle:
        'Helpful guides, admission updates, and practical articles from the Medientry content team.',
      selectedItemIds: blogs.map((item) => item.id),
      itemLimit: 6,
      isEnabled: true,
    },
    {
      sectionKey: 'notices',
      title: 'Notices and Downloads',
      subtitle: 'Pinned notices appear first, with download actions available when files exist.',
      selectedItemIds: notices.map((item) => item.id),
      itemLimit: 4,
      isEnabled: true,
    },
    {
      sectionKey: 'homepage_cta',
      title: 'Ready to Start Your Medical Journey?',
      subtitle:
        "Book a free consultation with our expert counselors today. We'll help you find the perfect medical college that matches your goals and budget.",
      content: {
        primaryButtonText: 'FREE CONSULTATION',
        primaryButtonUrl: '/contact',
        secondaryButtonText: 'CHAT ON WHATSAPP',
        secondaryButtonUrl: '',
        backgroundImage: '/images/footerbg.jpeg',
      },
      selectedItemIds: [],
      itemLimit: null,
      isEnabled: true,
    },
  ] as const;

  for (const section of sectionSeeds) {
    await prisma.homeSectionSetting.upsert({
      where: { sectionKey: section.sectionKey },
      update: {
        title: section.title,
        subtitle: section.subtitle,
        content: 'content' in section ? section.content : Prisma.JsonNull,
        selectedItemIds: section.selectedItemIds,
        itemLimit: section.itemLimit,
        isEnabled: section.isEnabled,
      },
      create: section,
    });
  }
};

const main = async () => {
  console.log('Seeding existing Medientry client content into PostgreSQL...');

  await seedSiteSetting();
  await seedPages();
  await seedStudyDestinations();
  await seedMedicalColleges();
  await seedGalleryItems();
  await seedBlogs();
  await seedNotices();
  await seedSuccessStories();
  await seedHomeReels();
  await seedHomeSections();

  const [pageCount, destinationCount, collegeCount, galleryCount, blogCount, noticeCount, storyCount, reelCount] =
    await Promise.all([
      prisma.page.count(),
      prisma.studyDestination.count(),
      prisma.medicalCollege.count(),
      prisma.galleryItem.count(),
      prisma.blog.count(),
      prisma.notice.count(),
      prisma.successStory.count(),
      prisma.homeReel.count(),
    ]);

  console.log(
    JSON.stringify(
      {
        pages: pageCount,
        studyDestinations: destinationCount,
        medicalColleges: collegeCount,
        galleryItems: galleryCount,
        blogs: blogCount,
        notices: noticeCount,
        successStories: storyCount,
        homeReels: reelCount,
      },
      null,
      2,
    ),
  );
};

main()
  .catch((error) => {
    console.error('Content seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
