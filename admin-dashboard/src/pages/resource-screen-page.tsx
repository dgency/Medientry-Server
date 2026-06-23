import { Navigate, useParams } from 'react-router-dom';

import { ResourcePage } from '../components/cms/resource-page';
import { resourceConfigs } from '../config/resource-configs';
import { useAuth } from '../hooks/use-auth';

export function ResourceScreenPage() {
  const { resourceKey = '' } = useParams();
  const { user } = useAuth();
  const config = resourceConfigs[resourceKey];

  if (!config) {
    return <Navigate to="/" replace />;
  }

  if (resourceKey === 'users' && user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <ResourcePage config={config} />;
}
