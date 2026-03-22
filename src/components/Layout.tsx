import React, { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStorage } from '../contexts/StorageContext';
import { 
  Beaker, 
  Calendar, 
  Calculator, 
  FileText, 
  Database, 
  LineChart, 
  HelpCircle,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Settings,
  BookOpen
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { user, logOut } = useAuth();
  const { storageMode, setStorageMode, encryptionKey, setEncryptionKey, subscribeToCollection } = useStorage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('emailAlerts') === 'true');
  const [tasks, setTasks] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const notifiedTasks = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('emailAlerts', String(emailAlerts));
  }, [emailAlerts]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCollection('tasks', [{ field: 'status', value: 'pending' }], (tasksData) => {
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, [user, storageMode]);

  useEffect(() => {
    if (!user || tasks.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;

      tasks.forEach(task => {
        if (task.reminderTime === currentTime && !notifiedTasks.current.has(task.id)) {
          // Check if task is scheduled for today
          let isToday = false;
          if (task.date) {
            const taskDate = task.date.toDate ? task.date.toDate() : new Date(task.date);
            if (taskDate.getFullYear() === now.getFullYear() && 
                taskDate.getMonth() === now.getMonth() && 
                taskDate.getDate() === now.getDate()) {
              isToday = true;
            }
          } else if (task.type === 'daily') {
            isToday = true;
          }

          if (isToday) {
            // Show browser notification if permitted
            if (Notification.permission === 'granted') {
              new Notification('Lab Planner Reminder', {
                body: `Task: ${task.title} is due now!`,
                icon: '/favicon.ico'
              });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('Lab Planner Reminder', {
                    body: `Task: ${task.title} is due now!`,
                    icon: '/favicon.ico'
                  });
                }
              });
            }

            // Simulate email alert if enabled
            if (emailAlerts && task.emailNotification) {
              console.log(`[Email Alert] Sending email to ${user.email} for task: ${task.title}`);
              setToastMessage(`Email sent: Reminder for "${task.title}"`);
              setTimeout(() => setToastMessage(null), 5000);
            }

            notifiedTasks.current.add(task.id);
          }
        }
      });
    };

    // Check immediately and then every minute
    checkReminders();
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [tasks, user, emailAlerts]);

  const handleLogOut = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Beaker },
    { name: 'Calculators', href: '/calculators', icon: Calculator },
    { name: 'Lab Planner', href: '/planner', icon: Calendar },
    { name: 'Reagents', href: '/reagents', icon: Database },
    { name: 'Protocols', href: '/protocols', icon: FileText },
    { name: 'Data Visualizer', href: '/visualizer', icon: LineChart },
    { name: 'Notes & Reports', href: '/notes', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-900 flex font-sans transition-colors duration-200">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center h-16 px-6 border-b border-slate-100 dark:border-slate-700">
          <div className="bg-blue-600 p-1.5 rounded-lg mr-3">
            <Beaker className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-slate-900 dark:text-white font-bold text-lg tracking-tight leading-tight block">BioLab Pro</span>
            <span className="text-blue-600 dark:text-blue-400 text-[10px] font-medium uppercase tracking-wider block">Biochemistry Management</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    isActive 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Icon className={cn("mr-3 h-5 w-5 flex-shrink-0", location.pathname === item.href ? "text-white" : "text-slate-400 dark:text-slate-500")} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <NavLink
            to="/help"
            className={({ isActive }) => cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mb-2",
              isActive 
                ? "bg-blue-600 text-white shadow-sm" 
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <HelpCircle className={cn("mr-3 h-5 w-5 flex-shrink-0", location.pathname === '/help' ? "text-white" : "text-slate-400 dark:text-slate-500")} />
            Help Center
          </NavLink>
          <button
            onClick={handleLogOut}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-8 z-10 transition-colors duration-200">
          
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center animate-in fade-in slide-in-from-top-4">
              <Bell className="w-5 h-5 mr-3" />
              <span className="font-medium">{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="ml-4 text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center lg:hidden mr-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          <div className="flex-1 flex items-center">
            <div className="max-w-md w-full relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg leading-5 bg-slate-50 dark:bg-slate-700 placeholder-slate-400 dark:placeholder-slate-400 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="Search experiments, reagents, protocols..."
              />
            </div>
          </div>
          <div className="flex items-center space-x-4 relative">
            <div className="relative">
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); }}
                className="p-2 text-slate-400 dark:text-slate-300 hover:text-slate-500 dark:hover:text-white bg-slate-50 dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-600"
              >
                <Bell className="h-5 w-5" />
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                    No new notifications
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); }}
                className="p-2 text-slate-400 dark:text-slate-300 hover:text-slate-500 dark:hover:text-white bg-slate-50 dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-600"
              >
                <Settings className="h-5 w-5" />
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Settings</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">Dark Mode</span>
                      <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">Email Alerts</span>
                      <button 
                        onClick={() => setEmailAlerts(!emailAlerts)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${emailAlerts ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${emailAlerts ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">Local Storage Mode</span>
                      <button 
                        onClick={() => setStorageMode(storageMode === 'local' ? 'online' : 'local')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${storageMode === 'local' ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${storageMode === 'local' ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Encryption Key</label>
                      <input 
                        type="password" 
                        value={encryptionKey}
                        onChange={(e) => setEncryptionKey(e.target.value)}
                        placeholder="Leave empty to disable"
                        className="w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">Set a key to enable client-side encryption. Data cannot be recovered if lost.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
              <div className="hidden md:block text-right">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{user?.displayName || 'Dr. Researcher'}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Principal Investigator</div>
              </div>
              <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold overflow-hidden border border-slate-200 dark:border-slate-700">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user?.email?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
