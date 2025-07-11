import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "@/hooks/use-realtime";

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
}

export function Header({ title, subtitle, onRefresh }: HeaderProps) {
  const { isConnected } = useRealtime();

  return (
    <header className="bg-white border-b border-tkd-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-tkd-gray-900">{title}</h2>
          <p className="text-tkd-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Real-time status indicator */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            isConnected ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              isConnected ? 'text-green-700' : 'text-red-700'
            }`}>
              {isConnected ? 'Real-time aktif' : 'Reconnecting...'}
            </span>
          </div>
          
          {/* Refresh button */}
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRefresh}
              className="text-tkd-gray-500 hover:text-tkd-gray-700"
            >
              <i className="fas fa-sync-alt"></i>
            </Button>
          )}
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative text-tkd-gray-500 hover:text-tkd-gray-700">
            <i className="fas fa-bell"></i>
            <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-tkd-red text-white text-xs">
              3
            </Badge>
          </Button>
        </div>
      </div>
    </header>
  );
}
