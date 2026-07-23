import { Navigate, useParams } from 'react-router-dom';

import { ResourcePage } from '../components/cms/resource-page';
import { resourceConfigs } from '../config/resource-configs';
import { useAuth } from '../hooks/use-auth';

type ResourceScreenPageProps = {
  configKey?: string;
};

export function ResourceScreenPage({ configKey }: ResourceScreenPageProps = {}) {
  const { resourceKey = '' } = useParams();
  const { user } = useAuth();
  const resolvedResourceKey = configKey ?? resourceKey;
  const config = resourceConfigs[resolvedResourceKey];

  if (!config) {
    return <Navigate to="/" replace />;
  }

  if (resolvedResourceKey === 'users' && user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <ResourcePage config={config} />;
}
