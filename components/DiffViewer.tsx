import React, { useMemo } from 'react';
import * as Diff from 'diff';
import { ViewMode, DiffLine, DiffSegment } from '../types';

interface DiffViewerProps {
  originalText: string;
  changedText: string;
  viewMode: ViewMode;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ originalText, changedText, viewMode }) => {
  
  // Logic to process diffs and align them for split view
  const processedDiff = useMemo(() => {
    // 1. Get raw diff chunks at line level
    const changes = Diff.diffLines(originalText, changedText);

    const leftLines: DiffLine[] = [];
    const rightLines: DiffLine[] = [];
    const unifiedLines: DiffLine[] = [];

    let leftLineNum = 1;
    let rightLineNum = 1;

    // Process for Split View with Alignment and Character Diffing
    for (let i = 0; i < changes.length; i++) {
      const part = changes[i];
      if (!part.value) continue; // Skip empty parts

      // Check for Modification Block (Remove followed by Add)
      if (part.removed) {
        const nextPart = changes[i + 1];
        if (nextPart && nextPart.added) {
          // This is a modification. We need to align these lines and diff them at char level.
          const removedContentLines = part.value.replace(/\n$/, '').split('\n');
          const addedContentLines = nextPart.value.replace(/\n$/, '').split('\n');
          
          const maxLines = Math.max(removedContentLines.length, addedContentLines.length);

          for (let k = 0; k < maxLines; k++) {
             const leftContent = removedContentLines[k];
             const rightContent = addedContentLines[k];

             // If both lines exist, compute sub-line diff
             if (leftContent !== undefined && rightContent !== undefined) {
                // Use diffChars for precision similar to DiffChecker
                const segments = Diff.diffChars(leftContent, rightContent);

                leftLines.push({
                  type: 'removed',
                  content: leftContent,
                  lineNumberLeft: leftLineNum++,
                  segments: segments
                });

                rightLines.push({
                  type: 'added',
                  content: rightContent,
                  lineNumberRight: rightLineNum++,
                  segments: segments
                });
             } else if (leftContent !== undefined) {
                // Only left exists (deletion)
                leftLines.push({ type: 'removed', content: leftContent, lineNumberLeft: leftLineNum++ });
                rightLines.push({ type: 'empty', content: '', lineNumberRight: undefined });
             } else {
                // Only right exists (addition)
                leftLines.push({ type: 'empty', content: '', lineNumberLeft: undefined });
                rightLines.push({ type: 'added', content: rightContent, lineNumberRight: rightLineNum++ });
             }
          }
          
          i++; // Skip the next part (added) as we processed it here
          continue;
        }
      }

      // Standard processing for non-modification blocks
      const lines = part.value.replace(/\n$/, '').split('\n');
      
      lines.forEach(line => {
        if (part.added) {
          leftLines.push({ type: 'empty', content: '', lineNumberLeft: undefined });
          rightLines.push({ type: 'added', content: line, lineNumberRight: rightLineNum++ });
        } else if (part.removed) {
          leftLines.push({ type: 'removed', content: line, lineNumberLeft: leftLineNum++ });
          rightLines.push({ type: 'empty', content: '', lineNumberRight: undefined });
        } else {
          leftLines.push({ type: 'neutral', content: line, lineNumberLeft: leftLineNum++ });
          rightLines.push({ type: 'neutral', content: line, lineNumberRight: rightLineNum++ });
        }
      });
    }

    // Process for Unified View
    // Re-doing Unified Loop for correct line numbers and simple display
    let uLeftNum = 1;
    let uRightNum = 1;
    
    changes.forEach((part) => {
       const lines = part.value.replace(/\n$/, '').split('\n');
       if(part.value === "") return;
       
       lines.forEach(line => {
          if (part.added) {
             unifiedLines.push({ type: 'added', content: line, lineNumberRight: uRightNum++ });
          } else if (part.removed) {
             unifiedLines.push({ type: 'removed', content: line, lineNumberLeft: uLeftNum++ });
          } else {
             unifiedLines.push({ type: 'neutral', content: line, lineNumberLeft: uLeftNum++, lineNumberRight: uRightNum++ });
          }
       });
    });

    return { leftLines, rightLines, unifiedLines };
  }, [originalText, changedText]);


  const renderSegmentedLine = (line: DiffLine, side: 'left' | 'right') => {
    if (!line.segments) return <span className="text-slate-800">{line.content}</span>;

    return (
      <>
        {line.segments.map((seg, idx) => {
           // Filter segments based on side
           if (side === 'left') {
             // Show removed parts and neutral parts. Skip added parts.
             if (seg.added) return null;
             return (
               <span key={idx} className={seg.removed ? 'bg-diff-delDark text-slate-900 rounded-[2px]' : 'text-slate-800'}>
                 {seg.value}
               </span>
             );
           } else {
             // Show added parts and neutral parts. Skip removed parts.
             if (seg.removed) return null;
             return (
                <span key={idx} className={seg.added ? 'bg-diff-addDark text-slate-900 rounded-[2px]' : 'text-slate-800'}>
                  {seg.value}
                </span>
             );
           }
        })}
      </>
    );
  };

  const renderLine = (line: DiffLine, side: 'left' | 'right' | 'unified') => {
    let bgClass = '';
    let textClass = 'text-slate-600';
    let prefix = ' ';
    
    if (line.type === 'added') {
      bgClass = 'bg-diff-add';
      textClass = 'text-slate-800';
      prefix = '+';
    } else if (line.type === 'removed') {
      bgClass = 'bg-diff-del';
      textClass = 'text-slate-800';
      prefix = '-';
    } else if (line.type === 'empty') {
      bgClass = 'bg-slate-50/50 diag-hatch';
    }

    const numLeft = line.lineNumberLeft !== undefined ? line.lineNumberLeft : '';
    const numRight = line.lineNumberRight !== undefined ? line.lineNumberRight : '';

    if (side === 'unified') {
       return (
        <div className={`flex w-full ${bgClass} hover:opacity-90`}>
          <div className="w-12 flex-shrink-0 text-right pr-2 text-xs text-slate-400 select-none py-0.5 border-r border-slate-200/50 bg-slate-50">{numLeft}</div>
          <div className="w-12 flex-shrink-0 text-right pr-2 text-xs text-slate-400 select-none py-0.5 border-r border-slate-200/50 bg-slate-50">{numRight}</div>
          <div className="w-6 flex-shrink-0 text-center text-xs text-slate-400 select-none py-0.5">{prefix}</div>
          <div className={`flex-1 px-2 font-mono text-sm whitespace-pre-wrap break-all py-0.5 ${textClass}`}>
             {line.content}
          </div>
        </div>
       )
    }

    // Split view rendering
    const lineNum = side === 'left' ? numLeft : numRight;
    
    return (
      <div className={`flex w-full ${bgClass} min-h-[1.5rem]`}>
        <div className="w-10 flex-shrink-0 text-right pr-2 text-xs text-slate-400 select-none py-0.5 border-r border-slate-200/50 bg-slate-50">
          {line.type !== 'empty' ? lineNum : ''}
        </div>
        <div className={`flex-1 px-2 font-mono text-sm whitespace-pre-wrap break-all py-0.5 ${textClass}`}>
          {line.type !== 'empty' ? (line.segments ? renderSegmentedLine(line, side) : line.content) : ''}
        </div>
      </div>
    );
  };

  if (viewMode === ViewMode.UNIFIED) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
           <div className="min-w-full">
            {processedDiff.unifiedLines.map((line, idx) => (
              <React.Fragment key={idx}>{renderLine(line, 'unified')}</React.Fragment>
            ))}
            {processedDiff.unifiedLines.length === 0 && <div className="p-8 text-center text-slate-400">No content to compare</div>}
           </div>
        </div>
      </div>
    );
  }

  // Split View
  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-slate-200">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            {processedDiff.leftLines.map((line, idx) => (
              <React.Fragment key={`left-${idx}`}>{renderLine(line, 'left')}</React.Fragment>
            ))}
            {processedDiff.leftLines.length === 0 && <div className="p-8 text-center text-slate-400">Original text empty</div>}
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-1/2">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
             {processedDiff.rightLines.map((line, idx) => (
              <React.Fragment key={`right-${idx}`}>{renderLine(line, 'right')}</React.Fragment>
            ))}
            {processedDiff.rightLines.length === 0 && <div className="p-8 text-center text-slate-400">Changed text empty</div>}
          </div>
        </div>
      </div>
    </div>
  );
};