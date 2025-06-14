
import { EnhancedOfflineIndicator } from './EnhancedOfflineIndicator';

interface ConnectivityIndicatorProps {
  className?: string;
  showText?: boolean;
}

export function ConnectivityIndicator({ className, showText = false }: ConnectivityIndicatorProps) {
  return (
    <EnhancedOfflineIndicator 
      className={className} 
      showDetails={showText}
      compact={!showText}
    />
  );
}

export default ConnectivityIndicator;
