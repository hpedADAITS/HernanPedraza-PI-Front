#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

commit_group() {
  local message="$1"
  local commit_date="$2"
  shift 2

  local files=("$@")
  if [ "${#files[@]}" -eq 0 ]; then
    return 0
  fi

  git add -- "${files[@]}"

  if git diff --cached --quiet; then
    echo "Skipping ${message} (no staged changes)"
    return 0
  fi

  GIT_AUTHOR_DATE="$commit_date" \
    GIT_COMMITTER_DATE="$commit_date" \
    git commit --date "$commit_date" -m "$message"
}

commit_group \
  "chore(frontend): refresh build and package tooling" \
  "2025-04-18 09:00:00 +0200" \
  .gitmodules \
  index.html \
  package.json \
  package-lock.json \
  .env.example \
  .env.production \
  tsconfig.json \
  vite.config.ts \
  src/vite-env.d.ts

commit_group \
  "feat(app): move frontend bootstrapping to routed shell" \
  "2025-04-18 09:30:00 +0200" \
  src/App.tsx \
  src/main.tsx \
  src/router/AppRoutes.tsx \
  src/router/routePaths.ts \
  src/router/useViewNavigation.ts \
  src/hooks/useAppStartup.ts \
  src/utils/debugMode.ts \
  src/utils/storage.ts \
  src/components/debug/SongCardDebugModal.tsx \
  src/components/layout/Layout.tsx \
  src/components/ui/alert-dialog.tsx \
  src/components/common/Logo.tsx \
  src/components/common/index.ts \
  src/index.css \
  src/constants/animations.ts

commit_group \
  "feat(auth): refresh login and email verification flow" \
  "2025-04-18 10:00:00 +0200" \
  src/pages/AttendeeLogin.tsx \
  src/pages/RoleSelection.tsx \
  src/pages/VerifyEmail.tsx \
  src/pages/DJLogin.tsx \
  src/pages/DJRegister.tsx \
  src/components/modals/EmailConfirmationModal.tsx \
  src/components/modals/EventIdSetupModal.tsx \
  src/services/api/auth.ts \
  src/services/api/client.ts \
  src/services/api/participants.ts \
  src/hooks/useAuth.ts

commit_group \
  "feat(dashboard): rebuild profile and queue screens" \
  "2025-04-18 11:00:00 +0200" \
  src/pages/Dashboard.tsx \
  src/components/common/ProfilePictureUpload.tsx \
  src/components/common/UserAvatar.tsx \
  src/components/dashboard/ActionButtons.tsx \
  src/components/dashboard/AttendeeProfileCard.tsx \
  src/components/dashboard/DJProfileCard.tsx \
  src/components/dashboard/ConnectedUsers.tsx \
  src/components/dashboard/MicrophoneControl.tsx \
  src/components/dashboard/ParticipantsList.tsx \
  src/components/dashboard/ProfileCard.tsx \
  src/components/dashboard/QRCodeModal.tsx \
  src/components/dashboard/QueueList.tsx \
  src/components/dashboard/SearchBar.tsx \
  src/components/dashboard/index.ts

commit_group \
  "feat(playback): update now playing and selection plumbing" \
  "2025-04-18 11:30:00 +0200" \
  src/pages/SongSelection.tsx \
  src/components/common/NowPlaying.tsx \
  src/components/dashboard/NowPlayingSection.tsx \
  src/hooks/useMicrophone.ts \
  src/services/api/events.ts \
  src/services/api/songs.ts \
  src/services/api/votes.ts \
  src/services/socket/emitters.ts \
  src/services/socket/index.ts \
  src/services/socket/listeners.ts \
  src/services/cache/cacheManager.test.ts

commit_group \
  "feat(settings): reorganize account and preference screens" \
  "2025-04-18 12:00:00 +0200" \
  src/pages/SettingsHome.tsx \
  src/pages/AccountSettings.tsx \
  src/pages/AppPreferences.tsx \
  src/pages/Settings.tsx \
  src/pages/SettingsList.tsx \
  src/pages/AppSettings.tsx \
  src/components/settings/SettingsUI.tsx

commit_group \
  "test(frontend): refresh app and playback coverage" \
  "2025-04-18 12:30:00 +0200" \
  test/hooks/useAuth.test.ts \
  test/hooks/useDarkMode.test.ts \
  test/utils/validation.test.ts \
  test/pages/RoleSelection.test.tsx \
  test/pages/SongSelection.test.tsx \
  test/components/NowPlaying.test.tsx \
  test/components/dashboard/ConnectedUsers.test.tsx \
  test/components/dashboard/ProfileCards.test.tsx \
  test/components/Logo.test.tsx \
  test/services/api.test.ts \
  test/services/socket.test.ts \
  test/services/cache/cacheManager.test.ts
