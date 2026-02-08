import React from 'react';

interface InputPanelProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder,
  readOnly = false 
}) => {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">{label}</h3>
        <span className="text-xs text-slate-400 font-mono">{value.length} chars</span>
      </div>
      <textarea
        className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/50 bg-white text-slate-800 custom-scrollbar"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        spellCheck={false}
      />
    </div>
  );
};
