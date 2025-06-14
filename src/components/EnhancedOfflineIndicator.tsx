
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock, Upload } from 'lucide-react';
import { useOfflineState } from '@/hooks/useOfflineState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface EnhancedOfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export function EnhancedOfflineIndicator({ 
  className, 
  showDetails = false, 
  compact = false 
}: EnhancedOfflineIndicatorProps) {
  const { 
    connectivity, 
    isOnline, 
    isOffline, 
    isSyncing,
    editorState,
    currentProject,
    currentDraft 
  } = useOfflineState();
  
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Mock sync queue for demonstration (in real app, this would come from offlineStateManager)
  useEffect(() => {
    // Simulate pending sync items
    const pendingItems = [];
    if (editorState?.unsavedContent && isOffline) {
      pendingItems.push({
        type: 'draft_update',
        timestamp: Date.now(),
        size: editorState.unsavedContent.length,
      });
    }
    setSyncQueue(pendingItems);
  }, [editorState, isOffline]);

  const getStatusIcon = () => {
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (isOnline && syncQueue.length === 0) return <CheckCircle className="h-4 w-4" />;
    if (isOnline && syncQueue.length > 0) return <Upload className="h-4 w-4" />;
    if (isOffline && syncQueue.length > 0) return <Clock className="h-4 w-4" />;
    if (isOffline) return <WifiOff className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (isSyncing) return 'text-blue-500';
    if (isOnline && syncQueue.length === 0) return 'text-green-500';
    if (isOnline && syncQueue.length > 0) return 'text-yellow-500';
    if (isOffline) return 'text-orange-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing changes...';
    if (isOnline && syncQueue.length === 0) return 'All changes saved';
    if (isOnline && syncQueue.length > 0) return `Syncing ${syncQueue.length} changes`;
    if (isOffline && syncQueue.length > 0) return `${syncQueue.length} changes pending`;
    if (isOffline) return 'Working offline';
    return 'Online';
  };

  const getDetailedStatus = () => {
    const hasUnsaved = editorState?.unsavedContent;
    const lastSaved = editorState?.lastSaved;
    
    return {
      connection: isOnline ? 'Connected' : 'Offline',
      lastSync: lastSyncTime?.toLocaleTimeString() || 'Never',
      pendingChanges: syncQueue.length,
      unsavedContent: hasUnsaved ? 'Yes' : 'No',
      lastActivity: lastSaved ? new Date(lastSaved).toLocaleTimeString() : 'No activity',
    };
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', getStatusColor(), className)}>
        {getStatusIcon()}
        {syncQueue.length > 0 && (
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {syncQueue.length}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Popover open={showTooltip} onOpenChange={setShowTooltip}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex items-center gap-2 px-2 py-1 h-auto',
            getStatusColor(),
            className
          )}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {getStatusIcon()}
          {!compact && (
            <span className="text-sm font-medium">
              {getStatusText()}
            </span>
          )}
          {syncQueue.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {syncQueue.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      {showDetails && (
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <h4 className="font-semibold">{getStatusText()}</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              {Object.entries(getDetailedStatus()).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>

            {syncQueue.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sync Progress</span>
                  <span className="font-medium">
                    {isSyncing ? 'Syncing...' : 'Waiting to sync'}
                  </span>
                </div>
                <Progress 
                  value={isSyncing ? 50 : 0} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {isOffline 
                    ? 'Changes will sync automatically when online' 
                    : 'Sync in progress...'
                  }
                </div>
              </div>
            )}

            {isOffline && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-800 dark:text-orange-200">
                      Working Offline
                    </p>
                    <p className="text-orange-700 dark:text-orange-300 mt-1">
                      Your changes are being saved locally and will sync automatically when you're back online.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}

export default EnhancedOfflineIndicator;
