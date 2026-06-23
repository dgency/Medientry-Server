# Medientry Content Migration Map

This document tracks how existing `Medientry-Client` hardcoded content is mapped into the CMS and PostgreSQL seed import.

| Frontend Source | Content Type | Database Model | CMS Module | Image / File Path Source | SEO Source | Migration Status |
| --- | --- | --- | --- | --- | --- | --- |
| `Medientry-Client/src/constants/site-content.ts` | Site name, logo, contact info, social links, reusable image paths | `SiteSetting` | Site Settings | `/images/medientry-logo.jpeg`, shared `siteImages.*` | `siteConfig.description` plus page-level fallbacks | Seeded |
| `Medientry-Client/src/constants/navigation.ts` | Main nav, footer links, destination links | `Page.content` (`home`) and `StudyDestination.showInMenu` | Pages, Study Destinations | N/A | N/A | Seeded |
| `Medientry-Client/src/data/admissionNotices.ts` | Notice titles, slugs, summaries, PDF links, dates | `Notice` | Notices & Downloads | `/notices/*.pdf` | `seoTitle`, `seoDescription`, `seoKeywords`, `canonicalUrl` from source or fallback | Seeded |
| `Medientry-Client/src/data/blogPosts.ts` | Knowledge Hub posts including Bangladesh + Georgia blog imports | `Blog` | Knowledge Hub / Blogs | `/images/blog/*` | Existing per-post SEO fields and fallbacks | Seeded |
| `Medientry-Client/src/data/universities.ts` | Medical college/university detail data, fee structure, highlights, SEO | `MedicalCollege` | Medical Colleges | `featuredImage`, `gallery` or fallback `/images/medical-college-1.jpg` | Existing per-college SEO fields and fallbacks | Seeded |
| `Medientry-Client/src/data/successStories.ts` | Student and parent reviews | `SuccessStory` | Success Stories | No dedicated image in source; imported as text-first stories | Fallback from student name/university if missing | Seeded |
| `Medientry-Client/src/components/pages/HomePage.tsx` | Homepage hero copy, trust blocks, admission steps, repeated-section defaults | `Page` (`slug: home`) and `HomeSectionSetting` | Pages, Home Sections | `/images/hero-campus-students.jpeg` and section assets | Root page SEO plus homepage fallbacks | Seeded |
| `Medientry-Client/src/components/pages/MbbsBangladesh.tsx` | Bangladesh destination copy, advantages, facts, challenges, fee overview | `StudyDestination` (`mbbs-bangladesh`) | Study Destinations | `/images/mbbs-bangladesh-hero.jpg` | Destination SEO fields and fallback keywords | Seeded |
| `Medientry-Client/src/components/pages/MbbsGeorgia.tsx` | Georgia destination copy, recognition, career prospects, fee overview | `StudyDestination` (`mbbs-georgia`) | Study Destinations | `/images/georgia-city.jpg` | Destination SEO fields and fallback keywords | Seeded |
| `Medientry-Client/src/components/pages/About.tsx` | About page body copy, values, trust points, counters | `Page` (`slug: about`) | Pages | `/images/team-photo.jpg` | Static page SEO + CMS override | Seeded |
| `Medientry-Client/src/components/pages/Contact.tsx` | Contact hero, offices, methods, working hours, expectations | `Page` (`slug: contact`) and `SiteSetting` | Pages, Site Settings | `/images/contact-hero.jpg` | Static page SEO + CMS override | Seeded |
| `Medientry-Client/src/components/pages/WhyMedientry.tsx` | Why Medientry reasons, guarantees, metrics | `Page` (`slug: why-medientry`) | Pages | `/images/team-photo.jpg` | Static page SEO + CMS override | Seeded |
| `Medientry-Client/src/components/pages/GeorgiaForBangladeshis.tsx` | Study-in-Georgia landing content for Bangladeshi students | `Page` (`slug: georgia-for-bangladeshis`) | Pages | `/images/georgia-tbilisi-hero.jpg` | Static page SEO + CMS override | Seeded |
| `Medientry-Client/src/components/pages/MbbsBangladeshGovernment.tsx` | SAARC / Non-SAARC quota tables, eligibility, process | `Page` (`slug: mbbs-bangladesh-government`) | Pages | `/images/mbbs-bangladesh-hero.jpg` | Static page SEO + CMS override | Seeded |
| `Medientry-Client/src/components/pages/Videos.tsx` | Gallery image titles, video titles, categories | `GalleryItem` and `Page` (`slug: videos`) | Gallery, Pages | Existing `/images/*` assets plus empty video URLs preserved | Static page SEO + CMS override | Seeded |
| `Medientry-Client/src/components/pages/SuccessStories.tsx` | Hero copy and stats for review listing page | `Page` (`slug: success-stories`) and `SuccessStory` | Pages, Success Stories | `/images/team-photo.jpg` | Static page SEO + CMS override | Seeded |
| `Medientry-Client/src/app/*/page.tsx` and `src/lib/cms-page-metadata.ts` | SEO metadata routing for static CMS pages | `Page`, `StudyDestination`, `MedicalCollege`, `Blog`, `Notice` | Pages and dynamic modules | Matches per-record `ogImage` | Existing metadata plus seeded fallback values | Connected |

## Notes

- Existing frontend public assets stay in `Medientry-Client/public`. The database stores paths like `/images/...` and `/notices/...` so the current frontend can keep using them without duplicating files.
- Backend-managed uploads continue using `/uploads/...`; client asset URL logic now leaves `/images/...` and `/notices/...` on the frontend origin.
- `HomeSectionSetting.selectedItemIds` uses real database IDs and is seeded after dependent records are created.
- Notice body storage is currently limited by the existing backend schema; summary, file links, and SEO are fully seeded, while the detailed notice route continues using the current API shape.
