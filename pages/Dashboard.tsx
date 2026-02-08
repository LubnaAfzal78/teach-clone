import React, { useEffect, useState } from 'react';
import { UserType, AIPersonality } from '../types';
import { useAuth } from '../context/AuthContext';
import { getTeacherVideos } from '../services/videoService';
import { getAdminStats } from '../services/adminService';
import { getApprovedPersonalities } from '../services/chatService';
import TeacherSidebar from '../components/TeacherSidebar';
import StudentSidebar from '../components/StudentSidebar';
import Button from '../components/Button';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Upload, 
  BookOpen, 
  Settings, 
  PlayCircle, 
  BarChart3, 
  Video, 
  Bot, 
  Users,
  MessageCircle,
  Clock
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [videoCount, setVideoCount] = useState(0);
  const [availablePersonalities, setAvailablePersonalities] = useState<(AIPersonality & { teacherName: string })[]>([]);
  
  useEffect(() => {
    if (user) {
      if (user.userType === UserType.TEACHER) {
        const videos = getTeacherVideos(user.userId);
        setVideoCount(videos.length);
      } else if (user.userType === UserType.STUDENT) {
        setAvailablePersonalities(getApprovedPersonalities());
      } else if (user.userType === UserType.ADMIN) {
        // Auto-redirect admin to their specific dashboard
        navigate('/admin/dashboard');
      }
    }
  }, [user, navigate]);

  if (!user) return null;

  // --- TEACHER DASHBOARD ---
  if (user.userType === UserType.TEACHER) {
    return (
      <TeacherSidebar>
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {user.fullName.split(' ')[0]}
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Manage your teaching videos and AI personality
          </p>
        </header>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Videos Uploaded */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-6 transition-transform hover:-translate-y-1">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <Video className="w-8 h-8" />
            </div>
            <div>
              <div className="text-4xl font-bold text-[#4A90E2]">{videoCount}</div>
              <div className="text-gray-500 font-medium">Videos Uploaded</div>
            </div>
          </div>

          {/* Card 2: Students Learning */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-6 transition-transform hover:-translate-y-1">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <div className="text-4xl font-bold text-[#4A90E2]">0</div>
              <div className="text-gray-500 font-medium">Students Learning</div>
            </div>
          </div>

          {/* Card 3: AI Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-6 transition-transform hover:-translate-y-1">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">Pending</div>
              <div className="text-gray-500 font-medium">AI Status</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => navigate('/upload-video')}
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group text-left flex items-start justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-blue-600 mb-2 group-hover:underline">Upload New Video</h3>
                <p className="text-gray-500 text-sm">Add more content to train your AI clone.</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Upload className="w-6 h-6" />
              </div>
            </button>

            <button 
              onClick={() => navigate('/ai-personality')}
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group text-left flex items-start justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-purple-600 mb-2 group-hover:underline">View AI Personality</h3>
                <p className="text-gray-500 text-sm">Check how your clone interacts with students.</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Bot className="w-6 h-6" />
              </div>
            </button>
          </div>
        </div>
      </TeacherSidebar>
    );
  }

  // --- STUDENT DASHBOARD ---
  if (user.userType === UserType.STUDENT) {
    return (
      <StudentSidebar>
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Start Learning
          </h1>
          <p className="text-gray-500 mt-2">
            Choose an AI teacher below to start a conversation.
          </p>
        </header>

        {availablePersonalities.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Bot className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Teachers Available Yet</h3>
            <p className="text-gray-500">
              Check back later! Teachers are currently training their AI clones.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {availablePersonalities.map(p => (
               <div key={p.personalityId} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full">
                 <div className="p-6 flex-1">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                       {p.teacherName.charAt(0)}
                     </div>
                     <div>
                       <h3 className="font-bold text-gray-800">{p.personalityName}</h3>
                       <p className="text-sm text-gray-500">{p.teacherName}</p>
                     </div>
                   </div>
                   <p className="text-sm text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                     "I am ready to help you learn!"
                   </p>
                 </div>
                 <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                   <button 
                    onClick={() => navigate(`/student/chat/${p.personalityId}`)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-green-500/20 shadow-lg"
                   >
                     <MessageCircle className="w-5 h-5" /> Start Chat
                   </button>
                 </div>
               </div>
             ))}
          </div>
        )}
      </StudentSidebar>
    );
  }

  // --- ADMIN REDIRECT LOADING STATE ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  );
};

export default Dashboard;