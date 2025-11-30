import React, { useState, useEffect, useRef } from "react";
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
  FileText,
  Plus,
} from "lucide-react";
import { DocumentFile, TabType } from "./types";
import { ToolbarButton } from "./components/toolbar";
import { FileTab } from "./components/file-tab";
import { ContentArea } from "./components/content";
import { detectFileType, isEditable, hasPreview, isBinary } from "./utils/fileType";

const DocumentReader: React.FC = () => {
  // State for multiple files
  const [files, setFiles] = useState<DocumentFile[]>([
    {
      id: "1",
      name: "Welcome.md",
      content:
        "# Welcome to Document Reader\n\nStart typing on the **left** to see the preview on the **right**.\n\n## Supported Formats\n- **Markdown**: Editor + Preview\n- **PDF**: Reader only\n- **Word (.doc/.docx)**: Reader only\n- **RTF**: Editor + Preview\n\n## Multi-Tab Features\n- Click the `+` icon to add a new file\n- Click `x` on a tab to close it\n- Import opens a new tab automatically\n\n```javascript\nconsole.log('Hello World');\n```",
      fileType: "markdown",
    },
  ]);

  const [activeFileId, setActiveFileId] = useState<string>("1");
  const [activeTab, setActiveTab] = useState<TabType>("write"); // Mobile toggle
  const [markedLoaded, setMarkedLoaded] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derived state for the currently active file
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Load 'marked' library dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
    script.async = true;
    script.onload = () => {
      setMarkedLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // --- File Management ---

  const handleUpdateContent = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId ? { ...f, content: newContent } : f
      )
    );
  };

  const handleUpdateName = (newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, name: newName } : f))
    );
  };

  const handleNewFile = () => {
    const newId = Date.now().toString();
    const newFile: DocumentFile = {
      id: newId,
      name: "Untitled.md",
      content: "",
      fileType: "markdown",
    };
    setFiles([...files, newFile]);
    setActiveFileId(newId);
  };

  const handleCloseFile = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation(); // Prevent switching to the tab we are closing

    if (files.length === 1) {
      // If closing the last file, just clear it instead of removing
      setFiles([
        { id: Date.now().toString(), name: "Untitled.md", content: "", fileType: "markdown" },
      ]);
      return;
    }

    const newFiles = files.filter((f) => f.id !== idToDelete);
    setFiles(newFiles);

    // If we closed the active file, switch to the last one available
    if (activeFileId === idToDelete) {
      setActiveFileId(newFiles[newFiles.length - 1].id);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = detectFileType(file.name);
      const newId = Date.now().toString();

      if (isBinary(fileType)) {
        // Handle binary files (PDF, Word)
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const arrayBuffer = e.target?.result;
          if (arrayBuffer instanceof ArrayBuffer) {
            // Convert to base64 for storage, or store as ArrayBuffer
            const uint8Array = new Uint8Array(arrayBuffer);
            const base64 = btoa(String.fromCharCode(...uint8Array));
            const newFile: DocumentFile = {
              id: newId,
              name: file.name,
              content: `data:application/octet-stream;base64,${base64}`,
              fileType,
              rawData: arrayBuffer,
            };
            setFiles([...files, newFile]);
            setActiveFileId(newId);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Handle text files (Markdown, RTF)
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const text = e.target?.result;
          if (typeof text === "string") {
            const newFile: DocumentFile = {
              id: newId,
              name: file.name,
              content: text,
              fileType,
            };
            setFiles([...files, newFile]);
            setActiveFileId(newId);
          }
        };
        reader.readAsText(file);
      }
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    let blob: Blob;
    let mimeType: string;
    let filename = activeFile.name;

    if (isBinary(activeFile.fileType)) {
      // Handle binary files
      if (activeFile.rawData) {
        const data = activeFile.rawData instanceof ArrayBuffer
          ? activeFile.rawData
          : activeFile.rawData.buffer;
        if (activeFile.fileType === "pdf") {
          mimeType = "application/pdf";
        } else {
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        blob = new Blob([data], { type: mimeType });
      } else {
        // Fallback: try to extract from base64 data URL
        if (activeFile.content.startsWith("data:")) {
          const base64 = activeFile.content.split(",")[1];
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          mimeType = activeFile.fileType === "pdf" 
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          blob = new Blob([bytes], { type: mimeType });
        } else {
          // Fallback to text
          blob = new Blob([activeFile.content], { type: "text/plain" });
        }
      }
    } else {
      // Handle text files
      if (activeFile.fileType === "markdown") {
        mimeType = "text/markdown";
      } else if (activeFile.fileType === "rtf") {
        mimeType = "application/rtf";
      } else {
        mimeType = "text/plain";
      }
      blob = new Blob([activeFile.content], { type: mimeType });
    }

    element.href = URL.createObjectURL(blob);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  // --- Editor Operations ---

  const insertSyntax = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const currentContent = activeFile.content;
    const selectedText = currentContent.substring(start, end);
    const beforeText = currentContent.substring(0, start);
    const afterText = currentContent.substring(end);

    const newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
    handleUpdateContent(newText);

    // Reset cursor position and focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const getParsedMarkdown = (): { __html: string } => {
    if (!markedLoaded || !window.marked) {
      return { __html: "Loading parser..." };
    }
    window.marked.setOptions({ gfm: true, breaks: true });
    return { __html: window.marked.parse(activeFile.content) };
  };

  const handleTriggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* --- Main Header --- */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-20 relative">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-blue-600 p-2 rounded-lg shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
              Document Reader
            </h1>
            <input
              type="text"
              value={activeFile.name}
              onChange={(e) => handleUpdateName(e.target.value)}
              className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 p-0 hover:text-blue-600 cursor-text w-full truncate"
              placeholder="Filename"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md,.markdown,.pdf,.doc,.docx,.rtf"
            className="hidden"
          />
          <button
            onClick={handleTriggerFileUpload}
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

      {/* --- File Tabs --- */}
      <div className="bg-slate-100 border-b border-slate-200 px-2 pt-2 flex items-end gap-1 overflow-x-auto scrollbar-hide">
        {files.map((file) => (
          <FileTab
            key={file.id}
            activeFileId={activeFileId}
            file={file}
            setActiveFileId={setActiveFileId}
            handleCloseFile={handleCloseFile}
          />
        ))}
        <button
          onClick={handleNewFile}
          className="p-2 mb-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded-md transition-colors"
          title="New File"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* --- Toolbar --- (Only show for markdown files) */}
      {activeFile.fileType === "markdown" && (
        <div className="bg-white border-b border-slate-200 px-2 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto z-10 shadow-sm">
          <ToolbarButton
            icon={Bold}
            label="Bold"
            onClick={() => insertSyntax("**", "**")}
          />
          <ToolbarButton
            icon={Italic}
            label="Italic"
            onClick={() => insertSyntax("*", "*")}
          />
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <ToolbarButton
            icon={Type}
            label="Heading"
            onClick={() => insertSyntax("## ")}
          />
          <ToolbarButton
            icon={Quote}
            label="Quote"
            onClick={() => insertSyntax("> ")}
          />
          <ToolbarButton
            icon={List}
            label="List"
            onClick={() => insertSyntax("- ")}
          />
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <ToolbarButton
            icon={Code}
            label="Code Block"
            onClick={() => insertSyntax("```\n", "\n```")}
          />
          <ToolbarButton
            icon={LinkIcon}
            label="Link"
            onClick={() => insertSyntax("[", "](url)")}
          />
          <div className="flex-1"></div>
          <button
            onClick={() => handleUpdateContent("")}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Clear Current File"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* --- Mobile View Toggle --- (Only show for editable files with preview) */}
      {isEditable(activeFile.fileType) && hasPreview(activeFile.fileType) && (
        <div className="md:hidden flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab("write")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === "write"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-slate-500"
            }`}
          >
            <PenTool className="w-4 h-4" /> Write
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === "preview"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-slate-500"
            }`}
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
        </div>
      )}

      {/* --- Main Content Area --- */}
      <ContentArea
        activeTab={activeTab}
        textareaRef={textareaRef}
        activeFile={activeFile}
        handleUpdateContent={handleUpdateContent}
        markedLoaded={markedLoaded}
        getParsedMarkdown={getParsedMarkdown}
      />
    </div>
  );
};
export default DocumentReader;
