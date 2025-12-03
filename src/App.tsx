/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import { FileUp, Download, Eye, PenTool, FileText, Plus } from "lucide-react";
import { ToolBar } from "./components/toolbar";
import { FileTab } from "./components/file-tab";
import { ContentArea } from "./components/content";
import { isEditable, hasPreview } from "./utils/fileType";
import { useStorage } from "./hooks/useStorage";
import { useFileManagement } from "./hooks/useFileManagement";
import { useDragAndDrop } from "./hooks/useDragAndDrop";

const DocumentReader: React.FC = () => {
  const {
    files,
    activeFileId,
    activeTab,
    isInitialized,
    setFiles,
    setActiveFileId,
    setActiveTab,
  } = useStorage();

  const {
    fileInputRef,
    handleUpdateContent,
    handleUpdateName,
    handleNewFile,
    handleCloseFile,
    handleFileUpload,
    handleDownload,
    handleTriggerFileUpload,
  } = useFileManagement({
    files,
    activeFileId,
    setFiles,
    setActiveFileId,
  });

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useDragAndDrop({
      onFileProcessed: (newFile) => {
        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
      },
    });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [markedLoaded, setMarkedLoaded] = useState<boolean>(false);

  // Derived state for the currently active file
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Load 'marked' library dynamically (bundled for offline support)
  useEffect(() => {
    import("marked")
      .then((markedModule) => {
        const { marked } = markedModule;
        // Set marked on window for compatibility
        (window as any).marked = marked;
        setMarkedLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load marked library:", error);
      });
  }, []);

  const getParsedMarkdown = (): { __html: string } => {
    if (!markedLoaded || !(window as any).marked) {
      return { __html: "Loading parser..." };
    }
    const marked = (window as any).marked;
    marked.setOptions({ gfm: true, breaks: true });
    return { __html: marked.parse(activeFile.content) };
  };

  // Don't render until initialized to prevent undefined activeFile
  if (!isInitialized || !activeFile) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden relative ${
        isDragging ? "bg-blue-50" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
        <ToolBar
          textareaRef={textareaRef}
          activeFile={activeFile}
          handleUpdateContent={handleUpdateContent}
        />
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

      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-600/10 border-4 border-dashed border-blue-600 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
            <FileUp className="w-16 h-16 text-blue-600" />
            <p className="text-xl font-semibold text-slate-800">
              Drop file like its hot 🔥
            </p>
            <p className="text-sm text-slate-500">
              Supported: .md, .markdown, .pdf, .doc, .docx
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentReader;
