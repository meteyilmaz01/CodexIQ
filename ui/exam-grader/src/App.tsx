import { ConfigProvider, theme as antTheme } from "antd";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./store/useAppStore";
import Login from "./auth/Login";
import LandingPage from "./pages/public/LandingPage";

// Student
import StudentLayout from "./pages/student/StudentLayout";
import Dashboard from "./pages/student/Dashboard";
import ExamResults from "./pages/student/ExamResults";
import ExamResultDetail from "./pages/student/ExamResultDetail";
import CodeTest from "./pages/student/CodeTest";
import Messages from "./pages/student/Messages";
import Profile from "./pages/student/Profile";

// Teacher
import TeacherLayout from "./pages/teacher/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ExamUpload from "./pages/teacher/ExamUpload";
import TeacherResults from "./pages/teacher/TeacherResults";
import TeacherResultDetail from "./pages/teacher/TeacherResultDetail";
import StudentList from "./pages/teacher/StudentList";
import TeacherMessages from "./pages/teacher/TeacherMessages";
import TeacherProfile from "./pages/teacher/TeacherProfile";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import Announcements from "./pages/admin/Announcements";
import ClassManagement from "./pages/admin/ClassManagement";
import SystemLogs from "./pages/admin/SystemLogs";
import ApiCosts from "./pages/admin/ApiCosts";
import QueueMonitor from "./pages/admin/QueueMonitor";

function App() {
  const currentTheme = useAppStore((state) => state.theme);

  return (
    <ConfigProvider
      theme={{
        algorithm:
          currentTheme === "dark"
            ? antTheme.darkAlgorithm
            : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#00e5ff",
          borderRadius: 10,
          fontFamily: "'DM Sans', sans-serif",
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Student Routes */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="results" element={<ExamResults />} />
            <Route path="results/:id" element={<ExamResultDetail />} />
            <Route path="code-test" element={<CodeTest />} />
            <Route path="messages" element={<Messages />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Teacher Routes */}
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="upload" element={<ExamUpload />} />
            <Route path="results" element={<TeacherResults />} />
            <Route path="results/:id" element={<TeacherResultDetail />} />
            <Route path="students" element={<StudentList />} />
            <Route path="messages" element={<TeacherMessages />} />
            <Route path="profile" element={<TeacherProfile />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="classes" element={<ClassManagement />} />
            <Route path="logs" element={<SystemLogs />} />
            <Route path="api-costs" element={<ApiCosts />} />
            <Route path="queue" element={<QueueMonitor />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
