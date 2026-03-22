import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStorage } from '../contexts/StorageContext';
import { Plus, Trash2, ChevronLeft, Calendar, FileText, FlaskConical, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  content: string;
  type: 'daily_report' | 'experiment_result' | 'general';
  date: any;
  createdAt: any;
}

const safeFormatDate = (dateObj: any, formatStr: string) => {
  if (!dateObj) return '';
  try {
    let d;
    if (typeof dateObj.toDate === 'function') {
      d = dateObj.toDate();
    } else if (typeof dateObj.toMillis === 'function') {
      d = new Date(dateObj.toMillis());
    } else {
      d = new Date(dateObj);
    }
    
    if (isNaN(d.getTime())) return '';
    return format(d, formatStr);
  } catch (e) {
    return '';
  }
};

export default function Notes() {
  const { user } = useAuth();
  const { fetchCollection, createDoc, editDoc, removeDoc, storageMode } = useStorage();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewState, setViewState] = useState<'list' | 'create' | 'view' | 'edit'>('list');
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'daily_report' | 'experiment_result' | 'general'>('daily_report');

  useEffect(() => {
    if (!user) return;
    fetchNotes();
  }, [user, storageMode]);

  const fetchNotes = async () => {
    try {
      const fetched = await fetchCollection('notes');
      const notesData = fetched.map(doc => ({ ...doc })) as Note[];
      setNotes(notesData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
        return (timeB || 0) - (timeA || 0);
      }));
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) return;

    try {
      if (viewState === 'edit' && activeNote) {
        await editDoc('notes', activeNote.id, {
          title,
          content,
          type
        });
        
        const updatedNote = {
          ...activeNote,
          title,
          content,
          type
        };
        
        setNotes(notes.map(n => n.id === activeNote.id ? updatedNote : n));
        setActiveNote(updatedNote);
        setViewState('view');
      } else {
        const newId = await createDoc('notes', {
          title,
          content,
          type,
          date: new Date()
        });
        
        const newNote = {
          id: newId,
          title, content, type, date: new Date(),
          createdAt: { toDate: () => new Date(), toMillis: () => Date.now() }
        };
        
        setNotes([newNote, ...notes]);
        setViewState('list');
      }
      
      // Reset form
      setTitle(''); setContent(''); setType('daily_report');
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeDoc('notes', id);
      setNotes(notes.filter(n => n.id !== id));
      if (activeNote?.id === id) {
        setViewState('list');
        setActiveNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getTypeIcon = (noteType: string) => {
    switch (noteType) {
      case 'daily_report': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'experiment_result': return <FlaskConical className="w-4 h-4 text-emerald-500" />;
      default: return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTypeLabel = (noteType: string) => {
    switch (noteType) {
      case 'daily_report': return 'Daily Report';
      case 'experiment_result': return 'Experiment Result';
      default: return 'General Note';
    }
  };

  if (loading) return <div>Loading notes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Notes & Reports</h1>
        {viewState === 'list' ? (
          <button
            onClick={() => {
              setTitle('');
              setContent('');
              setType('daily_report');
              setViewState('create');
            }}
            className="flex items-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </button>
        ) : (
          <button
            onClick={() => setViewState('list')}
            className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to List
          </button>
        )}
      </div>

      {viewState === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map(note => (
            <div 
              key={note.id} 
              onClick={() => { setActiveNote(note); setViewState('view'); }}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-colors group relative flex flex-col h-48"
            >
              <div className="flex items-center space-x-2 mb-3">
                {getTypeIcon(note.type)}
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {getTypeLabel(note.type)}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 truncate pr-8">{note.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 flex-1">{note.content}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-400">
                <span>
                  {safeFormatDate(note.createdAt, 'MMM d, yyyy')}
                </span>
              </div>

              <button 
                onClick={(e) => deleteNote(note.id, e)}
                className="absolute top-4 right-4 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-dashed">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No notes yet</h3>
              <p className="text-slate-500 dark:text-slate-400">Create your first daily report or experiment result.</p>
            </div>
          )}
        </div>
      )}

      {(viewState === 'create' || viewState === 'edit') && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:p-8 max-w-4xl mx-auto">
          <form onSubmit={saveNote} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                <input 
                  type="text" 
                  required
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full rounded-xl border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., Weekly Lab Meeting Notes or PCR Results"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value as any)} 
                  className="w-full rounded-xl border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border dark:bg-slate-700 dark:text-white"
                >
                  <option value="daily_report">Daily Report</option>
                  <option value="experiment_result">Experiment Result</option>
                  <option value="general">General Note</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Content</label>
              <textarea 
                required
                rows={12}
                value={content} 
                onChange={e => setContent(e.target.value)} 
                className="w-full rounded-xl border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border dark:bg-slate-700 dark:text-white font-mono text-sm"
                placeholder="Write your notes, observations, or results here..."
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                type="button" 
                onClick={() => {
                  if (viewState === 'edit') {
                    setViewState('view');
                  } else {
                    setViewState('list');
                  }
                }}
                className="mr-4 px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-blue-600 text-white py-2 px-6 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                {viewState === 'edit' ? 'Update Note' : 'Save Note'}
              </button>
            </div>
          </form>
        </div>
      )}

      {viewState === 'view' && activeNote && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 max-w-4xl mx-auto relative">
          <div className="absolute top-8 right-8 flex items-center space-x-2 print:hidden">
            <button 
              onClick={() => {
                setTitle(activeNote.title);
                setContent(activeNote.content);
                setType(activeNote.type);
                setViewState('edit');
              }}
              className="text-slate-400 hover:text-blue-500 transition-colors p-2"
              title="Edit Note"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => deleteNote(activeNote.id, e)}
              className="text-slate-400 hover:text-red-500 transition-colors p-2"
              title="Delete Note"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2 mb-6">
            {getTypeIcon(activeNote.type)}
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {getTypeLabel(activeNote.type)}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {safeFormatDate(activeNote.createdAt, 'MMMM d, yyyy')}
            </span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 pb-6 border-b border-slate-100 dark:border-slate-700">
            {activeNote.title}
          </h2>

          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 bg-transparent p-0 m-0 border-0">
              {activeNote.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
