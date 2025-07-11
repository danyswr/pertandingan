import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message = "Memuat data..." }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 flex items-center space-x-4 shadow-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tkd-blue"></div>
        <span className="text-tkd-gray-900 font-medium">{message}</span>
      </div>
    </div>
  );
}
