import { useState, useEffect } from "react";
import mammoth from "mammoth";
import { DocumentFile } from "../types";

interface WordReaderProps {
  file: DocumentFile;
}

export const WordReader: React.FC<WordReaderProps> = ({ file }) => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWordDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        let arrayBuffer: ArrayBuffer;
        
        if (file.rawData) {
          arrayBuffer = file.rawData instanceof ArrayBuffer
            ? file.rawData
            : file.rawData.buffer;
        } else {
          // Try to convert content to ArrayBuffer
          if (file.content.startsWith('data:')) {
            const base64 = file.content.split(',')[1];
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            arrayBuffer = bytes.buffer;
          } else {
            // Try parsing as base64
            try {
              const binaryString = atob(file.content);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              arrayBuffer = bytes.buffer;
            } catch {
              throw new Error("Invalid Word document data format");
            }
          }
        }

        // Check if it's .docx (mammoth supports) or .doc (not directly supported)
        const isDocx = file.name.toLowerCase().endsWith('.docx');
        
        if (isDocx) {
          // Use mammoth to convert .docx to HTML
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setHtmlContent(result.value);
          
          if (result.messages.length > 0) {
            console.warn("Word conversion warnings:", result.messages);
          }
        } else {
          // .doc files are not directly supported by mammoth
          // Show a message suggesting conversion to .docx
          throw new Error(
            ".doc files are not directly supported. Please convert to .docx format or use a conversion tool."
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load Word document");
      } finally {
        setLoading(false);
      }
    };

    loadWordDocument();
  }, [file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
        Loading Word document...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <div className="text-center p-6 max-w-md">
          <p className="font-semibold mb-2">Error loading Word document</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-4xl mx-auto p-6 min-h-full bg-white shadow-sm">
        <div
          className="word-content prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.6',
            color: '#334155',
          }}
        />
      </div>
    </div>
  );
};

