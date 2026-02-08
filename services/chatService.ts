import { Conversation, Message, AIPersonality, ChatResponse, ChatMessage, PersonalityStatus, VideoAnalysis } from '../types';
import { generateResponseWithContext } from './geminiService';
import { getPersonalityById as getPersonalityServiceById, getAnalysisByVideoId, getTeacherVideos } from './videoService';

const CONVERSATION_DB_KEY = 'teach_clone_conversations_db';
const MESSAGES_DB_KEY = 'teach_clone_messages_db';
const PERSONALITY_DB_KEY = 'teach_clone_personalities_db';
const USERS_DB_KEY = 'teach_clone_users_db'; 

// --- Helpers ---
const getConversationsDB = (): Conversation[] => JSON.parse(localStorage.getItem(CONVERSATION_DB_KEY) || '[]');
const saveConversationsDB = (data: Conversation[]) => localStorage.setItem(CONVERSATION_DB_KEY, JSON.stringify(data));

const getMessagesDB = (): Message[] => JSON.parse(localStorage.getItem(MESSAGES_DB_KEY) || '[]');
const saveMessagesDB = (data: Message[]) => localStorage.setItem(MESSAGES_DB_KEY, JSON.stringify(data));

const getPersonalitiesDB = (): AIPersonality[] => JSON.parse(localStorage.getItem(PERSONALITY_DB_KEY) || '[]');
const getUsersDB = () => JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');

