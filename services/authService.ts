import { User, UserType, UserStatus, AuthResponse, RegisterResponse } from '../types';

const DB_KEY = 'teach_clone_users_db';
const SESSION_KEY = 'teach_clone_session';
const SESSION_EXPIRY_KEY = 'teach_clone_session_expiry';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// Initialize "Database" with default Admin
const initializeDB = () => {
  const existing = localStorage.getItem(DB_KEY);
  if (!existing) {
    const adminUser: User = {
      userId: 1,
      email: 'admin@teachclone.com',
      password: 'password', // In real app, this would be hashed
      fullName: 'System Administrator',
      userType: UserType.ADMIN,
      status: UserStatus.APPROVED
    };
    localStorage.setItem(DB_KEY, JSON.stringify([adminUser]));
  }
};

const getDB = (): User[] => {
  initializeDB();
  return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
};

const saveDB = (users: User[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
};

export const getUserById = (userId: number): User | undefined => {
  const users = getDB();
  return users.find(u => u.userId === userId);
};

export const register = async (fullName: string, email: string, password: string, type: UserType): Promise<RegisterResponse> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network

  const users = getDB();
  
  // Check if email exists
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: 'Email already registered.' };
  }

  // Determine Status
  // Students are auto-approved, Teachers are pending
  const status = type === UserType.STUDENT ? UserStatus.APPROVED : UserStatus.PENDING;

  const newUser: User = {
    userId: users.length + 1,
    email,
    password, // Storing plain text for demo only. Real app uses bcrypt.
    fullName,
    userType: type,
    status
  };

  users.push(newUser);
  saveDB(users);

  if (status === UserStatus.PENDING) {
    return { success: true, message: 'Registration successful! Your account is pending admin approval.' };
  }

  return { success: true, message: 'Registration successful! You may now login.' };
};

export const login = async (email: string, password: string, type: UserType): Promise<AuthResponse> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const users = getDB();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.userType === type);

  // 1. Check if user exists
  if (!user) {
    return { success: false, message: 'Account not found for this role.' };
  }

  // 2. Verify Password (password_verify simulation)
  if (user.password !== password) {
    return { success: false, message: 'Invalid credentials.' };
  }

  // 3. Check Status (Admins always bypass, others check status)
  if (user.userType !== UserType.ADMIN && user.status !== UserStatus.APPROVED) {
    if (user.status === UserStatus.PENDING) {
      return { success: false, message: 'Account is pending approval. Please wait for an administrator.' };
    }
    return { success: false, message: 'Account has been rejected.' };
  }

  // Success - Create Session
  const sessionUser = { ...user };
  delete sessionUser.password; // Don't put password in session
  
  const expiryTime = Date.now() + SESSION_DURATION;
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());

  return { success: true, user: sessionUser };
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
};

export const getSession = (): User | null => {
  const session = localStorage.getItem(SESSION_KEY);
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);

  if (!session || !expiry) return null;

  // Check Expiry
  if (Date.now() > parseInt(expiry)) {
    logout();
    return null;
  }

  return JSON.parse(session);
};