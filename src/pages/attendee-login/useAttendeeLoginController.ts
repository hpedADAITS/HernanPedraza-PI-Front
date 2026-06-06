import { useReducer, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { attendeeSessionAPI, participantsAPI, eventsAPI } from '@/services/api';
import * as socket from '@/services/socket';
import { writeStoredJson } from '@/utils/storage';
import { activateSingleUserSession } from '@/services/singleUserSession';
import { queueFirstTimeTutorial } from '@/components/modals/firstTimeTutorialQueue';
import { validateNickname } from '@/utils/validation';
import { t } from '@/i18n';
import type { NavigateToView } from '@/types';

interface VerifiedEvent {
  _id?: string;
  id?: string;
  ownerName?: string;
  ownerId?: {
    displayName?: string;
    profilePicture?: string | null;
  } | null;
}

export interface AttendeeLoginState {
  eventCode: string;
  nickname: string;
  nicknamePassword: string;
  verifiedEvent: VerifiedEvent | null;
  showQRScanner: boolean;
}

type AttendeeLoginAction =
  | { type: 'set_event_code'; value: string }
  | { type: 'set_nickname'; value: string }
  | { type: 'set_nickname_password'; value: string }
  | { type: 'set_verified_event'; value: VerifiedEvent | null }
  | { type: 'set_show_qr_scanner'; value: boolean };

const INITIAL_STATE: AttendeeLoginState = {
  eventCode: '',
  nickname: '',
  nicknamePassword: '',
  verifiedEvent: null,
  showQRScanner: false,
};

function reducer(
  state: AttendeeLoginState,
  action: AttendeeLoginAction,
): AttendeeLoginState {
  switch (action.type) {
    case 'set_event_code':
      return { ...state, eventCode: action.value };
    case 'set_nickname':
      return { ...state, nickname: action.value };
    case 'set_nickname_password':
      return { ...state, nicknamePassword: action.value };
    case 'set_verified_event':
      return { ...state, verifiedEvent: action.value };
    case 'set_show_qr_scanner':
      return { ...state, showQRScanner: action.value };
    default:
      return state;
  }
}

export function useAttendeeLoginController(onNavigate: NavigateToView) {
  const [loading, setLoading] = useState(false);
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const isAccessCodeVerified = Boolean(state.verifiedEvent);
  const { toast } = useToast();

  const closeScanner = () => dispatch({ type: 'set_show_qr_scanner', value: false });
  const openScanner = () => dispatch({ type: 'set_show_qr_scanner', value: true });

  const setScannedCode = (code: string) => {
    dispatch({ type: 'set_event_code', value: code });
    closeScanner();
  };

  const setNickname = (value: string) => {
    dispatch({ type: 'set_nickname', value });
    dispatch({ type: 'set_verified_event', value: null });
  };

  const setEventCode = (value: string) => {
    dispatch({ type: 'set_event_code', value: value.toUpperCase() });
    dispatch({ type: 'set_verified_event', value: null });
  };

  const setNicknamePassword = (value: string) => {
    dispatch({ type: 'set_nickname_password', value });
  };

  const ensureNicknameAllowed = async () => {
    const result = validateNickname(state.nickname.trim());
    if (!result.valid) throw new Error(result.message || t('Invalid nickname'));
    await participantsAPI.validateNickname(state.nickname.trim());
  };

  const validateAccessCode = async () => {
    setLoading(true);
    try {
      if (!state.eventCode.trim() || !state.nickname.trim()) {
        throw new Error(t('Please enter both event code and nickname'));
      }

      await ensureNicknameAllowed();
      const event = await eventsAPI.getEventByAccessCode(state.eventCode);
      if (!event) {
        throw new Error(
          t('Invalid access code. Please check the code and try again, or ask the DJ to share a new QR code.'),
        );
      }

      dispatch({ type: 'set_verified_event', value: event });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('Invalid access code. Please check the code and try again.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const joinEvent = async () => {
    setLoading(true);
    try {
      const event = state.verifiedEvent;
      if (!event) throw new Error(t('Please enter a valid access code first'));

      await ensureNicknameAllowed();

      const eventId = event._id || event.id;
      if (!eventId) throw new Error(t('Invalid event details. Please verify the access code again.'));

      const { participant, token, user } = await attendeeSessionAPI.joinEvent(
        eventId,
        state.nickname,
        null,
        state.nicknamePassword || undefined,
      );
      if (!participant || !token || !user) throw new Error(t('Failed to join event'));

      const userId = user.id ?? user._id;
      const userSession = {
        _id: userId,
        id: userId,
        displayName: state.nickname,
        role: user.role ?? 'ATTENDEE',
      };

      writeStoredJson('user', userSession);
      activateSingleUserSession(userSession);
      writeStoredJson('currentEvent', {
        nickname: state.nickname,
        eventCode: state.eventCode,
        eventId,
        participantId: participant._id || participant.id,
        joinedAt: new Date().toISOString(),
        ownerName: event.ownerId?.displayName || event.ownerName || 'En evento de DJ:',
        ownerProfilePicture: event.ownerId?.profilePicture || null,
      });
      writeStoredJson('currentParticipant', {
        _id: participant._id || participant.id,
        nickname: state.nickname,
        eventId,
        profilePicture: participant.profilePicture || null,
        passwordProtected: Boolean(participant.passwordProtected),
      });

      toast.success(t('Joined event successfully!'));
      socket.initSocket(token);
      queueFirstTimeTutorial('attendee');
      onNavigate('attendee-dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('Failed to join event');
      if (message === 'Participant has been banned from this event') {
        onNavigate('banned');
        return;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (isAccessCodeVerified) {
      await joinEvent();
    } else {
      await validateAccessCode();
    }
  };

  return {
    state,
    loading,
    isAccessCodeVerified,
    openScanner,
    closeScanner,
    setScannedCode,
    setNickname,
    setEventCode,
    setNicknamePassword,
    submit,
  };
}
