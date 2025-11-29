import { X } from "lucide-react";
import { FileTabProps } from "../types";

export const FileTab: React.FC<FileTabProps> = ({
  activeFileId,
  setActiveFileId,
  file,
  handleCloseFile,
}) => {
  return (
    <div
      key={file.id}
      onClick={() => setActiveFileId(file.id)}
      className={`
              group flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-colors min-w-[120px] max-w-[200px] border-t border-l border-r
              ${
                activeFileId === file.id
                  ? "bg-white text-blue-600 border-slate-200 border-b-white -mb-px z-10"
                  : "bg-slate-200 text-slate-500 border-transparent hover:bg-slate-300"
              }
            `}
    >
      <span className="truncate flex-1">{file.name}</span>
      <button
        onClick={(e) => handleCloseFile(e, file.id)}
        className={`
                p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                ${
                  activeFileId === file.id
                    ? "hover:bg-slate-100 text-slate-400 hover:text-red-500"
                    : "hover:bg-slate-400/20 text-slate-500"
                }
              `}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
