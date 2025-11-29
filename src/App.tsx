import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, 
  Download, 
  Type, 
  Bold, 
  Italic, 
  List, 
  Code, 
  Quote, 
  Link as LinkIcon, 
  Eye, 
  PenTool, 
  Trash2,
  FileText
} from 'lucide-react';

const MarkdownEditor = () => {
  const [content, setContent] = useState("# Welcome to Markdown Editor\n\nStart typing on the **left** to see the preview on the **right**.\n\n## Features\n- Live preview\n- Upload & Download `.md` files\n- Mobile friendly\n\n```javascript\nconsole.log('Hello World');\n```");
  const [fileName, setFileName] = useState("document.md");
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview' (mostly for mobile)
  const [markedLoaded, setMarkedLoaded] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Load 'marked' library dynamically for parsing
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
    script.async = true;
    script.onload = () => {
      setMarkedLoaded(true);
    };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    }
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target.result);
        setFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const insertSyntax = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);

    const newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
    setContent(newText);

    // Reset cursor position and focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const getParsedMarkdown = () => {
    if (!markedLoaded || typeof window.marked === 'undefined') {
      return "Loading parser...";
    }
    // Configure marked to handle line breaks as <br>
    window.marked.setOptions({
        gfm: true,
        breaks: true,
    });
    return { __html: window.marked.parse(content) };
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* --- CSS for the Preview Content --- */}
      <style>{`
        .markdown-body {
          line-height: 1.6;
          color: #334155;
        }
        .markdown-body h1 { font-size: 2rem; font-weight: 800; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; color: #1e293b; }
        .markdown-body h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1e293b; }
        .markdown-body h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #1e293b; }
        .markdown-body p { margin-bottom: 1rem; }
        .markdown-body ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .markdown-body ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
        .markdown-body blockquote { border-left: 4px solid #3b82f6; background-color: #eff6ff; padding: 0.5rem 1rem; margin-bottom: 1rem; font-style: italic; color: #475569; }
        .markdown-body code { background-color: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #ef4444; }
        .markdown-body pre { background-color: #1e293b; padding: 1rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1rem; }
        .markdown-body pre code { background-color: transparent; color: #e2e8f0; padding: 0; font-size: 0.85em; }
        .markdown-body a { color: #2563eb; text-decoration: underline; }
        .markdown-body a:hover { color: #1d4ed8; }
        .markdown-body img { max-width: 100%; border-radius: 8px; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .markdown-body hr { border: 0; border-top: 2px solid #e2e8f0; margin: 2rem 0; }
        .markdown-body table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .markdown-body th, .markdown-body td { border: 1px solid #cbd5e1; padding: 0.5rem; text-align: left; }
        .markdown-body th { background-color: #f8fafc; font-weight: 600; }
      `}</style>

      {/* --- Header --- */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-800 leading-none">MD Editor</h1>
            <input 
              type="text" 
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="text-xs text-slate-500 bg-transparent border-none focus:ring-0 p-0 hover:text-blue-600 cursor-text"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".md,.txt" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <FileUp className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* --- Toolbar --- */}
      <div className="bg-white border-b border-slate-200 px-2 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto">
        <ToolbarButton icon={Bold} label="Bold" onClick={() => insertSyntax('**', '**')} />
        <ToolbarButton icon={Italic} label="Italic" onClick={() => insertSyntax('*', '*')} />
        <div className="w-px h-6 bg-slate-200 mx-1"></div>
        <ToolbarButton icon={Type} label="Heading" onClick={() => insertSyntax('## ')} />
        <ToolbarButton icon={Quote} label="Quote" onClick={() => insertSyntax('> ')} />
        <ToolbarButton icon={List} label="List" onClick={() => insertSyntax('- ')} />
        <div className="w-px h-6 bg-slate-200 mx-1"></div>
        <ToolbarButton icon={Code} label="Code Block" onClick={() => insertSyntax('```\n', '\n```')} />
        <ToolbarButton icon={LinkIcon} label="Link" onClick={() => insertSyntax('[', '](url)')} />
        <div className="flex-1"></div>
        <button 
          onClick={() => setContent('')} 
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
          title="Clear All"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* --- Mobile Tabs --- */}
      <div className="md:hidden flex border-b border-slate-200 bg-slate-50">
        <button 
          onClick={() => setActiveTab('write')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'write' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500'}`}
        >
          <PenTool className="w-4 h-4" /> Write
        </button>
        <button 
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500'}`}
        >
          <Eye className="w-4 h-4" /> Preview
        </button>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Editor Pane */}
        <div className={`flex-1 bg-white h-full overflow-hidden flex flex-col ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your markdown here..."
            className="flex-1 w-full h-full p-6 resize-none outline-none font-mono text-sm text-slate-700 leading-relaxed bg-white border-r border-slate-200"
            spellCheck="false"
          />
          <div className="bg-white border-t border-slate-100 px-4 py-2 text-xs text-slate-400 font-mono border-r border-slate-200">
            {content.length} characters • {content.split(/\s+/).filter(w => w.length > 0).length} words
          </div>
        </div>

        {/* Preview Pane */}
        <div className={`flex-1 bg-slate-50 h-full overflow-y-auto ${activeTab === 'write' ? 'hidden md:block' : 'block'}`}>
          <div className="max-w-3xl mx-auto p-6 min-h-full">
            {markedLoaded ? (
               <div 
                 className="markdown-body"
                 dangerouslySetInnerHTML={getParsedMarkdown()} 
               />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                Initializing Preview...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper component for toolbar buttons
const ToolbarButton = ({ icon: Icon, onClick, label }) => (
  <button
    onClick={onClick}
    className="p-2 text-slate-600 hover:bg-slate-100 hover:text-blue-600 rounded-md transition-colors flex items-center justify-center min-w-[36px]"
    title={label}
  >
    <Icon className="w-4 h-4" />
  </button>
);

export default MarkdownEditor;

