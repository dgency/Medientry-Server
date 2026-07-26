import { Badge } from '../components/ui/badge';
import { apiClient, extractApiData } from '../lib/api-client';
import {
  formatDateTime,
  formatLabel,
  getSiteBaseUrl,
  toDateTimeLocalValue,
  toKeywordsValue,
} from '../lib/utils';
import { extractYouTubeVideoId } from '../lib/youtube';
import type { ResourceConfig } from '../types/app';

type ResourceItem = { id: string; [key: string]: unknown };
const siteBaseUrl = getSiteBaseUrl();
const shortcutPageEditHrefKey = '__editHref';
const shortcutPageUpdatePathKey = '__updatePath';
const shortcutPageDeleteDisabledKey = '__deleteDisabled';

const defaultCollegeFeeManagementValue = () => ({
  feeStructure: [
    {
      label: 'Total Tuition Fees (Including 1-Year Internship)',
      amountUsd: null,
      amountInr: null,
      billingPeriod: 'total',
      description: null,
      sortOrder: 1,
      isTotal: true,
      isActive: true,
    },
    {
      label: 'Seat Booking Amount',
      amountUsd: null,
      amountInr: null,
      billingPeriod: 'one_time',
      description: null,
      sortOrder: 2,
      isTotal: false,
      isActive: true,
    },
    {
      label: 'Pay During Admission',
      amountUsd: null,
      amountInr: null,
      billingPeriod: 'admission',
      description: null,
      sortOrder: 3,
      isTotal: false,
      isActive: true,
    },
    {
      label: 'Remaining Amount (Pay in 5 Years)',
      amountUsd: null,
      amountInr: null,
      billingPeriod: 'installment',
      description: null,
      sortOrder: 4,
      isTotal: false,
      isActive: true,
    },
    {
      label: 'AC Hostel + Food (Per Month)',
      amountUsd: null,
      amountInr: null,
      billingPeriod: 'monthly',
      description: null,
      sortOrder: 5,
      isTotal: false,
      isActive: true,
    },
  ],
});

const formatNullableUsd = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }

  return `$${value.toLocaleString('en-US')}`;
};

const getMedicalCollegeFeeSummary = (item: ResourceItem) => {
  const feeStructure = Array.isArray(item.feeStructure) ? item.feeStructure : [];
  const totalRow =
    feeStructure.find(
      (feeItem) =>
        feeItem &&
        typeof feeItem === 'object' &&
        (feeItem as Record<string, unknown>).isTotal === true,
    ) ??
    feeStructure.find(
      (feeItem) =>
        feeItem &&
        typeof feeItem === 'object' &&
        typeof (feeItem as Record<string, unknown>).label === 'string' &&
        String((feeItem as Record<string, unknown>).label).toLowerCase().includes('total'),
    );

  if (totalRow && typeof totalRow === 'object') {
    return formatNullableUsd((totalRow as Record<string, unknown>).amountUsd);
  }

  if (typeof item.totalFee === 'number') {
    return formatNullableUsd(item.totalFee);
  }

  if (typeof item.tuitionFee === 'number') {
    return formatNullableUsd(item.tuitionFee);
  }

  return '-';
};

const sanitizeMedicalCollegeFeeStructure = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      label: typeof item.label === 'string' ? item.label : '',
      amountUsd: typeof item.amountUsd === 'number' ? item.amountUsd : item.amountUsd ?? null,
      amountInr: typeof item.amountInr === 'number' ? item.amountInr : item.amountInr ?? null,
      billingPeriod: typeof item.billingPeriod === 'string' ? item.billingPeriod : 'custom',
      description: typeof item.description === 'string' ? item.description : item.description ?? null,
      sortOrder:
        typeof item.sortOrder === 'number' && Number.isFinite(item.sortOrder)
          ? item.sortOrder
          : 0,
      isTotal: item.isTotal === true,
      isActive: item.isActive !== false,
    }));
};

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

const homePhilosophyFallbackContent = {
  eyebrow: 'OUR PHILOSOPHY',
  title: 'We Are Not Here to Sell You a College.',
  supportingHeading: "We Are Here to Protect Your Child's Future.",
  description:
    'There are 60+ medical colleges in Bangladesh. Not all offer the same quality education, facilities, or patient exposure. Many consultancies push low-quality colleges for higher commissions. Medientry does the opposite.',
  imageSrc: '/images/bangladesh-parliament-students.jpg',
  imageAlt: 'Medical students standing in front of the Bangladesh Parliament',
} as const;

const homeStudyDestinationsFallbackContent = {
  eyebrow: 'STUDY DESTINATIONS',
  title: 'Choose Your Path to Becoming a Doctor',
  subtitle:
    'We specialize in MBBS admission in Bangladesh and Georgia with recognized colleges and transparent guidance.',
} as const;

const genericPageCtaFallbackContent = {
  title: 'Ready to Take the Next Step?',
  subtitle:
    'Talk to our admissions team for clear guidance, quick answers, and a transparent roadmap for your MBBS or study abroad journey.',
  primaryButtonText: 'Book Free Consultation',
  primaryButtonUrl: '/contact',
  secondaryButtonText: 'Chat on WhatsApp',
  secondaryButtonUrl: '',
} as const;

const aboutPageFallbackContent = {
  whoWeAreEyebrow: 'Who We Are',
  whoWeAreTitle: 'The Leading MBBS Consultancy for Bangladesh',
  whoWeAreImage: '/images/team-photo.jpg',
  whoWeAreImageAlt: 'Medientry Bangladesh team - MBBS admission consultants',
  whoWeAreBadgeValue: '7+',
  whoWeAreBadgeLabel: 'Years of Excellence',
  overview: [
    'Led by a team of professionals with over 10 years of experience in the education sector, Medientry Bangladesh was established with a singular mission: to help Indian students find the right medical college that best fits their needs and aspirations.',
    'We specialize exclusively in MBBS admission in Bangladesh, giving us unparalleled expertise and the most accurate, up-to-date information on medical colleges in the country. This focused approach has made us the go-to consultancy for students and parents seeking genuine guidance.',
    'As a local consultancy with direct relationships with medical colleges, we are capable of securing admission to any college of your choice. Over the years, we have helped hundreds of Indian students gain admission to their desired medical colleges, and our support remains active until they successfully complete their degree.',
  ],
  valuesEyebrow: 'Our Values',
  valuesTitle: 'What Sets Medientry Apart',
  valuesSubtitle:
    'Our approach goes beyond just securing admissions. We serve as career guidance consultants, helping students choose the best-fit college to become successful doctors with premium services during admission and throughout their study period.',
  values: [
    {
      title: 'Transparency First',
      description: 'We provide only genuine, verified information. No hidden fees, no false promises.',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'Student-Centric Approach',
      description: "Your success is our success. We guide you based on what's best for your career, not our commission.",
      sortOrder: 2,
      isActive: true,
    },
    {
      title: 'Specialized Expertise',
      description: 'We focus exclusively on MBBS admission in Bangladesh, making us the most knowledgeable consultancy in this domain.',
      sortOrder: 3,
      isActive: true,
    },
    {
      title: 'Long-term Partnership',
      description: "Our relationship doesn't end with admission. We support you throughout your 5-year medical journey.",
      sortOrder: 4,
      isActive: true,
    },
  ],
  trustEyebrow: 'Why Parents Trust Us',
  trustTitle: 'Peace of Mind for Every Family',
  trustDescription:
    'We understand that sending your child abroad for education is a significant decision that comes with many concerns. Medientry addresses every worry with transparency, local presence, and unwavering support.',
  trustPoints: [
    'Over 500 successful student admissions since 2018',
    'Direct partnerships with 30+ medical colleges',
    'Local presence in Bangladesh for immediate support',
    'Zero upfront payment policy - pay only after admission',
    'Comprehensive visa and documentation assistance',
    'Emergency support throughout your study period',
  ],
  trustCtaText: 'Schedule a Consultation',
  trustCtaUrl: '/contact',
  metrics: {
    studentsPlaced: '500+',
    partnerColleges: '30+',
    yearsExperience: '7+',
    admissionSuccess: '100%',
  },
  pageCtaTitle: "Let's Discuss Your Medical Career",
  pageCtaSubtitle:
    'Our experienced counselors are ready to answer all your questions and help you make an informed decision about your future.',
} as const;

const whyMedientryFallbackContent = {
  heroQuoteText: "Your child's 6 years matter more to us than a one-time commission.",
  differenceTitle: 'The Medientry Difference',
  differenceDescription:
    'There are 60+ medical colleges in Bangladesh. Not all offer the same education, facilities, or patient exposure. Many consultancies push low-quality colleges for higher commissions. We do the opposite.',
  philosophyPoints: [
    { title: 'College Selection Based on Quality', description: 'FMGE track record, facilities, and your future goals - not commission rates.', sortOrder: 1, isActive: true },
    { title: 'Budget-Based Shortlisting', description: 'No pressure to overspend - we match colleges to your actual budget.', sortOrder: 2, isActive: true },
    { title: 'Honest Comparison', description: 'Transparent comparison between multiple colleges with clear pros and cons.', sortOrder: 3, isActive: true },
    { title: 'Clear Risk Explanation', description: 'We explain limitations and potential challenges upfront so you can decide with confidence.', sortOrder: 4, isActive: true },
    { title: 'Guidance Continues After Admission', description: 'Our support does not end with payment - we stay with you throughout your 5-6 year journey.', sortOrder: 5, isActive: true },
  ],
  differenceQuoteText: 'This transparent approach is why hundreds of parents have trusted Medientry for the last 7 years.',
  commitmentsEyebrow: 'Our Commitments',
  commitmentsTitle: 'What Makes Us Different',
  reasons: [
    { title: 'Genuine Information Only', description: 'We understand how crucial accurate information is for your decision. With over 60 private medical colleges in Bangladesh, each with its own pros and cons, choosing can be overwhelming.', details: 'We provide only verified, accurate overviews of colleges based on your budget and requirements. No misleading information, no hidden agendas - just honest guidance.', sortOrder: 1, isActive: true },
    { title: 'Quality-Based Selection', description: 'College recommendation based on FMGE track record, clinical facilities, teaching quality, and your specific goals - never based on which college pays us higher commission.', details: "We've turned down partnerships with colleges that don't meet our quality standards. Your child's 6-year investment deserves a college chosen for the right reasons.", sortOrder: 2, isActive: true },
    { title: 'Free One-on-One Consultation', description: 'Being a local consultancy with vast knowledge about every medical college, we offer personalized consultations that go beyond internet research.', details: 'Ask any question, no matter how specific or unusual. Our goal is to help you make an informed decision - whether you choose to admit through us or not.', sortOrder: 3, isActive: true },
    { title: 'Admission to Any College', description: 'As an authorized representative with partnerships across top-ranked medical colleges in Bangladesh, we can secure your admission to any college of your choice.', details: "Unlike other consultancies that push their preferred colleges, we help you choose based on what's best for YOU. We provide all necessary information so you can decide on your own.", sortOrder: 4, isActive: true },
    { title: 'Complete Paperwork & Visa Processing', description: 'Navigating admission documentation and visa processes can be stressful. We handle it all so you can focus on preparing for your journey.', details: "From admission forms to visa applications, we manage every piece of paperwork. We'll even pick you up from the airport and bring you to your college hostel.", sortOrder: 5, isActive: true },
    { title: 'Guidance Beyond Admission', description: "Our responsibility doesn't end with admission. We understand the concerns of studying in a foreign country as a young student.", details: "Throughout your entire 5-6 year study period, Medientry serves as your safe house in Bangladesh. From currency transfers to emergency visa assistance - we're always there when you need us.", sortOrder: 6, isActive: true },
    { title: 'No Advance Payment', description: "We don't charge anything before your admission is confirmed. This is our commitment to transparency and trust.", details: 'Many fraud consultancies charge upfront and disappear. With Medientry, you pay only after you have your admission letter in hand. Our formal connections with colleges guarantee your admission.', sortOrder: 7, isActive: true },
    { title: 'Your Future Over Our Profit', description: 'We prioritize your career over commissions. Even if it means lower earnings for us, we\'ll always recommend what\'s best for you.', details: 'Some consultancies push high-commission colleges regardless of quality. We\'ve turned down such partnerships because your 6-year investment and career deserve better.', sortOrder: 8, isActive: true },
    { title: 'Protection Against Fraud', description: 'The education consultancy space has many fraudsters. Being a local, established consultancy with formal college partnerships, we offer safety and reliability.', details: "We've helped students who were scammed by other consultancies get admission just before deadlines. Our reputation is built on trust, not false promises.", sortOrder: 9, isActive: true },
  ],
  promiseEyebrow: 'Our Promise',
  promiseTitle: 'What We Guarantee',
  promiseDescription:
    'When you choose Medientry, you are not just getting an admission consultant. You are getting a partner who is invested in your long-term success.',
  guarantees: [
    '100% admission guarantee to your chosen college',
    'Complete transparency in fees - no hidden charges',
    'Local presence in Bangladesh for immediate support',
    'Direct relationships with college administrations',
    'Emergency assistance throughout your study period',
    'Career guidance beyond just admission',
  ],
  promiseCtaText: 'Start Your Journey',
  promiseCtaUrl: '/contact',
  metrics: {
    studentsGuided: '500+',
    yearsExperience: '7+',
    partnerColleges: '60+',
    successRate: '100%',
  },
  trackRecordTitle: 'Our Track Record',
  trackRecordQuoteText: "We've helped students who were scammed by other consultancies get last-minute admissions. That's the Medientry difference.",
  feelEyebrow: 'What You Should Feel',
  feelTitle: 'After Talking to Medientry',
  feelStatements: [
    'These people will tell me the truth.',
    'They are thinking long-term.',
    "Even if I don't choose them, they are guiding me honestly.",
  ],
  feelSummary: 'Medientry is: A mentor + local guardian + strategist - not a middleman.',
  pageCtaTitle: 'Experience the Medientry Difference',
  pageCtaSubtitle:
    'Book a free consultation and see for yourself why hundreds of students and parents trust Medientry for their medical education journey.',
} as const;

const successStoriesFallbackContent = {
  stats: {
    studentsPlaced: '500+',
    admissionSuccess: '100%',
    yearsOfTrust: '7+',
    parentSatisfaction: '4.9/5',
  },
  shareTitle: 'Are You a Medientry Student?',
  shareSubtitle:
    "We'd love to feature your story. Share your experience with Medientry and help other students and parents make informed decisions.",
  shareCtaText: 'Share Your Story',
  shareCtaUrl: '/contact',
  pageCtaTitle: 'Ready to Write Your Success Story?',
  pageCtaSubtitle:
    "Join hundreds of students who have successfully started their medical careers with Medientry's guidance.",
} as const;

const contactPageFallbackContent = {
  formTitle: 'Book Free Consultation',
  formSubtitle: 'Fill in your details and our team will get back to you within 24 hours.',
  workingHoursTitle: 'Working Hours',
  whatToExpectTitle: 'What to Expect',
  whatsappCardTitle: 'Prefer WhatsApp?',
  whatsappCardDescription: 'Get quick answers to your questions on WhatsApp. Our team typically responds within minutes.',
  whatsappCtaText: 'Chat on WhatsApp',
  officesEyebrow: 'Our Offices',
  officesTitle: 'Visit Us',
  officesSubtitle: 'We have offices in Bangladesh and India to serve you better.',
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
  offices: [
    {
      id: 'bangladesh-office',
      name: 'Head Office - Bangladesh',
      address:
        'Online Wasi Tower, 572/K (13th Floor)\nMatikata, Dhaka Cantonment\nDhaka-1206, Bangladesh',
      phone: '+880 1713 456 910',
      email: 'info@medientrybd.com',
      googleMapsUrl: '',
    },
    {
      id: 'india-office',
      name: 'India Office',
      address:
        'House No. 125, C-1\nSRP Colony 8th Street Extension\nPeravallur, Chennai-600082\nTamil Nadu, India',
      phone: '+91 97917 15555',
      email: '',
      googleMapsUrl: '',
    },
  ],
} as const;

const collegesPageFallbackContent = {
  heroEyebrow: 'Partner Institutions',
  expertTipLabel: 'Expert Tip',
  expertTipText:
    "Don't choose a college based solely on fees. Consider FMGE pass rate, hospital facilities, faculty quality, and overall infrastructure. Our counselors can help you make the right choice.",
  bangladeshEyebrow: 'Bangladesh',
  bangladeshTitle: 'Medical Colleges in Bangladesh',
  bangladeshDescription:
    'Bangladesh has over 60 private medical colleges. We partner with the best NMC-recognized institutions known for quality education and high FMGE pass rates.',
  georgiaEyebrow: 'Georgia',
  georgiaTitle: 'Medical Universities in Georgia',
  georgiaDescription:
    'Georgian medical universities offer European standard education with international recognition. Perfect for students seeking global career opportunities.',
  guidanceEyebrow: 'Guidance',
  guidanceTitle: 'How to Choose the Right College',
  guidanceTips: [
    {
      title: 'Identify Your Budget',
      description:
        'Determine how much you can afford and find colleges within that range without compromising quality.',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'Check FMGE Pass Rate',
      description:
        'A high FMGE pass rate indicates quality education that prepares you for the licensing exam.',
      sortOrder: 2,
      isActive: true,
    },
    {
      title: 'Verify NMC Recognition',
      description:
        'Ensure the college is recognized by NMC so you can practice medicine in India.',
      sortOrder: 3,
      isActive: true,
    },
    {
      title: 'Consider Hospital Facilities',
      description:
        'Check patient flow and infrastructure of the attached hospital for clinical training.',
      sortOrder: 4,
      isActive: true,
    },
    {
      title: 'Evaluate Living Conditions',
      description:
        'Consider hostel quality, food options, and overall campus environment.',
      sortOrder: 5,
      isActive: true,
    },
    {
      title: 'Consult an Expert',
      description:
        "Don't rely solely on internet searches. Get guidance from someone with local knowledge.",
      sortOrder: 6,
      isActive: true,
    },
  ],
} as const;

