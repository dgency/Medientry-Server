import { Router } from 'express';

import { authRouter } from './auth.routes';
import { blogRouter } from './blog.routes';
import { collegeFeeInquiryRouter } from './college-fee-inquiry.routes';
import { consultationLeadRouter } from './consultation-lead.routes';
import { galleryRouter } from './gallery.routes';
import { healthRouter } from './health.routes';
import { homeReelRouter } from './home-reel.routes';
import { homeSectionRouter } from './home-section.routes';
import { medicalCollegeRouter } from './medical-college.routes';
import { noticeRouter } from './notice.routes';
import { pageRouter } from './page.routes';
import { siteSettingRouter } from './site-setting.routes';
import { studyDestinationRouter } from './study-destination.routes';
import { successStoryRouter } from './success-story.routes';
import { uploadRouter } from './upload.routes';
import { userRouter } from './user.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/blogs', blogRouter);
router.use('/college-fee-inquiries', collegeFeeInquiryRouter);
router.use('/consultation-leads', consultationLeadRouter);
router.use('/gallery', galleryRouter);
router.use('/health', healthRouter);
router.use('/home-reels', homeReelRouter);
router.use('/home-sections', homeSectionRouter);
router.use('/medical-colleges', medicalCollegeRouter);
router.use('/notices', noticeRouter);
router.use('/pages', pageRouter);
router.use('/site-settings', siteSettingRouter);
router.use('/study-destinations', studyDestinationRouter);
router.use('/success-stories', successStoryRouter);
router.use('/uploads', uploadRouter);
router.use('/users', userRouter);

export const apiRouter = router;
