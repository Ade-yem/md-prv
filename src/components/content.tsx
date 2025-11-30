import { useState, useRef, useEffect } from "react";
import { ContentAreaProp } from "../types";

export const ContentArea: React.FC<ContentAreaProp> = ({
  activeTab,
  textareaRef,
  activeFile,
  handleUpdateContent,
  markedLoaded,
  getParsedMarkdown,
}) => {
  const [editorWidth, setEditorWidth] = useState(50); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect if we're on a large screen (md breakpoint: 768px)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isLargeScreen) return; // Only allow resizing on large screens
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current || !isLargeScreen) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Constrain between 20% and 80%
      const constrainedWidth = Math.max(20, Math.min(80, newWidth));
      setEditorWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, isLargeScreen]);

  return (
    <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
      {/* Editor Pane */}
      <div
        className={`bg-white h-full overflow-hidden flex flex-col ${
          activeTab === "preview" ? "hidden md:flex" : "flex"
        } flex-1 md:flex-none`}
        style={
          isLargeScreen
            ? { width: `${editorWidth}%`, minWidth: "20%", maxWidth: "80%" }
            : undefined
        }
      >
        <textarea
          ref={textareaRef}
          value={activeFile.content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            handleUpdateContent(e.target.value)
          }
          placeholder="Type your markdown here..."
          className="flex-1 w-full h-full p-6 resize-none outline-none font-mono text-sm text-slate-700 leading-relaxed bg-white"
          spellCheck={false}
        />
        <div className="bg-white border-t border-slate-100 px-4 py-2 text-xs text-slate-400 font-mono">
          {activeFile.content.length} characters •{" "}
          {activeFile.content.split(/\s+/).filter((w) => w.length > 0).length}{" "}
          words
        </div>
      </div>

      {/* Resizer - Only visible on large screens when both panes are visible */}
      {activeTab === "write" && isLargeScreen && (
        <div
          className={`hidden md:block w-1 bg-slate-200 hover:bg-blue-500 cursor-col-resize transition-colors relative group ${
            isResizing ? "bg-blue-500" : ""
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize"></div>
        </div>
      )}

      {/* Preview Pane */}
      <div
        className={`bg-slate-50 h-full overflow-y-auto ${
          activeTab === "write" ? "hidden md:block" : "block"
        } flex-1 md:flex-none`}
        style={
          isLargeScreen
            ? { width: `${100 - editorWidth}%`, minWidth: "20%" }
            : undefined
        }
      >
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
  );
};
