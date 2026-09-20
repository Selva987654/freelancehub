import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import { RequireAuth } from './routes/ProtectedRoute';

import Home from './pages/Home';
import NeedSomething from './pages/NeedSomething';
import Discover from './pages/Discover';
import ProviderProfile from './pages/ProviderProfile';
import ServiceDetail from './pages/ServiceDetail';
import RequestDetail from './pages/RequestDetail';
import NotSure from './pages/NotSure';
import Business from './pages/Business';
import Students from './pages/Students';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Messages from './pages/Messages';
import ProjectWorkspace from './pages/ProjectWorkspace';

import DashboardHome from './pages/dashboard/DashboardHome';
import MyRequests from './pages/dashboard/MyRequests';
import OffersReceived from './pages/dashboard/OffersReceived';
import MyProjects from './pages/dashboard/MyProjects';
import Saved from './pages/dashboard/Saved';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import ProfileEdit from './pages/dashboard/ProfileEdit';
import Recommended from './pages/dashboard/Recommended';
import MyOffers from './pages/dashboard/MyOffers';
import MyServices from './pages/dashboard/MyServices';
import MyPortfolio from './pages/dashboard/MyPortfolio';

import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRequests from './pages/admin/AdminRequests';
import AdminOffers from './pages/admin/AdminOffers';
import AdminProjects from './pages/admin/AdminProjects';
import AdminServices from './pages/admin/AdminServices';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCategories from './pages/admin/AdminCategories';
import AdminReports from './pages/admin/AdminReports';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/need-something" element={<RequireAuth roles={['client']}><NeedSomething /></RequireAuth>} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/providers/:id" element={<ProviderProfile />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route path="/not-sure" element={<NotSure />} />
        <Route path="/business" element={<Business />} />
        <Route path="/students" element={<Students />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/projects/:id" element={<RequireAuth><ProjectWorkspace /></RequireAuth>} />
      </Route>

      <Route element={<RequireAuth roles={['client', 'provider']}><DashboardLayout /></RequireAuth>}>
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/dashboard/requests" element={<MyRequests />} />
        <Route path="/dashboard/offers" element={<OffersReceived />} />
        <Route path="/dashboard/projects" element={<MyProjects />} />
        <Route path="/dashboard/saved" element={<Saved />} />
        <Route path="/dashboard/notifications" element={<NotificationsPage />} />
        <Route path="/dashboard/profile" element={<ProfileEdit />} />
        <Route path="/dashboard/recommended" element={<Recommended />} />
        <Route path="/dashboard/my-offers" element={<MyOffers />} />
        <Route path="/dashboard/services" element={<MyServices />} />
        <Route path="/dashboard/portfolio" element={<MyPortfolio />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:id" element={<Messages />} />
      </Route>

      <Route element={<RequireAuth roles={['admin']}><AdminLayout /></RequireAuth>}>
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/requests" element={<AdminRequests />} />
        <Route path="/admin/offers" element={<AdminOffers />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/services" element={<AdminServices />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/reports" element={<AdminReports />} />
      </Route>

      <Route path="*" element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
