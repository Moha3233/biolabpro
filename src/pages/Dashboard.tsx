import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStorage } from '../contexts/StorageContext';
import { Calendar, FileText, Database, Clock, ChevronRight, AlertTriangle, Droplets, Beaker, ExternalLink, ClipboardList, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import MiniCalendar from '../components/MiniCalendar';

interface Task {
  id: string;
  title: string;
  date: any;
  type: string;
  status: string;
  completedDates?: string[];
}

interface Protocol {
  id: string;
  title: string;
  createdAt: any;
}

interface Reagent {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Note {
  id: string;
  title: string;
  type: string;
  createdAt: any;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { fetchCollection, storageMode } = useStorage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const targetDate = new Date(selectedDate);
        targetDate.setHours(0, 0, 0, 0);

        const tasksData = await fetchCollection('tasks');
        const parsedTasks = tasksData.map(doc => ({ ...doc } as Task));
        setAllTasks(parsedTasks);

        const tasksForDate = parsedTasks.filter(task => {
          if (!task.date) return false;
          const taskDate = task.date.toDate ? task.date.toDate() : new Date(task.date);
          taskDate.setHours(0, 0, 0, 0);
          
          if (taskDate.getTime() === targetDate.getTime()) return true;
          if (targetDate < taskDate) return false;
          
          if (task.type === 'daily') return true;
          if (task.type === 'weekly') return taskDate.getDay() === targetDate.getDay();
          if (task.type === 'monthly') return taskDate.getDate() === targetDate.getDate();
          
          return false;
        });
        setTasks(tasksForDate);

        // Fetch recent protocols
        const protocolsData = await fetchCollection('protocols');
        const recentProtocols = protocolsData
          .map(doc => ({ ...doc } as Protocol))
          .sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return (timeB || 0) - (timeA || 0);
          })
          .slice(0, 5);
        setProtocols(recentProtocols);

        // Fetch low reagents (assuming quantity < 10 is low)
        const reagentsData = await fetchCollection('reagents');
        const lowReagents = reagentsData
          .map(doc => ({ ...doc } as Reagent))
          .filter(reagent => reagent.quantity < 10);
        setReagents(lowReagents);

        // Fetch recent notes
        const notesData = await fetchCollection('notes');
        const recentNotes = notesData
          .map(doc => ({ ...doc } as Note))
          .sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return (timeB || 0) - (timeA || 0);
          })
          .slice(0, 3);
        setNotes(recentNotes);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, storageMode]);

  if (loading) return <div className="text-slate-900 dark:text-white">Loading dashboard...</div>;

  const firstName = user?.displayName?.split(' ')[0] || 'Researcher';

  const taskDates = allTasks.map(t => t.date?.toDate ? t.date.toDate() : new Date(t.date)).filter(Boolean);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back, Dr. {firstName}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's an overview of your laboratory's activity for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.</p>
        </div>
        <Link to="/protocols" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
          <span className="mr-2">+</span> New Experiment
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Experiments */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center text-slate-800 dark:text-white font-semibold">
                <Calendar className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Tasks for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full">
                {tasks.filter(t => {
                  const targetDate = new Date(selectedDate);
                  const year = targetDate.getFullYear();
                  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
                  const day = String(targetDate.getDate()).padStart(2, '0');
                  const dateString = `${year}-${month}-${day}`;
                  if (t.completedDates && t.completedDates.includes(dateString)) return false;
                  if (!t.completedDates && t.status === 'completed' && t.date) {
                    const taskDate = t.date.toDate ? t.date.toDate() : new Date(t.date);
                    if (taskDate.getFullYear() === year && taskDate.getMonth() === targetDate.getMonth() && taskDate.getDate() === targetDate.getDate()) {
                      return false;
                    }
                  }
                  return true;
                }).length} Active
              </span>
            </div>
            {tasks.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">No tasks scheduled for this date.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {tasks.map(task => {
                  const targetDate = new Date(selectedDate);
                  const year = targetDate.getFullYear();
                  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
                  const day = String(targetDate.getDate()).padStart(2, '0');
                  const dateString = `${year}-${month}-${day}`;
                  
                  let isCompleted = false;
                  if (task.completedDates && task.completedDates.includes(dateString)) {
                    isCompleted = true;
                  } else if (!task.completedDates && task.status === 'completed' && task.date) {
                    const taskDate = task.date.toDate ? task.date.toDate() : new Date(task.date);
                    if (taskDate.getFullYear() === year && taskDate.getMonth() === targetDate.getMonth() && taskDate.getDate() === targetDate.getDate()) {
                      isCompleted = true;
                    }
                  }

                  return (
                  <div key={task.id} className="p-6 flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className={`text-lg font-bold ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{task.title}</h3>
                          <Link to="/planner" className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">View Planner</Link>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Type: <span className="capitalize">{task.type}</span> • Status: <span className="capitalize">{isCompleted ? 'Completed' : 'Pending'}</span></p>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>

          {/* Recent Protocols */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center text-slate-800 dark:text-white font-semibold">
              <Clock className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Recent Protocols
            </div>
            {protocols.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">No recent protocols found.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700 p-2">
                {protocols.map(protocol => (
                  <Link key={protocol.id} to="/protocols" className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mr-4 group-hover:bg-white dark:group-hover:bg-slate-600 group-hover:shadow-sm transition-all">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{protocol.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Created on {protocol.createdAt ? (protocol.createdAt.toDate ? protocol.createdAt.toDate().toLocaleDateString() : protocol.createdAt.toMillis ? new Date(protocol.createdAt.toMillis()).toLocaleDateString() : new Date(protocol.createdAt).toLocaleDateString()) : 'Unknown'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-300" />
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="space-y-6">
          
          {/* Mini Calendar */}
          <MiniCalendar 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate} 
            taskDates={taskDates} 
          />

          {/* Recent Notes */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between text-slate-800 dark:text-white font-semibold">
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Recent Notes
              </div>
              <Link to="/notes" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View All</Link>
            </div>
            {notes.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">No recent notes.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700 p-2">
                {notes.map(note => (
                  <Link key={note.id} to="/notes" className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group">
                    <div className="flex items-center truncate pr-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mr-3 group-hover:bg-white dark:group-hover:bg-slate-600 group-hover:shadow-sm transition-all shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{note.title}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">{note.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-300 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Calculators */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 p-5">
            <h3 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-4">Quick Action Calculators</h3>
            <div className="space-y-3">
              <Link to="/calculators" className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-blue-100/50 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow group">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dilution Calculator</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">C1V1 = C2V2 formula</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
              </Link>

              <Link to="/calculators" className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-blue-100/50 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow group">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3">
                    <Beaker className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Buffer Preparator</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">pH & Concentration</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
              </Link>
            </div>
          </div>

          {/* Reagent Alerts */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Reagent Alerts</h3>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            
            {reagents.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-400 text-sm py-4">All reagents are sufficiently stocked.</div>
            ) : (
              <div className="space-y-5">
                {reagents.map(reagent => (
                  <div key={reagent.id}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{reagent.name}</span>
                      <span className={`text-sm font-bold ${reagent.quantity <= 5 ? 'text-red-600 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'}`}>
                        {reagent.quantity} {reagent.unit} left
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${reagent.quantity <= 5 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.max(5, (reagent.quantity / 10) * 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link to="/reagents" className="block text-center w-full py-2.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors border border-slate-200 dark:border-slate-600 mt-4">
              Manage Reagents
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

