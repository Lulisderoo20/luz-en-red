import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import { useApp } from '@/app/AppContext';
import { AppShell } from '@/components/shell/AppShell';
import { LoadingState } from '@/components/common/Surface';
import {
  AuthCallbackPage,
  LoginPage,
  RecoverPage,
  RegisterPage,
  WelcomePage,
} from '@/features/auth/AuthPages';
import { AdminPage } from '@/features/admin/AdminPage';
import { AgendaPage } from '@/features/agenda/AgendaPage';
import { FeedPage, CreatePostPage, PostDetailPage } from '@/features/feed/FeedPages';
import { CreateGroupPage, GroupDetailPage, GroupsPage } from '@/features/groups/GroupPages';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import {
  EditProfilePage,
  MyProfilePage,
  UserProfilePage,
} from '@/features/profile/ProfilePages';
import { CreatePrayerPage, PrayerRequestsPage } from '@/features/prayers/PrayerPages';
import { SearchPage } from '@/features/search/SearchPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { env } from '@/lib/env';

function BootSplash() {
  return (
    <div className="auth-page">
      <div className="auth-page__backdrop" />
      <div className="boot-splash">
        <span className="auth-hero__eyebrow">Luz en Red</span>
        <h1>Preparando tu comunidad</h1>
        <LoadingState label="Un momento..." />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isBootstrapping } = useApp();

  if (isBootstrapping) {
    return <BootSplash />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { user, isBootstrapping } = useApp();

  if (isBootstrapping) {
    return <BootSplash />;
  }

  if (user?.isOnboardingComplete) {
    return <Navigate to="/app/feed" replace />;
  }

  if (user) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function OnboardingRoute() {
  const { user, isBootstrapping } = useApp();

  if (isBootstrapping) {
    return <BootSplash />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user.isOnboardingComplete) {
    return <Navigate to="/app/feed" replace />;
  }

  return <OnboardingPage />;
}

function RoutedApp() {
  const location = useLocation();
  const { user } = useApp();

  if (user?.isOnboardingComplete && location.pathname === '/') {
    return <Navigate to="/app/feed" replace />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <WelcomePage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/auth/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/auth/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/auth/recover"
        element={
          <PublicOnlyRoute>
            <RecoverPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/onboarding" element={<OnboardingRoute />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/feed" replace />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="feed/new" element={<CreatePostPage />} />
        <Route path="posts/:postId" element={<PostDetailPage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="prayers" element={<PrayerRequestsPage />} />
        <Route path="prayers/new" element={<CreatePrayerPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="groups/new" element={<CreateGroupPage />} />
        <Route path="groups/:slug" element={<GroupDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile/me" element={<MyProfilePage />} />
        <Route path="profile/edit" element={<EditProfilePage />} />
        <Route path="profile/:username" element={<UserProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function AppRouter() {
  const Router = env.routerMode === 'browser' ? BrowserRouter : HashRouter;

  return (
    <Router>
      <RoutedApp />
    </Router>
  );
}
