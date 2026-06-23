import type { LucideIcon } from 'lucide-react';
import {
  BookOpenText,
  FileText,
  GalleryVerticalEnd,
  Globe2,
  GraduationCap,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  MapPinned,
  Newspaper,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { AuthUser } from '../types/app';

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: AuthUser['role'][];
};

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Site Settings', href: '/site-settings', icon: Settings2 },
  { label: 'Pages', href: '/pages', icon: FileText },
  { label: 'Study Destinations', href: '/study-destinations', icon: Globe2 },
  { label: 'Medical Colleges', href: '/medical-colleges', icon: GraduationCap },
  { label: 'Gallery', href: '/gallery', icon: ImageIcon },
  { label: 'Reels Videos', href: '/home-reels', icon: GalleryVerticalEnd },
  { label: 'Knowledge Hub / Blogs', href: '/blogs', icon: BookOpenText },
  { label: 'Notices & Downloads', href: '/notices', icon: Newspaper },
  { label: 'College Fee Inquiries', href: '/college-fee-inquiries', icon: FileText },
  { label: 'Success Stories', href: '/success-stories', icon: MapPinned },
  { label: 'Home Sections', href: '/home-sections', icon: Home },
  { label: 'Users', href: '/users', icon: Users, roles: ['SUPER_ADMIN'] },
];

export const getNavigationItemsForRole = (role?: AuthUser['role']) =>
  navigationItems.filter((item) => !item.roles || (role ? item.roles.includes(role) : false));

export const dashboardHighlights = [
  {
    title: 'Content-led CMS',
    description: 'Manage dynamic pages, destinations, colleges, notices, and homepage sections from one place.',
    icon: GalleryVerticalEnd,
  },
  {
    title: 'Protected operations',
    description: 'JWT-backed admin access with role-aware profile handling and secure request interceptors.',
    icon: ShieldCheck,
  },
];
