import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import { GraduationCap, Video, Users, UserCog } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (type: UserType) => {
    navigate(`/login?type=${type}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Hero Text */}
        <div className="text-white space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <GraduationCap className="w-6 h-6 text-yellow-300" />
            <span className="font-semibold tracking-wide">The Future of Education</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            🎓 Teach Clone
          </h1>
          
          <p className="text-xl md:text-2xl text-purple-100 font-light">
            Learn from AI versions of your favorite teachers in English.
          </p>

          <p className="text-purple-200 text-lg max-w-lg mx-auto md:mx-0">
            Teachers upload videos → AI learns their style → Students interact around the clock.
          </p>
        </div>

        {/* Right Side: Action Card */}
        <Card className="w-full max-w-md mx-auto transform transition-all hover:scale-105">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Get Started</h2>
            <p className="text-gray-500 mt-2">Select your role to continue</p>
          </div>

          <div className="space-y-4">
            <Button 
              variant="teacher" 
              onClick={() => handleNavigation(UserType.TEACHER)}
            >
              <Video className="w-5 h-5" />
              Teacher Login
            </Button>
            
            <Button 
              variant="student" 
              onClick={() => handleNavigation(UserType.STUDENT)}
            >
              <Users className="w-5 h-5" />
              Student Login
            </Button>
            
            <div className="pt-4 border-t border-gray-100">
               <Button 
                variant="admin" 
                onClick={() => handleNavigation(UserType.ADMIN)}
              >
                <UserCog className="w-5 h-5" />
                Admin Login
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <footer className="absolute bottom-4 text-purple-200 text-sm">
        &copy; {new Date().getFullYear()} Teach Clone. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;