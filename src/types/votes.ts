export interface Vote {
  id: string;
  songId: string;
  participantId: string;
  value: number;
}

export interface VoteStats {
  songId: string;
  totalVotes: number;
  upvotes: number;
  downvotes: number;
}
