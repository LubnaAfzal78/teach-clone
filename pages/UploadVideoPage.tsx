import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { uploadVideo } from '../services/videoService';
import TeacherSidebar from '../components/TeacherSidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import { Upload, FileVideo, AlertCircle, CheckCircle2 } from 'lucide-react';

const UploadVideoPage: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 
    'English', 'Computer Science', 'History', 'Geography', 'Other'
  ];

  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validation 1: File Type
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp4|mov|avi|webm|mkv)$/i)) {
        showNotification('error', 'Invalid file type. Allowed: MP4, MOV, AVI, WEBM.');
        setFile(null);
        e.target.value = ''; // Reset input
        return;
      }

      // Validation 2: File Size (20MB Limit for Client-Side Gemini)
      // This ensures we don't try to send a payload that will instantly fail at the API level
      const maxSize = 20 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        showNotification('error', 'File is too large. Maximum size is 20MB for browser analysis.');
        setFile(null);
        e.target.value = '';
        return;
      }

      setFile(selectedFile);
      showNotification('info', `File selected: ${selectedFile.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !file) {
      showNotification('error', 'Please select a file.');
      return;
    }

    setLoading(true);

    try {
      const response = await uploadVideo(
        user.userId,
        title,
        subject,
        gradeLevel,
        file
      );

      if (response.success) {
        showNotification('success', response.message);
        // Reset form
        setTitle('');
        setSubject('');
        setGradeLevel('');
        setFile(null);
        // Reset file input visually
        const fileInput = document.getElementById('video-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        showNotification('error', response.message);
      }
    } catch (err) {
      showNotification('error', 'An unexpected error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <TeacherSidebar>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          📹 Upload Teaching Video
        </h1>
        <p className="text-gray-500 mt-2">
          Upload a teaching video in English showing your unique teaching style.
        </p>
      </header>

      <div className="max-w-[700px]">
        <Card className="border border-gray-100 shadow-lg">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video Title <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g., Introduction to Algebra"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                    ▼
                  </div>
                </div>
              </div>

              {/* Grade Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level <span className="text-red-500">*</span></label>
                <div className="relative">
                   <select
                    required
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                  >
                    <option value="">Select Grade</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video File <span className="text-red-500">*</span></label>
              <div 
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors
                  ${file ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:bg-gray-50'}
                `}
              >
                <div className="space-y-1 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    {file ? <FileVideo className="w-full h-full text-purple-600 animate-pulse" /> : <Upload className="w-full h-full" />}
                  </div>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="video-upload" className="relative cursor-pointer rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none">
                      <span>{file ? 'Change file' : 'Upload a file'}</span>
                      <input 
                        id="video-upload" 
                        name="video-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                        onChange={handleFileChange}
                      />
                    </label>
                    {!file && <p className="pl-1">or drag and drop</p>}
                  </div>
                  <p className="text-xs text-gray-500">
                    {file 
                      ? `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)` 
                      : 'MP4, MOV, WEBM up to 20MB (Client Limit)'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" variant="teacher" isLoading={loading}>
                {loading ? 'Uploading Video...' : '📤 Upload Video'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </TeacherSidebar>
  );
};

export default UploadVideoPage;