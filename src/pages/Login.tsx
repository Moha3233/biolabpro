import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Beaker, Shield, Lock, CheckCircle } from 'lucide-react';

export default function Login() {
  const { signIn, signInWithEmail, signUpWithEmail, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signIn();
    } catch (error: any) {
      console.error('Failed to sign in', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (activeTab === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (error: any) {
      console.error('Authentication error', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-blue-600 p-1.5 rounded-lg mr-3">
            <Beaker className="w-6 h-6 text-white" />
          </div>
          <span className="text-slate-900 dark:text-white font-bold text-xl tracking-tight">BioLab Pro</span>
        </div>
        <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm font-medium">
          <Shield className="w-4 h-4 mr-2" />
          ENCRYPTED SESSION
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Secure Research Lab Management
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Enterprise-grade security and complete data isolation for your lab's critical workflows.
          </p>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="flex border-b border-slate-100 dark:border-slate-700">
            <button 
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${activeTab === 'login' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${activeTab === 'signup' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Sign Up
            </button>
          </div>
          
          <div className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : activeTab === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-3 bg-white rounded-full p-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-center space-x-6 text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center"><CheckCircle className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-500" /> HIPAA COMPLIANT</div>
              <div className="flex items-center"><Lock className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-500" /> AES-256 E2EE</div>
              <div className="flex items-center"><Shield className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-500" /> ISO 27001</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full p-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mb-4 md:mb-0 text-center md:text-left">
          © 2024 BioLab Pro. All research data is isolated and encrypted by default.
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-slate-900 dark:hover:text-slate-200 underline decoration-slate-300 dark:decoration-slate-600 underline-offset-4">Security Whitepaper</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-slate-200 underline decoration-slate-300 dark:decoration-slate-600 underline-offset-4">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-slate-200 underline decoration-slate-300 dark:decoration-slate-600 underline-offset-4">Data Processing Agreement</a>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start max-w-sm">
          <div className="bg-blue-600 p-2 rounded-lg mr-3 mt-0.5">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-blue-900 dark:text-blue-100 font-semibold text-sm">Isolation Protocol Active</h4>
            <p className="text-blue-700 dark:text-blue-300 text-xs mt-1 leading-relaxed">Your connection is routed through our secure research gateway.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