const mbbsBangladeshGovernmentFallbackContent = {
  heroEyebrow: 'Government Medical Colleges',
  heroBadgeText: 'SAARC & Non-SAARC Quota',
  introTitle: 'Introduction',
  introParagraph:
    'Government Medical Colleges in Bangladesh offer a limited number of seats for foreign students each academic year. These seats are divided into two categories:',
  introQuotaItems: [
    'SAARC Countries Quota - for students from India, Pakistan, Nepal, Sri Lanka, Bhutan, Maldives, and Afghanistan',
    'Non-SAARC Countries Quota - for students from all other countries',
  ],
  introConclusion:
    'The entire admission process is managed and overseen by the Directorate General of Medical Education (DGME), Bangladesh, under the Ministry of Health and Family Welfare. All admissions are centralized and governed by official policy.',
  seatEyebrow: 'As Per DGME Circular 2025-2026',
  seatTitle: 'Total Seat Allocation for Foreign Students',
  seatDescription:
    'A total of 224 seats are allocated for foreign students - 125 for SAARC countries and 99 for Non-SAARC countries. Allocation is country-wise as detailed below.',
  saarcTableTitle: 'SAARC Countries',
  saarcSeats: [
    { country: 'India', mbbs: 22, bds: 2, sortOrder: 1, isActive: true },
    { country: 'Pakistan', mbbs: 21, bds: 2, sortOrder: 2, isActive: true },
    { country: 'Nepal', mbbs: 19, bds: 3, sortOrder: 3, isActive: true },
    { country: 'Sri Lanka', mbbs: 13, bds: 2, sortOrder: 4, isActive: true },
    { country: 'Bhutan', mbbs: 28, bds: 2, sortOrder: 5, isActive: true },
    { country: 'Maldives', mbbs: 6, bds: 1, sortOrder: 6, isActive: true },
    { country: 'Afghanistan', mbbs: 3, bds: 1, sortOrder: 7, isActive: true },
  ],
  nonSaarcTableTitle: 'Non-SAARC Countries',
  nonSaarcSeats: [
    { country: 'Myanmar', mbbs: 5, bds: 2, sortOrder: 1, isActive: true },
    { country: 'Palestine', mbbs: 18, bds: 3, sortOrder: 2, isActive: true },
    { country: 'All other countries of the world', mbbs: 49, bds: 22, sortOrder: 3, isActive: true },
  ],
  saarcSectionTitle: 'SAARC Countries Admission (Merit Basis)',
  saarcApplicableTitle: 'Applicable Countries',
  saarcCountries: ['India', 'Pakistan', 'Nepal', 'Sri Lanka', 'Bhutan', 'Maldives', 'Afghanistan'],
  saarcKeyPointsTitle: 'Key Points',
  saarcKeyPoints: [
    'Admission is based on 10th & 12th exam results (O Level & A Level equivalent)',
    'Selection is strictly merit-based',
    'Seats are under Bangladesh Government scholarship allocation',
    'Tuition is substantially subsidized under the government scholarship program, with only minor institutional charges applicable',
  ],
  nonSaarcSectionTitle: 'Non-SAARC Countries Admission',
  nonSaarcPoints: [
    'Non-SAARC students can apply under the paid quota',
    'Fee structure as per government policy: approximately USD $5,000 per year (as per current foreign student policy)',
    'Limited seats available with centralized approval',
    'Final decision is subject to DGME approval',
  ],
  eligibilityTitle: 'Eligibility Criteria (As Per DGME Circular)',
  eligibilityPoints: [
    'Minimum aggregated GPA of 8.50 combined in O-Level and A-Level (on an individual GPA scale of 5.00)',
    'Individual GPA minimum 5.00 scale',
    'Biology minimum 3.50 in A-Level / 12th class equivalent',
    'No grade below 4.00 in any single exam will be considered',
    'All academic documents must be attested by Ministry of Education and Ministry of Foreign Affairs of the respective country',
    'Documents must be authenticated by the Bangladesh Embassy of the concerned country',
    'Equivalent Certificate required from DG Health, Bangladesh',
    'Valid passport and recent passport-size photograph required',
  ],
  applicationProcessTitle: 'Application Process',
  applicationSteps: [
    { title: 'Fill Application Form', description: "Interested candidates must duly fill up the official application form (Annexure 'A') and arrange all necessary documents.", sortOrder: 1, isActive: true },
    { title: 'Submit via Ministry of Foreign Affairs', description: "Application form with all academic records and relevant documents must be submitted to the respective country's Ministry of Foreign Affairs / responsible authority.", sortOrder: 2, isActive: true },
    { title: 'Deadline-Based Submission', description: 'Applications must be submitted within the official deadline window. No application will be considered after the deadline.', sortOrder: 3, isActive: true },
    { title: 'Verification & Eligible List', description: 'The respective Ministry of Foreign Affairs will verify documents according to admission criteria and prepare an eligible list of students.', sortOrder: 4, isActive: true },
    { title: 'Forwarded to DGME', description: 'Documents are forwarded to the Ministry of Foreign Affairs of Bangladesh, then to the Directorate General of Medical Education.', sortOrder: 5, isActive: true },
    { title: 'Final Selection', description: 'The admission committee makes the final selection. The decision of the admission committee is final in all matters.', sortOrder: 6, isActive: true },
  ],
  legalNoticeTitle: 'Important Legal Notice',
  legalNoticeSummary:
    'Fabrication of any documents in the admission process is subject to cancellation of admission, which will be punishable under law.',
  legalNoticeDetails:
    'As stated in the DGME circular: If any information, document, or procedure is found fictitious in future, the admission will be void immediately, and the Ministry of Health & Family Welfare of Bangladesh will not bear any responsibility.',
  helpTitle: 'How Medientry Can Help',
  helpDescription:
    'Medientry provides guidance, documentation support, and application assistance in accordance with official DGME policies. Admission decisions are made solely by the Government of Bangladesh.',
  helpPoints: [
    'Eligibility assessment and document checklist preparation',
    'Guidance on attestation and authentication requirements',
    'Application form filling support',
    'Information about government medical college options',
  ],
  helpDisclaimer:
    'Disclaimer: Medientry does not have any control over government seat allocation or admission decisions. All information on this page is based on the official DGME circular for Session 2025-2026 and is subject to change by the Government of Bangladesh.',
  helpPrimaryButtonText: 'Get Application Guidance',
  helpSecondaryButtonText: 'Explore Private College Admission',
} as const;

const georgiaForBangladeshisFallbackContent = {
  heroEyebrow: 'Study in Georgia',
  heroBadgeText: 'Official Representative for Bangladesh',
  heroLeadText:
    'Medientry Bangladesh is the Official Representative of Alte University, Georgia, for Bangladesh.',
  heroPrimaryButtonText: 'Apply Now',
  heroPrimaryButtonUrl: '/contact',
  heroSecondaryButtonText: 'Explore Programs',
  heroSecondaryButtonUrl: '#programs',
  programsEyebrow: 'Programs at Alte University',
  programsTitle: 'World-Class Programs for Bangladeshi Students',
  programsSubtitle:
    'Choose from internationally recognized programs designed to prepare you for global careers.',
  programs: [
    {
      title: 'MBBS in Georgia',
      duration: '6 Years',
      description: 'Internationally recognized medical degree with WHO, NMC, and ECFMG approval. Clinical rotations in European hospitals.',
      highlights: ['WHO & NMC Recognized', 'English Medium', 'Hands-on Clinical Training', 'USMLE & PLAB Eligible'],
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'Computer Science & Engineering',
      duration: '4 Years',
      description: 'Industry-aligned curriculum with internship opportunities at leading tech companies across Europe.',
      highlights: ['Modern Tech Stack', 'Industry Internships', 'Global Job Prospects', 'Research Opportunities'],
      sortOrder: 2,
      isActive: true,
    },
    {
      title: 'AI & Data Science',
      duration: '4 Years',
      description: 'Cutting-edge programs in artificial intelligence, machine learning, and data analytics with practical applications.',
      highlights: ['Machine Learning Focus', 'Real-world Projects', 'Industry Mentorship', 'High Demand Skills'],
      sortOrder: 3,
      isActive: true,
    },
  ],
  whyGeorgiaEyebrow: 'Why Georgia',
  whyGeorgiaTitle: 'Why Georgian Education for Bangladeshi Students',
  whyGeorgiaSubtitle:
    'Georgia offers the perfect blend of quality education, affordability, and international recognition.',
  whyGeorgiaCards: [
    { title: 'European Education Standards', description: 'Georgian universities follow European Bologna Process standards, ensuring globally recognized degrees.', sortOrder: 1, isActive: true },
    { title: 'Affordable Tuition', description: 'Quality European education at a fraction of the cost compared to Western European or American universities.', sortOrder: 2, isActive: true },
    { title: 'Safe & Welcoming', description: 'Georgia ranks among the safest countries in the world with a welcoming culture for international students.', sortOrder: 3, isActive: true },
    { title: 'No Language Barrier', description: 'All programs offered in English with no requirement to learn Georgian for academics.', sortOrder: 4, isActive: true },
  ],
  partnerEyebrow: 'Partner Institution',
  partnerTitle: 'Why Alte University',
  partnerDescription:
    "Alte University is one of Georgia's premier private universities, known for its commitment to academic excellence and international standards. As the official representative for Bangladesh, Medientry ensures seamless admission support.",
  partnerBenefits: [
    'Modern campus with state-of-the-art facilities',
    'Experienced faculty with international backgrounds',
    'Strong industry partnerships for internships',
    'Multicultural environment with students from 60+ countries',
    'Career development and placement support',
    'Affordable tuition with scholarship opportunities',
  ],
  partnerImage: '',
  partnerImageAlt: 'Alte University campus',
  partnerStatValue: '60+',
  partnerStatLabel: 'Countries Represented',
  recognitionEyebrow: 'Global Recognition',
  recognitionTitle: 'Internationally Recognized Degrees',
  recognitionSubtitle:
    'Alte University degrees are recognized by major international bodies, ensuring your qualifications are accepted worldwide.',
  recognitionItems: [
    { title: 'World Health Organization (WHO)', description: 'Medical', sortOrder: 1, isActive: true },
    { title: 'Bangladesh Medical & Dental Council (BM&DC)', description: 'Medical', sortOrder: 2, isActive: true },
    { title: 'Educational Commission for Foreign Medical Graduates (ECFMG)', description: 'Medical', sortOrder: 3, isActive: true },
    { title: 'World Federation for Medical Education (WFME)', description: 'Medical', sortOrder: 4, isActive: true },
    { title: 'European Higher Education Area (EHEA)', description: 'All Programs', sortOrder: 5, isActive: true },
    { title: 'Ministry of Education, Georgia', description: 'All Programs', sortOrder: 6, isActive: true },
  ],
  supportEyebrow: 'Our Support',
  supportTitle: 'Complete Admission Support by Medientry',
  supportSubtitle:
    'As the official representative, we provide end-to-end support from application to arrival.',
  supportSteps: [
    { title: 'Free Counseling', description: 'Understand your options and eligibility', sortOrder: 1, isActive: true },
    { title: 'Application Support', description: 'Complete documentation and submission', sortOrder: 2, isActive: true },
    { title: 'Visa Assistance', description: 'Full support for visa processing', sortOrder: 3, isActive: true },
    { title: 'Pre-Departure', description: 'Travel, accommodation & orientation', sortOrder: 4, isActive: true },
  ],
  careerEyebrow: 'Future Prospects',
  careerTitle: 'Career & Future Opportunities',
  careerDescription:
    'A degree from Alte University opens doors to global career opportunities. Graduates work in leading organizations across Europe, Asia, and beyond.',
  careerCards: [
    { title: 'MBBS Graduates', description: 'Eligible for USMLE (USA), PLAB (UK), FMGE (India), and licensure exams worldwide.', sortOrder: 1, isActive: true },
    { title: 'CSE & AI Graduates', description: 'Strong placements in European tech companies, startups, and global corporations.', sortOrder: 2, isActive: true },
    { title: 'Further Studies', description: 'Seamless pathways to postgraduate programs in EU universities.', sortOrder: 3, isActive: true },
  ],
  careerSnapshotTitle: 'Career Snapshot',
  careerSnapshotCards: [
    { title: 'MBBS Graduates', description: 'Eligible for USMLE, PLAB, FMGE, and licensure pathways worldwide.', sortOrder: 1, isActive: true },
    { title: 'Tech Graduates', description: 'Strong prospects in European companies, startups, and global teams.', sortOrder: 2, isActive: true },
    { title: 'Further Studies', description: 'Smooth progression into postgraduate programs across Europe.', sortOrder: 3, isActive: true },
  ],
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

const sanitizeStringList = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => normalizeString(item))
        .filter((item) => item.length > 0)
    : [];

const isAllowedGoogleMapsHost = (host: string) => {
  const normalizedHost = host.toLowerCase();

  if (normalizedHost === 'maps.app.goo.gl') {
    return true;
  }

  return (
    /^(?:www\.)?google\.[a-z.]+$/.test(normalizedHost) ||
    /^maps\.google\.[a-z.]+$/.test(normalizedHost)
  );
};

const sanitizeGoogleMapsPageUrl = (value: unknown) => {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return null;
  }

  try {
    const url = new URL(normalizedValue);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    if (!isAllowedGoogleMapsHost(url.hostname)) {
      return null;
    }

    const normalizedPath = url.pathname.toLowerCase();
    const hasSupportedPath =
      normalizedPath.startsWith('/maps') ||
      normalizedPath.startsWith('/place') ||
      normalizedPath.startsWith('/search') ||
      normalizedPath.startsWith('/dir');
    const hasSupportedQuery = ['q', 'query', 'destination', 'origin', 'place_id'].some((key) =>
      url.searchParams.has(key),
    );

    if (url.hostname.toLowerCase() !== 'maps.app.goo.gl' && !hasSupportedPath && !hasSupportedQuery) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
};

const isValidEmailAddress = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const readContactOfficeAddress = (value: unknown) => {
  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');
  }

  if (!Array.isArray(value)) {
    return '';
  }

  return value
    .map((line) => normalizeString(line))
    .filter(Boolean)
    .join('\n');
};

const sanitizeContactOffices = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const id = normalizeString(item.id) || `office-${index + 1}`;
      const name =
        normalizeString(item.name) ||
        normalizeString(item.title) ||
        normalizeString(item.company);
      const address = readContactOfficeAddress(item.address);
      const phone = normalizeString(item.phone);
      const email = normalizeString(item.email);
      const googleMapsUrl = sanitizeGoogleMapsPageUrl(
        item.googleMapsUrl ?? item.googleMapsLink,
      );

      if (!name && !address && !phone && !email && !googleMapsUrl) {
        return null;
      }

      return {
        id,
        name,
        address,
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        googleMapsUrl: googleMapsUrl ?? '',
      };
    })
    .filter(
      (
        item,
      ): item is {
        id: string;
        name: string;
        address: string;
        phone?: string;
        email?: string;
        googleMapsUrl: string;
      } => Boolean(item),
    );
};

const validateContactOffices = (value: unknown) => {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];

    if (!isRecord(item)) {
      return `Office ${index + 1}: Invalid office entry.`;
    }

    const name =
      normalizeString(item.name) ||
      normalizeString(item.title) ||
      normalizeString(item.company);
    const address = readContactOfficeAddress(item.address);
    const email = normalizeString(item.email);
    const googleMapsUrl = normalizeString(item.googleMapsUrl ?? item.googleMapsLink);

    if (!name) {
      return `Office ${index + 1}: Office Name is required.`;
    }

    if (!address) {
      return `Office ${index + 1}: Office Address is required.`;
    }

    if (!googleMapsUrl) {
      return `Office ${index + 1}: Google Maps Link is required.`;
    }

    if (!sanitizeGoogleMapsPageUrl(googleMapsUrl)) {
      return `Office ${index + 1}: Enter a full Google Maps URL from a supported Google Maps domain.`;
    }

    if (email && !isValidEmailAddress(email)) {
      return `Office ${index + 1}: Enter a valid Email Address.`;
    }
  }

  return undefined;
};

const duplicateLabelSuffix = 'Copy';

const appendDuplicateLabel = (value: unknown) => {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return duplicateLabelSuffix;
  }

  return normalizedValue.toLowerCase().endsWith(duplicateLabelSuffix.toLowerCase())
    ? normalizedValue
    : `${normalizedValue} ${duplicateLabelSuffix}`;
};

const stripResourceMetaFields = (item: Record<string, unknown>) => {
  const nextValues = { ...item };

  delete nextValues.id;
  delete nextValues.createdAt;
  delete nextValues.updatedAt;
  delete nextValues[shortcutPageEditHrefKey];
  delete nextValues[shortcutPageUpdatePathKey];
  delete nextValues[shortcutPageDeleteDisabledKey];

  return nextValues;
};

const buildDuplicateDraftValues = (
  editValues: Record<string, unknown>,
  overrides: Record<string, unknown>,
) => ({
  ...stripResourceMetaFields(editValues),
  ...overrides,
});

const isHomePageValues = (values: Record<string, unknown>) =>
  String(values.pageType ?? '').trim() === 'HOME' ||
  String(values.slug ?? '').trim().toLowerCase() === 'home';

const getNormalizedPageSlug = (values: Record<string, unknown>) =>
  String(values.slug ?? '').trim().toLowerCase();

const getNormalizedPageType = (values: Record<string, unknown>) =>
  String(values.pageType ?? '').trim().toUpperCase();

const isAboutPageValues = (values: Record<string, unknown>) =>
  getNormalizedPageType(values) === 'ABOUT' || getNormalizedPageSlug(values) === 'about';

const isContactPageValues = (values: Record<string, unknown>) =>
  getNormalizedPageType(values) === 'CONTACT' || getNormalizedPageSlug(values) === 'contact';

const isWhyMedientryPageValues = (values: Record<string, unknown>) =>
  getNormalizedPageSlug(values) === 'why-medientry';

const isSuccessStoriesPageValues = (values: Record<string, unknown>) =>
  getNormalizedPageSlug(values) === 'success-stories';

const isCollegesPageValues = (values: Record<string, unknown>) =>
  getNormalizedPageSlug(values) === 'colleges';

const isMbbsBangladeshGovernmentPageValues = (values: Record<string, unknown>) =>
  getNormalizedPageSlug(values) === 'mbbs-bangladesh-government';

const isGeorgiaForBangladeshisPageValues = (values: Record<string, unknown>) =>
  getNormalizedPageSlug(values) === 'georgia-for-bangladeshis';

const usesStructuredStaticPageEditor = (values: Record<string, unknown>) =>
  isAboutPageValues(values) ||
  isContactPageValues(values) ||
  isWhyMedientryPageValues(values) ||
  isSuccessStoriesPageValues(values) ||
  isCollegesPageValues(values) ||
  isMbbsBangladeshGovernmentPageValues(values) ||
  isGeorgiaForBangladeshisPageValues(values);

const isValidHexColor = (value: string) => /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
const defaultPageHeroOverlayColor = '#052118';
const defaultPageHeroOverlayOpacity = 0.82;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parsePageContentObject = (value: unknown) => (isRecord(value) ? { ...value } : {});

const readContentString = (content: Record<string, unknown>, key: string) =>
  typeof content[key] === 'string' ? content[key] : null;

const readContentBoolean = (content: Record<string, unknown>, key: string) =>
  typeof content[key] === 'boolean' ? content[key] : null;

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

