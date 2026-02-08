import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPersonalityByTeacherId } from '../services/videoService';
import { AIPersonality, PersonalityStatus } from '../types';
import TeacherSidebar from '../components/TeacherSidebar';
import Button from '../components/Button';
import Card from '../components/Card';
import { Bot, AlertCircle, Clock, CheckCircle2, XCircle, FileText, RefreshCw } from 'lucide-react';

const AIPersonalityPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [personality, setPersonality] = useState<AIPersonality | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const loadPersonality = () => {
    setLoading(true);
    if (user) {
      console.log(`[AIPersonalityPage] Loading for user ${user.userId}`);
      const p = getPersonalityByTeacherId(user.userId);
      console.log(`[AIPersonalityPage] Found:`, p);
      setPersonality(p);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonality();
  }, [user]);

  if (!user) return null;

  const getStatusBadge = (status: PersonalityStatus) => {
    switch (status) {
      case PersonalityStatus.APPROVED:
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="w-4 h-4" /> Approved
          </span>
        );
      case PersonalityStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700">
            <XCircle className="w-4 h-4" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
            <Clock className="w-4 h-4" /> Pending Approval
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <TeacherSidebar>
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            🤖 My AI Teaching Personality
          </h1>
          <p className="text-gray-500 mt-2">
            Review the system prompt that powers your AI clone.
          </p>
        </div>
        <button 
          onClick={loadPersonality}
          className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 text-gray-500 transition-colors shadow-sm"
          title="Refresh Data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : personality ? (
        <div className="max-w-4xl space-y-6 animate-fade-in">
          <Card className="border border-gray-100 shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{personality.personalityName}</h2>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Generated on {formatDate(personality.createdAt)}
                </p>
              </div>
              <div>
                {getStatusBadge(personality.approvalStatus)}
              </div>
            </div>

            {personality.approvalStatus === PersonalityStatus.REJECTED && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
                <h3 className="text-red-800 font-semibold mb-1 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Admin Feedback
                </h3>
                <p className="text-red-700">{personality.adminFeedback || 'No feedback provided.'}</p>
              </div>
            )}

            {personality.approvalStatus === PersonalityStatus.APPROVED && (
               <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="w-5 h-5" />
                  Your AI personality is active and available to students!
               </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" /> System Prompt
              </h3>
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 overflow-x-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                  {personality.systemPrompt}
                </pre>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-right">
                ID: {personality.personalityId} | Teacher ID: {personality.teacherId}
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <Bot className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No AI Personality Generated Yet</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            You need to upload and analyze a teaching video first. The AI will learn your style from the analysis.
          </p>
          <Button 
            variant="teacher" 
            className="w-auto px-8 mx-auto"
            onClick={() => navigate('/my-videos')}
          >
            Go to My Videos
          </Button>
          <div className="mt-4 text-xs text-gray-400">
            Debug: User ID {user.userId}
          </div>
        </div>
      )}
    </TeacherSidebar>
  );
};

export default AIPersonalityPage;