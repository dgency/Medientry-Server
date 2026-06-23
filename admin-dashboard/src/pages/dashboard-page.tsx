import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Globe, Layers3, Newspaper, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { EmptyState } from '../components/ui/empty-state';
import { Spinner } from '../components/ui/spinner';
import { dashboardHighlights, getNavigationItemsForRole } from '../config/navigation';
import { apiClient, extractApiData, getApiErrorMessage } from '../lib/api-client';
import { useAuth } from '../hooks/use-auth';

type DashboardMetrics = {
  pages: number;
  destinations: number;
  colleges: number;
  blogs: number;
  notices: number;
  successStories: number;
  users: number;
};

export function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const quickAccessItems = getNavigationItemsForRole(user?.role).slice(1);

  const metricsQuery = useQuery({
    queryKey: ['dashboard-metrics', user?.role],
    queryFn: async (): Promise<DashboardMetrics> => {
      const [
        pagesResponse,
        destinationsResponse,
        collegesResponse,
        blogsResponse,
        noticesResponse,
        successStoriesResponse,
        usersResponse,
      ] = await Promise.all([
        apiClient.get('/pages'),
        apiClient.get('/study-destinations'),
        apiClient.get('/medical-colleges'),
        apiClient.get('/blogs'),
        apiClient.get('/notices'),
        apiClient.get('/success-stories'),
        isSuperAdmin ? apiClient.get('/users') : Promise.resolve(null),
      ]);

      const pages = extractApiData<unknown[]>(pagesResponse);
      const destinations = extractApiData<unknown[]>(destinationsResponse);
      const colleges = extractApiData<unknown[]>(collegesResponse);
      const blogsPayload = extractApiData<{ items: unknown[]; meta?: { total?: number } }>(blogsResponse);
      const notices = extractApiData<unknown[]>(noticesResponse);
      const successStories = extractApiData<unknown[]>(successStoriesResponse);
      const users = usersResponse ? extractApiData<unknown[]>(usersResponse) : [];

      return {
        pages: Array.isArray(pages) ? pages.length : 0,
        destinations: Array.isArray(destinations) ? destinations.length : 0,
        colleges: Array.isArray(colleges) ? colleges.length : 0,
        blogs: blogsPayload.meta?.total ?? (Array.isArray(blogsPayload.items) ? blogsPayload.items.length : 0),
        notices: Array.isArray(notices) ? notices.length : 0,
        successStories: Array.isArray(successStories) ? successStories.length : 0,
        users: Array.isArray(users) ? users.length : 0,
      };
    },
  });

  const metricCards = metricsQuery.data
    ? [
        { label: 'Pages', value: metricsQuery.data.pages, icon: Layers3 },
        { label: 'Study Destinations', value: metricsQuery.data.destinations, icon: Globe },
        { label: 'Notices', value: metricsQuery.data.notices, icon: Newspaper },
        ...(isSuperAdmin
          ? [{ label: 'Users', value: metricsQuery.data.users, icon: Users }]
          : []),
      ]
    : [];

  return (
    <div className="space-y-6">
      <Card className="page-frame border-none">
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl">Welcome back, {user?.name?.split(' ')[0] ?? 'Admin'}</CardTitle>
          <CardDescription>
            This dashboard is connected to your Medientry backend and ready for content operations, global branding,
            and homepage curation.
          </CardDescription>
        </CardHeader>
      </Card>

      {metricsQuery.isLoading ? (
        <Card>
          <CardContent className="flex min-h-[220px] items-center justify-center">
            <Spinner />
          </CardContent>
        </Card>
      ) : metricsQuery.isError ? (
        <EmptyState title="Could not load dashboard metrics" description={getApiErrorMessage(metricsQuery.error)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => {
            const Icon = metric.icon;

            return (
              <Card key={metric.label}>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick access</CardTitle>
            <CardDescription>Jump into the modules that shape the public Medientry experience.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {quickAccessItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group rounded-2xl border border-border/70 bg-muted/30 p-4 transition hover:border-primary/30 hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="mt-4 font-semibold">{item.label}</p>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {dashboardHighlights.map((highlight) => {
            const Icon = highlight.icon;

            return (
              <Card key={highlight.title}>
                <CardContent className="flex gap-4 p-6">
                  <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">{highlight.title}</h3>
                    <p className="text-sm text-muted-foreground">{highlight.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
