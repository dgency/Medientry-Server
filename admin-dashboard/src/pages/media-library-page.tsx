import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { MediaLibraryBrowser } from '../components/cms/media-library-browser';

export function MediaLibraryPage() {
  return (
    <div className="space-y-6">
      <Card className="page-frame border-none">
        <CardHeader>
          <CardTitle className="text-2xl">Media Library</CardTitle>
          <CardDescription>
            Upload, preview, search, filter, and remove reusable media assets without leaving the dashboard.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <MediaLibraryBrowser
            embedded
            allowDelete
            uploadKind="all"
            showFooter={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
