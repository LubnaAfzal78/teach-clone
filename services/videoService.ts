import { Video, VideoStatus, VideoUploadResponse, VideoAnalysis, AnalysisResponse, AIPersonality, PersonalityStatus, PersonalityResponse } from '../types';
import { analyzeVideoWithGemini } from './geminiService';
import { getUserById } from './authService';

const VIDEO_DB_KEY = 'teach_clone_videos_db';
const ANALYSIS_DB_KEY = 'teach_clone_analysis_db';
const PERSONALITY_DB_KEY = 'teach_clone_personalities_db';

// --- INDEXED DB SETUP FOR LARGE FILES ---
const IDB_NAME = 'TeachCloneMedia';
const IDB_STORE = 'videos';
const IDB_VERSION = 1;

const openMediaDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE); // Key will be videoId
      }
    };
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
};

const saveBlobToDB = async (videoId: number, blob: Blob): Promise<void> => {
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const request = store.put(blob, videoId); // Store blob with videoId as key
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getBlobFromDB = async (videoId: number): Promise<Blob | null> => {
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const request = store.get(videoId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

// --- LOCAL STORAGE HELPERS (METADATA) ---
const getVideosDB = (): Video[] => {
  return JSON.parse(localStorage.getItem(VIDEO_DB_KEY) || '[]');
};

const saveVideosDB = (videos: Video[]) => {
  localStorage.setItem(VIDEO_DB_KEY, JSON.stringify(videos));
};

const getAnalysisDB = (): VideoAnalysis[] => {
  return JSON.parse(localStorage.getItem(ANALYSIS_DB_KEY) || '[]');
};

const saveAnalysisDB = (analyses: VideoAnalysis[]) => {
  localStorage.setItem(ANALYSIS_DB_KEY, JSON.stringify(analyses));
};

const getPersonalitiesDB = (): AIPersonality[] => {
  return JSON.parse(localStorage.getItem(PERSONALITY_DB_KEY) || '[]');
};

const savePersonalitiesDB = (personalities: AIPersonality[]) => {
  localStorage.setItem(PERSONALITY_DB_KEY, JSON.stringify(personalities));
};

// --- EXPORTS ---

export const getTeacherVideos = (teacherId: number): Video[] => {
  const allVideos = getVideosDB();
  return allVideos.filter(v => Number(v.teacherId) === Number(teacherId));
};

export const getVideoById = (videoId: number): Video | undefined => {
  const videos = getVideosDB();
  return videos.find(v => Number(v.videoId) === Number(videoId));
};

export const getAnalysisByVideoId = (videoId: number): VideoAnalysis | undefined => {
  const analyses = getAnalysisDB();
  return analyses.find(a => Number(a.videoId) === Number(videoId));
};

export const getPersonalityByTeacherId = (teacherId: number): AIPersonality | undefined => {
  const personalities = getPersonalitiesDB();
  return personalities.find(p => Number(p.teacherId) === Number(teacherId));
};

export const getPersonalityById = (personalityId: number): AIPersonality | undefined => {
  const personalities = getPersonalitiesDB();
  return personalities.find(p => Number(p.personalityId) === Number(personalityId));
};

const updateVideoStatus = (videoId: number, status: VideoStatus) => {
  const videos = getVideosDB();
  const index = videos.findIndex(v => Number(v.videoId) === Number(videoId));
  if (index !== -1) {
    videos[index].uploadStatus = status;
    saveVideosDB(videos);
  }
};

export const uploadVideo = async (
  teacherId: number,
  title: string,
  subject: string,
  gradeLevel: string,
  file: File
): Promise<VideoUploadResponse> => {
  // 1. STRICT VALIDATION
  if (!file) {
      return { success: false, message: 'No video file provided' };
  }

  const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm'];
  if (!allowedTypes.includes(file.type)) {
      return { success: false, message: 'Invalid file type. Allowed: mp4, avi, mov, mkv, webm' };
  }

  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  if (file.size > MAX_SIZE) {
      return { success: false, message: 'File too large. Maximum 100MB allowed.' };
  }

  // 2. REALISTIC UPLOAD SIMULATION
  // Calculate delay based on file size (e.g., 200ms per MB)
  const mbSize = file.size / (1024 * 1024);
  const uploadDurationMs = Math.max(1500, mbSize * 300); // Minimum 1.5s
  
  console.log(`[VideoService] Simulating upload for ${mbSize.toFixed(2)}MB file. Duration: ${uploadDurationMs}ms`);
  await new Promise(resolve => setTimeout(resolve, uploadDurationMs));

  try {
    const videos = getVideosDB();
    const newVideoId = videos.length > 0 ? Math.max(...videos.map(v => v.videoId)) + 1 : 1;
    
    // 3. STORE BINARY DATA IN INDEXEDDB
    await saveBlobToDB(newVideoId, file);

    const newVideo: Video = {
      videoId: newVideoId,
      teacherId: Number(teacherId), 
      title,
      subject,
      gradeLevel,
      filePath: `local_blob:${newVideoId}`, // Special marker for frontend to resolve
      fileSize: file.size,
      mimeType: file.type,
      uploadStatus: VideoStatus.UPLOADED, 
      uploadedAt: new Date().toISOString(),
      description: `Uploaded via secure portal`
    };

    videos.push(newVideo);
    saveVideosDB(videos);

    console.log(`SUCCESS: Video uploaded & saved to DB - ID: ${newVideo.videoId}`);

    return {
      success: true,
      message: 'Video uploaded successfully! Analysis ready.',
      video: newVideo
    };
  } catch (error) {
    console.error("Upload failed:", error);
    return {
      success: false,
      message: 'Storage error: Could not save video file locally.'
    };
  }
};

export const performVideoAnalysis = async (videoId: number): Promise<AnalysisResponse> => {
  const video = getVideoById(videoId);
  if (!video) {
    return { success: false, message: 'Video not found.' };
  }

  updateVideoStatus(videoId, VideoStatus.PROCESSING);

  try {
    // 1. RETRIEVE REAL FILE FROM INDEXEDDB
    const videoBlob = await getBlobFromDB(videoId);
    
    if (!videoBlob) {
        throw new Error("Video file data is missing or corrupted.");
    }

    console.log(`[VideoService] Retrieved blob for analysis. Size: ${videoBlob.size}`);

    // 2. SEND TO GEMINI (REAL ANALYSIS WITH FALLBACK)
    // Pass metadata to enable fallback if video is too large
    const geminiResponse = await analyzeVideoWithGemini(videoBlob, {
        title: video.title,
        subject: video.subject,
        gradeLevel: video.gradeLevel
    });

    if (!geminiResponse.success || !geminiResponse.text) {
      throw new Error(geminiResponse.error || 'Empty response from AI');
    }

    let jsonString = geminiResponse.text;
    
    // Robust cleaning of markdown
    jsonString = jsonString
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
    
    // Sometimes text comes before/after { }
    const startIndex = jsonString.indexOf('{');
    const endIndex = jsonString.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
        jsonString = jsonString.substring(startIndex, endIndex + 1);
    }
    
    const analysisData = JSON.parse(jsonString);

    // Format data for DB
    let toneDesc = 'Neutral';
    if (typeof analysisData.tone_and_energy === 'object') {
        toneDesc = `${analysisData.tone_and_energy.description} (Level: ${analysisData.tone_and_energy.level})`;
    } else if (analysisData.tone_description) {
        toneDesc = analysisData.tone_description;
    }

    const traits = Array.isArray(analysisData.unique_traits) ? analysisData.unique_traits.join(', ') : analysisData.unique_traits;
    const phrases = Array.isArray(analysisData.common_phrases) ? analysisData.common_phrases.join(', ') : analysisData.common_phrases;

    let gender: 'Male' | 'Female' = 'Male';
    if (analysisData.teacher_gender && analysisData.teacher_gender.toLowerCase().includes('female')) {
        gender = 'Female';
    }

    const analyses = getAnalysisDB();
    const newAnalysis: VideoAnalysis = {
      analysisId: analyses.length + 1,
      videoId: Number(videoId),
      teachingStyle: analysisData.teaching_style || 'Not specified',
      commonPhrases: phrases || '',
      toneDescription: toneDesc,
      languageMix: 'English Only', 
      pacing: analysisData.pacing || 'Moderate',
      teachingMethodology: analysisData.teaching_methodology,
      exampleTypes: analysisData.example_types,
      keyCharacteristics: traits,
      teacherGender: gender,
      voiceCharacteristics: analysisData.voice_characteristics,
      analyzedAt: new Date().toISOString()
    };

    // Upsert analysis
    const filteredAnalyses = analyses.filter(a => a.videoId !== Number(videoId));
    filteredAnalyses.push(newAnalysis);
    saveAnalysisDB(filteredAnalyses);

    updateVideoStatus(videoId, VideoStatus.ANALYZED);
    console.log(`SUCCESS: Analysis completed for video ID: ${videoId}`);

    return {
      success: true,
      message: 'Video analyzed successfully',
      analysis: newAnalysis
    };

  } catch (error) {
    console.error("Analysis Failed:", error);
    updateVideoStatus(videoId, VideoStatus.FAILED);
    return {
      success: false,
      message: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
};

export const generatePersonality = async (videoId: number): Promise<PersonalityResponse> => {
  const video = getVideoById(videoId);
  if (!video) return { success: false, message: 'Video not found.' };

  const analysis = getAnalysisByVideoId(videoId);
  if (!analysis) return { success: false, message: 'Video must be analyzed first.' };

  await new Promise(resolve => setTimeout(resolve, 800));

  try {
    const teacher = getUserById(video.teacherId);
    const teacherName = teacher ? teacher.fullName : 'Teacher';
    
    // Prompt construction based on extracted DNA
    const systemPrompt = `You are ${teacherName}, a teacher known for being ${analysis.toneDescription}.
Your teaching style is UNIQUE: ${analysis.teachingStyle}.
You OFTEN use these specific phrases: ${analysis.commonPhrases}.
Your pacing is ${analysis.pacing}.

Instructions:
1. ALWAYS stay in character.
2. Use your signature phrases listed above naturally.
3. Explain concepts using your typical examples: ${analysis.exampleTypes || 'relatable examples'}.
4. If asked about your teaching method, describe it as: ${analysis.teachingMethodology}.
5. Engage with students using your unique traits: ${analysis.keyCharacteristics}.
6. Speak in English only.
`;

    const personalities = getPersonalitiesDB();
    const existingIndex = personalities.findIndex(p => Number(p.teacherId) === Number(video.teacherId));
    
    let newPersonality: AIPersonality;

    if (existingIndex !== -1) {
      newPersonality = {
        ...personalities[existingIndex],
        personalityName: `${teacherName}'s AI Clone`,
        systemPrompt,
        approvalStatus: PersonalityStatus.PENDING,
        isActive: false,
        createdAt: new Date().toISOString()
      };
      personalities[existingIndex] = newPersonality;
    } else {
      newPersonality = {
        personalityId: personalities.length + 1,
        teacherId: video.teacherId,
        personalityName: `${teacherName}'s AI Clone`,
        systemPrompt,
        approvalStatus: PersonalityStatus.PENDING,
        isActive: false,
        createdAt: new Date().toISOString()
      };
      personalities.push(newPersonality);
    }

    savePersonalitiesDB(personalities);
    return { success: true, message: 'AI Personality generated!', personality: newPersonality };

  } catch (error) {
    console.error("Personality Generation Error:", error);
    return { success: false, message: 'Failed to generate personality.' };
  }
};