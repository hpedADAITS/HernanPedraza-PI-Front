import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Check,
    Mail,
    Music,
    Search,
    Send,
    UserMinus,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { m } from 'motion/react';
import { clsx } from 'clsx';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/common';
import {
    SettingsDialog,
    SettingsDialogActions,
    SettingsDialogButton,
} from '@/components/settings/SettingsUI';
import { useToast } from '@/hooks/useToast';
import { useDarkMode } from '@/hooks/useDarkMode';
import { friendsAPI, participantsAPI } from '@/services/api';
import type { Friend, FriendRequest } from '@/services/api';
import { readStoredJson } from '@/utils/storage';
import { getStoredEventId } from '@/services/session';
import { ANIMATION_DURATION, SCALE_IN, SLIDE_UP } from '@/constants/animations';
import { t } from '@/i18n';
import type { NavigateToView } from '@/types';

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

const panelClass = (isDarkMode: boolean) =>
    clsx(
        'rounded-2xl border shadow-[0_12px_28px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]',
        isDarkMode
            ? 'border-white/10 bg-[linear-gradient(180deg,#182235_0%,#111827_100%)] shadow-[0_16px_34px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'border-slate-900/10 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]',
    );

const mutedText = (isDarkMode: boolean) =>
    isDarkMode ? 'text-slate-400' : 'text-[#73829d]';

const primaryText = (isDarkMode: boolean) =>
    isDarkMode ? 'text-slate-50' : 'text-[#101c3a]';

const primaryButtonClass = (mode: 'attendee' | 'dj') =>
    mode === 'dj'
        ? 'bg-[#2878ff] hover:bg-[#1f66dc] focus-visible:ring-blue-100'
        : 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-100';

const rowClass = (isDarkMode: boolean) =>
    clsx(
        'flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors',
        isDarkMode
            ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
            : 'border-slate-900/10 bg-white hover:bg-slate-50',
    );

