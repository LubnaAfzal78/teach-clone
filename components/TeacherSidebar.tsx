import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  Video, 
  Bot, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TeacherSidebarProps {
  children: React.ReactNode;
}

const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ children }) => {
  const { logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Upload Video', icon: Upload, path: '/upload-video' },
    { label: 'My Videos', icon: Video, path: '/my-videos' },
    { label: 'My AI Personality', icon: Bot, path: '/ai-personality' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-[#667eea] to-[#764ba2] p-4 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span>🎓</span> Teach Clone
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} md:block
        w-full md:w-[250px] 
        bg-gradient-to-b from-[#667eea] to-[#764ba2] 
        text-white 
        flex flex-col 
        md:h-screen md:fixed md:left-0 md:top-0 md:z-20
        shadow-xl transition-all
      `}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span>🎓</span> Teach Clone
          </h1>
          <p className="text-purple-200 text-xs mt-1 tracking-wider uppercase">Teacher Portal</p>
        </div>

        <nav className="flex-1 px-4 py-4 md:py-0 space-y-2">
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
                    ? 'bg-white/20 text-white font-semibold shadow-inner' 
                    : 'text-purple-100 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={logoutUser}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-red-500/20 hover:text-white transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[250px] p-6 md:p-10">
        {children}
      </main>
    </div>
  );
};

export default TeacherSidebar;