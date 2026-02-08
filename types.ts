
export enum UserType {
  TEACHER = 'teacher',
  STUDENT = 'student',
  ADMIN = 'admin'
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface User {
  userId: number;
  email: string;
  fullName: string;
  userType: UserType;
  status: UserStatus;
  password?: string; // Only used internally for the mock DB
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export enum VideoStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  ANALYZED = 'analyzed',
  FAILED = 'failed'
}

export interface Video {
  videoId: number;
  teacherId: number;
  title: string;
  subject: string;
  gradeLevel: string;
  filePath: string;
  // New Schema Fields
  fileSize: number;
  mimeType: string; 
  duration?: number;
  uploadStatus: VideoStatus;
  uploadedAt: string;
  description?: string;
}

export interface VideoAnalysis {
  analysisId: number;
  videoId: number;
  teachingStyle: string;
  commonPhrases: string;
  toneDescription: string;
  languageMix: string;
  pacing: string;
  teachingMethodology?: string;
  exampleTypes?: string;
  keyCharacteristics?: string;
  teacherGender?: 'Male' | 'Female';
  voiceCharacteristics?: string;
  analyzedAt: string;
}

export enum PersonalityStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface AIPersonality {
  personalityId: number;
  teacherId: number;
  personalityName: string;
  systemPrompt: string;
  approvalStatus: PersonalityStatus;
  adminFeedback?: string;
  isActive: boolean; // Added per requirements
  createdAt: string;
}

export interface VideoUploadResponse {
  success: boolean;
  message: string;
  video?: Video;
}

export interface AnalysisResponse {
  success: boolean;
  message: string;
  analysis?: VideoAnalysis;
}

export interface PersonalityResponse {
  success: boolean;
  message: string;
  personality?: AIPersonality;
}

// For UI Chat simulation
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Persistent Chat Data
export interface Conversation {
  conversationId: number;
  studentId: number;
  personalityId: number;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
}

export interface Message {
  messageId: number;
  conversationId: number;
  senderType: 'student' | 'ai';
  messageText: string;
  createdAt: string;
  audioBase64?: string; 
  audioUrl?: string; // Added per SQL schema requirement
  audioConfig?: {
    pitch: number;
    rate: number;
    lang: string;
    gender?: 'Male' | 'Female';
    voiceName?: string; 
  };
}

export interface ChatResponse {
  success: boolean;
  aiResponse?: string;
  timestamp?: string;
  message?: string;
  audioBase64?: string;
  audioConfig?: {
    pitch: number;
    rate: number;
    lang: string;
    gender?: 'Male' | 'Female';
    voiceName?: string; 
  };
}