export function Friends({ mode, onNavigate }: Props) {
    const [tab, setTab] = useState<Tab>('friends');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [incoming, setIncoming] = useState<FriendRequest[]>([]);
    const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showInviteFor, setShowInviteFor] = useState<Friend | null>(null);
    const { error: toastError, success: toastSuccess } = useToast();
    const [isDarkMode] = useDarkMode();
    const backView = mode === 'dj' ? 'dj-dashboard' : 'attendee-dashboard';
    const eventId = getStoredEventId();

    const loadAll = useCallback(async () => {
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
            toastError(
                error instanceof Error
                    ? error.message
                    : t('Failed to load friends'),
            );
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    useEffect(() => {
        let active = true;
        queueMicrotask(() => {
            if (active) void loadAll();
        });
        return () => {
            active = false;
        };
    }, [loadAll]);

    const handleAccept = async (id: string) => {
        try {
            await friendsAPI.respondRequest(id, true);
            await loadAll();
            toastSuccess(t('Friend added'));
        } catch (error) {
            toastError(
                error instanceof Error
                    ? error.message
                    : t('Failed to accept friend request'),
            );
        }
    };

    const handleDeny = async (id: string) => {
        try {
            await friendsAPI.respondRequest(id, false);
            await loadAll();
        } catch (error) {
            toastError(
                error instanceof Error
                    ? error.message
                    : t('Failed to deny friend request'),
            );
        }
    };

    const handleUnfriend = async (friendId: string) => {
        try {
            await friendsAPI.unfriend(friendId);
            await loadAll();
            toastSuccess(t('Friend removed'));
        } catch (error) {
            toastError(
                error instanceof Error
                    ? error.message
                    : t('Failed to remove friend'),
            );
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await friendsAPI.cancelRequest(id);
            await loadAll();
        } catch (error) {
            toastError(
                error instanceof Error
                    ? error.message
                    : t('Failed to cancel request'),
            );
        }
    };

    const incomingCount = incoming.length;
    const filteredFriends = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return friends;
        return friends.filter(friend =>
            friend.displayName.toLowerCase().includes(q),
        );
    }, [friends, search]);

    return (
        <Layout
            theme="white"
            className="min-h-0 p-6 md:p-10 lg:px-8 lg:py-0 lg:pb-2"
            showNav={true}>
            <div className="mx-auto mt-4 flex w-full max-w-[896px] flex-1 min-h-0 flex-col gap-5 lg:mt-6">
                <m.header
                    {...SCALE_IN}
                    className={clsx(
                        panelClass(isDarkMode),
                        'flex items-center justify-between gap-4 px-5 py-4 sm:px-6',
                    )}>
                    <button
                        type="button"
                        onClick={() => onNavigate(backView)}
                        className={clsx(
                            'flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4',
                            isDarkMode
                                ? 'border border-white/30 bg-white/10 text-white hover:bg-white/16'
                                : 'border border-slate-900/20 bg-white text-slate-700 hover:bg-slate-50',
                        )}
                        aria-label={t('Go back')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
                        {t('Back')}
                    </button>

                    <div className="min-w-0 text-center">
                        <h1
                            className={clsx(
                                'truncate text-[22px] font-black leading-tight tracking-normal',
                                primaryText(isDarkMode),
                            )}>
                            {t('Friends')}
                        </h1>
                        <p
                            className={clsx(
                                'mt-1 text-xs font-bold leading-snug',
                                mutedText(isDarkMode),
                            )}>
                            {t('Manage friends')}
                        </p>
                    </div>

                    <div
                        className={clsx(
                            'grid h-10 min-w-10 shrink-0 place-items-center rounded-xl px-3 text-sm font-extrabold',
                            mode === 'dj'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700',
                        )}
                        aria-label={`${friends.length} ${t('Friends')}`}>
                        {friends.length}
                    </div>
                </m.header>

                <m.div
                    {...SLIDE_UP}
                    className={clsx(
                        panelClass(isDarkMode),
                        'grid gap-2 p-1.5 sm:grid-cols-3',
                    )}>
                    <TabButton
                        active={tab === 'friends'}
                        badge={friends.length || null}
                        icon={<Users size={16} />}
                        isDarkMode={isDarkMode}
                        label={t('My friends')}
                        mode={mode}
                        onClick={() => setTab('friends')}
                    />
                    <TabButton
                        active={tab === 'requests'}
                        badge={incomingCount || null}
                        icon={<Mail size={16} />}
                        isDarkMode={isDarkMode}
                        label={t('Requests')}
                        mode={mode}
                        onClick={() => setTab('requests')}
                    />
                    <TabButton
                        active={tab === 'add'}
                        icon={<UserPlus size={16} />}
                        isDarkMode={isDarkMode}
                        label={t('Add friend')}
                        mode={mode}
                        onClick={() => setTab('add')}
                    />
                </m.div>

                {loading ? (
                    <m.div
                        {...SLIDE_UP}
                        className={clsx(
                            panelClass(isDarkMode),
                            'p-6 text-center text-sm font-semibold',
                            mutedText(isDarkMode),
                        )}>
                        {t('Loading…')}
                    </m.div>
                ) : tab === 'friends' ? (
                    <FriendsTab
                        friends={filteredFriends}
                        isDarkMode={isDarkMode}
                        mode={mode}
                        onInvite={setShowInviteFor}
                        onSearchChange={setSearch}
                        onUnfriend={handleUnfriend}
                        search={search}
                    />
                ) : tab === 'requests' ? (
                    <RequestsTab
                        incoming={incoming}
                        isDarkMode={isDarkMode}
                        onAccept={handleAccept}
                        onCancel={handleCancel}
                        onDeny={handleDeny}
                        outgoing={outgoing}
                    />
                ) : (
                    <AddFriendTab
                        isDarkMode={isDarkMode}
                        mode={mode}
                        onSent={loadAll}
                    />
                )}
            </div>

            {showInviteFor && (
                <InviteToEventModal
                    eventId={eventId}
                    friend={showInviteFor}
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
    badge,
    icon,
    isDarkMode,
    label,
    mode,
    onClick,
}: {
    active: boolean;
    badge?: number | null;
    icon: React.ReactNode;
    isDarkMode: boolean;
    label: string;
    mode: 'attendee' | 'dj';
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                'flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-4',
                active
                    ? clsx(
                          'text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)]',
                          primaryButtonClass(mode),
                      )
                    : isDarkMode
                      ? 'text-slate-300 hover:bg-white/[0.07] focus-visible:ring-white/10'
                      : 'text-slate-600 hover:bg-slate-50 focus-visible:ring-blue-100',
            )}>
            {icon}
            <span className="truncate">{label}</span>
            {badge != null && badge > 0 && (
                <span
                    className={clsx(
                        'ml-1 rounded-full px-1.5 text-[10px] font-extrabold',
                        active
                            ? 'bg-white/25 text-white'
                            : mode === 'dj'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700',
                    )}>
                    {badge}
                </span>
            )}
        </button>
    );
}

