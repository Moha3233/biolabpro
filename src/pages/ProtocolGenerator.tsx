import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStorage } from '../contexts/StorageContext';
import { Plus, Printer, Trash2, ChevronLeft } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface Protocol {
  id: string;
  title: string;
  aim: string;
  reagents: string;
  procedure: string;
  observation: string;
  note: string;
  result: string;
  createdAt: any;
}

export default function ProtocolGenerator() {
  const { user } = useAuth();
  const { fetchCollection, createDoc, removeDoc, storageMode } = useStorage();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewState, setViewState] = useState<'list' | 'create' | 'view'>('list');
  const [activeProtocol, setActiveProtocol] = useState<Protocol | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [aim, setAim] = useState('');
  const [reagents, setReagents] = useState('');
  const [procedure, setProcedure] = useState('');
  const [observation, setObservation] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchProtocols();
  }, [user, storageMode]);

  const fetchProtocols = async () => {
    try {
      const fetched = await fetchCollection('protocols');
      const protocolsData = fetched.map(doc => ({ ...doc })) as Protocol[];
      setProtocols(protocolsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
        return (timeB || 0) - (timeA || 0);
      }));
    } catch (error) {
      console.error('Error fetching protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !aim.trim() || !user) return;

    try {
      const newId = await createDoc('protocols', {
        title,
        aim,
        reagents,
        procedure,
        observation,
        note,
        result
      });
      
      const newProtocol = {
        id: newId,
        title, aim, reagents, procedure, observation, note, result,
        createdAt: { toMillis: () => Date.now() }
      };
      
      setProtocols([newProtocol, ...protocols]);
      setViewState('list');
      
      // Reset form
      setTitle(''); setAim(''); setReagents(''); setProcedure('');
      setObservation(''); setNote(''); setResult('');
    } catch (error) {
      console.error('Error creating protocol:', error);
    }
  };

  const deleteProtocol = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeDoc('protocols', id);
      setProtocols(protocols.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting protocol:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div>Loading protocols...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Protocol Generator</h1>
        {viewState === 'list' ? (
          <button
            onClick={() => setViewState('create')}
            className="flex items-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Protocol
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
          {protocols.map(protocol => (
            <div 
              key={protocol.id} 
              onClick={() => { setActiveProtocol(protocol); setViewState('view'); }}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-colors group relative"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 truncate pr-8">{protocol.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{protocol.aim}</p>
              
              <button 
                onClick={(e) => deleteProtocol(protocol.id, e)}
                className="absolute top-4 right-4 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {protocols.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              No protocols found. Create your first one!
            </div>
          )}
        </div>
      )}

      {viewState === 'create' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 max-w-4xl mx-auto">
          <form onSubmit={saveProtocol} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Project Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Aim</label>
              <textarea required rows={3} value={aim} onChange={e => setAim(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reagents / Apparatus</label>
              <textarea rows={4} value={reagents} onChange={e => setReagents(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="List reagents and equipment needed..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Procedure (Bullet points)</label>
              <textarea rows={6} value={procedure} onChange={e => setProcedure(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="1. First step...&#10;2. Second step..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Observation</label>
              <textarea rows={4} value={observation} onChange={e => setObservation(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Result</label>
              <textarea rows={3} value={result} onChange={e => setResult(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white" />
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <button type="submit" className="bg-slate-900 dark:bg-slate-700 text-white py-2 px-6 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors">
                Save Protocol
              </button>
            </div>
          </form>
        </div>
      )}

      {viewState === 'view' && activeProtocol && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:bg-white">
          <div className="flex justify-end mb-6 print:hidden">
            <button onClick={handlePrint} className="flex items-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Printer className="w-5 h-5 mr-2" />
              Download PDF
            </button>
          </div>

          <div id="protocol-content" className="space-y-8 print:space-y-6">
            <div className="border-b-2 border-slate-800 dark:border-slate-600 pb-4">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white print:text-black">{activeProtocol.title}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 print:text-gray-600 mt-2">
                Generated by {user?.email} on {activeProtocol.createdAt ? (activeProtocol.createdAt.toDate ? activeProtocol.createdAt.toDate().toLocaleDateString() : activeProtocol.createdAt.toMillis ? new Date(activeProtocol.createdAt.toMillis()).toLocaleDateString() : new Date(activeProtocol.createdAt).toLocaleDateString()) : new Date().toLocaleDateString()}
              </p>
            </div>

            <section>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 print:text-black mb-2">Aim</h2>
              <p className="text-slate-700 dark:text-slate-300 print:text-black whitespace-pre-wrap">{activeProtocol.aim}</p>
            </section>

            {activeProtocol.reagents && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 print:text-black mb-2">Reagents & Apparatus</h2>
                <p className="text-slate-700 dark:text-slate-300 print:text-black whitespace-pre-wrap">{activeProtocol.reagents}</p>
              </section>
            )}

            {activeProtocol.procedure && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 print:text-black mb-2">Procedure</h2>
                <p className="text-slate-700 dark:text-slate-300 print:text-black whitespace-pre-wrap">{activeProtocol.procedure}</p>
              </section>
            )}

            {activeProtocol.observation && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 print:text-black mb-2">Observations</h2>
                <p className="text-slate-700 dark:text-slate-300 print:text-black whitespace-pre-wrap">{activeProtocol.observation}</p>
              </section>
            )}

            {activeProtocol.result && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 print:text-black mb-2">Result</h2>
                <p className="text-slate-700 dark:text-slate-300 print:text-black whitespace-pre-wrap">{activeProtocol.result}</p>
              </section>
            )}

            {activeProtocol.note && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 print:text-black mb-2">Notes</h2>
                <p className="text-slate-700 dark:text-slate-300 print:text-black whitespace-pre-wrap">{activeProtocol.note}</p>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
