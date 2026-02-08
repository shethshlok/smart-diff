import React, { useState, useEffect } from 'react';
import { ViewMode } from './types';
import { InputPanel } from './components/InputPanel';
import { DiffViewer } from './components/DiffViewer';
import { Button } from './components/Button';
import { summarizeDiff } from './services/geminiService';
import { 
  Split, 
  Combine, 
  Trash2, 
  Sparkles, 
  ArrowRightLeft, 
  Copy,
  FileText
} from 'lucide-react';

// Sample data for quick testing
const SAMPLE_ORIGINAL = `{
  "name": "Smart Diff",
  "version": "1.0.0",
  "features": [
    "Text Comparison",
    "Syntax Highlighting"
  ],
  "active": true
}`;

const SAMPLE_CHANGED = `{
  "name": "Smart Diff Checker",
  "version": "1.1.0",
  "features": [
    "Text Comparison",
    "Syntax Highlighting",
    "AI Summarization"
  ],
  "active": true,
  "author": "React Dev"
}`;

const App: React.FC = () => {
  const [originalText, setOriginalText] = useState('');
  const [changedText, setChangedText] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SPLIT);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleCompare = () => {
    setShowDiff(true);
    // Reset AI summary when text changes/re-compares
    setAiSummary(null);
  };

  const handleClear = () => {
    setOriginalText('');
    setChangedText('');
    setShowDiff(false);
    setAiSummary(null);
  };

  const handleSample = () => {
    setOriginalText(SAMPLE_ORIGINAL);
    setChangedText(SAMPLE_CHANGED);
    setShowDiff(false);
    setAiSummary(null);
  };

  const handleAiSummary = async () => {
    if (!originalText && !changedText) return;
    setIsAiLoading(true);
    const summary = await summarizeDiff(originalText, changedText);
    setAiSummary(summary);
    setIsAiLoading(false);
  };

  // Sticky Header Logic
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <header className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 py-3 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">DiffChecker<span className="text-blue-600">Pro</span></h1>
              <p className="text-xs text-slate-500 hidden sm:block">Compare text files smartly</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!showDiff && (
               <Button variant="ghost" size="sm" onClick={handleSample} icon={<FileText className="w-4 h-4" />}>
                 Load Sample
               </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={!originalText && !changedText} icon={<Trash2 className="w-4 h-4" />}>
              Clear
            </Button>
            <Button 
              onClick={handleCompare} 
              disabled={!originalText && !changedText || showDiff}
              className={showDiff ? 'opacity-50' : ''}
              size="sm"
            >
              Compare
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        
        {/* Editor Area - Only show if not comparing OR show as reference at top? 
            Better UX: If !showDiff, show inputs. If showDiff, show inputs collapsed or replace with diff. 
            Standard DiffChecker behavior: Inputs disappear, replaced by Diff result. 
            We'll follow that pattern but allow editing by clicking "Edit".
        */}

        {!showDiff ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px]">
            <InputPanel 
              label="Original Text" 
              value={originalText} 
              onChange={setOriginalText} 
              placeholder="Paste original text here..."
            />
            <InputPanel 
              label="Changed Text" 
              value={changedText} 
              onChange={setChangedText}
              placeholder="Paste modified text here..." 
            />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Toolbar for Diff View */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm gap-4">
              <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode(ViewMode.SPLIT)}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.SPLIT ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Split className="w-4 h-4 mr-2" /> Split
                </button>
                <button
                  onClick={() => setViewMode(ViewMode.UNIFIED)}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.UNIFIED ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Combine className="w-4 h-4 mr-2" /> Unified
                </button>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                 <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setShowDiff(false)}
                  className="w-full sm:w-auto"
                 >
                   Edit Text
                 </Button>
                 <Button 
                   variant={aiSummary ? "ghost" : "primary"}
                   size="sm" 
                   icon={<Sparkles className="w-4 h-4" />}
                   onClick={handleAiSummary}
                   isLoading={isAiLoading}
                   className={`w-full sm:w-auto ${aiSummary ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-transparent' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                 >
                   {aiSummary ? 'Regenerate Summary' : 'AI Explanation'}
                 </Button>
              </div>
            </div>

            {/* AI Summary Section */}
            {aiSummary && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-sm animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Sparkles className="w-24 h-24 text-indigo-600" />
                </div>
                <h3 className="text-indigo-900 font-semibold mb-2 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-indigo-600" /> 
                  AI Analysis
                </h3>
                <div className="prose prose-sm prose-indigo max-w-none text-indigo-800/90 whitespace-pre-wrap">
                  {aiSummary}
                </div>
              </div>
            )}

            {/* Diff Viewer */}
            <DiffViewer 
              originalText={originalText} 
              changedText={changedText} 
              viewMode={viewMode} 
            />
          </div>
        )}

      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-slate-500 text-sm">
          <p>Powered by React, Tailwind & Google Gemini</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
