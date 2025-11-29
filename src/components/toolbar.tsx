import { ToolbarButtonProps } from "../types";

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
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
