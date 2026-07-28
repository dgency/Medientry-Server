import {
  PageTemplateType,
  PageType,
  PublicationStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';

import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/password';

const defaultCmsPages = [
  {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    heroTitle: 'Privacy Policy',
    heroSubtitle:
      'Learn how Medientry Bangladesh collects, uses, and protects the information shared through our website and consultation process.',
    content: {
      html: '<p>Medientry Bangladesh is committed to protecting the privacy of students, parents, and visitors who engage with our website or services. This policy explains what information we collect, how we use it, and the steps we take to protect it.</p><h2>Information We Collect</h2><p>We may collect personal information such as your name, phone number, email address, country, preferred study destination, and any details you share through consultation, inquiry, or contact forms.</p><h2>How We Use Your Information</h2><p>We use submitted information to respond to inquiries, guide students through admissions, improve our services, communicate important updates, and maintain internal service records.</p><h2>Information Sharing</h2><p>We do not sell personal information. We may share relevant details only with trusted internal team members, partner institutions, or service providers when necessary to support admissions or requested services.</p><h2>Data Security</h2><p>We use reasonable administrative and technical safeguards to protect personal information from unauthorized access, misuse, or disclosure.</p><h2>Cookies and Analytics</h2><p>Our website may use cookies or analytics tools to understand site usage and improve the browsing experience. You can manage cookies through your browser settings.</p><h2>Your Rights</h2><p>You may request access to, correction of, or deletion of your personal information by contacting our team through the official channels listed on the website.</p><h2>Policy Updates</h2><p>We may update this policy from time to time to reflect operational, legal, or service changes. The latest version published on this page will apply.</p>',
    },
    seoTitle: 'Privacy Policy | Medientry Bangladesh',
    seoDescription:
      'Review the Medientry Bangladesh privacy policy for information on data collection, communication, and website usage practices.',
    seoKeywords: ['privacy policy', 'student data policy', 'website privacy'],
    canonicalUrl: '/privacy-policy',
  },
  {
    title: 'Terms and Conditions',
    slug: 'terms-and-conditions',
    heroTitle: 'Terms and Conditions',
    heroSubtitle:
      'Read the terms that apply to the use of the Medientry Bangladesh website, inquiry forms, and consultation-related services.',
    content: {
      html: '<p>These terms govern your use of the Medientry Bangladesh website, consultation services, and related communication channels. By using our website or submitting your information, you agree to these terms.</p><h2>Use of Website</h2><p>The website content is provided for general information about admissions, counseling, and education support services. You agree not to misuse the website or attempt to interfere with its operation.</p><h2>Service Scope</h2><p>Medientry provides guidance, admissions support, and information based on available institutional and regulatory updates. Final admission, visa, and institutional decisions remain subject to the relevant authorities.</p><h2>Accuracy of Information</h2><p>We work to keep information accurate and current, but details such as fees, eligibility, deadlines, and regulations may change. Users should confirm final decisions with our team before acting.</p><h2>User Responsibilities</h2><p>You agree to provide accurate information, respond to documentation requests honestly, and avoid submitting misleading or incomplete details during the consultation or admission process.</p><h2>Intellectual Property</h2><p>All website text, branding, media, and supporting materials are owned by Medientry or used with permission. They may not be copied or reused without authorization.</p><h2>Limitation of Liability</h2><p>Medientry is not liable for losses resulting from third-party decisions, regulatory changes, delays outside our control, or actions taken based solely on outdated information.</p><h2>Changes to Terms</h2><p>We may revise these terms when needed. Continued use of the website or services after updates means you accept the revised terms.</p>',
    },
    seoTitle: 'Terms and Conditions | Medientry Bangladesh',
    seoDescription:
      'Read the website and service terms and conditions for using Medientry Bangladesh resources and consultation support.',
    seoKeywords: ['terms and conditions', 'website terms', 'service terms'],
    canonicalUrl: '/terms-and-conditions',
  },
  {
    title: "FAQ's",
    slug: 'faqs',
    heroTitle: 'Frequently Asked Questions',
    heroSubtitle:
      'Find clear answers about admissions, planning, fees, and support before you begin your next step with Medientry Bangladesh.',
    content: {
      heroOverlayColor: '#052118',
      heroOverlayOpacity: 0.82,
      faqSectionEyebrow: 'Frequently Asked Questions',
      faqSectionTitle: 'Answers That Help You Move Forward with Confidence',
      faqSectionSubtitle:
        'Browse the most common questions by topic and get clear, professional answers before you start your application journey.',
      faqCategories: [
        {
          id: 'admissions-eligibility',
          title: 'Admissions and Eligibility',
          description:
            'Quick answers to the most common admission planning questions students and parents ask before starting.',
          sortOrder: 1,
          isActive: true,
          faqs: [
            {
              question:
                'Who can apply through Medientry for admission guidance?',
              answer:
                'Students and families looking for MBBS or selected study-abroad guidance can contact Medientry for counseling, documentation support, and admission planning.',
              sortOrder: 1,
              isActive: true,
            },
            {
              question:
                'What documents are usually required to begin the process?',
              answer:
                'Common requirements include academic transcripts, identification documents, passport details, recent photographs, and destination-specific eligibility records. The exact checklist depends on the student profile and target institution.',
              sortOrder: 2,
              isActive: true,
            },
            {
              question:
                'Can I speak with a counselor before choosing a destination?',
              answer:
                'Yes. Medientry provides consultation support so students can compare options, understand timelines, and move forward with a destination that matches their goals and budget.',
              sortOrder: 3,
              isActive: true,
            },
          ],
        },
        {
          id: 'fees-support',
          title: 'Fees and Ongoing Support',
          description:
            'Helpful answers around cost planning, guidance scope, and post-admission support expectations.',
          sortOrder: 2,
          isActive: true,
          faqs: [
            {
              question:
                'Does Medientry help with fee planning and budgeting?',
              answer:
                'Yes. The team can guide students through expected tuition, living expenses, and payment planning so families can prepare realistically before confirming admission.',
              sortOrder: 1,
              isActive: true,
            },
            {
              question:
                'Will support continue after admission is confirmed?',
              answer:
                'Medientry aims to support students beyond the initial application stage with practical next-step guidance related to documentation, travel preparation, and onboarding requirements.',
              sortOrder: 2,
              isActive: true,
            },
            {
              question: 'How can I ask a question that is not listed here?',
              answer:
                'If your question is not covered on this page, use the contact or consultation options on the website and the team will guide you directly.',
              sortOrder: 3,
              isActive: true,
            },
          ],
        },
      ],
      pageCtaTitle: 'Still Need Personal Guidance?',
      pageCtaSubtitle:
        'Talk to our team for answers tailored to your goals, budget, and admission timeline.',
      pageCtaPrimaryButtonText: 'Book Free Consultation',
      pageCtaPrimaryButtonUrl: '/contact-us',
      pageCtaSecondaryButtonText: 'Chat on WhatsApp',
      pageCtaSecondaryButtonUrl: '',
    },
    seoTitle: "FAQ's | Medientry Bangladesh",
    seoDescription:
      'Browse category-wise frequently asked questions about Medientry Bangladesh services, admissions planning, and consultation support.',
    seoKeywords: ['faqs', 'admission faq', 'student support faq'],
    canonicalUrl: '/faqs',
  },
] as const;

export const ensureDefaultSuperAdmin = async () => {
  if (!env.SEED_SUPER_ADMIN_PASSWORD) {
    console.warn(
      '[bootstrap] SEED_SUPER_ADMIN_PASSWORD is missing. Skipping default super admin bootstrap.',
    );
    return;
  }

  const email = env.SEED_SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    console.log(`[bootstrap] Default super admin already exists for ${email}. Skipping password reset.`);
    return;
  }

  const password = await hashPassword(env.SEED_SUPER_ADMIN_PASSWORD);

  await prisma.user.create({
    data: {
      name: env.SEED_SUPER_ADMIN_NAME.trim(),
      email,
      password,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`[bootstrap] Default super admin was created for ${email}.`);
};

export const ensureDefaultCmsPages = async () => {
  let createdPages = 0;

  for (const page of defaultCmsPages) {
    const existingPage = await prisma.page.findUnique({
      where: {
        slug: page.slug,
      },
      select: {
        id: true,
      },
    });

    if (existingPage) {
      continue;
    }

    await prisma.page.create({
      data: {
        title: page.title,
        slug: page.slug,
        pageType: PageType.CUSTOM,
        templateType: PageTemplateType.DEFAULT,
        status: PublicationStatus.PUBLISHED,
        heroTitle: page.heroTitle,
        heroSubtitle: page.heroSubtitle,
        content: page.content,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        seoKeywords: [...page.seoKeywords],
        canonicalUrl: page.canonicalUrl,
      },
    });

    createdPages += 1;
  }

  if (createdPages > 0) {
    console.log(`[bootstrap] Created ${createdPages} default CMS page(s).`);
  }
};