const toStructuredContentCards = (
  value: unknown,
  descriptionLookup: Record<string, string> = {},
) => {
  if (!Array.isArray(value)) {
    return null;
  }

  const cards = value
    .map((item, index) => {
      if (typeof item === 'string') {
        const title = item.trim();

        if (!title) {
          return null;
        }

        return {
          title,
          description: descriptionLookup[title] ?? '',
          sortOrder: index + 1,
          isActive: true,
        };
      }

      if (!isRecord(item)) {
        return null;
      }

      const title = normalizeString(item.title);
      const description = normalizeString(item.description);

      if (!title) {
        return null;
      }

      return {
        title,
        description,
        sortOrder:
          typeof item.sortOrder === 'number' && Number.isFinite(item.sortOrder)
            ? item.sortOrder
            : index + 1,
        isActive: item.isActive !== false,
      };
    })
    .filter(Boolean);

  return cards.length > 0 ? cards : null;
};

const toStructuredProgramCards = (value: unknown) => {
  if (!Array.isArray(value)) {
    return null;
  }

  const cards = value
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const title = normalizeString(item.title);
      const duration = normalizeString(item.duration);
      const description = normalizeString(item.description);
      const highlights = Array.isArray(item.highlights)
        ? item.highlights.filter(
            (highlight): highlight is string =>
              typeof highlight === 'string' && highlight.trim().length > 0,
          )
        : [];

      if (!title || !duration || !description) {
        return null;
      }

      return {
        title,
        duration,
        description,
        highlights,
        sortOrder:
          typeof item.sortOrder === 'number' && Number.isFinite(item.sortOrder)
            ? item.sortOrder
            : index + 1,
        isActive: item.isActive !== false,
      };
    })
    .filter(Boolean);

  return cards.length > 0 ? cards : null;
};

const toStructuredSeatAllocationRows = (value: unknown) => {
  if (!Array.isArray(value)) {
    return null;
  }

  const rows = value
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const country = normalizeString(item.country);
      const mbbs =
        typeof item.mbbs === 'number' && Number.isFinite(item.mbbs) ? item.mbbs : null;
      const bds =
        typeof item.bds === 'number' && Number.isFinite(item.bds) ? item.bds : null;

      if (!country || mbbs === null || bds === null) {
        return null;
      }

      return {
        country,
        mbbs,
        bds,
        sortOrder:
          typeof item.sortOrder === 'number' && Number.isFinite(item.sortOrder)
            ? item.sortOrder
            : index + 1,
        isActive: item.isActive !== false,
      };
    })
    .filter(Boolean);

  return rows.length > 0 ? rows : null;
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

const studyDestinationPageShortcutFields = [
  { name: 'title', label: 'Title', type: 'text', required: true },
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
  {
    name: 'content',
    label: 'Page Content',
    type: 'rich-content',
    richContentStorageMode: 'json-object',
    rows: 12,
    colSpan: 2,
  },
  ...defaultSeoFields,
] as const;

const getStudyDestinationShortcutItemsBySlug = (payload: unknown, slug: string) =>
  (Array.isArray(payload) ? payload : []).filter(
    (item): item is ResourceItem =>
      Boolean(item) &&
      typeof item === 'object' &&
      'slug' in item &&
      String((item as ResourceItem).slug ?? '').trim().toLowerCase() === slug,
  );

const getStudyDestinationShortcutEditValues = (item: ResourceItem) => ({
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
  content: item.content,
  seoKeywords: toKeywordsValue(item.seoKeywords),
});

const buildStudyDestinationShortcutPayload = (values: Record<string, unknown>) => {
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
};

const toResourceItems = (payload: unknown) =>
  (Array.isArray(payload) ? payload : []).filter(
    (item): item is ResourceItem =>
      Boolean(item) && typeof item === 'object' && 'id' in item,
  );

const buildStudyDestinationPageListItem = (item: ResourceItem, editHref: string) => ({
  ...item,
  templateType: String(item.templateType ?? 'FIXED_FRONTEND_CONTENT'),
  updatedAt: String(item.updatedAt ?? item.createdAt ?? ''),
  [shortcutPageEditHrefKey]: editHref,
  [shortcutPageUpdatePathKey]: `/study-destinations/${item.id}`,
  [shortcutPageDeleteDisabledKey]: true,
});

const loadPagesResourceItems = async () => {
  const [pagesResponse, studyDestinationsResponse] = await Promise.all([
    apiClient.get('/pages'),
    apiClient.get('/study-destinations'),
  ]);
  const pageItems = toResourceItems(extractApiData<unknown>(pagesResponse));
  const studyDestinationItems = extractApiData<unknown>(studyDestinationsResponse);
  const shortcutItems = [
    ...getStudyDestinationShortcutItemsBySlug(studyDestinationItems, 'mbbs-bangladesh').map((item) =>
      buildStudyDestinationPageListItem(item, '/pages/mbbs-bangladesh'),
    ),
    ...getStudyDestinationShortcutItemsBySlug(studyDestinationItems, 'mbbs-georgia').map((item) =>
      buildStudyDestinationPageListItem(item, '/pages/mbbs-georgia'),
    ),
  ];

  return [...pageItems, ...shortcutItems];
};

