import { useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { API_BASE, checkHealth, loadToken } from '@/services/api';
import { isDebugModeEnabled } from '@/utils/debugMode';
import { t } from '@/i18n';

export function useAppStartup() {
  const toast = useToast();
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
        toast.error(t('Failed to connect to {target}', { target: API_BASE }));
      }
    };
    checkDatabaseConnection();
  }, []);
}