// --- Cleaning Helper ---
const cleanAIResponse = (text: string): string => {
  if (!text) return "";
  let cleaned = text;

  // 1. Remove Markdown symbols (*, #, _, etc used for bold/italic/lists)
  // Replaces *, #, _, `, ~ with empty string
  cleaned = cleaned.replace(/[\*#_`~]/g, '');

  // 2. Remove unwanted phrases (case insensitive)
  const unwantedPhrases = [
    "Thanks for the click",
    "thanks for clicking",
    "thank you for the click"
  ];
  
  unwantedPhrases.forEach(phrase => {
    // Case insensitive global replace
    const regex = new RegExp(phrase, 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  // 3. Cleanup extra whitespace (double spaces, etc)
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
};

// --- Gender Detection Logic ---
const detectTeacherGender = (personality: AIPersonality, analysis?: VideoAnalysis): 'Male' | 'Female' => {
  // 1. Check video analysis first
  if (analysis?.teacherGender) {
    if (analysis.teacherGender.toLowerCase() === 'female') return 'Female';
    if (analysis.teacherGender.toLowerCase() === 'male') return 'Male';
  }

  // 2. Check voice characteristics if available
  if (analysis?.voiceCharacteristics) {
    const vc = analysis.voiceCharacteristics.toLowerCase();
    if (vc.includes('female') || vc.includes('woman')) return 'Female';
    if (vc.includes('male') || vc.includes('man')) return 'Male';
  }

  // 3. Fallback to Name Analysis
  const users = getUsersDB();
  const teacher = users.find((u: any) => u.userId === personality.teacherId);
  if (!teacher) return 'Male';

  const name = teacher.fullName.toLowerCase();
  
  const femaleNames = ['fatima', 'ayesha', 'sarah', 'maria', 'emily', 'jessica', 'linda', 'jennifer', 'khadija', 'maryam', 'zainab', 'aisha'];
  if (femaleNames.some(fn => name.includes(fn))) return 'Female';

  return 'Male'; // Default
};

// --- Google TTS Generation ---
// NOTE: Google Cloud TTS is currently disabled/restricted for the demo key.
// We return null to force the frontend to use the Browser's Native SpeechSynthesis.
const generateGoogleTTS = async (text: string, config: any): Promise<string | null> => {
  return null; 
};

// --- Voice Settings Logic ---
const getVoiceSettings = (personalityId: number) => {
    const personality = getPersonalitiesDB().find(p => p.personalityId === personalityId);
    if (!personality) return { pitch: 0, rate: 1.0, lang: 'en-US', gender: 'Male' as const, voiceName: 'en-US-Neural2-D' };

    let analysis: VideoAnalysis | undefined;
    const videos = getTeacherVideos(personality.teacherId);
    if (videos.length > 0) {
        analysis = getAnalysisByVideoId(videos[0].videoId);
    }

    // Default settings
    let pitch = 0;
    let rate = 1.0;
    
    // Detect Gender
    const gender = detectTeacherGender(personality, analysis);

    // Analyze Tone for Pitch
    if (analysis) {
        const tone = analysis.toneDescription.toLowerCase();
        if (tone.includes('energetic') || tone.includes('enthusiastic')) {
            pitch = 2.0; 
        } else if (tone.includes('calm') || tone.includes('serious')) {
            pitch = -2.0;
        }
    }

    // Analyze Pacing for Rate
    if (analysis) {
        const pacing = analysis.pacing.toLowerCase();
        if (pacing.includes('fast')) {
            rate = 1.15;
        } else if (pacing.includes('slow')) {
            rate = 0.90;
        }
    }

    // --- ENGLISH ONLY CONFIGURATION ---
    let lang = 'en-US';
    let voiceName = '';

    if (gender === 'Female') {
        // Natural female US English
        voiceName = 'en-US-Neural2-F'; 
    } else {
        // Natural male US English
        voiceName = 'en-US-Neural2-D';
    }

    return { pitch, rate, lang, gender, voiceName };
};

// --- Read Operations ---

export const getApprovedPersonalities = (): (AIPersonality & { teacherName: string })[] => {
  const personalities = getPersonalitiesDB();
  const users = getUsersDB();
  
  return personalities
    .filter(p => p.approvalStatus === PersonalityStatus.APPROVED && p.isActive)
    .map(p => {
      const teacher = users.find((u: any) => u.userId === p.teacherId);
      return {
        ...p,
        teacherName: teacher ? teacher.fullName : 'Unknown Teacher'
      };
    });
};

export const getPersonalityById = (id: number): AIPersonality | undefined => {
    return getPersonalitiesDB().find(p => p.personalityId === id);
};

export const getConversation = (studentId: number, personalityId: number): Conversation | null => {
    const convos = getConversationsDB();
    return convos.find(c => c.studentId === studentId && c.personalityId === personalityId) || null;
};

export const getConversationMessages = (conversationId: number): Message[] => {
    const msgs = getMessagesDB();
    return msgs.filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

// --- Write Operations ---

export const startConversation = (studentId: number, personalityId: number): Conversation => {
    let convos = getConversationsDB();
    let existing = convos.find(c => c.studentId === studentId && c.personalityId === personalityId);

    if (existing) return existing;

    const newConvo: Conversation = {
        conversationId: convos.length + 1,
        studentId,
        personalityId,
        startedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messageCount: 0
    };

    convos.push(newConvo);
    saveConversationsDB(convos);
    return newConvo;
};

export const processStudentMessage = async (
    conversationId: number, 
    personalityId: number, 
    messageText: string
): Promise<ChatResponse> => {
    try {
        // 1. Save Student Message
        const msgs = getMessagesDB();
        msgs.push({
            messageId: msgs.length + 1,
            conversationId,
            senderType: 'student',
            messageText,
            createdAt: new Date().toISOString()
        });
        saveMessagesDB(msgs);

        // 2. Fetch Context
        const personality = getPersonalityServiceById(personalityId);
        if (!personality) throw new Error("Personality not found");

        const history = getConversationMessages(conversationId);
        
        // Convert to Gemini ChatMessage format
        const chatHistory: ChatMessage[] = history.slice(0, -1).slice(-10).map(m => ({
            role: m.senderType === 'student' ? 'user' : 'model',
            text: m.messageText
        }));

        // 3. Call AI
        const aiResult = await generateResponseWithContext(
            personality.systemPrompt,
            chatHistory,
            messageText
        );

        if (!aiResult.success || !aiResult.text) throw new Error(aiResult.error || "AI failed to respond");

        // CLEANING STEP: Sanitize response before using it
        const cleanedAiText = cleanAIResponse(aiResult.text);

        // 4. Generate Audio Config (for frontend browser TTS)
        // We skip server-side generation to avoid API key errors
        const voiceSettings = getVoiceSettings(personalityId);
        let audioBase64: string | undefined = undefined;

        // 5. Save AI Response
        const aiMsg: Message = {
            messageId: msgs.length + 2, 
            conversationId,
            senderType: 'ai',
            messageText: cleanedAiText, 
            createdAt: new Date().toISOString(),
            audioConfig: voiceSettings,
            audioBase64: undefined // Will trigger browser TTS on frontend
        };
        
        msgs.push(aiMsg); 
        saveMessagesDB(msgs);

        // 6. Update Conversation Metadata
        const convos = getConversationsDB();
        const convoIdx = convos.findIndex(c => c.conversationId === conversationId);
        if (convoIdx !== -1) {
            convos[convoIdx].lastMessageAt = new Date().toISOString();
            convos[convoIdx].messageCount = msgs.filter(m => m.conversationId === conversationId).length;
            saveConversationsDB(convos);
        }

        return {
            success: true,
            aiResponse: cleanedAiText,
            timestamp: aiMsg.createdAt,
            audioConfig: voiceSettings,
            audioBase64: undefined
        };

    } catch (error) {
        console.error("Chat Process Error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred"
        };
    }
};