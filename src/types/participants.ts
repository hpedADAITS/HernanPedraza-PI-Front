export interface Participant {
  _id: string;
  nickname: string;
  joinedAt: string;
  isPremium?: boolean;
  socketId?: string;
}
