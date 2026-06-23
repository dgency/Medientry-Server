import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  ArrowRight,
  LockKeyhole,
  LogIn,
  Mail,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '../hooks/use-auth';
import { apiClient, extractApiData, getApiErrorMessage } from '../lib/api-client';
import { resolveCmsAssetUrl } from '../lib/media';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

type LoginValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type SiteSettingsBranding = {
  logoLight?: string | null;
  logoDark?: string | null;
  favicon?: string | null;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const brandingQuery = useQuery<SiteSettingsBranding | null>({
    queryKey: ['site-settings', 'branding'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/site-settings');
        return extractApiData<SiteSettingsBranding>(response) ?? null;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      toast.success('Welcome back to Medientry CMS.');
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  const siteLogoUrl =
    resolveCmsAssetUrl(brandingQuery.data?.logoLight) ||
    resolveCmsAssetUrl(brandingQuery.data?.logoDark) ||
    resolveCmsAssetUrl(brandingQuery.data?.favicon) ||
    '';
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const logoSrc = failedLogoUrl === siteLogoUrl ? '' : siteLogoUrl;
  const showLogo = Boolean(logoSrc);

  useEffect(() => {
    const faviconUrl = resolveCmsAssetUrl(brandingQuery.data?.favicon);

    if (!faviconUrl) {
      return;
    }

    let faviconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");

    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }

    faviconLink.href = faviconUrl;
  }, [brandingQuery.data?.favicon]);

  return (
    <div className="login-shell relative min-h-screen overflow-hidden">
      <div className="login-ambient-grid absolute inset-0 opacity-40" />
      <motion.div
        aria-hidden="true"
        className="login-orb login-orb-cyan"
        animate={{ x: [0, 16, -10, 0], y: [0, -14, 8, 0], scale: [1, 1.05, 0.98, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="login-orb login-orb-blue"
        animate={{ x: [0, -14, 10, 0], y: [0, 14, -18, 0], scale: [1, 0.96, 1.04, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          className="relative w-full max-w-md"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="login-glass-card border-none">
            <CardHeader className="space-y-5 p-7 text-center sm:p-8">
              {showLogo && logoSrc ? (
                <div className="mx-auto flex h-16 max-w-[12rem] items-center justify-center rounded-[1.35rem] px-4">
                  <img
                    src={logoSrc}
                    alt="Site logo"
                    className="max-h-16 w-auto max-w-full object-contain"
                    onError={() => {
                      setFailedLogoUrl(siteLogoUrl || null);
                    }}
                  />
                </div>
              ) : (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(8,47,73,0.96),rgba(14,116,144,0.92))] text-white shadow-[0_18px_40px_-18px_rgba(6,182,212,0.35)]">
                  <LogIn className="h-6 w-6" />
                </div>
              )}
              <div className="space-y-3">
                <span className="login-brand-badge login-brand-badge-light">Medientry CMS</span>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                    Welcome To
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-slate-500">
                    Admin Portal
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-7 pt-0 sm:p-8 sm:pt-0">
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      className="login-input pl-11"
                      {...register('email', { required: 'Email is required.' })}
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Password"
                      className="login-input pl-11"
                      {...register('password', { required: 'Password is required.' })}
                    />
                  </div>
                  {errors.password ? (
                    <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
                  ) : null}
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm font-medium text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-cyan-700"
                    {...register('rememberMe')}
                  />
                  Keep me signed in on this device
                </label>

                <Button
                  type="submit"
                  size="lg"
                  className="login-submit w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <motion.span
                        className="inline-flex h-4 w-4 rounded-full border-2 border-white/35 border-t-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                      Sign In
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-[18px] w-[18px]" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