export const resourceConfigs: Record<string, ResourceConfig<ResourceItem>> = {
  pages: {
    key: 'pages',
    title: 'Pages',
    singular: 'Page',
    description: 'Manage content pages, hero sections, reusable blocks, and SEO metadata.',
    endpoint: '/pages',
    loadItems: loadPagesResourceItems,
    getItemEditHref: (item) =>
      typeof item[shortcutPageEditHrefKey] === 'string'
        ? String(item[shortcutPageEditHrefKey])
        : null,
    getItemUpdatePath: (item) =>
      typeof item[shortcutPageUpdatePathKey] === 'string'
        ? String(item[shortcutPageUpdatePathKey])
        : null,
    canDeleteItem: (item) => item[shortcutPageDeleteDisabledKey] !== true,
    getDuplicateValues: (item, editValues) => {
      if (typeof item[shortcutPageEditHrefKey] === 'string') {
        return null;
      }

      return buildDuplicateDraftValues(editValues, {
        title: appendDuplicateLabel(editValues.title),
        slug: '',
        status: 'DRAFT',
        canonicalUrl: '',
      });
    },
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
      philosophyEyebrow: homePhilosophyFallbackContent.eyebrow,
      philosophyTitle: homePhilosophyFallbackContent.title,
      philosophySupportingHeading: homePhilosophyFallbackContent.supportingHeading,
      philosophyDescription: homePhilosophyFallbackContent.description,
      philosophyImageSrc: homePhilosophyFallbackContent.imageSrc,
      philosophyImageAlt: homePhilosophyFallbackContent.imageAlt,
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
      whyChooseUsFeatureCards: homeWhyChooseUsFallbackContent.featureCards,
      whyChooseUsApartTitle: homeWhyChooseUsFallbackContent.apartTitle,
      whyChooseUsApartItems: homeWhyChooseUsFallbackContent.apartItems,
      whyChooseUsRightEyebrow: homeWhyChooseUsFallbackContent.rightEyebrow,
      whyChooseUsRightTitle: homeWhyChooseUsFallbackContent.rightTitle,
      whyChooseUsRightParagraph: homeWhyChooseUsFallbackContent.rightParagraph,
      whyChooseUsChecklistItems: homeWhyChooseUsFallbackContent.checklistItems,
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
      studyDestinationsEyebrow: homeStudyDestinationsFallbackContent.eyebrow,
      studyDestinationsTitle: homeStudyDestinationsFallbackContent.title,
      studyDestinationsSubtitle: homeStudyDestinationsFallbackContent.subtitle,
      pageCtaTitle: genericPageCtaFallbackContent.title,
      pageCtaSubtitle: genericPageCtaFallbackContent.subtitle,
      pageCtaPrimaryButtonText: genericPageCtaFallbackContent.primaryButtonText,
      pageCtaPrimaryButtonUrl: genericPageCtaFallbackContent.primaryButtonUrl,
      pageCtaSecondaryButtonText: genericPageCtaFallbackContent.secondaryButtonText,
      pageCtaSecondaryButtonUrl: genericPageCtaFallbackContent.secondaryButtonUrl,
      aboutWhoWeAreEyebrow: aboutPageFallbackContent.whoWeAreEyebrow,
      aboutWhoWeAreTitle: aboutPageFallbackContent.whoWeAreTitle,
      aboutWhoWeAreImage: aboutPageFallbackContent.whoWeAreImage,
      aboutWhoWeAreImageAlt: aboutPageFallbackContent.whoWeAreImageAlt,
      aboutWhoWeAreBadgeValue: aboutPageFallbackContent.whoWeAreBadgeValue,
      aboutWhoWeAreBadgeLabel: aboutPageFallbackContent.whoWeAreBadgeLabel,
      aboutOverview: aboutPageFallbackContent.overview,
      aboutValuesEyebrow: aboutPageFallbackContent.valuesEyebrow,
      aboutValuesTitle: aboutPageFallbackContent.valuesTitle,
      aboutValuesSubtitle: aboutPageFallbackContent.valuesSubtitle,
      aboutValues: aboutPageFallbackContent.values,
      aboutTrustEyebrow: aboutPageFallbackContent.trustEyebrow,
      aboutTrustTitle: aboutPageFallbackContent.trustTitle,
      aboutTrustDescription: aboutPageFallbackContent.trustDescription,
      aboutTrustPoints: aboutPageFallbackContent.trustPoints,
      aboutTrustCtaText: aboutPageFallbackContent.trustCtaText,
      aboutTrustCtaUrl: aboutPageFallbackContent.trustCtaUrl,
      aboutMetricStudentsPlaced: aboutPageFallbackContent.metrics.studentsPlaced,
      aboutMetricPartnerColleges: aboutPageFallbackContent.metrics.partnerColleges,
      aboutMetricYearsExperience: aboutPageFallbackContent.metrics.yearsExperience,
      aboutMetricAdmissionSuccess: aboutPageFallbackContent.metrics.admissionSuccess,
      whyHeroQuoteText: whyMedientryFallbackContent.heroQuoteText,
      whyDifferenceTitle: whyMedientryFallbackContent.differenceTitle,
      whyDifferenceDescription: whyMedientryFallbackContent.differenceDescription,
      whyPhilosophyPoints: whyMedientryFallbackContent.philosophyPoints,
      whyDifferenceQuoteText: whyMedientryFallbackContent.differenceQuoteText,
      whyCommitmentsEyebrow: whyMedientryFallbackContent.commitmentsEyebrow,
      whyCommitmentsTitle: whyMedientryFallbackContent.commitmentsTitle,
      whyReasons: whyMedientryFallbackContent.reasons,
      whyPromiseEyebrow: whyMedientryFallbackContent.promiseEyebrow,
      whyPromiseTitle: whyMedientryFallbackContent.promiseTitle,
      whyPromiseDescription: whyMedientryFallbackContent.promiseDescription,
      whyGuarantees: whyMedientryFallbackContent.guarantees,
      whyPromiseCtaText: whyMedientryFallbackContent.promiseCtaText,
      whyPromiseCtaUrl: whyMedientryFallbackContent.promiseCtaUrl,
      whyMetricStudentsGuided: whyMedientryFallbackContent.metrics.studentsGuided,
      whyMetricYearsExperience: whyMedientryFallbackContent.metrics.yearsExperience,
      whyMetricPartnerColleges: whyMedientryFallbackContent.metrics.partnerColleges,
      whyMetricSuccessRate: whyMedientryFallbackContent.metrics.successRate,
      whyTrackRecordTitle: whyMedientryFallbackContent.trackRecordTitle,
      whyTrackRecordQuoteText: whyMedientryFallbackContent.trackRecordQuoteText,
      whyFeelEyebrow: whyMedientryFallbackContent.feelEyebrow,
      whyFeelTitle: whyMedientryFallbackContent.feelTitle,
      whyFeelStatements: whyMedientryFallbackContent.feelStatements,
      whyFeelSummary: whyMedientryFallbackContent.feelSummary,
      successStatStudentsPlaced: successStoriesFallbackContent.stats.studentsPlaced,
      successStatAdmissionSuccess: successStoriesFallbackContent.stats.admissionSuccess,
      successStatYearsOfTrust: successStoriesFallbackContent.stats.yearsOfTrust,
      successStatParentSatisfaction: successStoriesFallbackContent.stats.parentSatisfaction,
      successShareTitle: successStoriesFallbackContent.shareTitle,
      successShareSubtitle: successStoriesFallbackContent.shareSubtitle,
      successShareCtaText: successStoriesFallbackContent.shareCtaText,
      successShareCtaUrl: successStoriesFallbackContent.shareCtaUrl,
      contactFormTitle: contactPageFallbackContent.formTitle,
      contactFormSubtitle: contactPageFallbackContent.formSubtitle,
      contactWorkingHoursTitle: contactPageFallbackContent.workingHoursTitle,
      contactWhatToExpectTitle: contactPageFallbackContent.whatToExpectTitle,
      contactWhatsappCardTitle: contactPageFallbackContent.whatsappCardTitle,
      contactWhatsappCardDescription: contactPageFallbackContent.whatsappCardDescription,
      contactWhatsappCtaText: contactPageFallbackContent.whatsappCtaText,
      contactOfficesEyebrow: contactPageFallbackContent.officesEyebrow,
      contactOfficesTitle: contactPageFallbackContent.officesTitle,
      contactOfficesSubtitle: contactPageFallbackContent.officesSubtitle,
      contactOfficeHours: contactPageFallbackContent.workingHours.officeHours,
      contactFridayHours: contactPageFallbackContent.workingHours.friday,
      contactWhatToExpectItems: contactPageFallbackContent.whatToExpect,
      contactOffices: contactPageFallbackContent.offices,
      collegesHeroEyebrow: collegesPageFallbackContent.heroEyebrow,
      collegesExpertTipLabel: collegesPageFallbackContent.expertTipLabel,
      collegesExpertTipText: collegesPageFallbackContent.expertTipText,
      collegesBangladeshEyebrow: collegesPageFallbackContent.bangladeshEyebrow,
      collegesBangladeshTitle: collegesPageFallbackContent.bangladeshTitle,
      collegesBangladeshDescription: collegesPageFallbackContent.bangladeshDescription,
      collegesGeorgiaEyebrow: collegesPageFallbackContent.georgiaEyebrow,
      collegesGeorgiaTitle: collegesPageFallbackContent.georgiaTitle,
      collegesGeorgiaDescription: collegesPageFallbackContent.georgiaDescription,
      collegesGeorgiaVisible: true,
      collegesGuidanceEyebrow: collegesPageFallbackContent.guidanceEyebrow,
      collegesGuidanceTitle: collegesPageFallbackContent.guidanceTitle,
      collegesGuidanceTips: collegesPageFallbackContent.guidanceTips,
      governmentHeroEyebrow: mbbsBangladeshGovernmentFallbackContent.heroEyebrow,
      governmentHeroBadgeText: mbbsBangladeshGovernmentFallbackContent.heroBadgeText,
      governmentIntroTitle: mbbsBangladeshGovernmentFallbackContent.introTitle,
      governmentIntroParagraph: mbbsBangladeshGovernmentFallbackContent.introParagraph,
      governmentIntroQuotaItems: mbbsBangladeshGovernmentFallbackContent.introQuotaItems,
      governmentIntroConclusion: mbbsBangladeshGovernmentFallbackContent.introConclusion,
      governmentSeatEyebrow: mbbsBangladeshGovernmentFallbackContent.seatEyebrow,
      governmentSeatTitle: mbbsBangladeshGovernmentFallbackContent.seatTitle,
      governmentSeatDescription: mbbsBangladeshGovernmentFallbackContent.seatDescription,
      governmentSaarcTableTitle: mbbsBangladeshGovernmentFallbackContent.saarcTableTitle,
      governmentSaarcSeats: mbbsBangladeshGovernmentFallbackContent.saarcSeats,
      governmentNonSaarcTableTitle: mbbsBangladeshGovernmentFallbackContent.nonSaarcTableTitle,
      governmentNonSaarcSeats: mbbsBangladeshGovernmentFallbackContent.nonSaarcSeats,
      governmentSaarcSectionTitle: mbbsBangladeshGovernmentFallbackContent.saarcSectionTitle,
      governmentSaarcApplicableTitle: mbbsBangladeshGovernmentFallbackContent.saarcApplicableTitle,
      governmentSaarcCountries: mbbsBangladeshGovernmentFallbackContent.saarcCountries,
      governmentSaarcKeyPointsTitle: mbbsBangladeshGovernmentFallbackContent.saarcKeyPointsTitle,
      governmentSaarcKeyPoints: mbbsBangladeshGovernmentFallbackContent.saarcKeyPoints,
      governmentNonSaarcSectionTitle: mbbsBangladeshGovernmentFallbackContent.nonSaarcSectionTitle,
      governmentNonSaarcPoints: mbbsBangladeshGovernmentFallbackContent.nonSaarcPoints,
      governmentEligibilityTitle: mbbsBangladeshGovernmentFallbackContent.eligibilityTitle,
      governmentEligibilityPoints: mbbsBangladeshGovernmentFallbackContent.eligibilityPoints,
      governmentApplicationProcessTitle: mbbsBangladeshGovernmentFallbackContent.applicationProcessTitle,
      governmentApplicationSteps: mbbsBangladeshGovernmentFallbackContent.applicationSteps,
      governmentLegalNoticeTitle: mbbsBangladeshGovernmentFallbackContent.legalNoticeTitle,
      governmentLegalNoticeSummary: mbbsBangladeshGovernmentFallbackContent.legalNoticeSummary,
      governmentLegalNoticeDetails: mbbsBangladeshGovernmentFallbackContent.legalNoticeDetails,
      governmentHelpTitle: mbbsBangladeshGovernmentFallbackContent.helpTitle,
      governmentHelpDescription: mbbsBangladeshGovernmentFallbackContent.helpDescription,
      governmentHelpPoints: mbbsBangladeshGovernmentFallbackContent.helpPoints,
      governmentHelpDisclaimer: mbbsBangladeshGovernmentFallbackContent.helpDisclaimer,
      governmentHelpPrimaryButtonText: mbbsBangladeshGovernmentFallbackContent.helpPrimaryButtonText,
      governmentHelpSecondaryButtonText: mbbsBangladeshGovernmentFallbackContent.helpSecondaryButtonText,
      georgiaHeroEyebrow: georgiaForBangladeshisFallbackContent.heroEyebrow,
      georgiaHeroBadgeText: georgiaForBangladeshisFallbackContent.heroBadgeText,
      georgiaHeroLeadText: georgiaForBangladeshisFallbackContent.heroLeadText,
      georgiaHeroPrimaryButtonText: georgiaForBangladeshisFallbackContent.heroPrimaryButtonText,
      georgiaHeroPrimaryButtonUrl: georgiaForBangladeshisFallbackContent.heroPrimaryButtonUrl,
      georgiaHeroSecondaryButtonText: georgiaForBangladeshisFallbackContent.heroSecondaryButtonText,
      georgiaHeroSecondaryButtonUrl: georgiaForBangladeshisFallbackContent.heroSecondaryButtonUrl,
      georgiaProgramsEyebrow: georgiaForBangladeshisFallbackContent.programsEyebrow,
      georgiaProgramsTitle: georgiaForBangladeshisFallbackContent.programsTitle,
      georgiaProgramsSubtitle: georgiaForBangladeshisFallbackContent.programsSubtitle,
      georgiaPrograms: georgiaForBangladeshisFallbackContent.programs,
      georgiaWhyEyebrow: georgiaForBangladeshisFallbackContent.whyGeorgiaEyebrow,
      georgiaWhyTitle: georgiaForBangladeshisFallbackContent.whyGeorgiaTitle,
      georgiaWhySubtitle: georgiaForBangladeshisFallbackContent.whyGeorgiaSubtitle,
      georgiaWhyCards: georgiaForBangladeshisFallbackContent.whyGeorgiaCards,
      georgiaPartnerEyebrow: georgiaForBangladeshisFallbackContent.partnerEyebrow,
      georgiaPartnerTitle: georgiaForBangladeshisFallbackContent.partnerTitle,
      georgiaPartnerDescription: georgiaForBangladeshisFallbackContent.partnerDescription,
      georgiaPartnerBenefits: georgiaForBangladeshisFallbackContent.partnerBenefits,
      georgiaPartnerImage: georgiaForBangladeshisFallbackContent.partnerImage,
      georgiaPartnerImageAlt: georgiaForBangladeshisFallbackContent.partnerImageAlt,
      georgiaPartnerStatValue: georgiaForBangladeshisFallbackContent.partnerStatValue,
      georgiaPartnerStatLabel: georgiaForBangladeshisFallbackContent.partnerStatLabel,
      georgiaRecognitionEyebrow: georgiaForBangladeshisFallbackContent.recognitionEyebrow,
      georgiaRecognitionTitle: georgiaForBangladeshisFallbackContent.recognitionTitle,
      georgiaRecognitionSubtitle: georgiaForBangladeshisFallbackContent.recognitionSubtitle,
      georgiaRecognitionItems: georgiaForBangladeshisFallbackContent.recognitionItems,
      georgiaSupportEyebrow: georgiaForBangladeshisFallbackContent.supportEyebrow,
      georgiaSupportTitle: georgiaForBangladeshisFallbackContent.supportTitle,
      georgiaSupportSubtitle: georgiaForBangladeshisFallbackContent.supportSubtitle,
      georgiaSupportSteps: georgiaForBangladeshisFallbackContent.supportSteps,
      georgiaCareerEyebrow: georgiaForBangladeshisFallbackContent.careerEyebrow,
      georgiaCareerTitle: georgiaForBangladeshisFallbackContent.careerTitle,
      georgiaCareerDescription: georgiaForBangladeshisFallbackContent.careerDescription,
      georgiaCareerCards: georgiaForBangladeshisFallbackContent.careerCards,
      georgiaCareerSnapshotTitle: georgiaForBangladeshisFallbackContent.careerSnapshotTitle,
      georgiaCareerSnapshotCards: georgiaForBangladeshisFallbackContent.careerSnapshotCards,
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
        type: 'text',
        visible: (values) => isHomePageValues(values),
        description: 'Supports internal paths like /contact or full external URLs.',
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
        type: 'text',
        visible: (values) => isHomePageValues(values),
        description: 'Supports internal paths like /mbbs-bangladesh or full external URLs.',
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
        name: 'philosophyEyebrow',
        label: 'Our Philosophy Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'philosophyTitle',
        label: 'Our Philosophy Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'philosophySupportingHeading',
        label: 'Our Philosophy Supporting Heading',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'philosophyDescription',
        label: 'Our Philosophy Description',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'philosophyImageSrc',
        label: 'Our Philosophy Image',
        type: 'url',
        colSpan: 2,
        uploadKind: 'image',
        previewLabel: 'Preview philosophy image',
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'philosophyImageAlt',
        label: 'Our Philosophy Image Alt Text',
        type: 'text',
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
        type: 'text',
        visible: (values) => isHomePageValues(values),
        description: 'Supports internal paths like /success-stories or full external URLs.',
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
        label: 'Why Choose Us Feature Cards',
        type: 'feature-cards',
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
        label: 'What Sets Us Apart Items',
        type: 'feature-cards',
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
        label: 'Right Column Checklist',
        type: 'checklist-items',
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
      {
        name: 'studyDestinationsEyebrow',
        label: 'Study Destinations Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'studyDestinationsTitle',
        label: 'Study Destinations Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'studyDestinationsSubtitle',
        label: 'Study Destinations Subtitle',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isHomePageValues(values),
      },
      {
        name: 'aboutWhoWeAreEyebrow',
        label: 'About Who We Are Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutWhoWeAreTitle',
        label: 'About Who We Are Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutOverview',
        label: 'About Overview Paragraphs',
        type: 'string-list',
        colSpan: 2,
        visible: (values) => isAboutPageValues(values),
        description: 'Manage the paragraphs shown in the Who We Are section.',
      },
      {
        name: 'aboutWhoWeAreImage',
        label: 'About Who We Are Image',
        type: 'url',
        colSpan: 2,
        uploadKind: 'image',
        previewLabel: 'Preview about image',
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutWhoWeAreImageAlt',
        label: 'About Who We Are Image Alt Text',
        type: 'text',
        colSpan: 2,
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutWhoWeAreBadgeValue',
        label: 'About Badge Value',
        type: 'text',
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutWhoWeAreBadgeLabel',
        label: 'About Badge Label',
        type: 'text',
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutValuesEyebrow',
        label: 'About Values Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutValuesTitle',
        label: 'About Values Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutValuesSubtitle',
        label: 'About Values Subtitle',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutValues',
        label: 'About Value Cards',
        type: 'content-cards',
        colSpan: 2,
        visible: (values) => isAboutPageValues(values),
        description: 'Manage the value cards. Icons stay aligned with the existing frontend design.',
      },
      {
        name: 'aboutTrustEyebrow',
        label: 'About Trust Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutTrustTitle',
        label: 'About Trust Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutTrustDescription',
        label: 'About Trust Description',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutTrustPoints',
        label: 'About Trust Points',
        type: 'string-list',
        colSpan: 2,
        visible: (values) => isAboutPageValues(values),
        description: 'Manage the checklist items shown in the trust section.',
      },
      {
        name: 'aboutTrustCtaText',
        label: 'About Trust Button Text',
        type: 'text',
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutTrustCtaUrl',
        label: 'About Trust Button URL',
        type: 'text',
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutMetricStudentsPlaced',
        label: 'About Metric Students Placed',
        type: 'text',
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutMetricPartnerColleges',
        label: 'About Metric Partner Colleges',
        type: 'text',
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutMetricYearsExperience',
        label: 'About Metric Years Experience',
        type: 'text',
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'aboutMetricAdmissionSuccess',
        label: 'About Metric Admission Success',
        type: 'text',
        visible: (values) => isAboutPageValues(values),
      },
      {
        name: 'whyHeroQuoteText',
        label: 'Why Medientry Hero Quote',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyDifferenceTitle',
        label: 'Why Difference Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyDifferenceDescription',
        label: 'Why Difference Description',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyPhilosophyPoints',
        label: 'Why Difference Cards',
        type: 'content-cards',
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
        description: 'Manage the philosophy cards shown in the first Why Medientry section.',
      },
      {
        name: 'whyDifferenceQuoteText',
        label: 'Why Difference Quote',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyCommitmentsEyebrow',
        label: 'Why Commitments Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyCommitmentsTitle',
        label: 'Why Commitments Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyReasons',
        label: 'Why Commitment Cards',
        type: 'detailed-content-cards',
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
        description: 'Manage the commitment cards with title, description, and optional detail text.',
      },
      {
        name: 'whyPromiseEyebrow',
        label: 'Why Promise Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyPromiseTitle',
        label: 'Why Promise Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyPromiseDescription',
        label: 'Why Promise Description',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyGuarantees',
        label: 'Why Guarantee Points',
        type: 'string-list',
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyPromiseCtaText',
        label: 'Why Promise Button Text',
        type: 'text',
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyPromiseCtaUrl',
        label: 'Why Promise Button URL',
        type: 'text',
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyTrackRecordTitle',
        label: 'Why Track Record Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyMetricStudentsGuided',
        label: 'Why Metric Students Guided',
        type: 'text',
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyMetricYearsExperience',
        label: 'Why Metric Years Experience',
        type: 'text',
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyMetricPartnerColleges',
        label: 'Why Metric Partner Colleges',
        type: 'text',
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyMetricSuccessRate',
        label: 'Why Metric Success Rate',
        type: 'text',
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyTrackRecordQuoteText',
        label: 'Why Track Record Quote',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyFeelEyebrow',
        label: 'Why Feel Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyFeelTitle',
        label: 'Why Feel Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyFeelStatements',
        label: 'Why Feel Statements',
        type: 'string-list',
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'whyFeelSummary',
        label: 'Why Feel Summary',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isWhyMedientryPageValues(values),
      },
      {
        name: 'successStatStudentsPlaced',
        label: 'Success Stories Students Placed',
        type: 'text',
        visible: (values) => isSuccessStoriesPageValues(values),
      },
      {
        name: 'successStatAdmissionSuccess',
        label: 'Success Stories Admission Success',
        type: 'text',
        visible: (values) => isSuccessStoriesPageValues(values),
      },
      {
        name: 'successStatYearsOfTrust',
        label: 'Success Stories Years of Trust',
        type: 'text',
        visible: (values) => isSuccessStoriesPageValues(values),
      },
      {
        name: 'successStatParentSatisfaction',
        label: 'Success Stories Parent Satisfaction',
        type: 'text',
        visible: (values) => isSuccessStoriesPageValues(values),
      },
      {
        name: 'successShareTitle',
        label: 'Success Share Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isSuccessStoriesPageValues(values),
      },
      {
        name: 'successShareSubtitle',
        label: 'Success Share Subtitle',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isSuccessStoriesPageValues(values),
      },
      {
        name: 'successShareCtaText',
        label: 'Success Share Button Text',
        type: 'text',
        visible: (values) => isSuccessStoriesPageValues(values),
      },
      {
        name: 'successShareCtaUrl',
        label: 'Success Share Button URL',
        type: 'text',
        visible: (values) => isSuccessStoriesPageValues(values),
      },
      {
        name: 'contactFormTitle',
        label: 'Contact Form Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactFormSubtitle',
        label: 'Contact Form Subtitle',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactWorkingHoursTitle',
        label: 'Contact Working Hours Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactOfficeHours',
        label: 'Contact Office Hours',
        type: 'text',
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactFridayHours',
        label: 'Contact Friday Hours',
        type: 'text',
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactWhatToExpectTitle',
        label: 'Contact What To Expect Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactWhatToExpectItems',
        label: 'Contact What To Expect Items',
        type: 'string-list',
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactWhatsappCardTitle',
        label: 'Contact WhatsApp Card Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactWhatsappCardDescription',
        label: 'Contact WhatsApp Card Description',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactWhatsappCtaText',
        label: 'Contact WhatsApp Button Text',
        type: 'text',
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactOfficesEyebrow',
        label: 'Contact Offices Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactOfficesTitle',
        label: 'Contact Offices Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactOfficesSubtitle',
        label: 'Contact Offices Subtitle',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
      },
      {
        name: 'contactOffices',
        label: 'Contact Office Cards',
        type: 'contact-offices',
        colSpan: 2,
        visible: (values) => isContactPageValues(values),
        validate: (value) => validateContactOffices(value),
      },
      {
        name: 'collegesHeroEyebrow',
        label: 'Hero Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isCollegesPageValues(values),
      },
      {
        name: 'collegesExpertTipLabel',
        label: 'Expert Tip Label',
        type: 'text',
        visible: (values) => isCollegesPageValues(values),
      },
      {
        name: 'collegesExpertTipText',
        label: 'Expert Tip Text',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isCollegesPageValues(values),
      },
      {
        name: 'collegesBangladeshEyebrow',
        label: 'Bangladesh Section Eyebrow',
        type: 'text',
        visible: (values) => isCollegesPageValues(values),
      },
      {
        name: 'collegesBangladeshTitle',
        label: 'Bangladesh Section Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isCollegesPageValues(values),
      },
      {
        name: 'collegesBangladeshDescription',
        label: 'Bangladesh Section Description',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isCollegesPageValues(values),
      },
      {
        name: 'collegesGeorgiaEyebrow',
        label: 'Georgia Section Eyebrow',
        type: 'text',
        visible: (values) => isCollegesPageValues(values),
      },
      {
        name: 'collegesGeorgiaTitle',
        label: 'Georgia Section Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isCollegesPageValues(values),
      },
      {
        name: 'collegesGeorgiaDescription',
        label: 'Georgia Section Description',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isCollegesPageValues(values),
      },
      {
        name: 'collegesGeorgiaVisible',
        label: 'Show Georgia Section',
        type: 'switch',
        visible: (values) => isCollegesPageValues(values),
      },
      {
        name: 'collegesGuidanceEyebrow',
        label: 'Guidance Section Eyebrow',
        type: 'text',
        visible: (values) => isCollegesPageValues(values),
      },
      {
        name: 'collegesGuidanceTitle',
        label: 'Guidance Section Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isCollegesPageValues(values),
      },
      {
        name: 'collegesGuidanceTips',
        label: 'Guidance Tips',
        type: 'content-cards',
        colSpan: 2,
        visible: (values) => isCollegesPageValues(values),
        description:
          'Manage the tip cards shown below the automatic college grids. Medical college cards themselves stay synced from Medical Colleges and Study Destinations.',
      },
      {
        name: 'governmentHeroEyebrow',
        label: 'Government Hero Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentHeroBadgeText',
        label: 'Government Hero Badge Text',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentIntroTitle',
        label: 'Introduction Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentIntroParagraph',
        label: 'Introduction Paragraph',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentIntroQuotaItems',
        label: 'Introduction Quota Points',
        type: 'string-list',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
        description: 'Each point becomes one quota bullet in the introduction section.',
      },
      {
        name: 'governmentIntroConclusion',
        label: 'Introduction Closing Paragraph',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentSeatEyebrow',
        label: 'Seat Section Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentSeatTitle',
        label: 'Seat Section Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentSeatDescription',
        label: 'Seat Section Description',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentSaarcTableTitle',
        label: 'SAARC Table Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentSaarcSeats',
        label: 'SAARC Seat Rows',
        type: 'seat-allocation',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
        description: 'Manage the SAARC country seat table.',
      },
      {
        name: 'governmentNonSaarcTableTitle',
        label: 'Non-SAARC Table Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentNonSaarcSeats',
        label: 'Non-SAARC Seat Rows',
        type: 'seat-allocation',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
        description: 'Manage the non-SAARC country seat table.',
      },
      {
        name: 'governmentSaarcSectionTitle',
        label: 'SAARC Section Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentSaarcApplicableTitle',
        label: 'Applicable Countries Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentSaarcCountries',
        label: 'Applicable Countries',
        type: 'string-list',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentSaarcKeyPointsTitle',
        label: 'SAARC Key Points Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentSaarcKeyPoints',
        label: 'SAARC Key Points',
        type: 'string-list',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentNonSaarcSectionTitle',
        label: 'Non-SAARC Section Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentNonSaarcPoints',
        label: 'Non-SAARC Points',
        type: 'string-list',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentEligibilityTitle',
        label: 'Eligibility Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentEligibilityPoints',
        label: 'Eligibility Points',
        type: 'string-list',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentApplicationProcessTitle',
        label: 'Application Process Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentApplicationSteps',
        label: 'Application Steps',
        type: 'content-cards',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
        description: 'Each card becomes one application step. Display order controls the step number.',
      },
      {
        name: 'governmentLegalNoticeTitle',
        label: 'Legal Notice Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentLegalNoticeSummary',
        label: 'Legal Notice Summary',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentLegalNoticeDetails',
        label: 'Legal Notice Details',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentHelpTitle',
        label: 'Help Section Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentHelpDescription',
        label: 'Help Section Description',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentHelpPoints',
        label: 'Help Section Points',
        type: 'string-list',
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentHelpDisclaimer',
        label: 'Help Section Disclaimer',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentHelpPrimaryButtonText',
        label: 'Help Primary Button Text',
        type: 'text',
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'governmentHelpSecondaryButtonText',
        label: 'Help Secondary Button Text',
        type: 'text',
        visible: (values) => isMbbsBangladeshGovernmentPageValues(values),
      },
      {
        name: 'georgiaHeroEyebrow',
        label: 'Georgia Hero Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaHeroBadgeText',
        label: 'Georgia Hero Badge Text',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaHeroLeadText',
        label: 'Georgia Hero Lead Text',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaHeroPrimaryButtonText',
        label: 'Georgia Hero Primary Button Text',
        type: 'text',
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaHeroPrimaryButtonUrl',
        label: 'Georgia Hero Primary Button URL',
        type: 'text',
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaHeroSecondaryButtonText',
        label: 'Georgia Hero Secondary Button Text',
        type: 'text',
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaHeroSecondaryButtonUrl',
        label: 'Georgia Hero Secondary Button URL',
        type: 'text',
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaProgramsEyebrow',
        label: 'Programs Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaProgramsTitle',
        label: 'Programs Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaProgramsSubtitle',
        label: 'Programs Subtitle',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaPrograms',
        label: 'Programs',
        type: 'program-cards',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
        description: 'Manage the program cards shown in the first content section.',
      },
      {
        name: 'georgiaWhyEyebrow',
        label: 'Why Georgia Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaWhyTitle',
        label: 'Why Georgia Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaWhySubtitle',
        label: 'Why Georgia Subtitle',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaWhyCards',
        label: 'Why Georgia Cards',
        type: 'content-cards',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaPartnerEyebrow',
        label: 'Partner Section Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaPartnerTitle',
        label: 'Partner Section Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaPartnerDescription',
        label: 'Partner Section Description',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaPartnerBenefits',
        label: 'Partner Benefits',
        type: 'string-list',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaPartnerImage',
        label: 'Partner Image URL',
        type: 'url',
        colSpan: 2,
        uploadKind: 'image',
        previewLabel: 'Preview partner image',
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaPartnerImageAlt',
        label: 'Partner Image Alt Text',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaPartnerStatValue',
        label: 'Partner Stat Value',
        type: 'text',
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaPartnerStatLabel',
        label: 'Partner Stat Label',
        type: 'text',
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaRecognitionEyebrow',
        label: 'Recognition Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaRecognitionTitle',
        label: 'Recognition Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaRecognitionSubtitle',
        label: 'Recognition Subtitle',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaRecognitionItems',
        label: 'Recognition Items',
        type: 'content-cards',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
        description: 'Use the title for the recognition name and the description for the category label.',
      },
      {
        name: 'georgiaSupportEyebrow',
        label: 'Support Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaSupportTitle',
        label: 'Support Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaSupportSubtitle',
        label: 'Support Subtitle',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaSupportSteps',
        label: 'Support Steps',
        type: 'content-cards',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
        description: 'Each card becomes one support step. Display order controls the step number.',
      },
      {
        name: 'georgiaCareerEyebrow',
        label: 'Career Eyebrow',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaCareerTitle',
        label: 'Career Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaCareerDescription',
        label: 'Career Description',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaCareerCards',
        label: 'Career Cards',
        type: 'content-cards',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaCareerSnapshotTitle',
        label: 'Career Snapshot Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'georgiaCareerSnapshotCards',
        label: 'Career Snapshot Cards',
        type: 'content-cards',
        colSpan: 2,
        visible: (values) => isGeorgiaForBangladeshisPageValues(values),
      },
      {
        name: 'pageCtaTitle',
        label: 'Page CTA Title',
        type: 'text',
        colSpan: 2,
        visible: (values) => usesStructuredStaticPageEditor(values),
      },
      {
        name: 'pageCtaSubtitle',
        label: 'Page CTA Subtitle',
        type: 'textarea',
        rows: 4,
        colSpan: 2,
        visible: (values) => usesStructuredStaticPageEditor(values),
      },
      {
        name: 'pageCtaPrimaryButtonText',
        label: 'Page CTA Primary Button Text',
        type: 'text',
        visible: (values) => usesStructuredStaticPageEditor(values),
      },
      {
        name: 'pageCtaPrimaryButtonUrl',
        label: 'Page CTA Primary Button URL',
        type: 'text',
        visible: (values) => usesStructuredStaticPageEditor(values),
      },
      {
        name: 'pageCtaSecondaryButtonText',
        label: 'Page CTA Secondary Button Text',
        type: 'text',
        visible: (values) => usesStructuredStaticPageEditor(values),
      },
      {
        name: 'pageCtaSecondaryButtonUrl',
        label: 'Page CTA Secondary Button URL',
        type: 'text',
        visible: (values) => usesStructuredStaticPageEditor(values),
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
        label: 'Page Content',
        type: 'rich-content',
        richContentStorageMode: 'json-object',
        rows: 10,
        colSpan: 2,
        placeholder: '{\n  "blocks": []\n}',
        visible: (values) => !usesStructuredStaticPageEditor(values),
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

        if (usesStructuredStaticPageEditor(values)) {
          content.pageCtaTitle =
            normalizeString(values.pageCtaTitle) || genericPageCtaFallbackContent.title;
          content.pageCtaSubtitle =
            normalizeString(values.pageCtaSubtitle) || genericPageCtaFallbackContent.subtitle;
          content.pageCtaPrimaryButtonText =
            normalizeString(values.pageCtaPrimaryButtonText) ||
            genericPageCtaFallbackContent.primaryButtonText;
          content.pageCtaPrimaryButtonUrl =
            normalizeString(values.pageCtaPrimaryButtonUrl) ||
            genericPageCtaFallbackContent.primaryButtonUrl;
          content.pageCtaSecondaryButtonText =
            normalizeString(values.pageCtaSecondaryButtonText) ||
            genericPageCtaFallbackContent.secondaryButtonText;
          content.pageCtaSecondaryButtonUrl =
            normalizeString(values.pageCtaSecondaryButtonUrl) ||
            genericPageCtaFallbackContent.secondaryButtonUrl;
        }

        if (isAboutPageValues(values)) {
          content.aboutWhoWeAreEyebrow =
            normalizeString(values.aboutWhoWeAreEyebrow) ||
            aboutPageFallbackContent.whoWeAreEyebrow;
          content.aboutWhoWeAreTitle =
            normalizeString(values.aboutWhoWeAreTitle) ||
            aboutPageFallbackContent.whoWeAreTitle;
          content.aboutWhoWeAreImage =
            normalizeString(values.aboutWhoWeAreImage) ||
            aboutPageFallbackContent.whoWeAreImage;
          content.aboutWhoWeAreImageAlt =
            normalizeString(values.aboutWhoWeAreImageAlt) ||
            aboutPageFallbackContent.whoWeAreImageAlt;
          content.aboutWhoWeAreBadgeValue =
            normalizeString(values.aboutWhoWeAreBadgeValue) ||
            aboutPageFallbackContent.whoWeAreBadgeValue;
          content.aboutWhoWeAreBadgeLabel =
            normalizeString(values.aboutWhoWeAreBadgeLabel) ||
            aboutPageFallbackContent.whoWeAreBadgeLabel;
          content.aboutOverview =
            Array.isArray(values.aboutOverview) && values.aboutOverview.length > 0
              ? values.aboutOverview
              : aboutPageFallbackContent.overview;
          content.aboutValuesEyebrow =
            normalizeString(values.aboutValuesEyebrow) ||
            aboutPageFallbackContent.valuesEyebrow;
          content.aboutValuesTitle =
            normalizeString(values.aboutValuesTitle) ||
            aboutPageFallbackContent.valuesTitle;
          content.aboutValuesSubtitle =
            normalizeString(values.aboutValuesSubtitle) ||
            aboutPageFallbackContent.valuesSubtitle;
          content.aboutValues =
            Array.isArray(values.aboutValues) && values.aboutValues.length > 0
              ? values.aboutValues
              : aboutPageFallbackContent.values;
          content.aboutTrustEyebrow =
            normalizeString(values.aboutTrustEyebrow) ||
            aboutPageFallbackContent.trustEyebrow;
          content.aboutTrustTitle =
            normalizeString(values.aboutTrustTitle) ||
            aboutPageFallbackContent.trustTitle;
          content.aboutTrustDescription =
            normalizeString(values.aboutTrustDescription) ||
            aboutPageFallbackContent.trustDescription;
          content.aboutTrustPoints =
            Array.isArray(values.aboutTrustPoints) && values.aboutTrustPoints.length > 0
              ? values.aboutTrustPoints
              : aboutPageFallbackContent.trustPoints;
          content.aboutTrustCtaText =
            normalizeString(values.aboutTrustCtaText) ||
            aboutPageFallbackContent.trustCtaText;
          content.aboutTrustCtaUrl =
            normalizeString(values.aboutTrustCtaUrl) ||
            aboutPageFallbackContent.trustCtaUrl;
          content.aboutMetrics = {
            studentsPlaced:
              normalizeString(values.aboutMetricStudentsPlaced) ||
              aboutPageFallbackContent.metrics.studentsPlaced,
            partnerColleges:
              normalizeString(values.aboutMetricPartnerColleges) ||
              aboutPageFallbackContent.metrics.partnerColleges,
            yearsExperience:
              normalizeString(values.aboutMetricYearsExperience) ||
              aboutPageFallbackContent.metrics.yearsExperience,
            admissionSuccess:
              normalizeString(values.aboutMetricAdmissionSuccess) ||
              aboutPageFallbackContent.metrics.admissionSuccess,
          };
        }

        if (isWhyMedientryPageValues(values)) {
          content.whyHeroQuoteText =
            normalizeString(values.whyHeroQuoteText) ||
            whyMedientryFallbackContent.heroQuoteText;
          content.whyDifferenceTitle =
            normalizeString(values.whyDifferenceTitle) ||
            whyMedientryFallbackContent.differenceTitle;
          content.whyDifferenceDescription =
            normalizeString(values.whyDifferenceDescription) ||
            whyMedientryFallbackContent.differenceDescription;
          content.whyPhilosophyPoints =
            Array.isArray(values.whyPhilosophyPoints) && values.whyPhilosophyPoints.length > 0
              ? values.whyPhilosophyPoints
              : whyMedientryFallbackContent.philosophyPoints;
          content.whyDifferenceQuoteText =
            normalizeString(values.whyDifferenceQuoteText) ||
            whyMedientryFallbackContent.differenceQuoteText;
          content.whyCommitmentsEyebrow =
            normalizeString(values.whyCommitmentsEyebrow) ||
            whyMedientryFallbackContent.commitmentsEyebrow;
          content.whyCommitmentsTitle =
            normalizeString(values.whyCommitmentsTitle) ||
            whyMedientryFallbackContent.commitmentsTitle;
          content.whyReasons =
            Array.isArray(values.whyReasons) && values.whyReasons.length > 0
              ? values.whyReasons
              : whyMedientryFallbackContent.reasons;
          content.whyPromiseEyebrow =
            normalizeString(values.whyPromiseEyebrow) ||
            whyMedientryFallbackContent.promiseEyebrow;
          content.whyPromiseTitle =
            normalizeString(values.whyPromiseTitle) ||
            whyMedientryFallbackContent.promiseTitle;
          content.whyPromiseDescription =
            normalizeString(values.whyPromiseDescription) ||
            whyMedientryFallbackContent.promiseDescription;
          content.whyGuarantees =
            Array.isArray(values.whyGuarantees) && values.whyGuarantees.length > 0
              ? values.whyGuarantees
              : whyMedientryFallbackContent.guarantees;
          content.whyPromiseCtaText =
            normalizeString(values.whyPromiseCtaText) ||
            whyMedientryFallbackContent.promiseCtaText;
          content.whyPromiseCtaUrl =
            normalizeString(values.whyPromiseCtaUrl) ||
            whyMedientryFallbackContent.promiseCtaUrl;
          content.whyMetrics = {
            studentsGuided:
              normalizeString(values.whyMetricStudentsGuided) ||
              whyMedientryFallbackContent.metrics.studentsGuided,
            yearsExperience:
              normalizeString(values.whyMetricYearsExperience) ||
              whyMedientryFallbackContent.metrics.yearsExperience,
            partnerColleges:
              normalizeString(values.whyMetricPartnerColleges) ||
              whyMedientryFallbackContent.metrics.partnerColleges,
            successRate:
              normalizeString(values.whyMetricSuccessRate) ||
              whyMedientryFallbackContent.metrics.successRate,
          };
          content.whyTrackRecordTitle =
            normalizeString(values.whyTrackRecordTitle) ||
            whyMedientryFallbackContent.trackRecordTitle;
          content.whyTrackRecordQuoteText =
            normalizeString(values.whyTrackRecordQuoteText) ||
            whyMedientryFallbackContent.trackRecordQuoteText;
          content.whyFeelEyebrow =
            normalizeString(values.whyFeelEyebrow) ||
            whyMedientryFallbackContent.feelEyebrow;
          content.whyFeelTitle =
            normalizeString(values.whyFeelTitle) ||
            whyMedientryFallbackContent.feelTitle;
          content.whyFeelStatements =
            Array.isArray(values.whyFeelStatements) && values.whyFeelStatements.length > 0
              ? values.whyFeelStatements
              : whyMedientryFallbackContent.feelStatements;
          content.whyFeelSummary =
            normalizeString(values.whyFeelSummary) ||
            whyMedientryFallbackContent.feelSummary;
        }

        if (isSuccessStoriesPageValues(values)) {
          content.successStoriesStats = {
            studentsPlaced:
              normalizeString(values.successStatStudentsPlaced) ||
              successStoriesFallbackContent.stats.studentsPlaced,
            admissionSuccess:
              normalizeString(values.successStatAdmissionSuccess) ||
              successStoriesFallbackContent.stats.admissionSuccess,
            yearsOfTrust:
              normalizeString(values.successStatYearsOfTrust) ||
              successStoriesFallbackContent.stats.yearsOfTrust,
            parentSatisfaction:
              normalizeString(values.successStatParentSatisfaction) ||
              successStoriesFallbackContent.stats.parentSatisfaction,
          };
          content.successShareTitle =
            normalizeString(values.successShareTitle) ||
            successStoriesFallbackContent.shareTitle;
          content.successShareSubtitle =
            normalizeString(values.successShareSubtitle) ||
            successStoriesFallbackContent.shareSubtitle;
          content.successShareCtaText =
            normalizeString(values.successShareCtaText) ||
            successStoriesFallbackContent.shareCtaText;
          content.successShareCtaUrl =
            normalizeString(values.successShareCtaUrl) ||
            successStoriesFallbackContent.shareCtaUrl;
        }

        if (isContactPageValues(values)) {
          content.contactFormTitle =
            normalizeString(values.contactFormTitle) ||
            contactPageFallbackContent.formTitle;
          content.contactFormSubtitle =
            normalizeString(values.contactFormSubtitle) ||
            contactPageFallbackContent.formSubtitle;
          content.contactWorkingHoursTitle =
            normalizeString(values.contactWorkingHoursTitle) ||
            contactPageFallbackContent.workingHoursTitle;
          content.contactWhatToExpectTitle =
            normalizeString(values.contactWhatToExpectTitle) ||
            contactPageFallbackContent.whatToExpectTitle;
          content.contactWhatsappCardTitle =
            normalizeString(values.contactWhatsappCardTitle) ||
            contactPageFallbackContent.whatsappCardTitle;
          content.contactWhatsappCardDescription =
            normalizeString(values.contactWhatsappCardDescription) ||
            contactPageFallbackContent.whatsappCardDescription;
          content.contactWhatsappCtaText =
            normalizeString(values.contactWhatsappCtaText) ||
            contactPageFallbackContent.whatsappCtaText;
          content.contactOfficesEyebrow =
            normalizeString(values.contactOfficesEyebrow) ||
            contactPageFallbackContent.officesEyebrow;
          content.contactOfficesTitle =
            normalizeString(values.contactOfficesTitle) ||
            contactPageFallbackContent.officesTitle;
          content.contactOfficesSubtitle =
            normalizeString(values.contactOfficesSubtitle) ||
            contactPageFallbackContent.officesSubtitle;
          content.contactWorkingHours = {
            officeHours:
              normalizeString(values.contactOfficeHours) ||
              contactPageFallbackContent.workingHours.officeHours,
            friday:
              normalizeString(values.contactFridayHours) ||
              contactPageFallbackContent.workingHours.friday,
          };
          content.contactWhatToExpectItems =
            Array.isArray(values.contactWhatToExpectItems) &&
            values.contactWhatToExpectItems.length > 0
              ? values.contactWhatToExpectItems
              : contactPageFallbackContent.whatToExpect;
          content.contactOffices = sanitizeContactOffices(values.contactOffices);
          delete content.contactOfficeGoogleMapsLink;
        }

        if (isCollegesPageValues(values)) {
          content.collegesHeroEyebrow =
            normalizeString(values.collegesHeroEyebrow) ||
            collegesPageFallbackContent.heroEyebrow;
          content.collegesExpertTipLabel =
            normalizeString(values.collegesExpertTipLabel) ||
            collegesPageFallbackContent.expertTipLabel;
          content.collegesExpertTipText =
            normalizeString(values.collegesExpertTipText) ||
            collegesPageFallbackContent.expertTipText;
          content.collegesBangladeshEyebrow =
            normalizeString(values.collegesBangladeshEyebrow) ||
            collegesPageFallbackContent.bangladeshEyebrow;
          content.collegesBangladeshTitle =
            normalizeString(values.collegesBangladeshTitle) ||
            collegesPageFallbackContent.bangladeshTitle;
          content.collegesBangladeshDescription =
            normalizeString(values.collegesBangladeshDescription) ||
            collegesPageFallbackContent.bangladeshDescription;
          content.collegesGeorgiaEyebrow =
            normalizeString(values.collegesGeorgiaEyebrow) ||
            collegesPageFallbackContent.georgiaEyebrow;
          content.collegesGeorgiaTitle =
            normalizeString(values.collegesGeorgiaTitle) ||
            collegesPageFallbackContent.georgiaTitle;
          content.collegesGeorgiaDescription =
            normalizeString(values.collegesGeorgiaDescription) ||
            collegesPageFallbackContent.georgiaDescription;
          content.collegesGeorgiaVisible = values.collegesGeorgiaVisible !== false;
          content.collegesGuidanceEyebrow =
            normalizeString(values.collegesGuidanceEyebrow) ||
            collegesPageFallbackContent.guidanceEyebrow;
          content.collegesGuidanceTitle =
            normalizeString(values.collegesGuidanceTitle) ||
            collegesPageFallbackContent.guidanceTitle;
          content.collegeSelectionTips =
            Array.isArray(values.collegesGuidanceTips) && values.collegesGuidanceTips.length > 0
              ? values.collegesGuidanceTips
              : collegesPageFallbackContent.guidanceTips;
        }

        if (isMbbsBangladeshGovernmentPageValues(values)) {
          content.governmentHeroEyebrow =
            normalizeString(values.governmentHeroEyebrow) ||
            mbbsBangladeshGovernmentFallbackContent.heroEyebrow;
          content.governmentHeroBadgeText =
            normalizeString(values.governmentHeroBadgeText) ||
            mbbsBangladeshGovernmentFallbackContent.heroBadgeText;
          content.governmentIntroTitle =
            normalizeString(values.governmentIntroTitle) ||
            mbbsBangladeshGovernmentFallbackContent.introTitle;
          content.governmentIntroParagraph =
            normalizeString(values.governmentIntroParagraph) ||
            mbbsBangladeshGovernmentFallbackContent.introParagraph;
          content.governmentIntroQuotaItems =
            Array.isArray(values.governmentIntroQuotaItems) &&
            values.governmentIntroQuotaItems.length > 0
              ? values.governmentIntroQuotaItems
              : mbbsBangladeshGovernmentFallbackContent.introQuotaItems;
          content.governmentIntroConclusion =
            normalizeString(values.governmentIntroConclusion) ||
            mbbsBangladeshGovernmentFallbackContent.introConclusion;
          content.governmentSeatEyebrow =
            normalizeString(values.governmentSeatEyebrow) ||
            mbbsBangladeshGovernmentFallbackContent.seatEyebrow;
          content.governmentSeatTitle =
            normalizeString(values.governmentSeatTitle) ||
            mbbsBangladeshGovernmentFallbackContent.seatTitle;
          content.governmentSeatDescription =
            normalizeString(values.governmentSeatDescription) ||
            mbbsBangladeshGovernmentFallbackContent.seatDescription;
          content.governmentSaarcTableTitle =
            normalizeString(values.governmentSaarcTableTitle) ||
            mbbsBangladeshGovernmentFallbackContent.saarcTableTitle;
          content.governmentSaarcSeats =
            Array.isArray(values.governmentSaarcSeats) && values.governmentSaarcSeats.length > 0
              ? values.governmentSaarcSeats
              : mbbsBangladeshGovernmentFallbackContent.saarcSeats;
          content.governmentNonSaarcTableTitle =
            normalizeString(values.governmentNonSaarcTableTitle) ||
            mbbsBangladeshGovernmentFallbackContent.nonSaarcTableTitle;
          content.governmentNonSaarcSeats =
            Array.isArray(values.governmentNonSaarcSeats) && values.governmentNonSaarcSeats.length > 0
              ? values.governmentNonSaarcSeats
              : mbbsBangladeshGovernmentFallbackContent.nonSaarcSeats;
          content.governmentSaarcSectionTitle =
            normalizeString(values.governmentSaarcSectionTitle) ||
            mbbsBangladeshGovernmentFallbackContent.saarcSectionTitle;
          content.governmentSaarcApplicableTitle =
            normalizeString(values.governmentSaarcApplicableTitle) ||
            mbbsBangladeshGovernmentFallbackContent.saarcApplicableTitle;
          content.governmentSaarcCountries =
            Array.isArray(values.governmentSaarcCountries) && values.governmentSaarcCountries.length > 0
              ? values.governmentSaarcCountries
              : mbbsBangladeshGovernmentFallbackContent.saarcCountries;
          content.governmentSaarcKeyPointsTitle =
            normalizeString(values.governmentSaarcKeyPointsTitle) ||
            mbbsBangladeshGovernmentFallbackContent.saarcKeyPointsTitle;
          content.governmentSaarcKeyPoints =
            Array.isArray(values.governmentSaarcKeyPoints) && values.governmentSaarcKeyPoints.length > 0
              ? values.governmentSaarcKeyPoints
              : mbbsBangladeshGovernmentFallbackContent.saarcKeyPoints;
          content.governmentNonSaarcSectionTitle =
            normalizeString(values.governmentNonSaarcSectionTitle) ||
            mbbsBangladeshGovernmentFallbackContent.nonSaarcSectionTitle;
          content.governmentNonSaarcPoints =
            Array.isArray(values.governmentNonSaarcPoints) && values.governmentNonSaarcPoints.length > 0
              ? values.governmentNonSaarcPoints
              : mbbsBangladeshGovernmentFallbackContent.nonSaarcPoints;
          content.governmentEligibilityTitle =
            normalizeString(values.governmentEligibilityTitle) ||
            mbbsBangladeshGovernmentFallbackContent.eligibilityTitle;
          content.governmentEligibilityPoints =
            Array.isArray(values.governmentEligibilityPoints) && values.governmentEligibilityPoints.length > 0
              ? values.governmentEligibilityPoints
              : mbbsBangladeshGovernmentFallbackContent.eligibilityPoints;
          content.governmentApplicationProcessTitle =
            normalizeString(values.governmentApplicationProcessTitle) ||
            mbbsBangladeshGovernmentFallbackContent.applicationProcessTitle;
          content.governmentApplicationSteps =
            Array.isArray(values.governmentApplicationSteps) && values.governmentApplicationSteps.length > 0
              ? values.governmentApplicationSteps
              : mbbsBangladeshGovernmentFallbackContent.applicationSteps;
          content.governmentLegalNoticeTitle =
            normalizeString(values.governmentLegalNoticeTitle) ||
            mbbsBangladeshGovernmentFallbackContent.legalNoticeTitle;
          content.governmentLegalNoticeSummary =
            normalizeString(values.governmentLegalNoticeSummary) ||
            mbbsBangladeshGovernmentFallbackContent.legalNoticeSummary;
          content.governmentLegalNoticeDetails =
            normalizeString(values.governmentLegalNoticeDetails) ||
            mbbsBangladeshGovernmentFallbackContent.legalNoticeDetails;
          content.governmentHelpTitle =
            normalizeString(values.governmentHelpTitle) ||
            mbbsBangladeshGovernmentFallbackContent.helpTitle;
          content.governmentHelpDescription =
            normalizeString(values.governmentHelpDescription) ||
            mbbsBangladeshGovernmentFallbackContent.helpDescription;
          content.governmentHelpPoints =
            Array.isArray(values.governmentHelpPoints) && values.governmentHelpPoints.length > 0
              ? values.governmentHelpPoints
              : mbbsBangladeshGovernmentFallbackContent.helpPoints;
          content.governmentHelpDisclaimer =
            normalizeString(values.governmentHelpDisclaimer) ||
            mbbsBangladeshGovernmentFallbackContent.helpDisclaimer;
          content.governmentHelpPrimaryButtonText =
            normalizeString(values.governmentHelpPrimaryButtonText) ||
            mbbsBangladeshGovernmentFallbackContent.helpPrimaryButtonText;
          content.governmentHelpSecondaryButtonText =
            normalizeString(values.governmentHelpSecondaryButtonText) ||
            mbbsBangladeshGovernmentFallbackContent.helpSecondaryButtonText;
        }

        if (isGeorgiaForBangladeshisPageValues(values)) {
          content.georgiaHeroEyebrow =
            normalizeString(values.georgiaHeroEyebrow) ||
            georgiaForBangladeshisFallbackContent.heroEyebrow;
          content.georgiaHeroBadgeText =
            normalizeString(values.georgiaHeroBadgeText) ||
            georgiaForBangladeshisFallbackContent.heroBadgeText;
          content.georgiaHeroLeadText =
            normalizeString(values.georgiaHeroLeadText) ||
            georgiaForBangladeshisFallbackContent.heroLeadText;
          content.georgiaHeroPrimaryButtonText =
            normalizeString(values.georgiaHeroPrimaryButtonText) ||
            georgiaForBangladeshisFallbackContent.heroPrimaryButtonText;
          content.georgiaHeroPrimaryButtonUrl =
            normalizeString(values.georgiaHeroPrimaryButtonUrl) ||
            georgiaForBangladeshisFallbackContent.heroPrimaryButtonUrl;
          content.georgiaHeroSecondaryButtonText =
            normalizeString(values.georgiaHeroSecondaryButtonText) ||
            georgiaForBangladeshisFallbackContent.heroSecondaryButtonText;
          content.georgiaHeroSecondaryButtonUrl =
            normalizeString(values.georgiaHeroSecondaryButtonUrl) ||
            georgiaForBangladeshisFallbackContent.heroSecondaryButtonUrl;
          content.georgiaProgramsEyebrow =
            normalizeString(values.georgiaProgramsEyebrow) ||
            georgiaForBangladeshisFallbackContent.programsEyebrow;
          content.georgiaProgramsTitle =
            normalizeString(values.georgiaProgramsTitle) ||
            georgiaForBangladeshisFallbackContent.programsTitle;
          content.georgiaProgramsSubtitle =
            normalizeString(values.georgiaProgramsSubtitle) ||
            georgiaForBangladeshisFallbackContent.programsSubtitle;
          content.georgiaPrograms =
            Array.isArray(values.georgiaPrograms) && values.georgiaPrograms.length > 0
              ? values.georgiaPrograms
              : georgiaForBangladeshisFallbackContent.programs;
          content.georgiaWhyEyebrow =
            normalizeString(values.georgiaWhyEyebrow) ||
            georgiaForBangladeshisFallbackContent.whyGeorgiaEyebrow;
          content.georgiaWhyTitle =
            normalizeString(values.georgiaWhyTitle) ||
            georgiaForBangladeshisFallbackContent.whyGeorgiaTitle;
          content.georgiaWhySubtitle =
            normalizeString(values.georgiaWhySubtitle) ||
            georgiaForBangladeshisFallbackContent.whyGeorgiaSubtitle;
          content.georgiaWhyCards =
            Array.isArray(values.georgiaWhyCards) && values.georgiaWhyCards.length > 0
              ? values.georgiaWhyCards
              : georgiaForBangladeshisFallbackContent.whyGeorgiaCards;
          content.georgiaPartnerEyebrow =
            normalizeString(values.georgiaPartnerEyebrow) ||
            georgiaForBangladeshisFallbackContent.partnerEyebrow;
          content.georgiaPartnerTitle =
            normalizeString(values.georgiaPartnerTitle) ||
            georgiaForBangladeshisFallbackContent.partnerTitle;
          content.georgiaPartnerDescription =
            normalizeString(values.georgiaPartnerDescription) ||
            georgiaForBangladeshisFallbackContent.partnerDescription;
          content.georgiaPartnerBenefits =
            Array.isArray(values.georgiaPartnerBenefits) && values.georgiaPartnerBenefits.length > 0
              ? values.georgiaPartnerBenefits
              : georgiaForBangladeshisFallbackContent.partnerBenefits;
          content.georgiaPartnerImage =
            normalizeString(values.georgiaPartnerImage) ||
            georgiaForBangladeshisFallbackContent.partnerImage;
          content.georgiaPartnerImageAlt =
            normalizeString(values.georgiaPartnerImageAlt) ||
            georgiaForBangladeshisFallbackContent.partnerImageAlt;
          content.georgiaPartnerStatValue =
            normalizeString(values.georgiaPartnerStatValue) ||
            georgiaForBangladeshisFallbackContent.partnerStatValue;
          content.georgiaPartnerStatLabel =
            normalizeString(values.georgiaPartnerStatLabel) ||
            georgiaForBangladeshisFallbackContent.partnerStatLabel;
          content.georgiaRecognitionEyebrow =
            normalizeString(values.georgiaRecognitionEyebrow) ||
            georgiaForBangladeshisFallbackContent.recognitionEyebrow;
          content.georgiaRecognitionTitle =
            normalizeString(values.georgiaRecognitionTitle) ||
            georgiaForBangladeshisFallbackContent.recognitionTitle;
          content.georgiaRecognitionSubtitle =
            normalizeString(values.georgiaRecognitionSubtitle) ||
            georgiaForBangladeshisFallbackContent.recognitionSubtitle;
          content.georgiaRecognitionItems =
            Array.isArray(values.georgiaRecognitionItems) && values.georgiaRecognitionItems.length > 0
              ? values.georgiaRecognitionItems
              : georgiaForBangladeshisFallbackContent.recognitionItems;
          content.georgiaSupportEyebrow =
            normalizeString(values.georgiaSupportEyebrow) ||
            georgiaForBangladeshisFallbackContent.supportEyebrow;
          content.georgiaSupportTitle =
            normalizeString(values.georgiaSupportTitle) ||
            georgiaForBangladeshisFallbackContent.supportTitle;
          content.georgiaSupportSubtitle =
            normalizeString(values.georgiaSupportSubtitle) ||
            georgiaForBangladeshisFallbackContent.supportSubtitle;
          content.georgiaSupportSteps =
            Array.isArray(values.georgiaSupportSteps) && values.georgiaSupportSteps.length > 0
              ? values.georgiaSupportSteps
              : georgiaForBangladeshisFallbackContent.supportSteps;
          content.georgiaCareerEyebrow =
            normalizeString(values.georgiaCareerEyebrow) ||
            georgiaForBangladeshisFallbackContent.careerEyebrow;
          content.georgiaCareerTitle =
            normalizeString(values.georgiaCareerTitle) ||
            georgiaForBangladeshisFallbackContent.careerTitle;
          content.georgiaCareerDescription =
            normalizeString(values.georgiaCareerDescription) ||
            georgiaForBangladeshisFallbackContent.careerDescription;
          content.georgiaCareerCards =
            Array.isArray(values.georgiaCareerCards) && values.georgiaCareerCards.length > 0
              ? values.georgiaCareerCards
              : georgiaForBangladeshisFallbackContent.careerCards;
          content.georgiaCareerSnapshotTitle =
            normalizeString(values.georgiaCareerSnapshotTitle) ||
            georgiaForBangladeshisFallbackContent.careerSnapshotTitle;
          content.georgiaCareerSnapshotCards =
            Array.isArray(values.georgiaCareerSnapshotCards) && values.georgiaCareerSnapshotCards.length > 0
              ? values.georgiaCareerSnapshotCards
              : georgiaForBangladeshisFallbackContent.careerSnapshotCards;
        }

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
      content.philosophyEyebrow =
        normalizeString(values.philosophyEyebrow) ||
        homePhilosophyFallbackContent.eyebrow;
      content.philosophyTitle =
        normalizeString(values.philosophyTitle) ||
        homePhilosophyFallbackContent.title;
      content.philosophySupportingHeading =
        normalizeString(values.philosophySupportingHeading) ||
        homePhilosophyFallbackContent.supportingHeading;
      content.philosophyDescription =
        normalizeString(values.philosophyDescription) ||
        homePhilosophyFallbackContent.description;
      content.philosophyImageSrc =
        normalizeString(values.philosophyImageSrc) ||
        homePhilosophyFallbackContent.imageSrc;
      content.philosophyImageAlt =
        normalizeString(values.philosophyImageAlt) ||
        homePhilosophyFallbackContent.imageAlt;
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
      content.studyDestinationsEyebrow =
        normalizeString(values.studyDestinationsEyebrow) ||
        homeStudyDestinationsFallbackContent.eyebrow;
      content.studyDestinationsTitle =
        normalizeString(values.studyDestinationsTitle) ||
        homeStudyDestinationsFallbackContent.title;
      content.studyDestinationsSubtitle =
        normalizeString(values.studyDestinationsSubtitle) ||
        homeStudyDestinationsFallbackContent.subtitle;
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

      const legacyContactOfficeMapLink =
        readContentString(content, 'contactOfficeGoogleMapsLink') ?? '';
      const savedContactOffices =
        Array.isArray(content.contactOffices) && content.contactOffices.length > 0
          ? content.contactOffices
          : Array.isArray(content.offices)
            ? content.offices
            : contactPageFallbackContent.offices;
      const normalizedContactOffices = sanitizeContactOffices(savedContactOffices).map(
        (office, index) =>
          index === 0 &&
          legacyContactOfficeMapLink &&
          !office.googleMapsUrl
            ? {
                ...office,
                googleMapsUrl: legacyContactOfficeMapLink,
              }
            : office,
      );

      return {
        ...item,
        content: item.content,
        seoKeywords: toKeywordsValue(item.seoKeywords),
        heroOverlayColor:
          readContentString(content, 'heroOverlayColor') ??
          defaultPageHeroOverlayColor,
        heroOverlayOpacity:
          readContentNumber(content, 'heroOverlayOpacity') ??
          defaultPageHeroOverlayOpacity,
        pageCtaTitle:
          readContentString(content, 'pageCtaTitle') ??
          genericPageCtaFallbackContent.title,
        pageCtaSubtitle:
          readContentString(content, 'pageCtaSubtitle') ??
          genericPageCtaFallbackContent.subtitle,
        pageCtaPrimaryButtonText:
          readContentString(content, 'pageCtaPrimaryButtonText') ??
          genericPageCtaFallbackContent.primaryButtonText,
        pageCtaPrimaryButtonUrl:
          readContentString(content, 'pageCtaPrimaryButtonUrl') ??
          genericPageCtaFallbackContent.primaryButtonUrl,
        pageCtaSecondaryButtonText:
          readContentString(content, 'pageCtaSecondaryButtonText') ??
          genericPageCtaFallbackContent.secondaryButtonText,
        pageCtaSecondaryButtonUrl:
          readContentString(content, 'pageCtaSecondaryButtonUrl') ??
          genericPageCtaFallbackContent.secondaryButtonUrl,
        aboutWhoWeAreEyebrow:
          readContentString(content, 'aboutWhoWeAreEyebrow') ??
          aboutPageFallbackContent.whoWeAreEyebrow,
        aboutWhoWeAreTitle:
          readContentString(content, 'aboutWhoWeAreTitle') ??
          aboutPageFallbackContent.whoWeAreTitle,
        aboutWhoWeAreImage:
          readContentString(content, 'aboutWhoWeAreImage') ??
          aboutPageFallbackContent.whoWeAreImage,
        aboutWhoWeAreImageAlt:
          readContentString(content, 'aboutWhoWeAreImageAlt') ??
          aboutPageFallbackContent.whoWeAreImageAlt,
        aboutWhoWeAreBadgeValue:
          readContentString(content, 'aboutWhoWeAreBadgeValue') ??
          aboutPageFallbackContent.whoWeAreBadgeValue,
        aboutWhoWeAreBadgeLabel:
          readContentString(content, 'aboutWhoWeAreBadgeLabel') ??
          aboutPageFallbackContent.whoWeAreBadgeLabel,
        aboutOverview:
          content.aboutOverview ?? aboutPageFallbackContent.overview,
        aboutValuesEyebrow:
          readContentString(content, 'aboutValuesEyebrow') ??
          aboutPageFallbackContent.valuesEyebrow,
        aboutValuesTitle:
          readContentString(content, 'aboutValuesTitle') ??
          aboutPageFallbackContent.valuesTitle,
        aboutValuesSubtitle:
          readContentString(content, 'aboutValuesSubtitle') ??
          aboutPageFallbackContent.valuesSubtitle,
        aboutValues:
          content.aboutValues ?? aboutPageFallbackContent.values,
        aboutTrustEyebrow:
          readContentString(content, 'aboutTrustEyebrow') ??
          aboutPageFallbackContent.trustEyebrow,
        aboutTrustTitle:
          readContentString(content, 'aboutTrustTitle') ??
          aboutPageFallbackContent.trustTitle,
        aboutTrustDescription:
          readContentString(content, 'aboutTrustDescription') ??
          aboutPageFallbackContent.trustDescription,
        aboutTrustPoints:
          content.aboutTrustPoints ?? aboutPageFallbackContent.trustPoints,
        aboutTrustCtaText:
          readContentString(content, 'aboutTrustCtaText') ??
          aboutPageFallbackContent.trustCtaText,
        aboutTrustCtaUrl:
          readContentString(content, 'aboutTrustCtaUrl') ??
          aboutPageFallbackContent.trustCtaUrl,
        aboutMetricStudentsPlaced:
          readContentString(isRecord(content.aboutMetrics) ? content.aboutMetrics : {}, 'studentsPlaced') ??
          aboutPageFallbackContent.metrics.studentsPlaced,
        aboutMetricPartnerColleges:
          readContentString(isRecord(content.aboutMetrics) ? content.aboutMetrics : {}, 'partnerColleges') ??
          aboutPageFallbackContent.metrics.partnerColleges,
        aboutMetricYearsExperience:
          readContentString(isRecord(content.aboutMetrics) ? content.aboutMetrics : {}, 'yearsExperience') ??
          aboutPageFallbackContent.metrics.yearsExperience,
        aboutMetricAdmissionSuccess:
          readContentString(isRecord(content.aboutMetrics) ? content.aboutMetrics : {}, 'admissionSuccess') ??
          aboutPageFallbackContent.metrics.admissionSuccess,
        whyHeroQuoteText:
          readContentString(content, 'whyHeroQuoteText') ??
          whyMedientryFallbackContent.heroQuoteText,
        whyDifferenceTitle:
          readContentString(content, 'whyDifferenceTitle') ??
          whyMedientryFallbackContent.differenceTitle,
        whyDifferenceDescription:
          readContentString(content, 'whyDifferenceDescription') ??
          whyMedientryFallbackContent.differenceDescription,
        whyPhilosophyPoints:
          content.whyPhilosophyPoints ?? whyMedientryFallbackContent.philosophyPoints,
        whyDifferenceQuoteText:
          readContentString(content, 'whyDifferenceQuoteText') ??
          whyMedientryFallbackContent.differenceQuoteText,
        whyCommitmentsEyebrow:
          readContentString(content, 'whyCommitmentsEyebrow') ??
          whyMedientryFallbackContent.commitmentsEyebrow,
        whyCommitmentsTitle:
          readContentString(content, 'whyCommitmentsTitle') ??
          whyMedientryFallbackContent.commitmentsTitle,
        whyReasons:
          content.whyReasons ?? whyMedientryFallbackContent.reasons,
        whyPromiseEyebrow:
          readContentString(content, 'whyPromiseEyebrow') ??
          whyMedientryFallbackContent.promiseEyebrow,
        whyPromiseTitle:
          readContentString(content, 'whyPromiseTitle') ??
          whyMedientryFallbackContent.promiseTitle,
        whyPromiseDescription:
          readContentString(content, 'whyPromiseDescription') ??
          whyMedientryFallbackContent.promiseDescription,
        whyGuarantees:
          content.whyGuarantees ?? whyMedientryFallbackContent.guarantees,
        whyPromiseCtaText:
          readContentString(content, 'whyPromiseCtaText') ??
          whyMedientryFallbackContent.promiseCtaText,
        whyPromiseCtaUrl:
          readContentString(content, 'whyPromiseCtaUrl') ??
          whyMedientryFallbackContent.promiseCtaUrl,
        whyMetricStudentsGuided:
          readContentString(isRecord(content.whyMetrics) ? content.whyMetrics : {}, 'studentsGuided') ??
          whyMedientryFallbackContent.metrics.studentsGuided,
        whyMetricYearsExperience:
          readContentString(isRecord(content.whyMetrics) ? content.whyMetrics : {}, 'yearsExperience') ??
          whyMedientryFallbackContent.metrics.yearsExperience,
        whyMetricPartnerColleges:
          readContentString(isRecord(content.whyMetrics) ? content.whyMetrics : {}, 'partnerColleges') ??
          whyMedientryFallbackContent.metrics.partnerColleges,
        whyMetricSuccessRate:
          readContentString(isRecord(content.whyMetrics) ? content.whyMetrics : {}, 'successRate') ??
          whyMedientryFallbackContent.metrics.successRate,
        whyTrackRecordTitle:
          readContentString(content, 'whyTrackRecordTitle') ??
          whyMedientryFallbackContent.trackRecordTitle,
        whyTrackRecordQuoteText:
          readContentString(content, 'whyTrackRecordQuoteText') ??
          whyMedientryFallbackContent.trackRecordQuoteText,
        whyFeelEyebrow:
          readContentString(content, 'whyFeelEyebrow') ??
          whyMedientryFallbackContent.feelEyebrow,
        whyFeelTitle:
          readContentString(content, 'whyFeelTitle') ??
          whyMedientryFallbackContent.feelTitle,
        whyFeelStatements:
          content.whyFeelStatements ?? whyMedientryFallbackContent.feelStatements,
        whyFeelSummary:
          readContentString(content, 'whyFeelSummary') ??
          whyMedientryFallbackContent.feelSummary,
        successStatStudentsPlaced:
          readContentString(isRecord(content.successStoriesStats) ? content.successStoriesStats : {}, 'studentsPlaced') ??
          successStoriesFallbackContent.stats.studentsPlaced,
        successStatAdmissionSuccess:
          readContentString(isRecord(content.successStoriesStats) ? content.successStoriesStats : {}, 'admissionSuccess') ??
          successStoriesFallbackContent.stats.admissionSuccess,
        successStatYearsOfTrust:
          readContentString(isRecord(content.successStoriesStats) ? content.successStoriesStats : {}, 'yearsOfTrust') ??
          successStoriesFallbackContent.stats.yearsOfTrust,
        successStatParentSatisfaction:
          readContentString(isRecord(content.successStoriesStats) ? content.successStoriesStats : {}, 'parentSatisfaction') ??
          successStoriesFallbackContent.stats.parentSatisfaction,
        successShareTitle:
          readContentString(content, 'successShareTitle') ??
          successStoriesFallbackContent.shareTitle,
        successShareSubtitle:
          readContentString(content, 'successShareSubtitle') ??
          successStoriesFallbackContent.shareSubtitle,
        successShareCtaText:
          readContentString(content, 'successShareCtaText') ??
          successStoriesFallbackContent.shareCtaText,
        successShareCtaUrl:
          readContentString(content, 'successShareCtaUrl') ??
          successStoriesFallbackContent.shareCtaUrl,
        contactFormTitle:
          readContentString(content, 'contactFormTitle') ??
          contactPageFallbackContent.formTitle,
        contactFormSubtitle:
          readContentString(content, 'contactFormSubtitle') ??
          contactPageFallbackContent.formSubtitle,
        contactWorkingHoursTitle:
          readContentString(content, 'contactWorkingHoursTitle') ??
          contactPageFallbackContent.workingHoursTitle,
        contactWhatToExpectTitle:
          readContentString(content, 'contactWhatToExpectTitle') ??
          contactPageFallbackContent.whatToExpectTitle,
        contactWhatsappCardTitle:
          readContentString(content, 'contactWhatsappCardTitle') ??
          contactPageFallbackContent.whatsappCardTitle,
        contactWhatsappCardDescription:
          readContentString(content, 'contactWhatsappCardDescription') ??
          contactPageFallbackContent.whatsappCardDescription,
        contactWhatsappCtaText:
          readContentString(content, 'contactWhatsappCtaText') ??
          contactPageFallbackContent.whatsappCtaText,
        contactOfficesEyebrow:
          readContentString(content, 'contactOfficesEyebrow') ??
          contactPageFallbackContent.officesEyebrow,
        contactOfficesTitle:
          readContentString(content, 'contactOfficesTitle') ??
          contactPageFallbackContent.officesTitle,
        contactOfficesSubtitle:
          readContentString(content, 'contactOfficesSubtitle') ??
          contactPageFallbackContent.officesSubtitle,
        contactOfficeHours:
          readContentString(isRecord(content.contactWorkingHours) ? content.contactWorkingHours : {}, 'officeHours') ??
          contactPageFallbackContent.workingHours.officeHours,
        contactFridayHours:
          readContentString(isRecord(content.contactWorkingHours) ? content.contactWorkingHours : {}, 'friday') ??
          contactPageFallbackContent.workingHours.friday,
        contactWhatToExpectItems:
          content.contactWhatToExpectItems ?? contactPageFallbackContent.whatToExpect,
        contactOffices: normalizedContactOffices,
        collegesHeroEyebrow:
          readContentString(content, 'collegesHeroEyebrow') ??
          collegesPageFallbackContent.heroEyebrow,
        collegesExpertTipLabel:
          readContentString(content, 'collegesExpertTipLabel') ??
          collegesPageFallbackContent.expertTipLabel,
        collegesExpertTipText:
          readContentString(content, 'collegesExpertTipText') ??
          collegesPageFallbackContent.expertTipText,
        collegesBangladeshEyebrow:
          readContentString(content, 'collegesBangladeshEyebrow') ??
          collegesPageFallbackContent.bangladeshEyebrow,
        collegesBangladeshTitle:
          readContentString(content, 'collegesBangladeshTitle') ??
          collegesPageFallbackContent.bangladeshTitle,
        collegesBangladeshDescription:
          readContentString(content, 'collegesBangladeshDescription') ??
          collegesPageFallbackContent.bangladeshDescription,
        collegesGeorgiaEyebrow:
          readContentString(content, 'collegesGeorgiaEyebrow') ??
          collegesPageFallbackContent.georgiaEyebrow,
        collegesGeorgiaTitle:
          readContentString(content, 'collegesGeorgiaTitle') ??
          collegesPageFallbackContent.georgiaTitle,
        collegesGeorgiaDescription:
          readContentString(content, 'collegesGeorgiaDescription') ??
          collegesPageFallbackContent.georgiaDescription,
        collegesGeorgiaVisible:
          readContentBoolean(content, 'collegesGeorgiaVisible') ?? true,
        collegesGuidanceEyebrow:
          readContentString(content, 'collegesGuidanceEyebrow') ??
          collegesPageFallbackContent.guidanceEyebrow,
        collegesGuidanceTitle:
          readContentString(content, 'collegesGuidanceTitle') ??
          collegesPageFallbackContent.guidanceTitle,
        collegesGuidanceTips:
          content.collegeSelectionTips ?? collegesPageFallbackContent.guidanceTips,
        governmentHeroEyebrow:
          readContentString(content, 'governmentHeroEyebrow') ??
          mbbsBangladeshGovernmentFallbackContent.heroEyebrow,
        governmentHeroBadgeText:
          readContentString(content, 'governmentHeroBadgeText') ??
          mbbsBangladeshGovernmentFallbackContent.heroBadgeText,
        governmentIntroTitle:
          readContentString(content, 'governmentIntroTitle') ??
          mbbsBangladeshGovernmentFallbackContent.introTitle,
        governmentIntroParagraph:
          readContentString(content, 'governmentIntroParagraph') ??
          mbbsBangladeshGovernmentFallbackContent.introParagraph,
        governmentIntroQuotaItems:
          content.governmentIntroQuotaItems ?? mbbsBangladeshGovernmentFallbackContent.introQuotaItems,
        governmentIntroConclusion:
          readContentString(content, 'governmentIntroConclusion') ??
          mbbsBangladeshGovernmentFallbackContent.introConclusion,
        governmentSeatEyebrow:
          readContentString(content, 'governmentSeatEyebrow') ??
          mbbsBangladeshGovernmentFallbackContent.seatEyebrow,
        governmentSeatTitle:
          readContentString(content, 'governmentSeatTitle') ??
          mbbsBangladeshGovernmentFallbackContent.seatTitle,
        governmentSeatDescription:
          readContentString(content, 'governmentSeatDescription') ??
          mbbsBangladeshGovernmentFallbackContent.seatDescription,
        governmentSaarcTableTitle:
          readContentString(content, 'governmentSaarcTableTitle') ??
          mbbsBangladeshGovernmentFallbackContent.saarcTableTitle,
        governmentSaarcSeats:
          content.governmentSaarcSeats ??
          toStructuredSeatAllocationRows(content.saarcSeats) ??
          mbbsBangladeshGovernmentFallbackContent.saarcSeats,
        governmentNonSaarcTableTitle:
          readContentString(content, 'governmentNonSaarcTableTitle') ??
          mbbsBangladeshGovernmentFallbackContent.nonSaarcTableTitle,
        governmentNonSaarcSeats:
          content.governmentNonSaarcSeats ??
          toStructuredSeatAllocationRows(content.nonSaarcSeats) ??
          mbbsBangladeshGovernmentFallbackContent.nonSaarcSeats,
        governmentSaarcSectionTitle:
          readContentString(content, 'governmentSaarcSectionTitle') ??
          mbbsBangladeshGovernmentFallbackContent.saarcSectionTitle,
        governmentSaarcApplicableTitle:
          readContentString(content, 'governmentSaarcApplicableTitle') ??
          mbbsBangladeshGovernmentFallbackContent.saarcApplicableTitle,
        governmentSaarcCountries:
          content.governmentSaarcCountries ?? mbbsBangladeshGovernmentFallbackContent.saarcCountries,
        governmentSaarcKeyPointsTitle:
          readContentString(content, 'governmentSaarcKeyPointsTitle') ??
          mbbsBangladeshGovernmentFallbackContent.saarcKeyPointsTitle,
        governmentSaarcKeyPoints:
          content.governmentSaarcKeyPoints ?? mbbsBangladeshGovernmentFallbackContent.saarcKeyPoints,
        governmentNonSaarcSectionTitle:
          readContentString(content, 'governmentNonSaarcSectionTitle') ??
          mbbsBangladeshGovernmentFallbackContent.nonSaarcSectionTitle,
        governmentNonSaarcPoints:
          content.governmentNonSaarcPoints ?? mbbsBangladeshGovernmentFallbackContent.nonSaarcPoints,
        governmentEligibilityTitle:
          readContentString(content, 'governmentEligibilityTitle') ??
          mbbsBangladeshGovernmentFallbackContent.eligibilityTitle,
        governmentEligibilityPoints:
          content.governmentEligibilityPoints ??
          content.eligibility ??
          mbbsBangladeshGovernmentFallbackContent.eligibilityPoints,
        governmentApplicationProcessTitle:
          readContentString(content, 'governmentApplicationProcessTitle') ??
          mbbsBangladeshGovernmentFallbackContent.applicationProcessTitle,
        governmentApplicationSteps:
          content.governmentApplicationSteps ?? mbbsBangladeshGovernmentFallbackContent.applicationSteps,
        governmentLegalNoticeTitle:
          readContentString(content, 'governmentLegalNoticeTitle') ??
          mbbsBangladeshGovernmentFallbackContent.legalNoticeTitle,
        governmentLegalNoticeSummary:
          readContentString(content, 'governmentLegalNoticeSummary') ??
          mbbsBangladeshGovernmentFallbackContent.legalNoticeSummary,
        governmentLegalNoticeDetails:
          readContentString(content, 'governmentLegalNoticeDetails') ??
          mbbsBangladeshGovernmentFallbackContent.legalNoticeDetails,
        governmentHelpTitle:
          readContentString(content, 'governmentHelpTitle') ??
          mbbsBangladeshGovernmentFallbackContent.helpTitle,
        governmentHelpDescription:
          readContentString(content, 'governmentHelpDescription') ??
          mbbsBangladeshGovernmentFallbackContent.helpDescription,
        governmentHelpPoints:
          content.governmentHelpPoints ?? mbbsBangladeshGovernmentFallbackContent.helpPoints,
        governmentHelpDisclaimer:
          readContentString(content, 'governmentHelpDisclaimer') ??
          mbbsBangladeshGovernmentFallbackContent.helpDisclaimer,
        governmentHelpPrimaryButtonText:
          readContentString(content, 'governmentHelpPrimaryButtonText') ??
          mbbsBangladeshGovernmentFallbackContent.helpPrimaryButtonText,
        governmentHelpSecondaryButtonText:
          readContentString(content, 'governmentHelpSecondaryButtonText') ??
          mbbsBangladeshGovernmentFallbackContent.helpSecondaryButtonText,
        georgiaHeroEyebrow:
          readContentString(content, 'georgiaHeroEyebrow') ??
          georgiaForBangladeshisFallbackContent.heroEyebrow,
        georgiaHeroBadgeText:
          readContentString(content, 'georgiaHeroBadgeText') ??
          georgiaForBangladeshisFallbackContent.heroBadgeText,
        georgiaHeroLeadText:
          readContentString(content, 'georgiaHeroLeadText') ??
          georgiaForBangladeshisFallbackContent.heroLeadText,
        georgiaHeroPrimaryButtonText:
          readContentString(content, 'georgiaHeroPrimaryButtonText') ??
          georgiaForBangladeshisFallbackContent.heroPrimaryButtonText,
        georgiaHeroPrimaryButtonUrl:
          readContentString(content, 'georgiaHeroPrimaryButtonUrl') ??
          georgiaForBangladeshisFallbackContent.heroPrimaryButtonUrl,
        georgiaHeroSecondaryButtonText:
          readContentString(content, 'georgiaHeroSecondaryButtonText') ??
          georgiaForBangladeshisFallbackContent.heroSecondaryButtonText,
        georgiaHeroSecondaryButtonUrl:
          readContentString(content, 'georgiaHeroSecondaryButtonUrl') ??
          georgiaForBangladeshisFallbackContent.heroSecondaryButtonUrl,
        georgiaProgramsEyebrow:
          readContentString(content, 'georgiaProgramsEyebrow') ??
          georgiaForBangladeshisFallbackContent.programsEyebrow,
        georgiaProgramsTitle:
          readContentString(content, 'georgiaProgramsTitle') ??
          georgiaForBangladeshisFallbackContent.programsTitle,
        georgiaProgramsSubtitle:
          readContentString(content, 'georgiaProgramsSubtitle') ??
          georgiaForBangladeshisFallbackContent.programsSubtitle,
        georgiaPrograms:
          content.georgiaPrograms ??
          toStructuredProgramCards(content.programs) ??
          georgiaForBangladeshisFallbackContent.programs,
        georgiaWhyEyebrow:
          readContentString(content, 'georgiaWhyEyebrow') ??
          georgiaForBangladeshisFallbackContent.whyGeorgiaEyebrow,
        georgiaWhyTitle:
          readContentString(content, 'georgiaWhyTitle') ??
          georgiaForBangladeshisFallbackContent.whyGeorgiaTitle,
        georgiaWhySubtitle:
          readContentString(content, 'georgiaWhySubtitle') ??
          georgiaForBangladeshisFallbackContent.whyGeorgiaSubtitle,
        georgiaWhyCards:
          content.georgiaWhyCards ??
          toStructuredContentCards(
            content.whyGeorgia,
            Object.fromEntries(
              georgiaForBangladeshisFallbackContent.whyGeorgiaCards.map((item) => [
                item.title,
                item.description,
              ]),
            ),
          ) ??
          georgiaForBangladeshisFallbackContent.whyGeorgiaCards,
        georgiaPartnerEyebrow:
          readContentString(content, 'georgiaPartnerEyebrow') ??
          georgiaForBangladeshisFallbackContent.partnerEyebrow,
        georgiaPartnerTitle:
          readContentString(content, 'georgiaPartnerTitle') ??
          georgiaForBangladeshisFallbackContent.partnerTitle,
        georgiaPartnerDescription:
          readContentString(content, 'georgiaPartnerDescription') ??
          georgiaForBangladeshisFallbackContent.partnerDescription,
        georgiaPartnerBenefits:
          content.georgiaPartnerBenefits ??
          content.whyAlte ??
          georgiaForBangladeshisFallbackContent.partnerBenefits,
        georgiaPartnerImage:
          readContentString(content, 'georgiaPartnerImage') ??
          georgiaForBangladeshisFallbackContent.partnerImage,
        georgiaPartnerImageAlt:
          readContentString(content, 'georgiaPartnerImageAlt') ??
          georgiaForBangladeshisFallbackContent.partnerImageAlt,
        georgiaPartnerStatValue:
          readContentString(content, 'georgiaPartnerStatValue') ??
          georgiaForBangladeshisFallbackContent.partnerStatValue,
        georgiaPartnerStatLabel:
          readContentString(content, 'georgiaPartnerStatLabel') ??
          georgiaForBangladeshisFallbackContent.partnerStatLabel,
        georgiaRecognitionEyebrow:
          readContentString(content, 'georgiaRecognitionEyebrow') ??
          georgiaForBangladeshisFallbackContent.recognitionEyebrow,
        georgiaRecognitionTitle:
          readContentString(content, 'georgiaRecognitionTitle') ??
          georgiaForBangladeshisFallbackContent.recognitionTitle,
        georgiaRecognitionSubtitle:
          readContentString(content, 'georgiaRecognitionSubtitle') ??
          georgiaForBangladeshisFallbackContent.recognitionSubtitle,
        georgiaRecognitionItems:
          content.georgiaRecognitionItems ??
          toStructuredContentCards(
            content.recognition,
            Object.fromEntries(
              georgiaForBangladeshisFallbackContent.recognitionItems.map((item) => [
                item.title,
                item.description,
              ]),
            ),
          ) ??
          georgiaForBangladeshisFallbackContent.recognitionItems,
        georgiaSupportEyebrow:
          readContentString(content, 'georgiaSupportEyebrow') ??
          georgiaForBangladeshisFallbackContent.supportEyebrow,
        georgiaSupportTitle:
          readContentString(content, 'georgiaSupportTitle') ??
          georgiaForBangladeshisFallbackContent.supportTitle,
        georgiaSupportSubtitle:
          readContentString(content, 'georgiaSupportSubtitle') ??
          georgiaForBangladeshisFallbackContent.supportSubtitle,
        georgiaSupportSteps:
          content.georgiaSupportSteps ?? georgiaForBangladeshisFallbackContent.supportSteps,
        georgiaCareerEyebrow:
          readContentString(content, 'georgiaCareerEyebrow') ??
          georgiaForBangladeshisFallbackContent.careerEyebrow,
        georgiaCareerTitle:
          readContentString(content, 'georgiaCareerTitle') ??
          georgiaForBangladeshisFallbackContent.careerTitle,
        georgiaCareerDescription:
          readContentString(content, 'georgiaCareerDescription') ??
          georgiaForBangladeshisFallbackContent.careerDescription,
        georgiaCareerCards:
          content.georgiaCareerCards ?? georgiaForBangladeshisFallbackContent.careerCards,
        georgiaCareerSnapshotTitle:
          readContentString(content, 'georgiaCareerSnapshotTitle') ??
          georgiaForBangladeshisFallbackContent.careerSnapshotTitle,
        georgiaCareerSnapshotCards:
          content.georgiaCareerSnapshotCards ?? georgiaForBangladeshisFallbackContent.careerSnapshotCards,
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
        philosophyEyebrow:
          readContentString(content, 'philosophyEyebrow') ??
          homePhilosophyFallbackContent.eyebrow,
        philosophyTitle:
          readContentString(content, 'philosophyTitle') ??
          homePhilosophyFallbackContent.title,
        philosophySupportingHeading:
          readContentString(content, 'philosophySupportingHeading') ??
          homePhilosophyFallbackContent.supportingHeading,
        philosophyDescription:
          readContentString(content, 'philosophyDescription') ??
          homePhilosophyFallbackContent.description,
        philosophyImageSrc:
          readContentString(content, 'philosophyImageSrc') ??
          homePhilosophyFallbackContent.imageSrc,
        philosophyImageAlt:
          readContentString(content, 'philosophyImageAlt') ??
          homePhilosophyFallbackContent.imageAlt,
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
        whyChooseUsFeatureCards:
          content.whyChooseUsFeatureCards ?? homeWhyChooseUsFallbackContent.featureCards,
        whyChooseUsApartTitle:
          readContentString(content, 'whyChooseUsApartTitle') ??
          homeWhyChooseUsFallbackContent.apartTitle,
        whyChooseUsApartItems:
          content.whyChooseUsApartItems ?? homeWhyChooseUsFallbackContent.apartItems,
        whyChooseUsRightEyebrow:
          readContentString(content, 'whyChooseUsRightEyebrow') ??
          homeWhyChooseUsFallbackContent.rightEyebrow,
        whyChooseUsRightTitle:
          readContentString(content, 'whyChooseUsRightTitle') ??
          homeWhyChooseUsFallbackContent.rightTitle,
        whyChooseUsRightParagraph:
          readContentString(content, 'whyChooseUsRightParagraph') ??
          homeWhyChooseUsFallbackContent.rightParagraph,
        whyChooseUsChecklistItems:
          content.whyChooseUsChecklistItems ?? homeWhyChooseUsFallbackContent.checklistItems,
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
        studyDestinationsEyebrow:
          readContentString(content, 'studyDestinationsEyebrow') ??
          homeStudyDestinationsFallbackContent.eyebrow,
        studyDestinationsTitle:
          readContentString(content, 'studyDestinationsTitle') ??
          homeStudyDestinationsFallbackContent.title,
        studyDestinationsSubtitle:
          readContentString(content, 'studyDestinationsSubtitle') ??
          homeStudyDestinationsFallbackContent.subtitle,
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
  'page-mbbs-bangladesh': {
    key: 'page-mbbs-bangladesh',
    title: 'MBBS in Bangladesh Page',
    singular: 'Page',
    description:
      'Edit the fixed /mbbs-bangladesh page using the linked Study Destination record.',
    endpoint: '/study-destinations',
    listEndpoint: '/study-destinations',
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
    allowCreate: false,
    allowDelete: false,
    createButtonLabel: 'New destination',
    emptyTitle: 'MBBS in Bangladesh page not found',
    emptyDescription:
      'The linked study destination record is missing. Recreate it from Study Destinations if needed.',
    defaultValues: {
      title: '',
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
    fields: [...studyDestinationPageShortcutFields],
    columns: [
      { key: 'title', label: 'Title', render: (item) => <div className="font-semibold">{String(item.title ?? '-')}</div> },
      { key: 'country', label: 'Country', render: (item) => String(item.country ?? '-') },
      { key: 'showInMenu', label: 'Menu', render: (item) => <Badge variant={item.showInMenu ? 'success' : 'outline'}>{item.showInMenu ? 'Visible' : 'Hidden'}</Badge> },
      { key: 'status', label: 'Status', render: (item) => badgeForStatus(item.status) },
      { key: 'sortOrder', label: 'Order', render: (item) => String(item.sortOrder ?? 0) },
    ],
    getSearchText: (item) =>
      `${String(item.title ?? '')} ${String(item.country ?? '')} ${String(item.slug ?? '')}`,
    getEditValues: getStudyDestinationShortcutEditValues,
    buildPayload: (values) => buildStudyDestinationShortcutPayload(values),
    getListItems: (payload) => getStudyDestinationShortcutItemsBySlug(payload, 'mbbs-bangladesh'),
  },
  'page-mbbs-georgia': {
    key: 'page-mbbs-georgia',
    title: 'MBBS in Georgia Page',
    singular: 'Page',
    description:
      'Edit the fixed /mbbs-georgia page using the linked Study Destination record.',
    endpoint: '/study-destinations',
    listEndpoint: '/study-destinations',
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
    allowCreate: false,
    allowDelete: false,
    createButtonLabel: 'New destination',
    emptyTitle: 'MBBS in Georgia page not found',
    emptyDescription:
      'The linked study destination record is missing. Recreate it from Study Destinations if needed.',
    defaultValues: {
      title: '',
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
    fields: [...studyDestinationPageShortcutFields],
    columns: [
      { key: 'title', label: 'Title', render: (item) => <div className="font-semibold">{String(item.title ?? '-')}</div> },
      { key: 'country', label: 'Country', render: (item) => String(item.country ?? '-') },
      { key: 'showInMenu', label: 'Menu', render: (item) => <Badge variant={item.showInMenu ? 'success' : 'outline'}>{item.showInMenu ? 'Visible' : 'Hidden'}</Badge> },
      { key: 'status', label: 'Status', render: (item) => badgeForStatus(item.status) },
      { key: 'sortOrder', label: 'Order', render: (item) => String(item.sortOrder ?? 0) },
    ],
    getSearchText: (item) =>
      `${String(item.title ?? '')} ${String(item.country ?? '')} ${String(item.slug ?? '')}`,
    getEditValues: getStudyDestinationShortcutEditValues,
    buildPayload: (values) => buildStudyDestinationShortcutPayload(values),
    getListItems: (payload) => getStudyDestinationShortcutItemsBySlug(payload, 'mbbs-georgia'),
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
    getDuplicateValues: (_item, editValues) =>
      buildDuplicateDraftValues(editValues, {
        title: appendDuplicateLabel(editValues.title),
        slug: '',
        status: 'DRAFT',
        sortOrder: 0,
        isFeatured: false,
        showInMenu: false,
        canonicalUrl: '',
      }),
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
      {
        name: 'content',
        label: 'Page Content',
        type: 'rich-content',
        richContentStorageMode: 'json-object',
        rows: 12,
        colSpan: 2,
      },
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
      content: item.content,
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
    getDuplicateValues: (_item, editValues) =>
      buildDuplicateDraftValues(editValues, {
        name: appendDuplicateLabel(editValues.name),
        slug: '',
        status: 'DRAFT',
        sortOrder: 0,
        isFeatured: false,
        canonicalUrl: '',
      }),
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
      feeManagement: defaultCollegeFeeManagementValue(),
      sortOrder: 0,
      eligibility: '',
      admissionProcess: [],
      facilities: '',
      packageIncludedItems: [],
      packageAdditionalCostItems: [],
      gallery: [],
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
      {
        name: 'feeManagement',
        label: 'Fee Structure',
        type: 'college-fee-structure',
        colSpan: 2,
      },
      {
        name: 'packageIncludedItems',
        label: 'Included in Package',
        type: 'string-list',
        colSpan: 2,
        placeholder: 'Complete admission processing',
        description: 'Manage the package items shown in the Included in Package group.',
      },
      {
        name: 'packageAdditionalCostItems',
        label: 'Additional Costs (Not Included)',
        type: 'string-list',
        colSpan: 2,
        placeholder: 'Air tickets',
        description: 'Manage the package items shown in the Additional Costs (Not Included) group.',
      },
      { name: 'eligibility', label: 'Eligibility', type: 'textarea', rows: 3, colSpan: 2 },
      { name: 'status', label: 'Status', type: 'select', required: true, options: publicationStatusOptions },
      { name: 'isFeatured', label: 'Featured / Homepage Visible', type: 'switch' },
      {
        name: 'admissionProcess',
        label: 'Admission Process',
        type: 'string-list',
        rows: 8,
        colSpan: 2,
        description: 'Manage the admission-process steps shown for this college.',
        placeholder: 'Free counseling and college shortlisting',
      },
      { name: 'facilities', label: 'Badges / Features', type: 'keywords', colSpan: 2, description: 'Comma-separated badges shown on the homepage card.' },
      {
        name: 'gallery',
        label: 'Gallery Images',
        type: 'media-gallery',
        rows: 8,
        colSpan: 2,
      },
      {
        name: 'contentBlocks',
        label: 'Advanced Content',
        type: 'rich-content',
        richContentStorageMode: 'json-object',
        rows: 12,
        colSpan: 2,
      },
      ...defaultSeoFields,
    ],
    columns: [
      { key: 'name', label: 'College', render: (item) => <div className="font-semibold">{String(item.name ?? '-')}</div> },
      { key: 'location', label: 'Location', render: (item) => [String(item.city ?? '').trim(), String(item.country ?? '').trim()].filter(Boolean).join(', ') || '-' },
      { key: 'fee', label: 'Main Total', render: (item) => getMedicalCollegeFeeSummary(item) },
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
      feeManagement: {
        feeStructure:
          Array.isArray(item.feeStructure) && item.feeStructure.length > 0
            ? item.feeStructure
            : defaultCollegeFeeManagementValue().feeStructure,
      },
      admissionProcess: Array.isArray(item.admissionProcess) ? item.admissionProcess : [],
      facilities: toKeywordsValue(item.facilities),
      packageIncludedItems: sanitizeStringList(
        isRecord(item.contentBlocks) ? item.contentBlocks.included : [],
      ),
      packageAdditionalCostItems: sanitizeStringList(
        isRecord(item.contentBlocks) ? item.contentBlocks.notIncluded : [],
      ),
      gallery: Array.isArray(item.gallery) ? item.gallery : [],
      contentBlocks: item.contentBlocks,
      seoKeywords: toKeywordsValue(item.seoKeywords),
    }),
    buildPayload: (values) => {
      const feeManagement =
        values.feeManagement &&
        typeof values.feeManagement === 'object' &&
        !Array.isArray(values.feeManagement)
          ? (values.feeManagement as {
              feeStructure?: unknown;
            })
          : null;
      const existingContentBlocks =
        values.contentBlocks && typeof values.contentBlocks === 'object' && !Array.isArray(values.contentBlocks)
          ? { ...(values.contentBlocks as Record<string, unknown>) }
          : {};
      const badgeFeatures = Array.isArray(values.facilities)
        ? values.facilities.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];
      const establishedYear =
        typeof values.establishedYear === 'string' ? values.establishedYear.trim() : '';
      const packageIncludedItems = sanitizeStringList(values.packageIncludedItems);
      const packageAdditionalCostItems = sanitizeStringList(values.packageAdditionalCostItems);

      const contentBlocks = {
        ...existingContentBlocks,
        ...(establishedYear ? { established: establishedYear } : {}),
        included: packageIncludedItems,
        notIncluded: packageAdditionalCostItems,
      };

      const restValues = { ...values };
      delete restValues.feeManagement;
      delete restValues.packageIncludedItems;
      delete restValues.packageAdditionalCostItems;

      return {
        ...restValues,
        feeStructure: sanitizeMedicalCollegeFeeStructure(feeManagement?.feeStructure),
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
      mediaAssetId: '',
      title: '',
      type: 'IMAGE',
      url: '',
      category: '',
      altText: '',
      seoTitle: '',
      seoDescription: '',
      sortOrder: 0,
      status: 'ACTIVE',
    },
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
        placeholder: 'Auto-filled from the selected image when left blank',
      },
      { name: 'type', label: 'Type', type: 'select', required: true, options: galleryTypeOptions },
      {
        name: 'url',
        label: 'Gallery Asset / Video URL',
        type: 'url',
        colSpan: 2,
        uploadKind: 'image',
        previewLabel: 'Preview asset',
        allowMultipleUploads: true,
        assetIdFieldName: 'mediaAssetId',
        assetTitleFieldName: 'title',
        description:
          'For images, upload or select from the Media Library. Legacy/manual URLs are still accepted as a safe fallback. For videos, paste the video URL directly.',
      },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'altText', label: 'Alt Text', type: 'text', colSpan: 2, placeholder: 'Describe the image for accessibility and SEO' },
      { name: 'seoTitle', label: 'SEO Title', type: 'text', colSpan: 2, placeholder: 'Optional SEO title for this asset' },
      { name: 'seoDescription', label: 'SEO Description', type: 'textarea', rows: 4, colSpan: 2, placeholder: 'Optional SEO description for this asset' },
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
      getEditValues: (item) => ({
        ...item,
        mediaAssetId: String(item.mediaAssetId ?? ''),
      }),
      buildPayload: (values) => ({
        mediaAssetId: normalizeString(values.mediaAssetId) || null,
        title: normalizeString(values.title) || null,
        type: String(values.type ?? 'IMAGE'),
        url: normalizeString(values.url) || null,
        category: normalizeString(values.category) || null,
        altText: normalizeString(values.altText) || null,
        seoTitle: normalizeString(values.seoTitle) || null,
        seoDescription: normalizeString(values.seoDescription) || null,
        sortOrder:
          typeof values.sortOrder === 'number' && Number.isFinite(values.sortOrder)
            ? values.sortOrder
            : Number(values.sortOrder ?? 0),
        status: String(values.status ?? 'ACTIVE'),
      }),
    },
  'home-reels': {
    key: 'home-reels',
    title: 'Reels Videos',
    singular: 'Reel Video',
    description: 'Manage homepage reel cards with YouTube URLs, optional custom thumbnails, status, and display order.',
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
      videoUrl: '',
      thumbnail: '',
      sortOrder: 0,
      status: 'ACTIVE',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      {
        name: 'videoUrl',
        label: 'YouTube Video URL',
        type: 'youtube-video',
        required: true,
        colSpan: 2,
        linkedFieldName: 'thumbnail',
        placeholder: 'https://www.youtube.com/watch?v=VIDEO_ID',
        validate: (value) => {
          const normalizedValue = String(value ?? '').trim();

          if (!normalizedValue) {
            return 'YouTube Video URL is required.';
          }

          return extractYouTubeVideoId(normalizedValue)
            ? undefined
            : 'Please enter a valid YouTube video or YouTube Shorts URL.';
        },
      },
      {
        name: 'thumbnail',
        label: 'Video Thumbnail',
        type: 'url',
        colSpan: 2,
        uploadKind: 'videoThumbnail',
        allowManualEntry: false,
        previewLabel: 'Preview thumbnail',
        description: 'Upload a custom thumbnail or select one from the Media Library. Leave this blank to use the YouTube thumbnail automatically.',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: simpleStatusOptions,
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
        key: 'video',
        label: 'Video',
        render: (item) =>
          String(item.videoUrl ?? '').trim()
            ? 'Ready'
            : 'Missing URL',
      },
      { key: 'status', label: 'Status', render: (item) => badgeForStatus(item.status) },
      { key: 'sortOrder', label: 'Order', render: (item) => String(item.sortOrder ?? 0) },
    ],
    getSearchText: (item) =>
      `${String(item.title ?? '')} ${String(item.videoUrl ?? '')} ${String(item.youtubeVideoId ?? '')}`,
  },
  blogs: {
    key: 'blogs',
    title: 'Knowledge Hub',
    singular: 'Blog',
    description: 'Publish knowledge hub articles with pinned sorting and SEO metadata.',
    endpoint: '/blogs',
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
      {
        name: 'content',
        label: 'Content',
        type: 'rich-content',
        richContentStorageMode: 'json-loose',
        rows: 12,
        colSpan: 2,
      },
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
      content: item.content,
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
      {
        name: 'content',
        label: 'Content',
        type: 'rich-content',
        richContentStorageMode: 'string-html',
        rows: 10,
        colSpan: 2,
      },
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
      { key: 'trackingId', label: 'Inquiry ID', render: (item) => <Badge variant="success">{String(item.trackingId ?? '-')}</Badge> },
      { key: 'fullName', label: 'Name', render: (item) => <div className="font-semibold">{String(item.fullName ?? '-')}</div> },
      { key: 'phoneNumber', label: 'Phone', render: (item) => String(item.phoneNumber ?? '-') },
      { key: 'emailAddress', label: 'Email', render: (item) => String(item.emailAddress ?? '-') },
      { key: 'preferredStudyDestination', label: 'Destination', render: (item) => String(item.preferredStudyDestination ?? item.country ?? '-') },
      { key: 'interestedCollegeName', label: 'College', render: (item) => String(item.interestedCollegeName ?? '-') },
      { key: 'source', label: 'Source', render: (item) => <Badge variant="info">{String(item.source ?? 'College Fee Inquiry')}</Badge> },
      { key: 'createdAt', label: 'Submitted', render: (item) => formatDateTime(String(item.createdAt ?? '')) },
    ],
    getSearchText: (item) =>
      `${String(item.trackingId ?? '')} ${String(item.fullName ?? '')} ${String(item.phoneNumber ?? '')} ${String(item.emailAddress ?? '')} ${String(item.country ?? '')} ${String(item.preferredStudyDestination ?? '')} ${String(item.interestedCollegeName ?? '')} ${String(item.sourcePage ?? '')}`,
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
    getDuplicateValues: (_item, editValues) =>
      buildDuplicateDraftValues(editValues, {
        studentName: appendDuplicateLabel(editValues.studentName),
        status: 'INACTIVE',
        sortOrder: 0,
        showOnHomepage: false,
      }),
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
