import { prisma } from '../config/prisma';
import { resolvePublicMediaUrl } from '../utils/media-path';

const shouldApply = process.argv.includes('--apply');

type PlannedUpdate = {
  table: string;
  id: string;
  field: string;
  before: string;
  after: string;
};

const buildNormalizedValue = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || !/^\/?uploads\//i.test(trimmedValue)) {
    return null;
  }

  const normalizedValue = resolvePublicMediaUrl(trimmedValue);

  if (!normalizedValue || normalizedValue === trimmedValue) {
    return null;
  }

  return normalizedValue;
};

const main = async () => {
  const plannedUpdates: PlannedUpdate[] = [];

  const [
    mediaAssets,
    pages,
    blogs,
    studyDestinations,
    medicalColleges,
    notices,
    successStories,
    galleryItems,
    siteSettings,
  ] = await Promise.all([
    prisma.mediaAsset.findMany({ select: { id: true, url: true, publicUrl: true } }),
    prisma.page.findMany({ select: { id: true, heroImage: true, ogImage: true } }),
    prisma.blog.findMany({ select: { id: true, featuredImage: true, ogImage: true } }),
    prisma.studyDestination.findMany({ select: { id: true, featuredImage: true, ogImage: true } }),
    prisma.medicalCollege.findMany({ select: { id: true, featuredImage: true, ogImage: true } }),
    prisma.notice.findMany({ select: { id: true, fileUrl: true, ogImage: true } }),
    prisma.successStory.findMany({ select: { id: true, image: true } }),
    prisma.galleryItem.findMany({ select: { id: true, url: true, thumbnail: true } }),
    prisma.siteSetting.findMany({ select: { id: true, logoLight: true, logoDark: true, favicon: true } }),
  ]);

  const collect = (
    table: string,
    id: string,
    field: string,
    value?: string | null,
  ) => {
    const normalizedValue = buildNormalizedValue(value);

    if (!normalizedValue || typeof value !== 'string') {
      return;
    }

    plannedUpdates.push({
      table,
      id,
      field,
      before: value,
      after: normalizedValue,
    });
  };

  for (const item of mediaAssets) {
    collect('media_assets', item.id, 'url', item.url);
    collect('media_assets', item.id, 'publicUrl', item.publicUrl);
  }

  for (const item of pages) {
    collect('pages', item.id, 'heroImage', item.heroImage);
    collect('pages', item.id, 'ogImage', item.ogImage);
  }

  for (const item of blogs) {
    collect('blogs', item.id, 'featuredImage', item.featuredImage);
    collect('blogs', item.id, 'ogImage', item.ogImage);
  }

  for (const item of studyDestinations) {
    collect('study_destinations', item.id, 'featuredImage', item.featuredImage);
    collect('study_destinations', item.id, 'ogImage', item.ogImage);
  }

  for (const item of medicalColleges) {
    collect('medical_colleges', item.id, 'featuredImage', item.featuredImage);
    collect('medical_colleges', item.id, 'ogImage', item.ogImage);
  }

  for (const item of notices) {
    collect('notices', item.id, 'fileUrl', item.fileUrl);
    collect('notices', item.id, 'ogImage', item.ogImage);
  }

  for (const item of successStories) {
    collect('success_stories', item.id, 'image', item.image);
  }

  for (const item of galleryItems) {
    collect('gallery_items', item.id, 'url', item.url);
    collect('gallery_items', item.id, 'thumbnail', item.thumbnail);
  }

  for (const item of siteSettings) {
    collect('site_settings', item.id, 'logoLight', item.logoLight);
    collect('site_settings', item.id, 'logoDark', item.logoDark);
    collect('site_settings', item.id, 'favicon', item.favicon);
  }

  if (!shouldApply) {
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          updateCount: plannedUpdates.length,
          plannedUpdates,
        },
        null,
        2,
      ),
    );
    return;
  }

  for (const update of plannedUpdates) {
    switch (update.table) {
      case 'media_assets':
        await prisma.mediaAsset.update({
          where: { id: update.id },
          data: { [update.field]: update.after },
        });
        break;
      case 'pages':
        await prisma.page.update({
          where: { id: update.id },
          data: { [update.field]: update.after },
        });
        break;
      case 'blogs':
        await prisma.blog.update({
          where: { id: update.id },
          data: { [update.field]: update.after },
        });
        break;
      case 'study_destinations':
        await prisma.studyDestination.update({
          where: { id: update.id },
          data: { [update.field]: update.after },
        });
        break;
      case 'medical_colleges':
        await prisma.medicalCollege.update({
          where: { id: update.id },
          data: { [update.field]: update.after },
        });
        break;
      case 'notices':
        await prisma.notice.update({
          where: { id: update.id },
          data: { [update.field]: update.after },
        });
        break;
      case 'success_stories':
        await prisma.successStory.update({
          where: { id: update.id },
          data: { [update.field]: update.after },
        });
        break;
      case 'gallery_items':
        await prisma.galleryItem.update({
          where: { id: update.id },
          data: { [update.field]: update.after },
        });
        break;
      case 'site_settings':
        await prisma.siteSetting.update({
          where: { id: update.id },
          data: { [update.field]: update.after },
        });
        break;
      default:
        break;
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: 'apply',
        updateCount: plannedUpdates.length,
        appliedUpdates: plannedUpdates,
      },
      null,
      2,
    ),
  );
};

main()
  .catch((error) => {
    console.error('[media:normalize] Failed to normalize media records.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
