import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import RedeemPage from "@/pages/RedeemPage";
import { AuthProvider } from "@/admin/auth";
import AdminLayout from "@/admin/layout/AdminLayout";
import LoginPage from "@/admin/pages/LoginPage";
import DashboardPage from "@/admin/pages/DashboardPage";
import BatchesPage from "@/admin/pages/BatchesPage";
import CodesPage from "@/admin/pages/CodesPage";
import RemedyPage from "@/admin/pages/RemedyPage";
import LogsPage from "@/admin/pages/LogsPage";

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* 兑换前台 */}
            <Route path="/" element={<RedeemPage />} />

            {/* 管理后台 */}
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="batches" element={<BatchesPage />} />
              <Route path="codes" element={<CodesPage />} />
              <Route path="remedy" element={<RemedyPage />} />
              <Route path="logs" element={<LogsPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}
