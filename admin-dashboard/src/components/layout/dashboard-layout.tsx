import { Menu, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { getNavigationItemsForRole } from '../../config/navigation';
import { useAuth } from '../../hooks/use-auth';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

function SidebarContent({
  onNavigate,
  onClose,
  showCloseButton = false,
}: {
  onNavigate?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigationItems = getNavigationItemsForRole(user?.role);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold">Medientry CMS</p>
            <p className="text-xs text-muted-foreground">Admin dashboard</p>
          </div>
        </div>
        {showCloseButton ? (
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close navigation</span>
          </Button>
        ) : null}
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive || location.pathname === item.href
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-border/80 px-4 py-4">
        <div className="mb-3 rounded-2xl bg-secondary/70 p-3">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={logout}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 border-r border-border/70 bg-white/85 backdrop-blur xl:block">
          <SidebarContent />
        </aside>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-40 xl:hidden">
            <div className="absolute inset-0 bg-slate-950/40" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 border-r border-border/70 bg-white shadow-soft">
              <SidebarContent
                onNavigate={() => setSidebarOpen(false)}
                onClose={() => setSidebarOpen(false)}
                showCloseButton
              />
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-white/85 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="xl:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open navigation</span>
                </Button>
                <div>
                  <p className="text-sm font-semibold text-foreground">Content Operations</p>
                  <p className="text-xs text-muted-foreground">Manage Medientry CMS modules and homepage content.</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
