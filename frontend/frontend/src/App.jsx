import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import SendNotification from "./pages/SendNotification/SendNotification";
import StudentRegister from './pages/StudentRegister/StudentRegister.jsx'
import StudentLogin from './pages/StudentLogin/StudentLogin.jsx'
import AdminLogin from './pages/AdminLogin/AdminLogin.jsx'
import LoginChoice from './pages/LoginChoice/LoginChoice.jsx'
import StudentDashboard from './pages/StudentDashboard/StudentDashboard.jsx'
import StudentProfile from './pages/StudentProfile/StudentProfile.jsx'
import AdminDashboard from './pages/AdminDashboard/AdminDashboard.jsx'
import ManageAdmins from './pages/ManageAdmins/ManageAdmins.jsx'
import SetPassword from './pages/SetPassword/SetPassword.jsx'
import ManageOpportunities from './pages/ManageOpportunities/ManageOpportunities.jsx'
import ApplicantsView from './pages/ApplicantsView/ApplicantsView.jsx'
import CompanySearch from "./pages/CompanySearch/CompanySearch";
import CompanyProfile from "./pages/CompanyProfile/CompanyProfile";
import ManageCompanies from "./pages/ManageCompanies/ManageCompanies";
import PlacementRecords from "./pages/PlacementRecords/PlacementRecords";
import StudentSearch from "./pages/StudentSearch/StudentSearch";
import ResumeReminder from "./pages/ResumeReminder/ResumeReminder";
import CgpaUpload from "./pages/CgpaUpload/CgpaUpload";
import NotificationHistory from "./pages/NotificationHistory/NotificationHistory";
import StudentDetails from './pages/StudentDetails/StudentDetails.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginChoice />} />
          <Route path="/register/student" element={<StudentRegister />} />
          <Route path="/login/student" element={<StudentLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Public — reached only via the invitation email link, never
              from anywhere in the app's own navigation. */}
          <Route path="/admin/set-password" element={<SetPassword />} />

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-admins"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <ManageAdmins />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/opportunities"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <ManageOpportunities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/opportunities/:type/:id/applicants"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <ApplicantsView />
              </ProtectedRoute>
            }
          />
          <Route
  path="/admin/notification-history"
  element={
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <NotificationHistory />
    </ProtectedRoute>
  }
/>

          <Route
  path="/admin/notifications"
  element={
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <SendNotification />
    </ProtectedRoute>
  }
/>
          <Route
  path="/company-search"
  element={
    <ProtectedRoute allowedRoles={["student", "admin", "super_admin"]}>
      <CompanySearch />
    </ProtectedRoute>
  }
/>
<Route
  path="/company/:companyId"
  element={
    <ProtectedRoute allowedRoles={["student", "admin", "super_admin"]}>
      <CompanyProfile />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/companies"
  element={
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <ManageCompanies />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/placement-records"
  element={
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <PlacementRecords />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/students"
  element={
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <StudentSearch />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/resume-reminders"
  element={
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <ResumeReminder />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/cgpa-upload"
  element={
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <CgpaUpload />
    </ProtectedRoute>
  }
/>
<Route
  path="/student/details"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDetails />
    </ProtectedRoute>
  }
/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App