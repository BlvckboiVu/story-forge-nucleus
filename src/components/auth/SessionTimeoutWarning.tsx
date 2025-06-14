
import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { sessionManager } from '../../contexts/auth/sessionManager';

export const SessionTimeoutWarning: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    sessionManager.setSessionCallbacks(
      () => {
        setShowWarning(true);
        setTimeRemaining(sessionManager.getTimeUntilExpiry());
      },
      () => {
        setShowWarning(false);
        // The auth context will handle the actual logout
      }
    );

    const interval = setInterval(() => {
      if (showWarning) {
        const remaining = sessionManager.getTimeUntilExpiry();
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          setShowWarning(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = () => {
    sessionManager.updateActivity();
    setShowWarning(false);
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Your session will expire in <strong>{formatTime(timeRemaining)}</strong> due to inactivity.</p>
            <p>Would you like to extend your session?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setShowWarning(false)}>
            Let it expire
          </Button>
          <AlertDialogAction onClick={handleExtendSession}>
            Extend Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
