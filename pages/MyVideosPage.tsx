import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getTeacherVideos, performVideoAnalysis, generatePersonality, getPersonalityByTeacherId, getBlobFromDB } from '../services/videoService';
import { Video as VideoModel, VideoStatus } from '../types';
import TeacherSidebar from '../components/TeacherSidebar';
import Button from '../components/Button';
import { Plus, Clock, Sparkles, AlertCircle, CheckCircle2, Video, RefreshCw, Search } from 'lucide-react';

const MyVideosPage: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoModel[]>([]);
  const [videoUrls, setVideoUrls] = useState<{[key: number]: string}>({}); // Store blob URLs
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [hasPersonality, setHasPersonality] = useState(false);

  const fetchVideos = async () => {
    if (user) {
      const fetchedVideos = getTeacherVideos(user.userId);
      fetchedVideos.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setVideos(fetchedVideos);
      
      // Load Blobs for playback
      const urls: {[key: number]: string} = {};
      for (const v of fetchedVideos) {
        if (v.filePath.startsWith('local_blob:')) {
            const blob = await getBlobFromDB(v.videoId);
            if (blob) {
                urls[v.videoId] = URL.createObjectURL(blob);
            }
        }
      }
      setVideoUrls(urls);

      const personality = getPersonalityByTeacherId(user.userId);
      setHasPersonality(!!personality);
      
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    
    // Cleanup URLs on unmount to prevent memory leaks
    return () => {
        Object.values(videoUrls).forEach(url => URL.revokeObjectURL(url as string));
    };
  }, [user]);

  const handleAnalyze = async (videoId: number) => {
    setProcessingIds(prev => [...prev, videoId]);
    showNotification('info', 'Analysis started. This may take a moment...');
    
    try {
        const result = await performVideoAnalysis(videoId);
        if (result.success) {
            showNotification('success', 'Analysis complete! AI has learned your style.');
            fetchVideos();
        } else {
            showNotification('error', `Analysis Failed: ${result.message}`);
            fetchVideos();
        }
    } catch (e) {
        showNotification('error', 'An unexpected error occurred during analysis.');
    } finally {
        setProcessingIds(prev => prev.filter(id => id !== videoId));
    }
  };

  const handleGeneratePersonality = async (videoId: number) => {
    setProcessingIds(prev => [...prev, videoId]); 

    try {
      console.log(`[MyVideosPage] Generating personality for video ${videoId}`);
      const result = await generatePersonality(videoId);
      
      if (result.success) {
        showNotification('success', 'Personality generated successfully!');
        setTimeout(() => {
            navigate('/ai-personality');
        }, 800);
      } else {
        showNotification('error', `Generation Failed: ${result.message}`);
      }
    } catch (error) {
      console.error(error);
      showNotification('error', "An unexpected error occurred.");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== videoId));
    }
  };

  if (!user) return null;

  const getStatusBadge = (status: VideoStatus) => {
    switch (status) {
      case VideoStatus.ANALYZED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Analyzed
          </span>
        );
      case VideoStatus.PROCESSING:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Processing
          </span>
        );
      case VideoStatus.FAILED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default: // UPLOADED
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
          </span>
        );
    }
  };

  return (
    <TeacherSidebar>
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            📚 My Teaching Videos
          </h1>
          <p className="text-gray-500 mt-2">
            Manage and analyze your uploaded content.
          </p>
        </div>
        <div>
          <Button 
            variant="teacher" 
            className="w-auto px-6"
            onClick={() => navigate('/upload-video')}
          >
            <Plus className="w-5 h-5" /> Upload New
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <Video className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No videos uploaded yet</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Upload your first lecture video to start training your AI clone.
          </p>
          <Button 
            variant="teacher" 
            className="w-auto px-8 mx-auto"
            onClick={() => navigate('/upload-video')}
          >
            Upload your first video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const isProcessing = processingIds.includes(video.videoId) || video.uploadStatus === VideoStatus.PROCESSING;
            const canGenerate = video.uploadStatus === VideoStatus.ANALYZED && !isProcessing;
            const videoUrl = videoUrls[video.videoId];

            return (
              <div key={video.videoId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="aspect-video bg-gray-900 relative group">
                  {videoUrl ? (
                    <video 
                      controls 
                      className="w-full h-full object-cover"
                      src={videoUrl}
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white bg-gray-800">
                        <div className="text-center">
                            <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs text-gray-400">Video not available</p>
                        </div>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-3 flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 line-clamp-2" title={video.title}>
                      {video.title}
                    </h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Subject:</span>
                      <span className="font-medium text-gray-700">{video.subject}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Grade:</span>
                      <span className="font-medium text-gray-700">{video.gradeLevel}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      {getStatusBadge(isProcessing ? VideoStatus.PROCESSING : video.uploadStatus)}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {video.uploadStatus === VideoStatus.UPLOADED && !isProcessing && (
                        <button 
                          onClick={() => handleAnalyze(video.videoId)}
                          className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <Search className="w-4 h-4" /> 🔍 Analyze with AI
                        </button>
                      )}

                      {isProcessing && (
                        <div className="text-center py-2 text-sm text-orange-600 font-medium flex items-center justify-center gap-2 bg-orange-50 rounded-lg">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></span>
                          ⏳ {video.uploadStatus === VideoStatus.ANALYZED ? 'Generating...' : 'Processing...'}
                        </div>
                      )}

                      {canGenerate && (
                        <div className="flex flex-col gap-2">
                           {hasPersonality ? (
                             <button 
                               className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 cursor-default border border-gray-200"
                               disabled
                             >
                               <CheckCircle2 className="w-4 h-4" /> Personality Generated
                             </button>
                           ) : (
                             <button 
                               className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm animate-pulse"
                               onClick={() => handleGeneratePersonality(video.videoId)}
                             >
                               <Sparkles className="w-4 h-4" /> ✨ Generate AI Personality
                             </button>
                           )}
                           
                           {hasPersonality && (
                             <button 
                               onClick={() => handleGeneratePersonality(video.videoId)}
                               className="text-xs text-purple-600 hover:underline text-center mt-1"
                             >
                               Regenerate (Update Profile)
                             </button>
                           )}
                        </div>
                      )}

                      {video.uploadStatus === VideoStatus.FAILED && !isProcessing && (
                         <button 
                          onClick={() => handleAnalyze(video.videoId)}
                          className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" /> 🔄 Retry Analysis
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </TeacherSidebar>
  );
};

export default MyVideosPage;