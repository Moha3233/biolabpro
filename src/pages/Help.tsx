import React from 'react';

export default function Help() {
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Help & Documentation</h1>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Dashboard</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            The dashboard provides a quick overview of your daily tasks, recent protocols, and low reagent alerts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Calculators</h2>
          <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 text-sm space-y-1">
            <li><strong>Dilution:</strong> Uses the C1V1 = C2V2 formula. Leave the unknown value blank.</li>
            <li><strong>Solution Preparation:</strong> Calculates required mass based on Molarity, Volume, and Molecular Weight.</li>
            <li><strong>Buffer Preparation:</strong> Select a standard buffer type (e.g., Phosphate, Acetate, Tris), input the desired volume, molarity, and pH to calculate the required mass of acidic and basic components.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Lab Planner</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Manage your daily, weekly, and monthly tasks. You can add new tasks, mark them as completed, or delete them.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Protocol Generator</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Create standardized experiment logs. Fill in the aim, procedure, and results. You can print the protocol directly from the app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Reagent Tracker</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Keep track of your lab inventory. Add new reagents, update quantities, and track their storage locations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Data Visualizer</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Upload CSV files or manually enter data to generate Line, Bar, or Scatter plots. You can save your datasets for future use.
          </p>
        </section>
      </div>
    </div>
  );
}
