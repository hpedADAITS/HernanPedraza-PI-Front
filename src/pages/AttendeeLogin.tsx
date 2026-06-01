import React from 'react';
import { LoginPage } from '@/pages/LoginPage';
import { AttendeeLoginForm } from './attendee-login/AttendeeLoginForm';
import { QRScannerModal } from './attendee-login/QRScannerModal';
import { useAttendeeLoginController } from './attendee-login/useAttendeeLoginController';
import { useQrScanner } from './attendee-login/useQrScanner';
import type { NavigateToView } from '@/types';

interface Props {
  onNavigate: NavigateToView;
  logoWhite?: boolean;
  onLogoChange?: (white: boolean) => void;
}

export function AttendeeLogin({ onNavigate }: Props) {
  const controller = useAttendeeLoginController(onNavigate);
  const { videoRef, canvasRef } = useQrScanner({
    enabled: controller.state.showQRScanner,
    onCode: controller.setScannedCode,
    onClose: controller.closeScanner,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await controller.submit();
  };

  return (
    <LoginPage
      onBack={() => onNavigate('role-selection')}
      background="radial-gradient(ellipse 90% 60% at 50% -10%, rgba(255,255,255,0.10) 0%, transparent 60%), linear-gradient(180deg, #065f46 0%, #052e22 100%)"
      formClassName="overflow-hidden p-7 sm:p-9"
      onSubmit={handleSubmit}
    >
      <AttendeeLoginForm
        state={controller.state}
        loading={controller.loading}
        isAccessCodeVerified={controller.isAccessCodeVerified}
        onNicknameChange={controller.setNickname}
        onEventCodeChange={controller.setEventCode}
        onNicknamePasswordChange={controller.setNicknamePassword}
        onOpenScanner={controller.openScanner}
      />

      <QRScannerModal
        open={controller.state.showQRScanner}
        videoRef={videoRef}
        canvasRef={canvasRef}
        onClose={controller.closeScanner}
      />
    </LoginPage>
  );
}
