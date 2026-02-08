import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  UserCog
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminSidebarProps {
  children: React.ReactNode;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ children }) => {
  const { logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Teachers', icon: Users, path: '/admin/teachers' },
    { label: 'Personalities', icon: Bot, path: '/admin/personalities' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div 
        className="md:hidden p-4 text-white flex justify-between items-center shadow-md"
        style={{ background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }}
      >
        <div className="flex items-center gap-2 font-bold text-lg">
          <UserCog className="w-6 h-6" /> Admin Panel
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} md:block
        w-full md:w-[250px] 
        text-white 
        flex flex-col 
        md:h-screen md:fixed md:left-0 md:top-0 md:z-20
        shadow-xl transition-all
      `}
      style={{ background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }}
      >
        <div className="p-6 hidden md:block border-b border-white/10">
          <h1 className="text-2xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
            <UserCog className="w-8 h-8" />
            <span>Admin</span>
          </h1>
          <p className="text-white text-xs mt-1 tracking-wider uppercase opacity-80">Control Center</p>
        </div>

        <nav className="flex-1 px-4 py-4 md:py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left
                  ${isActive
                    ? 'bg-white/20 text-white font-bold shadow-lg' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10">
          <button 
            onClick={logoutUser}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:bg-red-700/50 hover:text-white transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[250px] p-6 md:p-10 bg-[#f5f5f5]">
        {children}
      </main>
    </div>
  );
};

export default AdminSidebar;