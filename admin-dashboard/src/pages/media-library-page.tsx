import { MediaLibraryBrowser } from '../components/cms/media-library-browser';

export function MediaLibraryPage() {
  return (
    <MediaLibraryBrowser
      variant="page"
      title="Media Library"
      description="Manage all uploaded website assets in one place. Upload new media, review previews, update SEO metadata, and copy shareable URLs."
      showUploadControls
      uploadKinds={['image', 'document']}
    />
  );
}
