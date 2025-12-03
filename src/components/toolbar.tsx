import { DocumentFile, ToolbarButtonProps } from "../types";
import {
  Type,
  Bold,
  Italic,
  List,
  Code,
  Quote,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";

export const ToolBarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon,
  onClick,
  label,
}) => (
  <button
    onClick={onClick}
    className="p-2 text-slate-600 hover:bg-slate-100 hover:text-blue-600 rounded-md transition-colors flex items-center justify-center min-w-[36px]"
    title={label}
  >
    <Icon className="w-4 h-4" />
  </button>
);

export const ToolBar: React.FC<{
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  activeFile: DocumentFile;
  handleUpdateContent: (content: string) => void;
}> = ({ textareaRef, activeFile, handleUpdateContent }) => {
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
  return (
    <div className="bg-white border-b border-slate-200 px-2 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto z-10 shadow-sm">
      <ToolBarButton
        icon={Bold}
        label="Bold"
        onClick={() => insertSyntax("**", "**")}
      />
      <ToolBarButton
        icon={Italic}
        label="Italic"
        onClick={() => insertSyntax("*", "*")}
      />
      <div className="w-px h-6 bg-slate-200 mx-1"></div>
      <ToolBarButton
        icon={Type}
        label="Heading"
        onClick={() => insertSyntax("## ")}
      />
      <ToolBarButton
        icon={Quote}
        label="Quote"
        onClick={() => insertSyntax("> ")}
      />
      <ToolBarButton
        icon={List}
        label="List"
        onClick={() => insertSyntax("- ")}
      />
      <div className="w-px h-6 bg-slate-200 mx-1"></div>
      <ToolBarButton
        icon={Code}
        label="Code Block"
        onClick={() => insertSyntax("```\n", "\n```")}
      />
      <ToolBarButton
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
  );
};
