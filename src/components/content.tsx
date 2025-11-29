import { ContentAreaProp } from "../types";

export const ContentArea: React.FC<ContentAreaProp> = ({
  activeTab,
  textareaRef,
  activeFile,
  handleUpdateContent,
  markedLoaded,
  getParsedMarkdown,
}) => {
  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Editor Pane */}
      <div
        className={`flex-1 bg-white h-full overflow-hidden flex flex-col ${
          activeTab === "preview" ? "hidden md:flex" : "flex"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={activeFile.content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            handleUpdateContent(e.target.value)
          }
          placeholder="Type your markdown here..."
          className="flex-1 w-full h-full p-6 resize-none outline-none font-mono text-sm text-slate-700 leading-relaxed bg-white border-r border-slate-200"
          spellCheck={false}
        />
        <div className="bg-white border-t border-slate-100 px-4 py-2 text-xs text-slate-400 font-mono border-r border-slate-200">
          {activeFile.content.length} characters •{" "}
          {activeFile.content.split(/\s+/).filter((w) => w.length > 0).length}{" "}
          words
        </div>
      </div>

      {/* Preview Pane */}
      <div
        className={`flex-1 bg-slate-50 h-full overflow-y-auto ${
          activeTab === "write" ? "hidden md:block" : "block"
        }`}
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