function FriendsTab({
    friends,
    isDarkMode,
    mode,
    onInvite,
    onSearchChange,
    onUnfriend,
    search,
}: {
    friends: Friend[];
    isDarkMode: boolean;
    mode: 'attendee' | 'dj';
    onInvite: (friend: Friend) => void;
    onSearchChange: (next: string) => void;
    onUnfriend: (friendId: string) => void;
    search: string;
}) {
    return (
        <m.section
            {...SLIDE_UP}
            className={clsx(panelClass(isDarkMode), 'p-4 sm:p-5')}>
            <SearchField
                isDarkMode={isDarkMode}
                onChange={onSearchChange}
                placeholder={t('Search friends…')}
                value={search}
            />
            {friends.length === 0 ? (
                <p
                    className={clsx(
                        'py-8 text-center text-sm font-semibold',
                        mutedText(isDarkMode),
                    )}>
                    {t(
                        'You have no friends yet. Send a request from the Add tab.',
                    )}
                </p>
            ) : (
                <ul className="mt-4 flex flex-col gap-3">
                    {friends.map(friend => (
                        <PersonRow
                            key={friend.friendId}
                            actions={
                                <>
                                    <button
                                        type="button"
                                        onClick={() => onInvite(friend)}
                                        className={clsx(
                                            'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold text-white transition-colors focus-visible:outline-none focus-visible:ring-4',
                                            primaryButtonClass(mode),
                                        )}>
                                        <Send size={13} aria-hidden="true" />
                                        {t('Invite')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onUnfriend(friend.friendId)
                                        }
                                        className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                                        aria-label={t('Remove friend')}>
                                        <UserMinus size={16} />
                                    </button>
                                </>
                            }
                            isDarkMode={isDarkMode}
                            meta={t('Friends since {date}', {
                                date: new Date(
                                    friend.since,
                                ).toLocaleDateString(),
                            })}
                            name={friend.displayName}
                            profilePicture={friend.profilePicture}
                        />
                    ))}
                </ul>
            )}
        </m.section>
    );
}

function SearchField({
    isDarkMode,
    onChange,
    placeholder,
    value,
}: {
    isDarkMode: boolean;
    onChange: (next: string) => void;
    placeholder: string;
    value: string;
}) {
    return (
        <label
            className={clsx(
                'group flex h-[52px] min-w-0 items-center gap-3.5 rounded-xl border px-[18px] shadow-[0_10px_20px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]',
                isDarkMode
                    ? 'border-white/10 bg-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.10)]'
                    : 'border-slate-900/10 bg-white',
            )}>
            <Search
                className={clsx(
                    'h-5 w-5 flex-shrink-0 transition-colors group-focus-within:text-[#2878ff]',
                    isDarkMode ? 'text-slate-300' : 'text-[#526990]',
                )}
                aria-hidden="true"
            />
            <input
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className={clsx(
                    'h-full min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold tracking-normal outline-none',
                    isDarkMode
                        ? 'text-white placeholder:text-slate-400'
                        : 'text-[#14213f] placeholder:text-[#8b9ab4]',
                )}
            />
        </label>
    );
}

function PersonRow({
    actions,
    isDarkMode,
    meta,
    name,
    profilePicture,
}: {
    actions: React.ReactNode;
    isDarkMode: boolean;
    meta?: string;
    name: string;
    profilePicture?: string | null;
}) {
    return (
        <m.li
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: ANIMATION_DURATION.fast }}
            className={rowClass(isDarkMode)}>
            <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                    name={name}
                    profilePicture={profilePicture}
                    className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 shadow-sm"
                    fallbackClassName="flex items-center justify-center bg-gradient-to-br from-emerald-400 to-blue-500 font-bold text-white"
                />
                <div className="min-w-0">
                    <p
                        className={clsx(
                            'truncate text-sm font-bold',
                            isDarkMode ? 'text-slate-100' : 'text-slate-800',
                        )}>
                        {name}
                    </p>
                    {meta && (
                        <p
                            className={clsx(
                                'mt-0.5 truncate text-xs font-semibold',
                                mutedText(isDarkMode),
                            )}>
                            {meta}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1.5">
                {actions}
            </div>
        </m.li>
    );
}

