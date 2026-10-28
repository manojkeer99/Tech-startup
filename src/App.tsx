import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-toggle';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/toast';
import { Navbar } from '@/components/chrome/navbar';
import { Footer } from '@/components/chrome/footer';
import { TaglineStrip } from '@/components/chrome/tagline-strip';

// Pages
import { HomePage } from '@/pages/home';
import { ServicesPage } from '@/pages/services';
import { ServiceDetailPage } from '@/pages/service-detail';
import { ProjectIntakePage } from '@/pages/project-intake';
import { ContactPage } from '@/pages/contact';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';
import { ForgotPasswordPage } from '@/pages/forgot-password';
import { ResetPasswordPage } from '@/pages/reset-password';
import { DashboardPage } from '@/pages/dashboard';
import { AdminPage } from '@/pages/admin';
import { ReferAndEarnPage } from '@/pages/refer-and-earn';
import { trackReferralCode } from '@/lib/admin-api';
import { store } from '@/lib/store';

export default function App() {
  useEffect(() => {
    store.checkSession().catch(() => {});
  }, []);
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Preserve referral attribution on the server when a visitor arrives through any URL with ?ref=CODE
  const refParam = searchParams.get('ref');
  useEffect(() => {
    if (!refParam) return;
    const clean = refParam.trim().toUpperCase();
    if (/^TCR-[A-Z0-9]{4,16}$/.test(clean)) {
      trackReferralCode(clean).catch(() => {});
    }
  }, [refParam]);

  const navigate = (pathWithSearch: string) => {
    const [path, search] = pathWithSearch.split('?');
    setCurrentPath(path);
    const newParams = new URLSearchParams(search || '');
    setSearchParams(newParams);

    try {
      window.history.pushState({}, '', pathWithSearch);
    } catch {
      // Ignore
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route matching
  const isDashboard = currentPath.startsWith('/dashboard');
  const isAdmin = currentPath.startsWith('/admin') && currentPath !== '/admin/login';
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/admin/login'].includes(currentPath);
  const showChrome = !isDashboard && !isAdmin;
  const showTagline = showChrome && !isAuthPage;

  const renderContent = () => {
    // 1. Service Detail (/services/:slug)
    if (currentPath.startsWith('/services/')) {
      const slug = currentPath.replace('/services/', '').replace(/\/$/, '');
      return <ServiceDetailPage slug={slug} navigate={navigate} />;
    }

    // 2. Services Lineup (/services)
    if (currentPath === '/services') {
      return <ServicesPage navigate={navigate} />;
    }

    // 2b. Direct Process section route (/process)
    if (currentPath === '/process') {
      return <HomePage navigate={navigate} initialSection="process" />;
    }

    // 2c. Direct Community section route (/community)
    if (currentPath === '/community') {
      return <HomePage navigate={navigate} initialSection="community" />;
    }

    // 3. Project Intake (/project)
    if (currentPath === '/project') {
      const initialService = searchParams.get('service') || undefined;
      return <ProjectIntakePage initialService={initialService} navigate={navigate} />;
    }

    // 3b. Refer & Earn (/refer-and-earn)
    if (currentPath === '/refer-and-earn') {
      return <ReferAndEarnPage navigate={navigate} incomingRefCode={refParam || undefined} />;
    }

    // 4. Contact (/contact)
    if (currentPath === '/contact') {
      return <ContactPage navigate={navigate} />;
    }

    // 5. Auth
    if (currentPath === '/login') {
      return <LoginPage navigate={navigate} />;
    }
    if (currentPath === '/admin/login') {
      return <LoginPage navigate={navigate} isAdminLogin />;
    }
    if (currentPath === '/register') {
      return <RegisterPage navigate={navigate} />;
    }
    if (currentPath === '/forgot-password') {
      return <ForgotPasswordPage navigate={navigate} />;
    }
    if (currentPath === '/reset-password') {
      const token = searchParams.get('token') || undefined;
      return <ResetPasswordPage tokenFromQuery={token} navigate={navigate} />;
    }

    // 6. Dashboard (/dashboard)
    if (currentPath === '/dashboard') {
      const tab = searchParams.get('tab') || 'overview';
      return <DashboardPage navigate={navigate} initialTab={tab} />;
    }

    // 7. Admin (/admin)
    if (currentPath === '/admin') {
      const tab = searchParams.get('tab') || 'overview';
      return <AdminPage navigate={navigate} initialTab={tab} />;
    }

    // Default: Home Page (/)
    return <HomePage navigate={navigate} />;
  };

  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <div className="relative min-h-screen bg-[var(--color-void)] text-[var(--color-ink)] selection:bg-violet-500/30 selection:text-white overflow-x-clip">
            <div className="noise-overlay" aria-hidden="true" />
            {showChrome && <Navbar currentPath={currentPath} navigate={navigate} />}
            <main className={`overflow-x-clip ${showChrome ? 'pt-16' : ''}`}>
              {showTagline && <TaglineStrip />}
              {renderContent()}
            </main>
            {showChrome && <Footer navigate={navigate} />}
          </div>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
