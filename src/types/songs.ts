export interface Song {
  _id: string;
  title: string;
  artist: string;
  voteScore: number;
  status: string;
  requestedBy?: { _id: string; nickname: string } | null;
  eventId?: string;
  createdAt?: string;
}
