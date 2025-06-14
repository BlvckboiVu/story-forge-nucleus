
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineState } from '@/hooks/useOfflineState';
import { cn } from '@/lib/utils';

interface ConnectivityIndicatorProps {
  className?: string;
  showText?: boolean;
}

export function ConnectivityIndicator({ className, showText = false }: ConnectivityIndicatorProps) {
  const { connectivity, isOnline, isOffline, isSyncing } = useOfflineState({ syncOnMount: false });

  const getIcon = () => {
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (isOnline) return <Wifi className="h-4 w-4" />;
    return <WifiOff className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (isOnline) return 'Online';
    return 'Offline';
  };

  const getStatusColor = () => {
    if (isSyncing) return 'text-blue-500';
    if (isOnline) return 'text-green-500';
    return 'text-orange-500';
  };

  return (
    <div className={cn(
      'flex items-center gap-2',
      getStatusColor(),
      className
    )}>
      {getIcon()}
      {showText && (
        <span className="text-sm font-medium">
          {getStatusText()}
        </span>
      )}
    </div>
  );
}

export default ConnectivityIndicator;
