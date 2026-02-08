import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { UserType } from '../types';
import { register } from '../services/authService';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeParam = searchParams.get('type') as UserType;
  const userType = Object.values(UserType).includes(typeParam) ? typeParam : UserType.STUDENT;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const response = await register(fullName, email, password, userType);
      
      if (response.success) {
        setSuccessMsg(response.message);
        // If it's a student (approved), we could auto-login, but requirements say link to login
        // If it's a teacher (pending), they must wait.
        setTimeout(() => {
          if (!response.message.includes('pending')) {
             // Optional auto-redirect for students could go here
          }
        }, 2000);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getVariant = () => {
    return userType === UserType.TEACHER ? 'teacher' : 'student';
  };

  if (successMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful</h2>
          <p className="text-gray-600 mb-8">{successMsg}</p>
          <Button onClick={() => navigate(`/login?type=${userType}`)} variant={getVariant()}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Create {userType === UserType.TEACHER ? 'Teacher' : 'Student'} Account
          </h2>
          <p className="text-gray-500 text-sm mt-1">Join Teach Clone today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

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
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            variant={getVariant()} 
            isLoading={loading}
          >
            Register
          </Button>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to={`/login?type=${userType}`} 
                className="font-semibold text-purple-600 hover:text-purple-700 hover:underline"
              >
                Login here
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;