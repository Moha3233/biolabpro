import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStorage } from '../contexts/StorageContext';
import { format, startOfWeek, addDays, isSameDay, startOfDay } from 'date-fns';
import { Plus, Trash2, CheckCircle, Circle, Calendar as CalendarIcon, Clock, CalendarDays, Flag } from 'lucide-react';
import MiniCalendar from '../components/MiniCalendar';

interface Task {
  id: string;
  title: string;
  date: Date;
  type: 'daily' | 'weekly' | 'monthly' | 'event';
  status: 'pending' | 'in-progress' | 'completed';
  completedDates?: string[];
  reminderTime?: string;
  emailNotification?: boolean;
}

export default function LabPlanner() {
  const { user } = useAuth();
  const { fetchCollection, createDoc, editDoc, removeDoc, storageMode } = useStorage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'daily' | 'weekly' | 'monthly' | 'event'>('daily');
  const [newTaskReminderTime, setNewTaskReminderTime] = useState('');
  const [newTaskEmailNotification, setNewTaskEmailNotification] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTasks();
  }, [user, storageMode]);

  const fetchTasks = async () => {
    try {
      const fetchedTasks = await fetchCollection('tasks');
      const formattedTasks = fetchedTasks.map(doc => ({
        ...doc,
        date: doc.date.toDate ? doc.date.toDate() : new Date(doc.date)
      })) as Task[];
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;

    try {
      const taskData: any = {
        title: newTaskTitle,
        date: selectedDate,
        type: newTaskType,
        status: 'pending'
      };
      if (newTaskReminderTime) taskData.reminderTime = newTaskReminderTime;
      if (newTaskEmailNotification) taskData.emailNotification = true;

      const newId = await createDoc('tasks', taskData);
      
      setTasks([...tasks, {
        id: newId,
        title: newTaskTitle,
        date: selectedDate,
        type: newTaskType,
        status: 'pending',
        reminderTime: newTaskReminderTime || undefined,
        emailNotification: newTaskEmailNotification || undefined
      }]);
      setNewTaskTitle('');
      setNewTaskReminderTime('');
      setNewTaskEmailNotification(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const completedDates = task.completedDates || [];
      const isCompletedOnDate = completedDates.includes(dateString);
      
      let newCompletedDates;
      if (isCompletedOnDate) {
        newCompletedDates = completedDates.filter(d => d !== dateString);
      } else {
        newCompletedDates = [...completedDates, dateString];
      }

      await editDoc('tasks', task.id, { 
        completedDates: newCompletedDates,
        status: newCompletedDates.length > 0 ? 'completed' : 'pending'
      });
      
      setTasks(tasks.map(t => t.id === task.id ? { 
        ...t, 
        completedDates: newCompletedDates,
        status: newCompletedDates.length > 0 ? 'completed' : 'pending'
      } : t));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await removeDoc('tasks', id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Calendar logic
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const isTaskOnDate = (task: Task, date: Date) => {
    const taskDate = startOfDay(task.date);
    const checkDate = startOfDay(date);

    if (isSameDay(taskDate, checkDate)) return true;
    if (checkDate < taskDate) return false;

    if (task.type === 'daily') return true;
    if (task.type === 'weekly') return taskDate.getDay() === checkDate.getDay();
    if (task.type === 'monthly') return taskDate.getDate() === checkDate.getDate();
    
    return false;
  };

  const isTaskCompletedOnDate = (task: Task, date: Date) => {
    if (task.completedDates && task.completedDates.includes(format(date, 'yyyy-MM-dd'))) {
      return true;
    }
    // Fallback for older tasks without completedDates
    if (!task.completedDates && task.status === 'completed' && isSameDay(task.date, date)) {
      return true;
    }
    return false;
  };

  const tasksForSelectedDate = tasks.filter(t => isTaskOnDate(t, selectedDate));
  const taskDates = tasks.map(t => t.date).filter(Boolean);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Clock className="w-3.5 h-3.5 mr-1" />;
      case 'weekly': return <CalendarDays className="w-3.5 h-3.5 mr-1" />;
      case 'monthly': return <CalendarIcon className="w-3.5 h-3.5 mr-1" />;
      case 'event': return <Flag className="w-3.5 h-3.5 mr-1" />;
      default: return <Clock className="w-3.5 h-3.5 mr-1" />;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Lab Planner</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your daily, weekly, and monthly laboratory tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar / Date Selector */}
        <div className="lg:col-span-1 space-y-6">
          <MiniCalendar 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate} 
            taskDates={taskDates} 
          />
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <Plus className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
              Add New Task
            </h3>
            <form onSubmit={addTask} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Task title..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-400"
                />
              </div>
              <div>
                <select
                  value={newTaskType}
                  onChange={e => setNewTaskType(e.target.value as any)}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="daily">Daily Task</option>
                  <option value="weekly">Weekly Task</option>
                  <option value="monthly">Monthly Task</option>
                  <option value="event">Special Event</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Reminder Time (Optional)</label>
                <input
                  type="time"
                  value={newTaskReminderTime}
                  onChange={e => setNewTaskReminderTime(e.target.value)}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div className="flex items-center">
                <input
                  id="email-notification"
                  type="checkbox"
                  checked={newTaskEmailNotification}
                  onChange={e => setNewTaskEmailNotification(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="email-notification" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">
                  Send Email Notification
                </label>
              </div>
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="w-full flex justify-center items-center bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to {format(selectedDate, 'MMM d')}
              </button>
            </form>
          </div>
        </div>

        {/* Task List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Tasks for {format(selectedDate, 'MMMM d, yyyy')}
            </h2>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
              {tasksForSelectedDate.length} {tasksForSelectedDate.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          
          {tasksForSelectedDate.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-600">
                <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No tasks scheduled</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">You have a clear schedule for this day. Add a new task using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {tasksForSelectedDate.map(task => {
                const isCompleted = isTaskCompletedOnDate(task, selectedDate);
                return (
                <div 
                  key={task.id} 
                  className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                    isCompleted 
                      ? 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <button 
                      onClick={() => toggleTaskStatus(task)} 
                      className={`flex-shrink-0 transition-colors ${
                        isCompleted 
                          ? 'text-green-500 hover:text-green-600' 
                          : 'text-slate-300 hover:text-blue-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate transition-colors ${
                        isCompleted ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'
                      }`}>
                        {task.title}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          task.type === 'event' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                          task.type === 'monthly' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                          task.type === 'weekly' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {getTypeIcon(task.type)}
                          {task.type}
                        </span>
                        {task.reminderTime && (
                          <span className="inline-flex items-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {task.reminderTime}
                          </span>
                        )}
                        {task.emailNotification && (
                          <span className="inline-flex items-center text-[10px] font-medium text-blue-500">
                            Email Alert
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)} 
                    className="flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete task"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
