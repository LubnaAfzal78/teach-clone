import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, DashboardStats, getTeachers, updateTeacherStatus } from '../services/adminService';
import { User, UserStatus, UserType } from '../types';
import AdminSidebar from '../components/AdminSidebar';
import { UserCog, Users, Bot, CheckCircle2, Clock } from 'lucide-react';
import Card from '../components/Card';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTeachers, setRecentTeachers] = useState<User[]>([]);

  useEffect(() => {
    // Check if admin
    if (user && user.userType !== UserType.ADMIN) {
      navigate('/dashboard');
      return;
    }

    const loadData = () => {
      setStats(getAdminStats());
      const allTeachers = getTeachers();
      setRecentTeachers(allTeachers.slice(0, 5)); // Get last 5
    };

    loadData();
  }, [user, navigate]);

  const handleQuickApprove = async (teacherId: number) => {
    if (window.confirm("Approve this teacher?")) {
      await updateTeacherStatus(teacherId, UserStatus.APPROVED);
      // Refresh data
      setStats(getAdminStats());
      setRecentTeachers(getTeachers().slice(0, 5));
    }
  };

  if (!stats) return null;

  return (
    <AdminSidebar>
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 mt-2">Overview of platform activity and pending items.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-full">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{stats.pendingTeachers}</div>
            <div className="text-sm text-gray-500">Pending Teachers</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-purple-100 text-purple-600 rounded-full">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{stats.pendingPersonalities}</div>
            <div className="text-sm text-gray-500">Pending Personalities</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-full">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{stats.approvedTeachers}</div>
            <div className="text-sm text-gray-500">Active Teachers</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalStudents}</div>
            <div className="text-sm text-gray-500">Total Students</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <Card title="Recent Teacher Registrations">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-sm">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentTeachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">No teachers found.</td>
                </tr>
              ) : (
                recentTeachers.map(t => (
                  <tr key={t.userId} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-medium text-gray-800">{t.fullName}</td>
                    <td className="py-4 text-gray-600 text-sm">{t.email}</td>
                    <td className="py-4">
                      {t.status === UserStatus.PENDING ? (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">Pending</span>
                      ) : t.status === UserStatus.APPROVED ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Approved</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">Rejected</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {t.status === UserStatus.PENDING && (
                        <button 
                          type="button"
                          onClick={() => handleQuickApprove(t.userId)}
                          className="text-xs bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600 transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
          <button 
            type="button"
            onClick={() => navigate('/admin/teachers')}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
          >
            View All Teachers →
          </button>
        </div>
      </Card>
    </AdminSidebar>
  );
};

export default AdminDashboard;