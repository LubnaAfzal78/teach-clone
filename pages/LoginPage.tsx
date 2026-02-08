import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { UserType } from '../types';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, Lock, Mail, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginUser, user } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const typeParam = searchParams.get('type') as UserType;
  const userType = Object.values(UserType).includes(typeParam) ? typeParam : UserType.STUDENT;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill admin credentials for demo
  useEffect(() => {
    if (userType === UserType.ADMIN) {
      setEmail('admin@teachclone.com');
      setPassword('password');
    } else {
      setEmail('');
      setPassword('');
    }
    setError('');
  }, [userType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password, userType);
      
      if (response.success && response.user) {
        loginUser(response.user);
        navigate('/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (userType) {
      case UserType.TEACHER: return 'Teacher Portal';
      case UserType.ADMIN: return 'Admin Console';
      default: return 'Student Access';
    }
  };

  const getVariant = () => {
    switch (userType) {
      case UserType.TEACHER: return 'teacher';
      case UserType.ADMIN: return 'admin';
      default: return 'student';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </button>

        <div className="text-center mb-8">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 text-white text-2xl font-bold shadow-lg
            ${userType === UserType.TEACHER ? 'bg-blue-500' : 
              userType === UserType.ADMIN ? 'bg-orange-500' : 'bg-green-500'}`}
          >
            {userType === UserType.TEACHER ? 'T' : userType === UserType.ADMIN ? 'A' : 'S'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{getTitle()}</h2>
          <p className="text-gray-500 text-sm mt-1">Please sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            variant={getVariant()} 
            isLoading={loading}
          >
            Sign In
          </Button>

          {userType !== UserType.ADMIN && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to={`/register?type=${userType}`} 
                  className="font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Register here
                </Link>
              </p>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;