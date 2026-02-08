import { User, UserType, UserStatus, AIPersonality, PersonalityStatus } from '../types';
import { callGemini } from './geminiService';

const USERS_DB_KEY = 'teach_clone_users_db';
const PERSONALITY_DB_KEY = 'teach_clone_personalities_db';

// --- Helpers to access the "Database" ---
const getUsersDB = (): User[] => JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
const saveUsersDB = (users: User[]) => localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

const getPersonalitiesDB = (): AIPersonality[] => JSON.parse(localStorage.getItem(PERSONALITY_DB_KEY) || '[]');
const savePersonalitiesDB = (p: AIPersonality[]) => localStorage.setItem(PERSONALITY_DB_KEY, JSON.stringify(p));

export interface DashboardStats {
  pendingTeachers: number;
  pendingPersonalities: number;
  approvedTeachers: number;
  totalStudents: number;
}

export const getAdminStats = (): DashboardStats => {
  const users = getUsersDB();
  const personalities = getPersonalitiesDB();

  return {
    pendingTeachers: users.filter(u => u.userType === UserType.TEACHER && u.status === UserStatus.PENDING).length,
    approvedTeachers: users.filter(u => u.userType === UserType.TEACHER && u.status === UserStatus.APPROVED).length,
    totalStudents: users.filter(u => u.userType === UserType.STUDENT).length,
    pendingPersonalities: personalities.filter(p => p.approvalStatus === PersonalityStatus.PENDING).length,
  };
};

export const getTeachers = (): User[] => {
  const users = getUsersDB();
  // Return teachers sorted by ID desc (newest first)
  return users.filter(u => u.userType === UserType.TEACHER).reverse();
};

export const updateTeacherStatus = async (userId: number, status: UserStatus): Promise<boolean> => {
  try {
    const users = getUsersDB();
    
    // Log for debugging
    console.log(`[AdminService] Attempting to update User ID: ${userId} to Status: ${status}`);
    
    // Use loose equality (==) intentionally to match string "1" with number 1 if types got mixed up in localStorage
    // eslint-disable-next-line eqeqeq
    const index = users.findIndex(u => u.userId == userId);
    
    if (index !== -1) {
      users[index].status = status;
      saveUsersDB(users);
      console.log(`[AdminService] Successfully updated user ${userId}.`);
      return true;
    } else {
      console.error(`[AdminService] User ${userId} NOT FOUND in database.`);
      console.log('Available User IDs:', users.map(u => u.userId));
      return false;
    }
  } catch (error) {
    console.error("[AdminService] Exception in updateTeacherStatus:", error);
    return false;
  }
};

export const getAllPersonalities = (): (AIPersonality & { teacherName: string })[] => {
  const personalities = getPersonalitiesDB();
  const users = getUsersDB();
  
  // Join with User data to get teacher name
  return personalities.map(p => {
    // Robust ID match
    const teacher = users.find(u => Number(u.userId) === Number(p.teacherId));
    return {
      ...p,
      teacherName: teacher ? teacher.fullName : 'Unknown Teacher'
    };
  }).reverse();
};

export const getPendingPersonalities = (): (AIPersonality & { teacherName: string })[] => {
  const personalities = getPersonalitiesDB();
  const users = getUsersDB();
  
  // Join with User data to get teacher name
  return personalities
    .filter(p => p.approvalStatus === PersonalityStatus.PENDING)
    .map(p => {
      const teacher = users.find(u => Number(u.userId) === Number(p.teacherId));
      return {
        ...p,
        teacherName: teacher ? teacher.fullName : 'Unknown Teacher'
      };
    });
};

export const updatePersonalityStatus = async (
  personalityId: number, 
  status: PersonalityStatus, 
  feedback?: string,
  editedPrompt?: string
): Promise<boolean> => {
  try {
    const personalities = getPersonalitiesDB();
    console.log(`[AdminService] Updating personality ${personalityId} to ${status}`);
    
    // Explicit number conversion for robust matching
    const index = personalities.findIndex(p => Number(p.personalityId) === Number(personalityId));

    if (index !== -1) {
      const p = personalities[index];
      p.approvalStatus = status;
      
      if (status === PersonalityStatus.APPROVED) {
        p.isActive = true;
        p.adminFeedback = undefined;
      } else if (status === PersonalityStatus.REJECTED) {
        p.isActive = false;
        p.adminFeedback = feedback;
      }

      if (editedPrompt) {
        p.systemPrompt = editedPrompt;
      }

      savePersonalitiesDB(personalities);
      console.log(`[AdminService] Update successful for personality ${personalityId}`);
      return true;
    }
    console.error(`[AdminService] Personality ${personalityId} not found`);
    return false;
  } catch (e) {
    console.error(`[AdminService] Error updating personality:`, e);
    return false;
  }
};

export const togglePersonalityActive = async (personalityId: number, isActive: boolean): Promise<boolean> => {
  const personalities = getPersonalitiesDB();
  const index = personalities.findIndex(p => Number(p.personalityId) === Number(personalityId));

  if (index !== -1) {
    personalities[index].isActive = isActive;
    savePersonalitiesDB(personalities);
    return true;
  }
  return false;
};

export const testPersonalityChat = async (systemPrompt: string, userMessage: string): Promise<string> => {
  const combinedPrompt = `${systemPrompt}\n\nIMPORTANT: The above is your persona. Reply to the student's question below staying strictly in character.\n\nStudent: ${userMessage}`;
  const result = await callGemini(combinedPrompt);
  return result.text || "Error generating response.";
};