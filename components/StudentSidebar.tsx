import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  LogOut, 
  Menu, 
  X,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StudentSidebarProps {
  children: React.ReactNode;
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({ children }) => {
  const { logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Browse Teachers', icon: LayoutDashboard, path: '/dashboard' },
    // In a full app, we'd have a separate page for chat history
    // { label: 'My Chats', icon: MessageSquare, path: '/my-chats' }, 
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-green-500 to-teal-600 p-4 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 font-bold text-lg">
          <GraduationCap className="w-6 h-6" /> Student Portal
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} md:block
        w-full md:w-[250px] 
        bg-gradient-to-b from-green-500 to-teal-600
        text-white 
        flex flex-col 
        md:h-screen md:fixed md:left-0 md:top-0 md:z-20
        shadow-xl transition-all
      `}>
        <div className="p-6 hidden md:block border-b border-white/10">
          <h1 className="text-2xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <GraduationCap className="w-8 h-8" />
            <span>Teach Clone</span>
          </h1>
          <p className="text-green-100 text-xs mt-1 tracking-wider uppercase opacity-80">Student Access</p>
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
                    ? 'bg-white text-green-600 font-bold shadow-lg transform translate-x-1' 
                    : 'text-green-50 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-green-600' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10">
          <button 
            onClick={logoutUser}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-green-100 hover:bg-red-700/50 hover:text-white transition-colors text-left"
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

export default StudentSidebar;