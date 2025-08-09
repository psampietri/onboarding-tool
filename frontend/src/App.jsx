import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import AdminDashboard from './pages/admin/Dashboard';
import UserDashboard from './pages/user/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageTemplates from './pages/admin/ManageTemplates';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="templates" element={<ManageTemplates />} />
        </Route>

        <Route path="/" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
