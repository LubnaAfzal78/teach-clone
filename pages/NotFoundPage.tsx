import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import Button from '../components/Button';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-orange-500" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Button onClick={() => navigate('/')} variant="primary">
          <Home className="w-4 h-4" /> Go Home
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;