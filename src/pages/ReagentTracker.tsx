import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStorage } from '../contexts/StorageContext';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface Reagent {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: string;
}

export default function ReagentTracker() {
  const { user } = useAuth();
  const { fetchCollection, createDoc, editDoc, removeDoc, storageMode } = useStorage();
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newUnit, setNewUnit] = useState('mL');
  const [newLocation, setNewLocation] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchReagents();
  }, [user, storageMode]);

  const fetchReagents = async () => {
    try {
      const fetched = await fetchCollection('reagents');
      const reagentsData = fetched.map(doc => ({ ...doc })) as Reagent[];
      setReagents(reagentsData);
    } catch (error) {
      console.error('Error fetching reagents:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReagent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newQuantity || !newLocation.trim() || !user) return;

    try {
      const newId = await createDoc('reagents', {
        name: newName,
        quantity: parseFloat(newQuantity),
        unit: newUnit,
        location: newLocation
      });
      
      setReagents([...reagents, {
        id: newId,
        name: newName,
        quantity: parseFloat(newQuantity),
        unit: newUnit,
        location: newLocation
      }]);
      
      setNewName('');
      setNewQuantity('');
      setNewLocation('');
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding reagent:', error);
    }
  };

  const updateQuantity = async (id: string) => {
    try {
      const qty = parseFloat(editQuantity);
      if (isNaN(qty) || qty < 0) return;

      await editDoc('reagents', id, { quantity: qty });
      setReagents(reagents.map(r => r.id === id ? { ...r, quantity: qty } : r));
      setEditingId(null);
    } catch (error) {
      console.error('Error updating reagent quantity:', error);
    }
  };

  const deleteReagent = async (id: string) => {
    try {
      await removeDoc('reagents', id);
      setReagents(reagents.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting reagent:', error);
    }
  };

  if (loading) return <div>Loading inventory...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reagent Tracker</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Add Reagent'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-slate-700">
          <form onSubmit={addReagent} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reagent Name</label>
              <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</label>
              <input type="number" step="0.01" required value={newQuantity} onChange={e => setNewQuantity(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Unit</label>
              <select value={newUnit} onChange={e => setNewUnit(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white">
                <option value="mL">mL</option>
                <option value="L">L</option>
                <option value="mg">mg</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="units">units</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
              <input type="text" required value={newLocation} onChange={e => setNewLocation(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white" />
            </div>
            <div className="md:col-span-5 flex justify-end mt-4">
              <button type="submit" className="bg-slate-900 dark:bg-slate-700 text-white py-2 px-6 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors">
                Save Reagent
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {reagents.map(reagent => (
              <tr key={reagent.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-slate-900 dark:text-white">{reagent.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === reagent.id ? (
                    <div className="flex items-center space-x-2">
                      <input 
                        type="number" 
                        step="0.01"
                        value={editQuantity} 
                        onChange={e => setEditQuantity(e.target.value)}
                        className="w-20 rounded border-slate-300 dark:border-slate-600 p-1 text-sm border dark:bg-slate-700 dark:text-white"
                      />
                      <span className="text-sm text-slate-500 dark:text-slate-400">{reagent.unit}</span>
                      <button onClick={() => updateQuantity(reagent.id)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${reagent.quantity < 10 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {reagent.quantity} {reagent.unit}
                      </span>
                      <button 
                        onClick={() => { setEditingId(reagent.id); setEditQuantity(reagent.quantity.toString()); }}
                        className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                  {reagent.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => deleteReagent(reagent.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {reagents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No reagents found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
