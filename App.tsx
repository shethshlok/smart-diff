import React, { useState, useEffect } from 'react';
import { ViewMode } from './types';
import { InputPanel } from './components/InputPanel';
import { DiffViewer } from './components/DiffViewer';
import { Button } from './components/Button';
import { summarizeDiff, resolveMerge } from './services/geminiService';
import { 
  Split, 
  Combine, 
  Trash2, 
  Sparkles, 
  ArrowRightLeft, 
  Copy,
  FileText,
  GitMerge,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronUp
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
  
  // Merge States
  const [activeTab, setActiveTab] = useState<'compare' | 'merge'>('compare');
  const [mergePrompt, setMergePrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are an expert at resolving code merge conflicts. Combine the \'current\' (left) and \'incoming\' (right) content intelligently based on the user\'s instructions.');
  const [mergeResult, setMergeResult] = useState<string | null>(null);
  const [isMergeLoading, setIsMergeLoading] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [mergeViewMode, setMergeViewMode] = useState<'edit' | 'diff'>('edit');

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
    setMergeResult(null);
    setMergePrompt('');
  };

  const handleSample = () => {
    setOriginalText(SAMPLE_ORIGINAL);
    setChangedText(SAMPLE_CHANGED);
    setShowDiff(false);
    setAiSummary(null);
    setMergeResult(null);
  };

  const handleAiSummary = async () => {
    if (!originalText && !changedText) return;
    setIsAiLoading(true);
    const summary = await summarizeDiff(originalText, changedText);
    setAiSummary(summary);
    setIsAiLoading(false);
  };

  const handleResolveMerge = async () => {
    if (!originalText && !changedText) return;
    setIsMergeLoading(true);
    const result = await resolveMerge(originalText, changedText, mergePrompt, systemPrompt);
    setMergeResult(result);
    setIsMergeLoading(false);
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
          
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'compare' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Compare
            </button>
            <button 
              onClick={() => {
                setActiveTab('merge');
                setShowDiff(false);
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'merge' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Merge
            </button>
          </nav>
          
          <div className="flex items-center space-x-2">
            {!showDiff && (
               <Button variant="ghost" size="sm" onClick={handleSample} icon={<FileText className="w-4 h-4" />}>
                 Load Sample
               </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={!originalText && !changedText} icon={<Trash2 className="w-4 h-4" />}>
              Clear
            </Button>
            {activeTab === 'compare' && (
              <Button 
                onClick={handleCompare} 
                disabled={!originalText && !changedText || showDiff}
                className={showDiff ? 'opacity-50' : ''}
                size="sm"
              >
                Compare
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        
        {/* Editor Area - Only show if not comparing OR show as reference at top? 
            Better UX: If !showDiff, show inputs. If showDiff, show inputs collapsed or replace with diff. 
            Standard DiffChecker behavior: Inputs disappear, replaced by Diff result. 
            We'll follow that pattern but allow editing by clicking "Edit".
        */}

        {!showDiff && activeTab === 'compare' ? (
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
        ) : activeTab === 'merge' ? (
          <div className="space-y-6">
            {/* Merge Intelligence Header - Compact & Responsive */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-20 z-40">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg hidden sm:block">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      rows={1}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-sm bg-slate-50 transition-all resize-none overflow-hidden"
                      placeholder="Merge instructions (e.g. 'Keep my styles, use their logic')"
                      value={mergePrompt}
                      onChange={(e) => {
                        setMergePrompt(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleResolveMerge();
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex p-1 bg-slate-100 rounded-lg">
                    <button
                      onClick={() => setMergeViewMode('edit')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mergeViewMode === 'edit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Editors
                    </button>
                    <button
                      onClick={() => setMergeViewMode('diff')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mergeViewMode === 'diff' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Diff View
                    </button>
                  </div>
                  
                  <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
                  
                  <Button 
                    onClick={handleResolveMerge}
                    isLoading={isMergeLoading}
                    disabled={!originalText && !changedText}
                    icon={<GitMerge className="w-4 h-4" />}
                    size="sm"
                    className="flex-1 lg:flex-none px-6 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Resolve
                  </Button>
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                <button 
                  onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                  className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center hover:text-slate-600 transition-colors"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  System Agent Configuration
                  {showSystemPrompt ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                </button>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:block">⌘ + Enter to resolve</span>
              </div>
              
              {showSystemPrompt && (
                <div className="mt-3 p-3 rounded-lg border border-slate-100 bg-slate-50 animate-fade-in">
                  <textarea
                    className="w-full p-2 bg-transparent text-xs font-mono text-slate-600 outline-none"
                    rows={2}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="System instructions for the AI agent..."
                  />
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="space-y-6">
              {mergeViewMode === 'edit' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[450px]">
                  <InputPanel 
                    label="Current (Left)" 
                    value={originalText} 
                    onChange={setOriginalText} 
                    placeholder="Paste current text here..."
                  />
                  <InputPanel 
                    label="Incoming (Right)" 
                    value={changedText} 
                    onChange={setChangedText}
                    placeholder="Paste incoming text here..." 
                  />
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Changes Reference</h4>
                    <div className="flex items-center space-x-2 bg-slate-100 p-0.5 rounded-md">
                      <button onClick={() => setViewMode(ViewMode.SPLIT)} className={`p-1 rounded ${viewMode === ViewMode.SPLIT ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Split size={14} /></button>
                      <button onClick={() => setViewMode(ViewMode.UNIFIED)} className={`p-1 rounded ${viewMode === ViewMode.UNIFIED ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Combine size={14} /></button>
                    </div>
                  </div>
                  <DiffViewer 
                    originalText={originalText} 
                    changedText={changedText} 
                    viewMode={viewMode} 
                  />
                </div>
              )}

              {mergeResult && (
                <div className="space-y-4 animate-fade-in border-t border-slate-200 pt-8 mt-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                       </div>
                       <h3 className="font-bold text-slate-800">Merge Result</h3>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={<Copy className="w-4 h-4" />}
                      onClick={() => {
                        navigator.clipboard.writeText(mergeResult);
                      }}
                      className="text-emerald-600 hover:bg-emerald-50"
                    >
                      Copy Result
                    </Button>
                  </div>
                  <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl font-mono text-sm overflow-x-auto shadow-xl ring-1 ring-slate-800 relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase tracking-widest font-bold">Read Only Output</span>
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed">{mergeResult}</pre>
                  </div>
                </div>
              )}
            </div>
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