function RequestsTab({
    incoming,
    isDarkMode,
    onAccept,
    onCancel,
    onDeny,
    outgoing,
}: {
    incoming: FriendRequest[];
    isDarkMode: boolean;
    onAccept: (id: string) => void;
    onCancel: (id: string) => void;
    onDeny: (id: string) => void;
    outgoing: FriendRequest[];
}) {
    return (
        <div className="flex flex-col gap-4">
            <m.section
                {...SLIDE_UP}
                className={clsx(panelClass(isDarkMode), 'p-4 sm:p-5')}>
                <h2
                    className={clsx(
                        'mb-3 text-[13px] font-extrabold leading-tight',
                        primaryText(isDarkMode),
                    )}>
                    {t('Incoming requests')}
                </h2>
                {incoming.length === 0 ? (
                    <p
                        className={clsx(
                            'py-6 text-center text-sm font-semibold',
                            mutedText(isDarkMode),
                        )}>
                        {t('No pending requests')}
                    </p>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {incoming.map(request => (
                            <PersonRow
                                key={request.id}
                                actions={
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => onAccept(request.id)}
                                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-extrabold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100">
                                            <Check
                                                size={13}
                                                aria-hidden="true"
                                            />
                                            {t('Accept')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDeny(request.id)}
                                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                                            aria-label={t('Deny')}>
                                            <X size={16} />
                                        </button>
                                    </>
                                }
                                isDarkMode={isDarkMode}
                                meta={
                                    request.message
                                        ? `"${request.message}"`
                                        : undefined
                                }
                                name={
                                    request.other?.displayName || t('Unknown')
                                }
                                profilePicture={request.other?.profilePicture}
                            />
                        ))}
                    </ul>
                )}
            </m.section>

            <m.section
                {...SLIDE_UP}
                transition={{ ...SLIDE_UP.transition, delay: 0.04 }}
                className={clsx(panelClass(isDarkMode), 'p-4 sm:p-5')}>
                <h2
                    className={clsx(
                        'mb-3 text-[13px] font-extrabold leading-tight',
                        primaryText(isDarkMode),
                    )}>
                    {t('Outgoing requests')}
                </h2>
                {outgoing.length === 0 ? (
                    <p
                        className={clsx(
                            'py-6 text-center text-sm font-semibold',
                            mutedText(isDarkMode),
                        )}>
                        {t('No outgoing requests')}
                    </p>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {outgoing.map(request => (
                            <PersonRow
                                key={request.id}
                                actions={
                                    <button
                                        type="button"
                                        onClick={() => onCancel(request.id)}
                                        className={clsx(
                                            'h-9 rounded-lg border px-3 text-xs font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-4',
                                            isDarkMode
                                                ? 'border-white/10 bg-white/[0.06] text-slate-100 hover:bg-white/[0.1] focus-visible:ring-white/10'
                                                : 'border-slate-900/10 bg-white text-[#17213a] hover:bg-slate-50 focus-visible:ring-blue-100',
                                        )}>
                                        {t('Cancel')}
                                    </button>
                                }
                                isDarkMode={isDarkMode}
                                meta={t('Pending')}
                                name={
                                    request.other?.displayName || t('Unknown')
                                }
                                profilePicture={request.other?.profilePicture}
                            />
                        ))}
                    </ul>
                )}
            </m.section>
        </div>
    );
}

