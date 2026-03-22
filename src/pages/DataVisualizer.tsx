import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStorage } from '../contexts/StorageContext';
import Papa from 'papaparse';
import { 
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Upload, Trash2, Save, Plus, LineChart as LineChartIcon, Printer, Image as ImageIcon } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import * as htmlToImage from 'html-to-image';

interface Dataset {
  id: string;
  name: string;
  data: string; // JSON string
}

export default function DataVisualizer() {
  const { user } = useAuth();
  const { fetchCollection, createDoc, removeDoc, storageMode } = useStorage();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeData, setActiveData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'scatter'>('line');
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [yAxisKey, setYAxisKey] = useState<string>('');
  const [datasetName, setDatasetName] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchDatasets();
  }, [user, storageMode]);

  const fetchDatasets = async () => {
    try {
      const fetched = await fetchCollection('datasets');
      const datasetsData = fetched.map(doc => ({ ...doc })) as Dataset[];
      setDatasets(datasetsData);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setActiveData(results.data as any[]);
          const keys = Object.keys(results.data[0] as object);
          if (keys.length >= 2) {
            setXAxisKey(keys[0]);
            setYAxisKey(keys[1]);
          }
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
      }
    });
  };

  const saveDataset = async () => {
    if (!datasetName.trim() || activeData.length === 0 || !user) return;

    try {
      const dataString = JSON.stringify(activeData);
      if (dataString.length > 500000) {
        console.warn('Dataset is too large to save. Please reduce the size.');
        return;
      }

      const newId = await createDoc('datasets', {
        name: datasetName,
        data: dataString
      });
      
      setDatasets([...datasets, {
        id: newId,
        name: datasetName,
        data: dataString
      }]);
      
      setDatasetName('');
    } catch (error) {
      console.error('Error saving dataset:', error);
    }
  };

  const loadDataset = (dataset: Dataset) => {
    try {
      const parsed = JSON.parse(dataset.data);
      setActiveData(parsed);
      if (parsed.length > 0) {
        const keys = Object.keys(parsed[0]);
        if (keys.length >= 2) {
          setXAxisKey(keys[0]);
          setYAxisKey(keys[1]);
        }
      }
    } catch (e) {
      console.error('Failed to parse dataset JSON', e);
    }
  };

  const deleteDataset = async (id: string) => {
    try {
      await removeDoc('datasets', id);
      setDatasets(datasets.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting dataset:', error);
    }
  };

  const addManualDataPoint = () => {
    if (!xAxisKey || !yAxisKey) {
      console.warn('Please define X and Y axis keys first.');
      return;
    }
    const newPoint = { [xAxisKey]: 0, [yAxisKey]: 0 };
    setActiveData([...activeData, newPoint]);
  };

  const updateDataPoint = (index: number, key: string, value: string) => {
    const newData = [...activeData];
    newData[index] = { ...newData[index], [key]: isNaN(Number(value)) ? value : Number(value) };
    setActiveData(newData);
  };

  const removeDataPoint = (index: number) => {
    const newData = [...activeData];
    newData.splice(index, 1);
    setActiveData(newData);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNG = async () => {
    const element = document.getElementById('chart-content');
    if (element) {
      try {
        const dataUrl = await htmlToImage.toPng(element, { 
          backgroundColor: '#ffffff',
          pixelRatio: 2
        });
        const link = document.createElement('a');
        link.download = `${datasetName || 'chart'}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to generate PNG', error);
      }
    }
  };

  const dataKeys = activeData.length > 0 ? Object.keys(activeData[0]) : [];

  if (loading) return <div>Loading datasets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Data Visualizer</h1>
        <div className="flex space-x-3">
          <button onClick={handleDownloadPNG} className="flex items-center bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-2 px-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <ImageIcon className="w-5 h-5 mr-2" />
            Download PNG
          </button>
          <button onClick={handlePrint} className="flex items-center bg-slate-900 dark:bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors">
            <Printer className="w-5 h-5 mr-2" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Data Source</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Upload CSV</label>
                <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
                  <Upload className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-2" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Choose file</span>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {datasets.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Saved Datasets</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {datasets.map(dataset => (
                      <div key={dataset.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <button onClick={() => loadDataset(dataset)} className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[120px]">
                          {dataset.name}
                        </button>
                        <button onClick={() => deleteDataset(dataset.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {activeData.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Chart Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chart Type</label>
                  <select value={chartType} onChange={e => setChartType(e.target.value as any)} className="w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white">
                    <option value="line">Line Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="scatter">Scatter Plot</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">X-Axis</label>
                  <select value={xAxisKey} onChange={e => setXAxisKey(e.target.value)} className="w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white">
                    {dataKeys.map(key => <option key={key} value={key}>{key}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Y-Axis</label>
                  <select value={yAxisKey} onChange={e => setYAxisKey(e.target.value)} className="w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white">
                    {dataKeys.map(key => <option key={key} value={key}>{key}</option>)}
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Save Dataset</label>
                  <div className="flex space-x-2">
                    <input type="text" placeholder="Dataset name" value={datasetName} onChange={e => setDatasetName(e.target.value)} className="flex-1 rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" />
                    <button onClick={saveDataset} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Save className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart & Data Panel */}
        <div className="lg:col-span-3 space-y-6">
          {activeData.length > 0 ? (
            <>
              <div id="chart-content" className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={activeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey={xAxisKey} />
                      <YAxis />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Line type="monotone" dataKey={yAxisKey} stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  ) : chartType === 'bar' ? (
                    <BarChart data={activeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey={xAxisKey} />
                      <YAxis />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Bar dataKey={yAxisKey} fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey={xAxisKey} type="number" name={xAxisKey} />
                      <YAxis dataKey={yAxisKey} type="number" name={yAxisKey} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Scatter name={`${yAxisKey} vs ${xAxisKey}`} data={activeData} fill="#2563eb" />
                    </ScatterChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 print:hidden">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Data Editor</h2>
                  <button onClick={addManualDataPoint} className="flex items-center text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <Plus className="w-4 h-4 mr-1" /> Add Row
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        {dataKeys.map(key => (
                          <th key={key} className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{key}</th>
                        ))}
                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {activeData.map((row, index) => (
                        <tr key={index}>
                          {dataKeys.map(key => (
                            <td key={key} className="px-4 py-2 whitespace-nowrap">
                              <input 
                                type="text" 
                                value={row[key] !== undefined ? row[key] : ''} 
                                onChange={(e) => updateDataPoint(index, key, e.target.value)}
                                className="w-full border-transparent focus:border-blue-500 focus:ring-blue-500 sm:text-sm rounded-md p-1 dark:bg-slate-700 dark:text-white"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-2 whitespace-nowrap text-right">
                            <button onClick={() => removeDataPoint(index)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <LineChartIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Data Available</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                Upload a CSV file or select a saved dataset from the panel to start visualizing your data.
              </p>
              
              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 w-full max-w-sm">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Or start with manual entry:</p>
                <div className="flex space-x-2">
                  <input type="text" placeholder="X-Axis Name" value={xAxisKey} onChange={e => setXAxisKey(e.target.value)} className="flex-1 rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" />
                  <input type="text" placeholder="Y-Axis Name" value={yAxisKey} onChange={e => setYAxisKey(e.target.value)} className="flex-1 rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" />
                  <button onClick={() => {
                    if (xAxisKey && yAxisKey) {
                      setActiveData([{ [xAxisKey]: 0, [yAxisKey]: 0 }]);
                    }
                  }} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
