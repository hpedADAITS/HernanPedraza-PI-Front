import React, { useEffect, useMemo, useState } from 'react';
import { Check, UserPlus, UserMinus, X, Mail, Users, Search, Music, Send } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/common';
import { SettingsDialog, SettingsDialogActions, SettingsDialogButton } from '@/components/settings/SettingsUI';
import { useToast } from '@/hooks/useToast';
import { friendsAPI, participantsAPI } from '@/services/api';
import type { Friend, FriendRequest } from '@/services/api';
import { readStoredJson } from '@/utils/storage';
import { getStoredEventId } from '@/services/session';
import { t } from '@/i18n';
import type { NavigateToView, View } from '@/types';

interface Props {
  mode: 'attendee' | 'dj';
  onNavigate: NavigateToView;
}

type Tab = 'friends' | 'requests' | 'add';

interface EventAttendeeOption {
  participantId: string;
  userId: string | null;
  nickname: string;
  profilePicture: string | null;
}

export function Friends({ mode, onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInviteFor, setShowInviteFor] = useState<Friend | null>(null);
  const { toast } = useToast();
  const settingsView: View = mode === 'dj' ? 'dj-settings' : 'attendee-settings';
  const eventId = getStoredEventId();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [list, inc, out] = await Promise.all([
        friendsAPI.listFriends(),
        friendsAPI.listRequests('incoming'),
        friendsAPI.listRequests('outgoing'),
      ]);
      setFriends(list);
      setIncoming(inc);
      setOutgoing(out);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('Failed to load friends'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await friendsAPI.respondRequest(id, true);
      await loadAll();
      toast.success(t('Friend added'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to accept friend request'));
    }
  };

  const handleDeny = async (id: string) => {
    try {
      await friendsAPI.respondRequest(id, false);
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to deny friend request'));
    }
  };

  const handleUnfriend = async (friendId: string) => {
    try {
      await friendsAPI.unfriend(friendId);
      await loadAll();
      toast.success(t('Friend removed'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to remove friend'));
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await friendsAPI.cancelRequest(id);
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to cancel request'));
    }
  };

  const incomingCount = incoming.length;
  const filteredFriends = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((friend) => friend.displayName.toLowerCase().includes(q));
  }, [friends, search]);

  return (
    <Layout theme="blue" className="p-6 md:p-12 items-center" showNav={true}>
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate(settingsView)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            {t('Back')}
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('Friends')}</h1>
          <div className="w-12" />
        </div>

        <div className="mb-6 flex gap-2 rounded-xl bg-white/60 p-1 shadow-inner">
          <TabButton
            active={tab === 'friends'}
            onClick={() => setTab('friends')}
            icon={<Users size={16} />}
            label={t('My friends')}
            badge={friends.length || null}
          />
          <TabButton
            active={tab === 'requests'}
            onClick={() => setTab('requests')}
            icon={<Mail size={16} />}
            label={t('Requests')}
            badge={incomingCount || null}
          />
          <TabButton
            active={tab === 'add'}
            onClick={() => setTab('add')}
            icon={<UserPlus size={16} />}
            label={t('Add friend')}
          />
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white/80 p-6 text-center text-sm font-medium text-slate-600 shadow">
            {t('Loading…')}
          </div>
        ) : tab === 'friends' ? (
          <FriendsTab
            friends={filteredFriends}
            search={search}
            onSearchChange={setSearch}
            onUnfriend={handleUnfriend}
            onInvite={setShowInviteFor}
          />
        ) : tab === 'requests' ? (
          <RequestsTab
            incoming={incoming}
            outgoing={outgoing}
            onAccept={handleAccept}
            onDeny={handleDeny}
            onCancel={handleCancel}
          />
        ) : (
          <AddFriendTab onSent={loadAll} />
        )}
      </div>

      {showInviteFor && (
        <InviteToEventModal
          friend={showInviteFor}
          eventId={eventId}
          onClose={() => setShowInviteFor(null)}
          onSent={() => {
            setShowInviteFor(null);
            void loadAll();
          }}
        />
      )}
    </Layout>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition ${
        active ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-white/60'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge != null && badge > 0 && (
        <span
          className={`ml-1 rounded-full px-1.5 text-[10px] font-extrabold ${
            active ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function FriendsTab({
  friends,
  search,
  onSearchChange,
  onUnfriend,
  onInvite,
}: {
  friends: Friend[];
  search: string;
  onSearchChange: (next: string) => void;
  onUnfriend: (friendId: string) => void;
  onInvite: (friend: Friend) => void;
}) {
  return (
    <div className="rounded-2xl bg-white/90 p-4 shadow">
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('Search friends…')}
          className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
        />
      </div>
      {friends.length === 0 ? (
        <p className="py-6 text-center text-sm font-medium text-slate-500">
          {t('You have no friends yet. Send a request from the Add tab.')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {friends.map((friend) => (
            <li
              key={friend.friendId}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar
                  name={friend.displayName}
                  profilePicture={friend.profilePicture}
                  className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100"
                  fallbackClassName="bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {friend.displayName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {t('Friends since {date}', { date: new Date(friend.since).toLocaleDateString() })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onInvite(friend)}
                  className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
                >
                  <Send size={12} className="mr-1 inline" />
                  {t('Invite')}
                </button>
                <button
                  type="button"
                  onClick={() => onUnfriend(friend.friendId)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={t('Remove friend')}
                >
                  <UserMinus size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestsTab({
  incoming,
  outgoing,
  onAccept,
  onDeny,
  onCancel,
}: {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  onAccept: (id: string) => void;
  onDeny: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white/90 p-4 shadow">
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-slate-500">
          {t('Incoming requests')}
        </h2>
        {incoming.length === 0 ? (
          <p className="py-2 text-center text-sm font-medium text-slate-500">
            {t('No pending requests')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {incoming.map((request) => (
              <li
                key={request.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={request.other?.displayName || t('Unknown')}
                    profilePicture={request.other?.profilePicture}
                    className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100"
                    fallbackClassName="bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {request.other?.displayName || t('Unknown')}
                    </p>
                    {request.message && (
                      <p className="truncate text-xs text-slate-500">“{request.message}”</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onAccept(request.id)}
                    className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    <Check size={12} className="mr-1 inline" />
                    {t('Accept')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeny(request.id)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={t('Deny')}
                  >
                    <X size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-white/90 p-4 shadow">
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-slate-500">
          {t('Outgoing requests')}
        </h2>
        {outgoing.length === 0 ? (
          <p className="py-2 text-center text-sm font-medium text-slate-500">
            {t('No outgoing requests')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {outgoing.map((request) => (
              <li
                key={request.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={request.other?.displayName || t('Unknown')}
                    profilePicture={request.other?.profilePicture}
                    className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100"
                  fallbackClassName="bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {request.other?.displayName || t('Unknown')}
                    </p>
                    <p className="truncate text-xs text-slate-500">{t('Pending')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCancel(request.id)}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  {t('Cancel')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddFriendTab({ onSent }: { onSent: () => void }) {
  const eventId = getStoredEventId();
  const myUserId =
    readStoredJson<{ _id?: string; id?: string }>('user')?._id ||
    readStoredJson<{ _id?: string; id?: string }>('user')?.id ||
    null;
  const [attendees, setAttendees] = useState<EventAttendeeOption[]>([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!eventId) {
        setAttendees([]);
        setLoading(false);
        return;
      }
      try {
        const list = await participantsAPI.listEventParticipants(eventId);
        if (cancelled) return;
        const options: EventAttendeeOption[] = (Array.isArray(list) ? list : [])
          .map((p: Record<string, unknown>) => {
            const userId =
              typeof p.userId === 'string'
                ? p.userId
                : (p.userId && typeof p.userId === 'object'
                  ? ((p.userId as Record<string, unknown>)._id || (p.userId as Record<string, unknown>).id)
                  : null);
            return {
              participantId: String(p._id || p.id || ''),
              userId: userId ? String(userId) : null,
              nickname: String(p.nickname || ''),
              profilePicture: (p.profilePicture as string | null) || null,
            };
          })
          .filter((option) => option.userId && option.userId !== myUserId);
        setAttendees(options);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : t('Failed to load attendees'),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, myUserId, toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return attendees;
    return attendees.filter((a) => a.nickname.toLowerCase().includes(q));
  }, [attendees, search]);

  const send = async (toUserId: string, nickname: string) => {
    setSending(toUserId);
    try {
      await friendsAPI.sendRequest(toUserId);
      toast.success(t('Friend request sent to {name}', { name: nickname }));
      onSent();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('Failed to send friend request'),
      );
    } finally {
      setSending(null);
    }
  };

  if (!eventId) {
    return (
      <div className="rounded-2xl bg-white/90 p-4 text-center text-sm font-medium text-slate-600 shadow">
        {t('Join an event to add friends from the attendees list.')}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/90 p-4 shadow">
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-slate-500">
        {t('People in this event')}
      </h2>
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('Search attendees…')}
          className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
        />
      </div>
      {loading ? (
        <p className="py-2 text-center text-sm font-medium text-slate-500">
          {t('Loading…')}
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-2 text-center text-sm font-medium text-slate-500">
          {t('No other attendees with accounts are in this event right now.')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((attendee) => (
            <li
              key={attendee.participantId}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar
                  name={attendee.nickname}
                  profilePicture={attendee.profilePicture}
                  className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100"
                  fallbackClassName="bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold"
                />
                <p className="truncate text-sm font-bold text-slate-800">
                  {attendee.nickname}
                </p>
              </div>
              <button
                type="button"
                onClick={() => attendee.userId && send(attendee.userId, attendee.nickname)}
                disabled={sending === attendee.userId}
                className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <UserPlus size={12} className="mr-1 inline" />
                {t('Add')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InviteToEventModal({
  friend,
  eventId,
  onClose,
  onSent,
}: {
  friend: Friend;
  eventId: string | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!code.trim()) {
      toast.error(t('Enter the event code to send the invite'));
      return;
    }
    setBusy(true);
    try {
      await friendsAPI.sendInvite({
        friendId: friend.friendId,
        eventCode: code.trim(),
        eventId,
        message: message.trim() || undefined,
      });
      toast.success(t('Invite sent to {name}', { name: friend.displayName }));
      onSent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to send invite'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsDialog open onClose={onClose} title={t('Invite {name} to an event', { name: friend.displayName })}>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-slate-600">
          {t('They will receive an email with the event code. Their address stays private.')}
        </p>
        <label className="block text-sm font-semibold text-slate-700">
          {t('Event code')}
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Music size={16} className="text-slate-400" />
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="DJPARTY"
              className="w-full bg-transparent text-base font-bold tracking-widest text-slate-800 outline-none"
            />
          </div>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          {t('Message (optional)')}
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>
      <SettingsDialogActions>
        <SettingsDialogButton onClick={onClose} disabled={busy}>
          {t('Cancel')}
        </SettingsDialogButton>
        <SettingsDialogButton onClick={submit} disabled={busy || !code.trim()} variant="primary">
          {busy ? t('Sending…') : t('Send invite')}
        </SettingsDialogButton>
      </SettingsDialogActions>
    </SettingsDialog>
  );
}
