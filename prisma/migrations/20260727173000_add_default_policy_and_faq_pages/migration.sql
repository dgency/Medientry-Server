INSERT INTO "pages" (
  "id",
  "title",
  "slug",
  "pageType",
  "templateType",
  "status",
  "heroTitle",
  "heroSubtitle",
  "heroImage",
  "content",
  "seoTitle",
  "seoDescription",
  "seoKeywords",
  "ogImage",
  "canonicalUrl",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    '7d7bc188-6a76-4d02-8d88-1ea9e8477ac1',
    'Privacy Policy',
    'privacy-policy',
    'CUSTOM',
    'DEFAULT',
    'PUBLISHED',
    'Privacy Policy',
    'Learn how Medientry Bangladesh collects, uses, and protects the information shared through our website and consultation process.',
    NULL,
    jsonb_build_object(
      'html',
      '<p>Medientry Bangladesh is committed to protecting the privacy of students, parents, and visitors who engage with our website or services. This policy explains what information we collect, how we use it, and the steps we take to protect it.</p><h2>Information We Collect</h2><p>We may collect personal information such as your name, phone number, email address, country, preferred study destination, and any details you share through consultation, inquiry, or contact forms.</p><h2>How We Use Your Information</h2><p>We use submitted information to respond to inquiries, guide students through admissions, improve our services, communicate important updates, and maintain internal service records.</p><h2>Information Sharing</h2><p>We do not sell personal information. We may share relevant details only with trusted internal team members, partner institutions, or service providers when necessary to support admissions or requested services.</p><h2>Data Security</h2><p>We use reasonable administrative and technical safeguards to protect personal information from unauthorized access, misuse, or disclosure.</p><h2>Cookies and Analytics</h2><p>Our website may use cookies or analytics tools to understand site usage and improve the browsing experience. You can manage cookies through your browser settings.</p><h2>Your Rights</h2><p>You may request access to, correction of, or deletion of your personal information by contacting our team through the official channels listed on the website.</p><h2>Policy Updates</h2><p>We may update this policy from time to time to reflect operational, legal, or service changes. The latest version published on this page will apply.</p>'
    ),
    'Privacy Policy | Medientry Bangladesh',
    'Review the Medientry Bangladesh privacy policy for information on data collection, communication, and website usage practices.',
    ARRAY['privacy policy', 'student data policy', 'website privacy']::TEXT[],
    NULL,
    '/privacy-policy',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'f3bd7450-e1d3-4786-9c0a-4ed07039e891',
    'Terms and Conditions',
    'terms-and-conditions',
    'CUSTOM',
    'DEFAULT',
    'PUBLISHED',
    'Terms and Conditions',
    'Read the terms that apply to the use of the Medientry Bangladesh website, inquiry forms, and consultation-related services.',
    NULL,
    jsonb_build_object(
      'html',
      '<p>These terms govern your use of the Medientry Bangladesh website, consultation services, and related communication channels. By using our website or submitting your information, you agree to these terms.</p><h2>Use of Website</h2><p>The website content is provided for general information about admissions, counseling, and education support services. You agree not to misuse the website or attempt to interfere with its operation.</p><h2>Service Scope</h2><p>Medientry provides guidance, admissions support, and information based on available institutional and regulatory updates. Final admission, visa, and institutional decisions remain subject to the relevant authorities.</p><h2>Accuracy of Information</h2><p>We work to keep information accurate and current, but details such as fees, eligibility, deadlines, and regulations may change. Users should confirm final decisions with our team before acting.</p><h2>User Responsibilities</h2><p>You agree to provide accurate information, respond to documentation requests honestly, and avoid submitting misleading or incomplete details during the consultation or admission process.</p><h2>Intellectual Property</h2><p>All website text, branding, media, and supporting materials are owned by Medientry or used with permission. They may not be copied or reused without authorization.</p><h2>Limitation of Liability</h2><p>Medientry is not liable for losses resulting from third-party decisions, regulatory changes, delays outside our control, or actions taken based solely on outdated information.</p><h2>Changes to Terms</h2><p>We may revise these terms when needed. Continued use of the website or services after updates means you accept the revised terms.</p>'
    ),
    'Terms and Conditions | Medientry Bangladesh',
    'Read the website and service terms and conditions for using Medientry Bangladesh resources and consultation support.',
    ARRAY['terms and conditions', 'website terms', 'service terms']::TEXT[],
    NULL,
    '/terms-and-conditions',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '56d63036-5216-4716-9ea0-df0805e8f0b8',
    'FAQ''s',
    'faqs',
    'CUSTOM',
    'DEFAULT',
    'PUBLISHED',
    'Frequently Asked Questions',
    'Find clear answers about admissions, planning, fees, and support before you begin your next step with Medientry Bangladesh.',
    NULL,
    jsonb_build_object(
      'heroOverlayColor', '#052118',
      'heroOverlayOpacity', 0.82,
      'faqSectionEyebrow', 'Frequently Asked Questions',
      'faqSectionTitle', 'Answers That Help You Move Forward with Confidence',
      'faqSectionSubtitle', 'Browse the most common questions by topic and get clear, professional answers before you start your application journey.',
      'faqCategories',
      jsonb_build_array(
        jsonb_build_object(
          'id', 'admissions-eligibility',
          'title', 'Admissions and Eligibility',
          'description', 'Quick answers to the most common admission planning questions students and parents ask before starting.',
          'sortOrder', 1,
          'isActive', true,
          'faqs',
          jsonb_build_array(
            jsonb_build_object(
              'question', 'Who can apply through Medientry for admission guidance?',
              'answer', 'Students and families looking for MBBS or selected study-abroad guidance can contact Medientry for counseling, documentation support, and admission planning.',
              'sortOrder', 1,
              'isActive', true
            ),
            jsonb_build_object(
              'question', 'What documents are usually required to begin the process?',
              'answer', 'Common requirements include academic transcripts, identification documents, passport details, recent photographs, and destination-specific eligibility records. The exact checklist depends on the student profile and target institution.',
              'sortOrder', 2,
              'isActive', true
            ),
            jsonb_build_object(
              'question', 'Can I speak with a counselor before choosing a destination?',
              'answer', 'Yes. Medientry provides consultation support so students can compare options, understand timelines, and move forward with a destination that matches their goals and budget.',
              'sortOrder', 3,
              'isActive', true
            )
          )
        ),
        jsonb_build_object(
          'id', 'fees-support',
          'title', 'Fees and Ongoing Support',
          'description', 'Helpful answers around cost planning, guidance scope, and post-admission support expectations.',
          'sortOrder', 2,
          'isActive', true,
          'faqs',
          jsonb_build_array(
            jsonb_build_object(
              'question', 'Does Medientry help with fee planning and budgeting?',
              'answer', 'Yes. The team can guide students through expected tuition, living expenses, and payment planning so families can prepare realistically before confirming admission.',
              'sortOrder', 1,
              'isActive', true
            ),
            jsonb_build_object(
              'question', 'Will support continue after admission is confirmed?',
              'answer', 'Medientry aims to support students beyond the initial application stage with practical next-step guidance related to documentation, travel preparation, and onboarding requirements.',
              'sortOrder', 2,
              'isActive', true
            ),
            jsonb_build_object(
              'question', 'How can I ask a question that is not listed here?',
              'answer', 'If your question is not covered on this page, use the contact or consultation options on the website and the team will guide you directly.',
              'sortOrder', 3,
              'isActive', true
            )
          )
        )
      ),
      'pageCtaTitle', 'Still Need Personal Guidance?',
      'pageCtaSubtitle', 'Talk to our team for answers tailored to your goals, budget, and admission timeline.',
      'pageCtaPrimaryButtonText', 'Book Free Consultation',
      'pageCtaPrimaryButtonUrl', '/contact-us',
      'pageCtaSecondaryButtonText', 'Chat on WhatsApp',
      'pageCtaSecondaryButtonUrl', ''
    ),
    'FAQ''s | Medientry Bangladesh',
    'Browse category-wise frequently asked questions about Medientry Bangladesh services, admissions planning, and consultation support.',
    ARRAY['faqs', 'admission faq', 'student support faq']::TEXT[],
    NULL,
    '/faqs',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("slug") DO NOTHING;
