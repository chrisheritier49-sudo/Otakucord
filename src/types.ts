export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  title: string;
  coins: number;
  quizPoints?: number;
  cardInventory: string[]; // GachaCard IDs
  userRoles?: string[]; // IDs of selected roles
  language?: string; // Selected language
  languages?: string[]; // Selected languages
  joinedGuilds?: string[]; // Guild IDs the user has joined
  notifications?: Notification[]; // User notifications
}

export type ChannelType = 'text' | 'voice' | 'quiz' | 'roles' | 'trivia' | 'watch-party';

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  description: string;
  category: string;
  rules?: string; // Customizable salon/group rules
  creatorId?: string; // Creator who can manage rules
  icon?: string; // Customizable icon or emoji for the channel
}

export interface Guild {
  id: string;
  name: string;
  icon: string; // Tailwind bg-gradient or custom icon name
  banner: string; // Visual banner class or image
  channels: Channel[];
  themeColor: string; // Tailwind border/text accent class
}

export interface MessageAuthor {
  username: string;
  avatar: string;
  title?: string;
  isBot?: boolean;
  botStyle?: string; // colors for name tag
}

export interface Message {
  id: string;
  channelId: string;
  guildId: string;
  author: MessageAuthor;
  content: string;
  timestamp: string;
  originalLanguage?: string; // Senders language
  translatedContent?: Record<string, string>; // Language code to translated text
  mediaUrl?: string; // Cloudinary secure URL
  mediaType?: 'image' | 'video'; // Media type
  mediaExpiry?: string; // ISO timestamp when the media is auto-deleted / hidden
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface GachaCard {
  id: string;
  name: string;
  anime: string;
  rarity: Rarity;
  image: string; // Anime style colors/emojis or standard CSS
  stats: {
    hp: number;
    atk: number;
    def: number;
  };
  description: string;
  value: number; // coin resell value
}

export interface Role {
  id: string;
  name: string;
  color: string;
  category: 'level' | 'interest' | 'genre';
  description: string;
}

export interface WatchPartyEvent {
  id: string;
  animeTitle: string;
  episodeNumber: number;
  scheduledTime: string;
  host: string;
  participants: string[];
  isLive: boolean;
  coverImage?: string;
  genre?: string;
  videoUrl?: string;
}
