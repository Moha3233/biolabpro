import React, { useState } from 'react';
import { Beaker, Droplets, TestTube2 } from 'lucide-react';

type BufferType = 'phosphate' | 'acetate' | 'tris';

const BUFFER_RECIPES = {
  phosphate: {
    name: 'Phosphate Buffer',
    pKa: 7.21,
    acidName: 'Monosodium phosphate (NaH₂PO₄)',
    acidMw: 119.98,
    baseName: 'Disodium phosphate (Na₂HPO₄)',
    baseMw: 141.96,
    minPh: 5.8,
    maxPh: 8.0
  },
  acetate: {
    name: 'Acetate Buffer',
    pKa: 4.76,
    acidName: 'Acetic acid (CH₃COOH)',
    acidMw: 60.05,
    baseName: 'Sodium acetate (CH₃COONa)',
    baseMw: 82.03,
    minPh: 3.6,
    maxPh: 5.6
  },
  tris: {
    name: 'Tris Buffer',
    pKa: 8.06,
    acidName: 'Tris-HCl',
    acidMw: 157.60,
    baseName: 'Tris Base',
    baseMw: 121.14,
    minPh: 7.0,
    maxPh: 9.0
  }
};

export default function Calculators() {
  const [activeTab, setActiveTab] = useState<'dilution' | 'solution' | 'buffer'>('dilution');

  // Dilution State (C1V1 = C2V2)
  const [c1, setC1] = useState('');
  const [v1, setV1] = useState('');
  const [c2, setC2] = useState('');
  const [v2, setV2] = useState('');
  const [dilutionResult, setDilutionResult] = useState<string | null>(null);

  // Solution State (Mass = Molarity * Volume * MW)
  const [molarity, setMolarity] = useState('');
  const [volume, setVolume] = useState('');
  const [mw, setMw] = useState('');
  const [solutionResult, setSolutionResult] = useState<string | null>(null);

  // Buffer State
  const [selectedBuffer, setSelectedBuffer] = useState<BufferType>('phosphate');
  const [bufferVolume, setBufferVolume] = useState('');
  const [bufferMolarity, setBufferMolarity] = useState('');
  const [bufferPh, setBufferPh] = useState('');
  const [bufferRecipe, setBufferRecipe] = useState<{acidMass: number, baseMass: number} | null>(null);
  const [bufferError, setBufferError] = useState<string | null>(null);

  const calculateDilution = () => {
    const vals = [c1, v1, c2, v2].filter(v => v !== '');
    if (vals.length !== 3) {
      setDilutionResult('Please fill exactly 3 fields to calculate the 4th.');
      return;
    }
    
    const nc1 = parseFloat(c1);
    const nv1 = parseFloat(v1);
    const nc2 = parseFloat(c2);
    const nv2 = parseFloat(v2);

    if (!c1) setDilutionResult(`C1 = ${(nc2 * nv2) / nv1}`);
    else if (!v1) setDilutionResult(`V1 = ${(nc2 * nv2) / nc1}`);
    else if (!c2) setDilutionResult(`C2 = ${(nc1 * nv1) / nv2}`);
    else if (!v2) setDilutionResult(`V2 = ${(nc1 * nv1) / nc2}`);
  };

  const calculateSolution = () => {
    if (!molarity || !volume || !mw) {
      setSolutionResult('Please fill all fields.');
      return;
    }
    const mass = parseFloat(molarity) * parseFloat(volume) * parseFloat(mw);
    setSolutionResult(`Required Mass = ${mass.toFixed(4)} g`);
  };

  const calculateBufferRecipe = () => {
    setBufferError(null);
    setBufferRecipe(null);

    if (!bufferVolume || !bufferMolarity || !bufferPh) {
      setBufferError('Please fill all fields.');
      return;
    }

    const vol = parseFloat(bufferVolume);
    const mol = parseFloat(bufferMolarity);
    const phVal = parseFloat(bufferPh);
    const data = BUFFER_RECIPES[selectedBuffer];

    if (phVal < data.minPh || phVal > data.maxPh) {
      setBufferError(`For ${data.name}, pH should be between ${data.minPh} and ${data.maxPh}.`);
      return;
    }

    const ratio = Math.pow(10, phVal - data.pKa);
    const acidMolarity = mol / (1 + ratio);
    const baseMolarity = mol - acidMolarity;

    const acidMass = acidMolarity * vol * data.acidMw;
    const baseMass = baseMolarity * vol * data.baseMw;

    setBufferRecipe({ acidMass, baseMass });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Lab Calculators</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quick tools for daily laboratory calculations</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('dilution')}
          className={`flex items-center px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dilution' ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 rounded-t-lg' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t-lg'}`}
        >
          <Droplets className="w-4 h-4 mr-2" />
          Dilution (C1V1 = C2V2)
        </button>
        <button
          onClick={() => setActiveTab('solution')}
          className={`flex items-center px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'solution' ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 rounded-t-lg' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t-lg'}`}
        >
          <Beaker className="w-4 h-4 mr-2" />
          Solution Preparation
        </button>
        <button
          onClick={() => setActiveTab('buffer')}
          className={`flex items-center px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'buffer' ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 rounded-t-lg' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t-lg'}`}
        >
          <TestTube2 className="w-4 h-4 mr-2" />
          Buffer Preparation
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-2xl">
        {activeTab === 'dilution' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dilution Calculator</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Leave one field empty to calculate its value.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">C1 (Initial Conc.)</label>
                <input type="number" value={c1} onChange={e => setC1(e.target.value)} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="e.g. 10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">V1 (Initial Vol.)</label>
                <input type="number" value={v1} onChange={e => setV1(e.target.value)} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="e.g. 5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">C2 (Final Conc.)</label>
                <input type="number" value={c2} onChange={e => setC2(e.target.value)} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="e.g. 2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">V2 (Final Vol.)</label>
                <input type="number" value={v2} onChange={e => setV2(e.target.value)} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="e.g. 25" />
              </div>
            </div>
            <button onClick={calculateDilution} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">Calculate</button>
            {dilutionResult && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg font-mono text-center text-lg border border-blue-100 dark:border-blue-800/50 shadow-inner">
                {dilutionResult}
              </div>
            )}
          </div>
        )}

        {activeTab === 'solution' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Solution Preparation</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Calculate the required mass for a specific molarity and volume.</p>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Desired Molarity (mol/L)</label>
                <input type="number" value={molarity} onChange={e => setMolarity(e.target.value)} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="e.g. 0.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Desired Volume (L)</label>
                <input type="number" value={volume} onChange={e => setVolume(e.target.value)} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Molecular Weight (g/mol)</label>
                <input type="number" value={mw} onChange={e => setMw(e.target.value)} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="e.g. 58.44" />
              </div>
            </div>
            <button onClick={calculateSolution} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">Calculate Mass</button>
            {solutionResult && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg font-mono text-center text-lg border border-blue-100 dark:border-blue-800/50 shadow-inner">
                {solutionResult}
              </div>
            )}
          </div>
        )}

        {activeTab === 'buffer' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Standard Buffer Recipes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Calculate the required ingredients for standard buffers based on desired pH and molarity.</p>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Buffer Type</label>
                <select 
                  value={selectedBuffer} 
                  onChange={e => {
                    setSelectedBuffer(e.target.value as BufferType);
                    setBufferPh('');
                    setBufferRecipe(null);
                    setBufferError(null);
                  }} 
                  className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors bg-white dark:bg-slate-700 dark:text-white"
                >
                  <option value="phosphate">Phosphate Buffer (pH 5.8 - 8.0)</option>
                  <option value="acetate">Acetate Buffer (pH 3.6 - 5.6)</option>
                  <option value="tris">Tris Buffer (pH 7.0 - 9.0)</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Desired Volume (L)</label>
                  <input type="number" value={bufferVolume} onChange={e => setBufferVolume(e.target.value)} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="e.g. 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Desired Molarity (M)</label>
                  <input type="number" value={bufferMolarity} onChange={e => setBufferMolarity(e.target.value)} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="e.g. 0.1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Desired pH</label>
                  <input type="number" value={bufferPh} onChange={e => setBufferPh(e.target.value)} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border transition-colors dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder={`e.g. ${BUFFER_RECIPES[selectedBuffer].pKa}`} />
                </div>
              </div>
            </div>
            <button onClick={calculateBufferRecipe} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">Calculate Recipe</button>
            
            {bufferError && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-sm border border-red-100 dark:border-red-800/50">
                {bufferError}
              </div>
            )}

            {bufferRecipe && (
              <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Required Ingredients</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{BUFFER_RECIPES[selectedBuffer].acidName}</span>
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">{bufferRecipe.acidMass.toFixed(3)} g</span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{BUFFER_RECIPES[selectedBuffer].baseName}</span>
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">{bufferRecipe.baseMass.toFixed(3)} g</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-600 text-sm text-slate-500 dark:text-slate-400">
                    <p>Dissolve the above ingredients in approx. 80% of the final volume of distilled water. Adjust pH if necessary, then add water to reach exactly {bufferVolume} L.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
