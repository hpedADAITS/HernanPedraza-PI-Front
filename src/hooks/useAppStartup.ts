import { useEffect } from 'react';
import { toast } from 'sonner';
import { API_BASE, checkHealth, loadToken } from '@/services/api';
import { isDebugModeEnabled } from '@/utils/debugMode';

export function useAppStartup() {
  useEffect(() => {
    loadToken();

    const checkDatabaseConnection = async () => {
      const isDebug = isDebugModeEnabled();
      if (isDebug) {
        return;
      }

      const health = await checkHealth();
      if (health.database) {
        return;
      } else {
        toast.error(`Failed to connect to ${API_BASE}`);
      }
    };
    checkDatabaseConnection();
  }, []);
}