function AddFriendTab({
    isDarkMode,
    mode,
    onSent,
}: {
    isDarkMode: boolean;
    mode: 'attendee' | 'dj';
    onSent: () => void;
}) {
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
                const list =
                    await participantsAPI.listEventParticipants(eventId);
                if (cancelled) return;
                const options: EventAttendeeOption[] = (
                    Array.isArray(list) ? list : []
                )
                    .map((p: Record<string, unknown>) => {
                        const userId =
                            typeof p.userId === 'string'
                                ? p.userId
                                : p.userId && typeof p.userId === 'object'
                                  ? (p.userId as Record<string, unknown>)._id ||
                                    (p.userId as Record<string, unknown>).id
                                  : null;
                        return {
                            participantId: String(p._id || p.id || ''),
                            userId: userId ? String(userId) : null,
                            nickname: String(p.nickname || ''),
                            profilePicture:
                                (p.profilePicture as string | null) || null,
                        };
                    })
                    .filter(
                        option => option.userId && option.userId !== myUserId,
                    );
                setAttendees(options);
            } catch (error) {
                if (!cancelled) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : t('Failed to load attendees'),
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
        return attendees.filter(attendee =>
            attendee.nickname.toLowerCase().includes(q),
        );
    }, [attendees, search]);

    const send = async (toUserId: string, nickname: string) => {
        setSending(toUserId);
        try {
            await friendsAPI.sendRequest(toUserId);
            toast.success(
                t('Friend request sent to {name}', { name: nickname }),
            );
            onSent();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('Failed to send friend request'),
            );
        } finally {
            setSending(null);
        }
    };

    if (!eventId) {
        return (
            <m.div
                {...SLIDE_UP}
                className={clsx(
                    panelClass(isDarkMode),
                    'p-6 text-center text-sm font-semibold',
                    mutedText(isDarkMode),
                )}>
                {t('Join an event to add friends from the attendees list.')}
            </m.div>
        );
    }

    return (
        <m.section
            {...SLIDE_UP}
            className={clsx(panelClass(isDarkMode), 'p-4 sm:p-5')}>
            <h2
                className={clsx(
                    'mb-3 text-[13px] font-extrabold leading-tight',
                    primaryText(isDarkMode),
                )}>
                {t('People in this event')}
            </h2>
            <SearchField
                isDarkMode={isDarkMode}
                onChange={setSearch}
                placeholder={t('Search attendees…')}
                value={search}
            />
            {loading ? (
                <p
                    className={clsx(
                        'py-6 text-center text-sm font-semibold',
                        mutedText(isDarkMode),
                    )}>
                    {t('Loading…')}
                </p>
            ) : filtered.length === 0 ? (
                <p
                    className={clsx(
                        'py-6 text-center text-sm font-semibold',
                        mutedText(isDarkMode),
                    )}>
                    {t(
                        'No other attendees with accounts are in this event right now.',
                    )}
                </p>
            ) : (
                <ul className="mt-4 flex flex-col gap-3">
                    {filtered.map(attendee => (
                        <PersonRow
                            key={attendee.participantId}
                            actions={
                                <button
                                    type="button"
                                    onClick={() =>
                                        attendee.userId &&
                                        send(attendee.userId, attendee.nickname)
                                    }
                                    disabled={sending === attendee.userId}
                                    className={clsx(
                                        'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4',
                                        primaryButtonClass(mode),
                                    )}>
                                    <UserPlus size={13} aria-hidden="true" />
                                    {t('Add')}
                                </button>
                            }
                            isDarkMode={isDarkMode}
                            name={attendee.nickname}
                            profilePicture={attendee.profilePicture}
                        />
                    ))}
                </ul>
            )}
        </m.section>
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
            toast.success(
                t('Invite sent to {name}', { name: friend.displayName }),
            );
            onSent();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('Failed to send invite'),
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <SettingsDialog
            open
            onClose={onClose}
            title={t('Invite {name} to an event', {
                name: friend.displayName,
            })}>
            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-slate-600">
                    {t(
                        'They will receive an email with the event code. Their address stays private.',
                    )}
                </p>
                <label className="block text-sm font-semibold text-slate-700">
                    {t('Event code')}
                    <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <Music size={16} className="text-slate-400" />
                        <input
                            value={code}
                            onChange={event =>
                                setCode(event.target.value.toUpperCase())
                            }
                            placeholder="DJPARTY"
                            className="w-full bg-transparent text-base font-bold tracking-widest text-slate-800 outline-none"
                        />
                    </div>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                    {t('Message (optional)')}
                    <textarea
                        value={message}
                        onChange={event => setMessage(event.target.value)}
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
                <SettingsDialogButton
                    onClick={submit}
                    disabled={busy || !code.trim()}
                    variant="primary">
                    {busy ? t('Sending…') : t('Send invite')}
                </SettingsDialogButton>
            </SettingsDialogActions>
        </SettingsDialog>
    );
}
