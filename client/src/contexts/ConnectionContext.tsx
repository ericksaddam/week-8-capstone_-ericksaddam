import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ConnectionContext } from '@/hooks/useConnection';
import { checkBackendHealth } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';

type ConnectionContextType = {
  isOnline: boolean;
  lastChecked: Date | null;
  checkConnection: () => Promise<boolean>;
};



export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = useCallback(async (showToast = true) => {
    if (isChecking) return isOnline;
    
    setIsChecking(true);
    try {
      const isBackendHealthy = await checkBackendHealth();
      const wasOffline = !isOnline;
      
      setIsOnline(isBackendHealthy);
      setLastChecked(new Date());
      
      if (wasOffline && isBackendHealthy) {
        toast({
          title: 'Back Online',
          description: 'Connection to the server has been restored.',
          variant: 'default',
        });
      } else if (!isBackendHealthy && showToast) {
        toast({
          title: 'Connection Error',
          description: 'Unable to connect to the server. Some features may be unavailable.',
          variant: 'destructive',
        });
      }
      
      return isBackendHealthy;
    } catch (error) {
      setIsOnline(false);
      setLastChecked(new Date());
      
      if (showToast) {
        toast({
          title: 'Connection Error',
          description: 'Unable to connect to the server. Please check your internet connection and try again.',
          variant: 'destructive',
        });
      }
      
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, isOnline, toast]);

  // Check connection on mount and periodically
  useEffect(() => {
    checkConnection();
    
    const interval = setInterval(() => {
      checkConnection(false);
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [checkConnection]);

  return (
    <ConnectionContext.Provider value={{ isOnline, lastChecked, checkConnection }}>
      {children}
    </ConnectionContext.Provider>
  );
}


