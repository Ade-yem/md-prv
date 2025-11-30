import { useState, useRef, useEffect } from "react";
import { DocumentFile } from "../types";
// @ts-expect-error - rtf-parser doesn't have TypeScript types
import parseRTF from "rtf-parser";

interface RTFEditorProps {
  file: DocumentFile;
  activeTab: "write" | "preview";
  handleUpdateContent: (newContent: string) => void;
}

export const RTFEditor: React.FC<RTFEditorProps> = ({
  file,
  activeTab,
  handleUpdateContent,
}) => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorWidth, setEditorWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse RTF to HTML on load
  useEffect(() => {
    const parseRTFFile = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!file.content || file.content.trim() === "") {
          setHtmlContent("");
          setLoading(false);
          return;
        }

        // Parse RTF to get document structure
        // rtf-parser uses callback-based API
        parseRTF.string(
          file.content,
          (
            err: Error | null,
            doc: { content?: unknown[]; paragraphs?: unknown[] }
          ) => {
            if (err) {
              setError(err.message || "Failed to parse RTF");
              // Fallback: try to extract plain text
              const fallbackHtml = file.content
                .replace(/\\par\s*/g, "<p></p>")
                .replace(/\\b\s*/g, "<strong>")
                .replace(/\\b0\s*/g, "</strong>")
                .replace(/\\i\s*/g, "<em>")
                .replace(/\\i0\s*/g, "</em>")
                .replace(/\\u\d+\s*/g, "")
                .replace(/[{}]/g, "")
                .replace(/\\[a-z]+\d*\s*/gi, "");
              setHtmlContent(fallbackHtml || "<p></p>");
              setLoading(false);
              return;
            }

            // Convert RTF document to HTML
            // This is a simplified conversion - RTF is complex
            const convertNode = (node: unknown): string => {
              if (typeof node === "string") {
                return node;
              }

              if (typeof node === "object" && node !== null) {
                const n = node as Record<string, unknown>;

                if (n.type === "paragraph") {
                  const content =
                    (n.content as unknown[])?.map(convertNode).join("") || "";
                  return `<p>${content}</p>`;
                }

                if (n.type === "text") {
                  let text = (n.value as string) || "";
                  if (n.bold) text = `<strong>${text}</strong>`;
                  if (n.italic) text = `<em>${text}</em>`;
                  if (n.underline) text = `<u>${text}</u>`;
                  return text;
                }

                if (n.content) {
                  return (n.content as unknown[]).map(convertNode).join("");
                }
              }

              return "";
            };

            let html = "";
            // Try to extract content from RTF document structure
            if (doc && doc.content) {
              html = doc.content.map(convertNode).join("");
            } else if (doc && doc.paragraphs) {
              // Alternative structure
              html = doc.paragraphs
                .map((p: unknown) => {
                  const paragraph = p as { content?: unknown[] };
                  const content =
                    paragraph.content?.map(convertNode).join("") || "";
                  return `<p>${content}</p>`;
                })
                .join("");
            } else {
              // Fallback: try to extract plain text
              html = file.content
                .replace(/\\par\s*/g, "<p></p>")
                .replace(/\\b\s*/g, "<strong>")
                .replace(/\\b0\s*/g, "</strong>")
                .replace(/\\i\s*/g, "<em>")
                .replace(/\\i0\s*/g, "</em>")
                .replace(/\\u\d+\s*/g, "")
                .replace(/[{}]/g, "")
                .replace(/\\[a-z]+\d*\s*/gi, "");
            }

            setHtmlContent(html || "<p></p>");
            setLoading(false);
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse RTF");
        // Fallback: show raw content
        setHtmlContent(`<pre>${file.content}</pre>`);
        setLoading(false);
      }
    };

    parseRTFFile();
  }, [file.id, file.content]); // Re-parse when file changes

  // Update RTF content when editor content changes
  const handleEditorChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlContent(html);

      // Convert HTML back to RTF (simplified)
      // This is a basic conversion - full RTF conversion would be more complex
      let rtf = "{\\rtf1\\ansi\\deff0\n";

      // Simple conversion: extract text and basic formatting
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      const convertToRTF = (element: Node): string => {
        if (element.nodeType === Node.TEXT_NODE) {
          return element.textContent || "";
        }

        if (element.nodeType === Node.ELEMENT_NODE) {
          const el = element as HTMLElement;
          const tagName = el.tagName.toLowerCase();
          const content = Array.from(el.childNodes).map(convertToRTF).join("");

          if (tagName === "p") {
            return `\\par ${content}`;
          } else if (tagName === "strong" || tagName === "b") {
            return `{\\b ${content}}`;
          } else if (tagName === "em" || tagName === "i") {
            return `{\\i ${content}}`;
          } else if (tagName === "u") {
            return `{\\ul ${content}}`;
          }

          return content;
        }

        return "";
      };

      rtf += convertToRTF(tempDiv);
      rtf += "\n}";

      handleUpdateContent(rtf);
    }
  };

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Resizer logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current || !isLargeScreen) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
        Loading RTF document...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <div className="text-center p-6">
          <p className="font-semibold mb-2">Error loading RTF</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

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
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorChange}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          className="flex-1 w-full h-full p-6 outline-none text-sm text-slate-700 leading-relaxed bg-white overflow-y-auto"
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: "1.6",
          }}
        />
        <div className="bg-white border-t border-slate-100 px-4 py-2 text-xs text-slate-400 font-mono">
          RTF Editor
        </div>
      </div>

      {/* Resizer */}
      {activeTab === "write" && isLargeScreen && (
        <div
          className={`hidden md:block w-1 bg-slate-200 hover:bg-blue-500 cursor-col-resize transition-colors relative group ${
            isResizing ? "bg-blue-500" : ""
          }`}
          onMouseDown={(e) => {
            if (!isLargeScreen) return;
            e.preventDefault();
            setIsResizing(true);
          }}
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
        <div className="max-w-3xl mx-auto p-6 min-h-full bg-white">
          <div
            className="rtf-preview prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: "1.6",
              color: "#334155",
            }}
          />
        </div>
      </div>
    </div>
  );
};
