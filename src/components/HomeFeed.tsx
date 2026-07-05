import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, Users, Sparkles, Hash, PlusCircle, Heart, MessageSquare, 
  Share2, AlertTriangle, Radio, Check, Layers, Plus, BookOpen, User, Image, Video,
  Coins, MessageCircle, MoreHorizontal, Eye, ShieldAlert, Award,
  UserPlus, X, HeartHandshake, HelpCircle, Flame
} from 'lucide-react';
import { Guild, User as AppUser } from '../types';

interface HomeFeedProps {
  availableGuilds: Guild[];
  joinedGuilds: string[];
  onJoinGuild: (guildId: string) => void;
  onCreateGuild: () => void;
  user: AppUser;
  onOpenReportModal: (targetName: string) => void;
  friends: string[];
  setFriends: React.Dispatch<React.SetStateAction<string[]>>;
  friendRequests: any[];
  setFriendRequests: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveView: (view: 'home' | 'guild' | 'dm') => void;
  setActiveDmId: (dmId: string | null) => void;
  setPrivateMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

interface SocialPage {
  id: string;
  name: string;
  avatar: string;
  description: string;
  creatorId: string;
  followers: string[]; // List of user IDs
  category: string;
  postsCount: number;
}

interface SocialPost {
  id: string;
  authorType: 'user' | 'page';
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  postImage?: string; // Base64 or URL
  timestamp: string;
  likes: string[]; // List of user IDs
  sharesCount: number;
  comments: {
    id: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: string;
  }[];
  reactions: Record<string, string[]>; // emoji -> userIds
}

interface SocialStory {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string; // base64 or URL
  createdAt: number; // timestamp in ms
}

export const ANIME_AVATAR_PRESETS = [
  { name: 'Naruto 🍥', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80' },
  { name: 'Nezuko 🌸', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80' },
  { name: 'Cosplay 👗', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80' },
  { name: 'Tokyo Style ⚔️', url: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=200&auto=format&fit=crop&q=80' },
  { name: 'Neko Girl 🐾', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80' },
  { name: 'Mech / Gaming 👾', url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&auto=format&fit=crop&q=80' },
  { name: 'Shibuya Night 🌃', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=200&auto=format&fit=crop&q=80' }
];

export const renderPageAvatar = (avatarStr: string, className: string = "w-8 h-8") => {
  const isUrl = avatarStr && (avatarStr.toLowerCase().startsWith('http') || avatarStr.startsWith('data:') || avatarStr.length > 5);
  if (isUrl) {
    return (
      <div className={`${className} rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0`}>
        <img src={avatarStr} alt="Page Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
    );
  }
  return (
    <div className={`${className} rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-lg font-bold shrink-0 shadow-sm select-none`}>
      <span>{avatarStr || '👑'}</span>
    </div>
  );
};

export function HomeFeed({ 
  availableGuilds, 
  joinedGuilds, 
  onJoinGuild, 
  onCreateGuild,
  user,
  onOpenReportModal,
  friends,
  setFriends,
  friendRequests,
  setFriendRequests,
  setActiveView,
  setActiveDmId,
  setPrivateMessages
}: HomeFeedProps) {
  const [activeTab, setActiveTab] = useState<'servers' | 'feed' | 'friends'>('feed');
  const joinableGuilds = availableGuilds.filter(g => !joinedGuilds.includes(g.id));

  // --- USER SOCIAL STATUS STATES ---
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [userSocialStatus, setUserSocialStatus] = useState(() => {
    return localStorage.getItem('otaku_user_social_status') || "Hypé par l'IA ! 🤖";
  });
  const [statusInput, setStatusInput] = useState(userSocialStatus);
  const [selectedStoryFriend, setSelectedStoryFriend] = useState<any | null>(null);

  const handleUpdateStatus = (statusText: string) => {
    setUserSocialStatus(statusText);
    localStorage.setItem('otaku_user_social_status', statusText);
    alert("✨ Votre statut Otaku a été mis à jour avec succès !");
  };

  const handleAddStory = () => {
    if (!storyText.trim() && !storyMediaUrl) return;

    const newStory: SocialStory = {
      id: `story_${Date.now()}`,
      authorId: 'user-current',
      authorName: user.username,
      authorAvatar: user.avatar,
      content: storyText,
      mediaType: storyMediaType,
      mediaUrl: storyMediaUrl,
      createdAt: Date.now()
    };
    setSocialStories(prev => [...prev, newStory]);
    setStoryText('');
    setStoryMediaUrl('');
    setStoryMediaType(undefined);
    setShowStatusModal(false);
    
    // Fallback sync the old simple status for display purposes if text provided
    if (storyText.trim()) {
      handleUpdateStatus(storyText);
    }
  };

  const BOT_DETAILS: Record<string, { username: string; avatar: string; title: string; status: string; description: string; coverColor: string }> = {
    'NarutoBot': { username: 'NarutoBot', avatar: '🍥', title: '7ème Hokage', status: 'online', description: 'Dattebayo! Je ne reviens jamais sur ma parole, c\'est ça mon nindo ! 🍥', coverColor: 'from-orange-500 to-amber-600' },
    'SasukeBot': { username: 'SasukeBot', avatar: '👁️', title: 'Uchiwa Légendaire', status: 'dnd', description: 'La vengeance est un chemin solitaire. Ne me ralentis pas. ⚔️', coverColor: 'from-indigo-900 to-purple-900' },
    'GokuBot': { username: 'GokuBot', avatar: '👊', title: 'Guerrier Saiyan 🔥', status: 'idle', description: 'Salut ! C\'est moi, Goku ! Tu as l\'air fort, on s\'entraîne ensemble ?', coverColor: 'from-orange-600 to-red-600' },
    'RemBot': { username: 'RemBot', avatar: '🌸', title: 'Waifu Suprême 💙', status: 'online', description: 'Servante de la maison Roswaal. Toujours là pour vous épauler.', coverColor: 'from-blue-400 to-indigo-600' },
    'LuffyBot': { username: 'LuffyBot', avatar: '🍖', title: 'Roi des Pirates 👑', status: 'online', description: 'Je vais devenir le Roi des Pirates ! Viens faire la fête avec moi !', coverColor: 'from-red-500 to-yellow-600' },
    'Zoro': { username: 'Zoro', avatar: '⚔️', title: 'Second d\'Équipage', status: 'idle', description: 'Le plus grand bretteur du monde. Toujours perdu en chemin.', coverColor: 'from-emerald-600 to-teal-800' },
    'GojoSatoru': { username: 'GojoSatoru', avatar: '🌌', title: 'Le Plus Fort ✨', status: 'online', description: 'Ne t\'inquiète pas, je suis le plus fort ! 😉🌌', coverColor: 'from-sky-400 to-indigo-900' }
  };

  // --- PERSISTED SOCIAL DATA (Pages & Posts) ---
  const [socialPages, setSocialPages] = useState<SocialPage[]>(() => {
    const saved = localStorage.getItem('otaku_social_pages_v4');
    return saved ? JSON.parse(saved) : [];
  });

  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(() => {
    const saved = localStorage.getItem('otaku_social_posts_v4');
    return saved ? JSON.parse(saved) : [];
  });

  // --- PERSISTED SOCIAL STORIES (Expires after 24h) ---
  const [socialStories, setSocialStories] = useState<SocialStory[]>(() => {
    const saved = localStorage.getItem('otaku_social_stories_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Exclude expired (older than 24h)
        return parsed.filter((s: SocialStory) => Date.now() - s.createdAt < 24 * 60 * 60 * 1000);
      } catch (e) {
        console.error("Failed to parse stories", e);
      }
    }
    // Generate lovely interactive initial stories for our bot friends within 24h limit
    const now = Date.now();
    return [
      {
        id: 'story-naruto',
        authorId: 'NarutoBot',
        authorName: 'Naruto',
        authorAvatar: '🍥',
        content: 'Un délicieux bol de ramen géant chez Ichiraku ! Le bouillon miso est exceptionnel aujourd\'hui ! 🍜🍥🔥',
        createdAt: now - 3 * 60 * 60 * 1000 // 3 hours ago
      },
      {
        id: 'story-goku',
        authorId: 'GokuBot',
        authorName: 'Goku',
        authorAvatar: '👊',
        content: 'Repousser ses limites, toujours ! 3000 pompes terminées sous gravité x100 ! 💪💥⚡ Qui est prêt pour un combat ?',
        createdAt: now - 6 * 60 * 60 * 1000 // 6 hours ago
      },
      {
        id: 'story-gojo',
        authorId: 'GojoSatoru',
        authorName: 'Gojo Satoru',
        authorAvatar: '🌌',
        content: 'Un petit dessert sucré de Shibuya en chemin. Ne vous en faites pas, je suis littéralement le plus fort ! 😉✨🌌',
        createdAt: now - 12 * 60 * 60 * 1000 // 12 hours ago
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('otaku_social_pages_v4', JSON.stringify(socialPages));
  }, [socialPages]);

  useEffect(() => {
    localStorage.setItem('otaku_social_posts_v4', JSON.stringify(socialPosts));
  }, [socialPosts]);

  useEffect(() => {
    localStorage.setItem('otaku_social_stories_v4', JSON.stringify(socialStories));
  }, [socialStories]);

  // Periodic cleanup for expired stories
  useEffect(() => {
    const cleanStories = () => {
      setSocialStories(prev => {
        const filtered = prev.filter(s => Date.now() - s.createdAt < 24 * 60 * 60 * 1000);
        if (filtered.length !== prev.length) {
          return filtered;
        }
        return prev;
      });
    };
    cleanStories();
    const interval = setInterval(cleanStories, 60000); // Clean every minute
    return () => clearInterval(interval);
  }, []);

  // --- STORY INTERACTION & VIEWER STATES ---
  const [selectedStory, setSelectedStory] = useState<SocialStory | null>(null);
  const [storyText, setStoryText] = useState('');
  const [storyMediaUrl, setStoryMediaUrl] = useState('');
  const [storyMediaType, setStoryMediaType] = useState<'image' | 'video' | undefined>(undefined);

  // --- PAGE CREATION STATES ---
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageCategory, setNewPageCategory] = useState('Anime');
  const [newPageAvatar, setNewPageAvatar] = useState('👑');
  const [newPageDesc, setNewPageDesc] = useState('');

  // --- POST PUBLISH STATES ---
  const [postContent, setPostContent] = useState('');
  const [postImageInput, setPostImageInput] = useState('');
  const [publishAs, setPublishAs] = useState<string>('user'); // 'user' or pageId
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // --- FILTER STATE ---
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  // Filtered lists
  const myCreatedPages = socialPages.filter(p => p.creatorId === user.id);
  const filteredPosts = socialPosts.filter(post => {
    if (selectedCategory === 'Tous') return true;
    if (post.authorType === 'page') {
      const p = socialPages.find(page => page.id === post.authorId);
      return p?.category === selectedCategory;
    }
    return selectedCategory === 'Membres'; // Filter posts from normal users
  });

  // Handle Page creation
  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName.trim()) return;

    const newPage: SocialPage = {
      id: `page-${Date.now()}`,
      name: newPageName,
      avatar: newPageAvatar,
      description: newPageDesc || 'Aucune description disponible pour cette page Otaku.',
      creatorId: user.id,
      followers: [user.id], // Creator follows by default
      category: newPageCategory,
      postsCount: 0
    };

    setSocialPages(prev => [...prev, newPage]);
    setNewPageName('');
    setNewPageDesc('');
    setNewPageAvatar('👑');
    setShowCreatePageModal(false);
    alert(`✨ Votre Page Otaku "${newPage.name}" a été créée avec succès ! Vous pouvez désormais poster en son nom.`);
  };

  // Toggle subscribe/follow to a page
  const handleToggleSubscribe = (pageId: string) => {
    setSocialPages(prev => prev.map(p => {
      if (p.id === pageId) {
        const isFollowing = p.followers.includes(user.id);
        const updatedFollowers = isFollowing 
          ? p.followers.filter(id => id !== user.id)
          : [...p.followers, user.id];
        return { ...p, followers: updatedFollowers };
      }
      return p;
    }));
  };

  // Handle Post Publishing
  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    let authorName = user.username;
    let authorAvatar = user.avatar;
    let authorType: 'user' | 'page' = 'user';
    let authorId = user.id;

    if (publishAs !== 'user') {
      const selectedPage = socialPages.find(p => p.id === publishAs);
      if (selectedPage) {
        authorName = selectedPage.name;
        authorAvatar = selectedPage.avatar;
        authorType = 'page';
        authorId = selectedPage.id;

        // Increment page's post count
        setSocialPages(prev => prev.map(p => {
          if (p.id === selectedPage.id) {
            return { ...p, postsCount: p.postsCount + 1 };
          }
          return p;
        }));
      }
    }

    const newPost: SocialPost = {
      id: `post-${Date.now()}`,
      authorType,
      authorId,
      authorName,
      authorAvatar,
      content: postContent,
      postImage: postImageInput || undefined,
      timestamp: "À l'instant",
      likes: [],
      sharesCount: 0,
      comments: [],
      reactions: {}
    };

    setSocialPosts(prev => [newPost, ...prev]);
    setPostContent('');
    setPostImageInput('');
  };

  // Like Toggle
  const handleToggleLike = (postId: string) => {
    setSocialPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const hasLiked = p.likes.includes(user.id);
        const updatedLikes = hasLiked
          ? p.likes.filter(id => id !== user.id)
          : [...p.likes, user.id];
        return { ...p, likes: updatedLikes };
      }
      return p;
    }));
  };

  // Emoji reaction add
  const handleReact = (postId: string, emoji: string) => {
    setSocialPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const reactions = { ...p.reactions };
        if (!reactions[emoji]) reactions[emoji] = [];
        
        if (reactions[emoji].includes(user.id)) {
          // Remove reaction
          reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
        } else {
          // Add reaction
          reactions[emoji] = [...reactions[emoji], user.id];
        }
        
        // Clean empty emoji array
        if (reactions[emoji].length === 0) delete reactions[emoji];

        return { ...p, reactions };
      }
      return p;
    }));
  };

  // Add Comment
  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      authorName: user.username,
      authorAvatar: user.avatar,
      content: commentText,
      timestamp: "À l'instant"
    };

    setSocialPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleSharePost = (postId: string) => {
    setSocialPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, sharesCount: p.sharesCount + 1 };
      }
      return p;
    }));
    alert("📢 Lien du post copié dans le presse-papier ! Partagé avec succès à votre liste d'amis Otaku.");
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-200 h-full overflow-y-auto lg:overflow-hidden">
      
      {/* 1. TOP SELECTION TABS */}
      <div className="h-14 border-b border-slate-950/60 px-4 md:px-6 flex items-center justify-between bg-slate-950/30 shrink-0 overflow-x-auto scrollbar-none">
        <div className="flex gap-4 flex-nowrap">
          <button
            onClick={() => setActiveTab('feed')}
            className={`py-4 px-2 border-b-2 text-xs md:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'feed'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Radio size={14} className="animate-pulse" />
            <span>Actualités & Pages 📢</span>
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={`py-4 px-2 border-b-2 text-xs md:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 relative ${
              activeTab === 'friends'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Otakus & Amis 👥</span>
            {friendRequests.filter(r => r.type === 'received').length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce shrink-0 ml-1">
                {friendRequests.filter(r => r.type === 'received').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('servers')}
            className={`py-4 px-2 border-b-2 text-xs md:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'servers'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Compass size={14} />
            <span>Serveurs 🚀</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-950/55 px-3 py-1.5 rounded-full border border-slate-850/60">
          <Layers size={12} className="text-pink-400" />
          <span>Statut :</span>
          <span className="font-bold text-slate-300">Otaku Social Link</span>
        </div>
      </div>

      {/* 2. MAIN CONTAINER WITH TABS */}
      <div className="flex-none lg:flex-1 lg:overflow-hidden relative flex flex-col min-h-0">
        
        {/* TAB 1: SOCIAL FEED & PAGES (THE CORE REQUESTED SPACE) */}
        {activeTab === 'feed' && (
          <div className="flex-none lg:flex-1 flex flex-col lg:flex-row lg:overflow-hidden min-h-0">
            
            {/* Feed Center Area */}
            <div className="flex-none lg:flex-1 lg:overflow-y-auto p-4 md:p-6 space-y-6 min-h-0">
              
              {/* OTAKU STORIES / STATUS REEL */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">✨</span>
                    <h4 className="font-sans font-black text-xs text-white uppercase tracking-wider">Statuts & Stories (24h)</h4>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setShowCreatePageModal(true)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/25 flex items-center gap-1"
                    >
                      <Plus size={10} />
                      <span>Créer une Page</span>
                    </button>
                    <button 
                      onClick={() => {
                        setStoryText('');
                        setStoryMediaUrl('');
                        setStoryMediaType(undefined);
                        setShowStatusModal(true);
                      }}
                      className="text-[10px] text-pink-400 hover:text-pink-300 font-bold uppercase tracking-wider bg-pink-500/10 px-2.5 py-1 rounded-md border border-pink-500/25 flex items-center gap-1"
                    >
                      <Plus size={10} />
                      <span>Ajouter Statut</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none scroll-smooth">
                  {/* 1. Own User Story Bubble */}
                  {(() => {
                    const myActiveStories = socialStories.filter(s => s.authorId === 'user-current');
                    const hasActiveStory = myActiveStories.length > 0;
                    const latestStory = hasActiveStory ? myActiveStories[myActiveStories.length - 1] : null;

                    return (
                      <div 
                        onClick={() => {
                          if (hasActiveStory) {
                            setSelectedStory(myActiveStories[0]);
                          } else {
                            setStoryText('');
                            setStoryMediaUrl('');
                            setStoryMediaType(undefined);
                            setShowStatusModal(true);
                          }
                        }}
                        className="w-20 h-32 rounded-2xl relative overflow-hidden bg-slate-950 border border-slate-800 shrink-0 cursor-pointer select-none group active:scale-95 transition-all shadow-md flex flex-col justify-between p-2"
                      >
                        {/* Background visual */}
                        {latestStory && latestStory.mediaUrl ? (
                          <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-500">
                            {latestStory.mediaType === 'video' ? (
                              <video src={latestStory.mediaUrl} className="w-full h-full object-cover opacity-60" muted playsInline />
                            ) : (
                              <img src={latestStory.mediaUrl} alt="Status Preview" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                            )}
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-pink-950/80 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                        )}
                        
                        {/* User Mini Avatar with glow if active */}
                        <div className={`relative z-10 w-7 h-7 rounded-full bg-slate-900 border-2 ${hasActiveStory ? 'border-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)] animate-pulse' : 'border-slate-600'} flex items-center justify-center text-sm font-bold shadow overflow-hidden`}>
                          {renderPageAvatar(user.avatar, "w-full h-full")}
                        </div>

                        {/* Add Button Centered visually */}
                        <div className="relative z-10 self-center bg-pink-600 group-hover:bg-pink-500 text-white rounded-full p-1 shadow-lg shadow-pink-600/30 transition-colors">
                          {hasActiveStory ? <Eye size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}
                        </div>

                        <div className="relative z-10 bg-slate-950/70 backdrop-blur-xs p-1 rounded-lg">
                          <p className="text-[9px] font-black text-white text-center truncate">Mon Statut</p>
                          <p className="text-[8px] text-pink-300 text-center truncate font-medium mt-0.5 leading-none">
                            {hasActiveStory ? 'Voir stories' : userSocialStatus}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2. Bots/Friends Story Bubbles */}
                  {Object.keys(BOT_DETAILS)
                    .map(botId => {
                      const bot = BOT_DETAILS[botId];
                      const isFriend = friends.includes(botId);
                      const botActiveStories = socialStories.filter(s => s.authorId === botId);
                      const hasStories = botActiveStories.length > 0;
                      const latestBotStory = hasStories ? botActiveStories[botActiveStories.length - 1] : null;
                      
                      return (
                        <div 
                          key={botId}
                          onClick={() => {
                            if (hasStories) {
                              setSelectedStory(botActiveStories[0]);
                            } else {
                              setSelectedStoryFriend({ id: botId, ...bot });
                            }
                          }}
                          className="w-20 h-32 rounded-2xl relative overflow-hidden bg-slate-950 border border-slate-850 shrink-0 cursor-pointer select-none group active:scale-95 transition-all shadow-md flex flex-col justify-between p-2"
                        >
                          {/* Background cover color gradient or story thumbnail */}
                          {latestBotStory && latestBotStory.mediaUrl ? (
                            <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-500">
                              {latestBotStory.mediaType === 'video' ? (
                                <video src={latestBotStory.mediaUrl} className="w-full h-full object-cover opacity-60" muted playsInline />
                              ) : (
                                <img src={latestBotStory.mediaUrl} alt="Story preview" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                              )}
                            </div>
                          ) : (
                            <div className={`absolute inset-0 bg-gradient-to-br ${bot.coverColor} opacity-20 group-hover:scale-110 transition-transform duration-500`} />
                          )}
                          
                          {/* Ring border: glowing pink if has story, or standard friend/otaku color */}
                          <div className={`relative z-10 w-7 h-7 rounded-full bg-slate-900 border-2 ${
                            hasStories 
                              ? 'border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.7)]' 
                              : isFriend 
                                ? 'border-indigo-500' 
                                : 'border-slate-700'
                          } flex items-center justify-center text-sm font-bold shadow`}>
                            <span>{bot.avatar}</span>
                          </div>

                          {/* Status Ring / Mini indicator */}
                          <div className="relative z-10 bg-slate-950/70 backdrop-blur-md p-1.5 rounded-xl border border-slate-850/60 max-w-full">
                            <p className="text-[8px] text-slate-300 truncate font-black leading-tight text-center">
                              {bot.username.replace('Bot', '')}
                            </p>
                            <p className="text-[7px] text-indigo-300 truncate text-center leading-none mt-0.5 font-bold">
                              {hasStories ? '🎬 Story' : isFriend ? '🟢 En ligne' : '👤 Otaku'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* PUBLISH BOX CARD */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">✍️</span>
                    <h3 className="font-sans font-black text-sm text-white uppercase tracking-wider">Créer un Post d'actualité</h3>
                  </div>

                  {/* Poster Identity Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400">Identité :</span>
                    <select
                      value={publishAs}
                      onChange={(e) => setPublishAs(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-indigo-400 focus:outline-none focus:border-indigo-500 font-bold"
                    >
                      <option value="user">👤 Moi (@{user.username})</option>
                      {myCreatedPages.map(p => {
                        const isUrl = p.avatar && (p.avatar.toLowerCase().startsWith('http') || p.avatar.startsWith('data:') || p.avatar.length > 5);
                        return (
                          <option key={p.id} value={p.id}>
                            {isUrl ? '🖼️' : p.avatar} {p.name} (Page)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <form onSubmit={handlePublishPost} className="space-y-3">
                  <textarea
                    rows={3}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder={
                      publishAs === 'user' 
                        ? "Quoi de neuf aujourd'hui dans votre quotidien d'Otaku ? Partagez vos coups de cœur !" 
                        : `Publiez une annonce officielle au nom de votre page...`
                    }
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 resize-none font-medium leading-relaxed"
                  />

                  {/* Optional Image attachment preview */}
                  {postImageInput && (
                    <div className="relative w-36 h-24 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                      <img src={postImageInput} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPostImageInput('')}
                        className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-black text-white rounded-full transition-colors border border-slate-800"
                        title="Supprimer l'image"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1">
                    <div className="flex items-center gap-3">
                      <label className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors flex items-center justify-center gap-1.5" title="Ajouter une image au post">
                        <PlusCircle size={14} className="text-slate-400 hover:text-indigo-400" />
                        <span className="text-[10px] font-bold">📸 Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setPostImageInput(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
                        ✨ Gagnez des <span className="text-yellow-400 font-bold">Coins</span> !
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!postContent.trim() && !postImageInput}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                        postContent.trim() || postImageInput
                          ? 'bg-indigo-650 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 active:scale-95'
                          : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <span>Publier</span>
                      <PlusCircle size={13} />
                    </button>
                  </div>
                </form>
              </div>

              {/* POSTS FEED LIST */}
              <div className="space-y-4">
                
                {/* Categories & Filter Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                  {['Tous', 'Anime', 'Manga', 'Cosplay', 'Gaming', 'Membres'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-indigo-500 text-white shadow'
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      {cat === 'Tous' ? '🌐 Tout le flux' : cat === 'Membres' ? '👤 Posts des Membres' : `# ${cat}`}
                    </button>
                  ))}
                </div>

                {filteredPosts.length === 0 ? (
                  <div className="bg-slate-950/35 border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-500">
                    <BookOpen size={28} className="mx-auto text-slate-600 mb-2" />
                    <p className="text-xs">Aucune publication dans cette catégorie pour le moment.</p>
                  </div>
                ) : (
                  filteredPosts.map(post => {
                    const isLiked = post.likes.includes(user.id);
                    const isMyPage = post.authorType === 'page' && socialPages.find(p => p.id === post.authorId)?.creatorId === user.id;
                    const isPageSubscribed = post.authorType === 'page' && socialPages.find(p => p.id === post.authorId)?.followers.includes(user.id);

                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-950 border border-slate-850/80 rounded-2xl p-5 hover:border-slate-800 transition-all shadow-md relative"
                      >
                        {/* Post Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0 shadow overflow-hidden">
                              {post.authorAvatar.startsWith('http') || post.authorAvatar.startsWith('data:') ? (
                                <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span>{post.authorAvatar}</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white truncate hover:text-indigo-400 cursor-pointer">
                                  {post.authorName}
                                </span>
                                
                                {post.authorType === 'page' ? (
                                  <span className="bg-pink-950/60 border border-pink-500/20 px-1.5 py-0.5 rounded text-[8px] text-pink-400 font-bold uppercase tracking-wider">
                                    PAGE PRO 📢
                                  </span>
                                ) : (
                                  <span className="bg-indigo-950 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[8px] text-indigo-400 font-bold uppercase tracking-wider">
                                    Membres 👤
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{post.timestamp}</div>
                            </div>
                          </div>

                          {/* S'abonner / Follow button if Page */}
                          {post.authorType === 'page' && !isMyPage && (
                            <button
                              onClick={() => handleToggleSubscribe(post.authorId)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm ${
                                isPageSubscribed
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              }`}
                            >
                              {isPageSubscribed ? (
                                <>
                                  <Check size={11} />
                                  <span>Abonné</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={11} />
                                  <span>S'abonner</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Post Content */}
                        <div className="text-xs text-slate-200 leading-relaxed font-medium mb-4 whitespace-pre-wrap select-text">
                          {post.content}
                        </div>

                        {/* Post Attached Image */}
                        {post.postImage && (
                          <div className="mb-4 rounded-xl overflow-hidden border border-slate-850 bg-slate-900 max-h-[340px] flex items-center justify-center">
                            <img 
                              src={post.postImage} 
                              alt="Post Media" 
                              className="w-full h-full object-contain max-h-[340px]"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Reactions Pills (Reactions Bar) */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-4 border-t border-b border-slate-900/60 py-2.5">
                          {/* Like/Heart Button */}
                          <button
                            onClick={() => handleToggleLike(post.id)}
                            className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                              isLiked
                                ? 'bg-rose-950/50 border-rose-500/30 text-rose-400'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Heart size={11} className={isLiked ? 'fill-rose-500 text-rose-400' : ''} />
                            <span>J'aime ({post.likes.length})</span>
                          </button>

                          {/* Custom Reactions */}
                          {['🔥', '👍', '🍜', '😮'].map(emoji => {
                            const userReacted = post.reactions[emoji]?.includes(user.id);
                            const count = post.reactions[emoji]?.length || 0;
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleReact(post.id, emoji)}
                                className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 border transition-all ${
                                  userReacted
                                    ? 'bg-indigo-950 border-indigo-500/30 text-indigo-300'
                                    : 'bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-850'
                                }`}
                              >
                                <span>{emoji}</span>
                                {count > 0 && <span className="font-mono text-[9px]">{count}</span>}
                              </button>
                            );
                          })}

                          <div className="ml-auto flex items-center gap-2">
                            <button
                              onClick={() => handleSharePost(post.id)}
                              className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg transition-colors"
                              title="Partager ce post aux amis"
                            >
                              <Share2 size={13} />
                            </button>
                            <button
                              onClick={() => onOpenReportModal(post.authorName)}
                              className="p-1.5 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                              title="Signaler ce post"
                            >
                              <AlertTriangle size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Comments Space */}
                        <div className="bg-slate-900/45 rounded-xl p-3 border border-slate-900 space-y-3">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <MessageCircle size={10} />
                            <span>Commentaires ({post.comments.length})</span>
                          </div>

                          {post.comments.length > 0 && (
                            <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                              {post.comments.map(c => (
                                <div key={c.id} className="flex gap-2.5 items-start text-xs bg-slate-950/20 p-2 rounded-lg">
                                  <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center text-xs shrink-0 overflow-hidden shadow">
                                    {c.authorAvatar.startsWith('http') || c.authorAvatar.startsWith('data:') ? (
                                      <img src={c.authorAvatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <span>{c.authorAvatar}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className="font-bold text-slate-300 text-[11px]">{c.authorName}</span>
                                      <span className="text-[8px] text-slate-500 font-mono">{c.timestamp}</span>
                                    </div>
                                    <p className="text-slate-300 font-medium leading-relaxed">{c.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Write Comment Box */}
                          <form 
                            onSubmit={(e) => handleAddComment(post.id, e)}
                            className="flex gap-2 pt-1"
                          >
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Rédiger une réponse à cette publication..."
                              className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="submit"
                              disabled={!(commentInputs[post.id] || '').trim()}
                              className="px-3 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-900 disabled:text-slate-600 text-white font-bold rounded-xl text-xs transition-colors"
                            >
                              Répondre
                            </button>
                          </form>
                        </div>

                      </motion.div>
                    );
                  })
                )}

              </div>
            </div>

            {/* Sidebar Right Area: Vos Pages & suggestions */}
            <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-950/60 p-4 md:p-5 bg-slate-900/60 shrink-0 space-y-6 lg:overflow-y-auto">
              
              {/* CREATOR PORTAL BOX */}
              <div className="bg-gradient-to-br from-indigo-950/30 to-purple-950/25 border border-indigo-500/20 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden shadow">
                <div className="absolute top-1 right-1 opacity-25">
                  <Award size={48} className="text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-sans font-black text-xs text-white uppercase tracking-wider">Créer une Page Otaku</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Vous souhaitez lancer une page de news, un fan-club ou partager vos créations ? Lancez votre propre Page dès maintenant !
                  </p>
                </div>
                <button
                  onClick={() => setShowCreatePageModal(true)}
                  className="w-full py-2 rounded-xl bg-pink-650 hover:bg-pink-600 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Lancer ma Page</span>
                </button>
              </div>

              {/* SECTION: VOS PAGES CREATED */}
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                  Vos Pages Otaku ({myCreatedPages.length})
                </div>

                {myCreatedPages.length === 0 ? (
                  <div className="p-4 bg-slate-950/35 border border-slate-850 rounded-xl text-center">
                    <p className="text-[10px] text-slate-500 italic">Vous ne possédez aucune page.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myCreatedPages.map(p => (
                      <div key={p.id} className="p-2.5 bg-slate-950/50 border border-slate-850 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {renderPageAvatar(p.avatar, "w-8 h-8")}
                          <div className="min-w-0">
                            <h5 className="text-[11px] font-bold text-white truncate">{p.name}</h5>
                            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wide">{p.category}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          {p.followers.length} abonnés
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: PAGES SUGGESTIONS */}
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                  Pages populaires recommandées
                </div>

                <div className="space-y-2">
                  {socialPages.filter(p => p.creatorId !== user.id).map(p => {
                    const isSubscribed = p.followers.includes(user.id);
                    return (
                      <div key={p.id} className="p-3 bg-slate-950/40 border border-slate-850/40 rounded-xl flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {renderPageAvatar(p.avatar, "w-8 h-8")}
                            <div className="min-w-0">
                              <h5 className="text-[11px] font-black text-white truncate">{p.name}</h5>
                              <p className="text-[9px] text-pink-400 font-mono">{p.category}</p>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                          {p.description}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-900/60 mt-1">
                          <span className="text-[9px] text-slate-500 font-mono">
                            👥 {p.followers.length} otakus
                          </span>

                          <button
                            onClick={() => handleToggleSubscribe(p.id)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                              isSubscribed
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            {isSubscribed ? 'Abonné ✓' : '+ S\'abonner'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: OTAKUS & AMIS (FACEBOOK-LIKE FRIEND SYSTEM REQUESTED) */}
        {activeTab === 'friends' && (
          <div className="flex-none lg:flex-1 lg:overflow-y-auto p-4 md:p-6 space-y-6 min-h-0">
            
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center shadow-lg shadow-pink-600/20 shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight uppercase">Réseau Social Otaku</h1>
                <p className="text-xs text-slate-400 mt-0.5">Ajoutez des amis, confirmez des demandes et discutez en tête-à-tête comme sur Facebook.</p>
              </div>
            </div>

            {/* Main Social Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left column: Incoming Requests & Suggestions */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. DEMANDES D'AMIS EN ATTENTE */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
                  <h3 className="font-sans font-black text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      {friendRequests.some(r => r.type === 'received') && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                      )}
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                    </span>
                    Demandes d'amis reçues ({friendRequests.filter(r => r.type === 'received').length})
                  </h3>

                  {friendRequests.filter(r => r.type === 'received').length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      <HeartHandshake className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                      <p className="text-xs">Aucune nouvelle demande d'ami pour le moment.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {friendRequests.filter(r => r.type === 'received').map(req => {
                        const botDetail = BOT_DETAILS[req.id];
                        return (
                          <div key={req.id} className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                              <span>{req.avatar}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-sans font-black text-xs text-white truncate">{req.username}</h4>
                              <p className="text-[10px] text-pink-400 font-bold truncate">
                                {botDetail ? botDetail.title : 'Otaku Passionné'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 italic line-clamp-2">
                                "{req.message || 'Devenons amis pour discuter anime !'}"
                              </p>
                              
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => {
                                    setFriends(prev => {
                                      if (prev.includes(req.id)) return prev;
                                      const updated = [...prev, req.id];
                                      localStorage.setItem('otaku_friends_v2', JSON.stringify(updated));
                                      return updated;
                                    });
                                    setFriendRequests(prev => prev.filter(r => r.id !== req.id));
                                    alert(`✨ Vous avez accepté la demande de ${req.username} ! Vous pouvez maintenant lui écrire.`);
                                  }}
                                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all"
                                >
                                  Confirmer
                                </button>
                                <button
                                  onClick={() => {
                                    setFriendRequests(prev => prev.filter(r => r.id !== req.id));
                                    alert(`Demande d'ami de ${req.username} déclinée.`);
                                  }}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all"
                                >
                                  Ignorer
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. SUGGESTIONS D'AMIS */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
                  <h3 className="font-sans font-black text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                    Suggestions d'amis Otakus (Recommandé)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Object.keys(BOT_DETAILS)
                      .filter(botId => !friends.includes(botId) && !friendRequests.some(r => r.id === botId && r.type === 'received'))
                      .map(botId => {
                        const bot = BOT_DETAILS[botId];
                        const isSent = friendRequests.some(r => r.id === botId && r.type === 'sent');
                        
                        return (
                          <div 
                            key={botId}
                            className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-sm flex flex-col group hover:border-indigo-500/40 transition-all"
                          >
                            {/* Top Banner Cover */}
                            <div className={`h-12 bg-gradient-to-r ${bot.coverColor} relative shrink-0`}>
                              <span className="absolute top-2 right-2 bg-slate-950/70 backdrop-blur-xs text-[8px] text-white font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                {bot.status === 'online' ? '🟢 En ligne' : bot.status === 'dnd' ? '🔴 Ne pas déranger' : '🟡 Absent'}
                              </span>
                            </div>

                            {/* Body Content */}
                            <div className="p-3.5 flex-1 flex flex-col items-center text-center relative pt-7">
                              {/* Avatar sticking out */}
                              <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-slate-800 absolute -top-6 flex items-center justify-center text-2xl shadow-md">
                                <span>{bot.avatar}</span>
                              </div>

                              <h4 className="font-sans font-black text-xs text-white mt-1">{bot.username}</h4>
                              <p className="text-[10px] text-indigo-400 font-bold mb-2">{bot.title}</p>
                              
                              <p className="text-[10px] text-slate-400 line-clamp-2 italic mb-4">
                                "{bot.description}"
                              </p>

                              <button
                                disabled={isSent}
                                onClick={() => {
                                  // Add sent request
                                  setFriendRequests(prev => [...prev, { id: botId, username: bot.username, avatar: bot.avatar, type: 'sent' }]);
                                  
                                  // Auto-accept simulated after 1.5 seconds!
                                  setTimeout(() => {
                                    // Add to friends
                                    setFriends(prev => {
                                      if (prev.includes(botId)) return prev;
                                      const updated = [...prev, botId];
                                      localStorage.setItem('otaku_friends_v2', JSON.stringify(updated));
                                      return updated;
                                    });
                                    // Remove request
                                    setFriendRequests(prev => prev.filter(r => r.id !== botId));
                                    
                                    // Seed a welcome message!
                                    setPrivateMessages(prev => {
                                      const messages = prev[botId] || [];
                                      const updated = {
                                        ...prev,
                                        [botId]: [
                                          ...messages,
                                          {
                                            senderId: botId,
                                            recipientId: user.id,
                                            content: `Yo ! Merci pour la demande d'ami ! 😊 Qu'est-ce que tu regardes comme anime ou manga en ce moment ? Discutons ! 🍿`,
                                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                          }
                                        ]
                                      };
                                      localStorage.setItem('otaku_private_messages_v2', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }, 1500);

                                  alert(`📩 Demande d'ami envoyée à ${bot.username} ! Elle sera bientôt acceptée.`);
                                }}
                                className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                  isSent
                                    ? 'bg-slate-950 border border-slate-800 text-slate-500'
                                    : 'bg-indigo-650/40 hover:bg-indigo-600/90 text-indigo-300 hover:text-white border border-indigo-500/20 active:scale-95'
                                }`}
                              >
                                {isSent ? (
                                  <>
                                    <span>⏳ Demande en attente...</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus size={11} />
                                    <span>Ajouter en ami</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

              </div>

              {/* Right column: Friends list */}
              <div className="space-y-6">
                
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
                  <h3 className="font-sans font-black text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Vos amis connectés ({friends.length})
                  </h3>

                  {friends.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <HelpCircle className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                      <p className="text-xs">Aucun ami pour le moment.</p>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">Confirmez les demandes ci-dessus ou ajoutez des suggestions pour commencer à chatter !</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {friends.map(friendId => {
                        const bot = BOT_DETAILS[friendId] || { username: friendId, avatar: '👤', title: 'Ami Otaku', status: 'online' };
                        return (
                          <div 
                            key={friendId}
                            className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3 group hover:border-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0 w-9 h-9 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-lg">
                                <span>{bot.avatar}</span>
                                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                                  bot.status === 'online' ? 'bg-emerald-500' : bot.status === 'dnd' ? 'bg-rose-500' : 'bg-amber-500'
                                }`}></span>
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-sans font-black text-xs text-white truncate">{bot.username}</h4>
                                <p className="text-[9px] text-slate-400 truncate">{bot.title}</p>
                              </div>
                            </div>

                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  setActiveDmId(friendId);
                                  setActiveView('dm');
                                }}
                                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all shadow"
                              >
                                Écrire
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Retirer ${bot.username} de vos amis ?`)) {
                                    setFriends(prev => {
                                      const updated = prev.filter(f => f !== friendId);
                                      localStorage.setItem('otaku_friends_v2', JSON.stringify(updated));
                                      return updated;
                                    });
                                    alert(`${bot.username} retiré de vos amis.`);
                                  }
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                title="Retirer l'ami"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: SERVERS DISCOVERY (ORIGINAL VIEW CONFIGURED) */}
        {activeTab === 'servers' && (
          <div className="flex-none lg:flex-1 lg:overflow-y-auto p-6 space-y-8 min-h-0">
            
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Compass className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase">Annuaires des Guildes d'Anime</h1>
                <p className="text-xs text-slate-400 mt-1">Trouvez et rejoignez les serveurs officiels et communautaires de vos mangas préférés.</p>
              </div>
            </div>

            {/* Welcome Banner for Empty User State */}
            {joinedGuilds.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="space-y-1.5 text-center md:text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full">
                    Nouveau Départ 🌟
                  </span>
                  <h2 className="text-xl font-black text-white tracking-tight">Bienvenue sur OtakuCord, l'univers ultime des Otakus !</h2>
                  <p className="text-slate-400 text-xs max-w-xl">
                    Tu n'es actuellement connecté à aucun serveur. Prends ton destin en main : rejoins une communauté existante ci-dessous ou crée ton propre sanctuaire d'anime dès maintenant !
                  </p>
                </div>
                <button
                  onClick={onCreateGuild}
                  className="px-5 py-3 bg-pink-600 hover:bg-pink-500 text-white font-black rounded-xl flex items-center gap-2 shadow-lg shadow-pink-600/20 active:scale-95 transition-all text-xs uppercase tracking-wide whitespace-nowrap shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Créer mon serveur</span>
                </button>
              </motion.div>
            )}

            {/* Available Guilds */}
            <section className="pt-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-pink-400" />
                <span>Serveurs à rejoindre ({joinableGuilds.length})</span>
              </h2>
              {joinableGuilds.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                  <p className="text-xs text-slate-400 font-mono">Vous avez déjà rejoint tous les serveurs disponibles d'OtakuCord ! ✨</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {joinableGuilds.map(guild => (
                    <div key={guild.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex flex-col items-center text-center gap-4 hover:border-slate-800 transition-colors group">
                      <div className={`w-16 h-16 rounded-2xl ${guild.banner || 'bg-slate-800'} flex items-center justify-center shadow-xl shadow-black/50 group-hover:scale-105 transition-transform`}>
                        <span className="text-3xl">{guild.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wide">{guild.name}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">{guild.channels.length} salons d'activités</p>
                      </div>
                      <button
                        onClick={() => onJoinGuild(guild.id)}
                        className="mt-2 w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs uppercase"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Rejoindre</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

      </div>

      {/* 3. MODAL DE CREATION DE PAGE */}
      <AnimatePresence>
        {showCreatePageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setShowCreatePageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative text-slate-100 flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-sans font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="text-indigo-400">✨</span>
                  <span>Lancer une nouvelle Page</span>
                </h3>
              </div>

              <form onSubmit={handleCreatePage} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Nom de la Page
                  </label>
                  <input
                    type="text"
                    required
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    placeholder="Ex: My Hero Academia Actu, Cosplay Sensation..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Catégorie
                    </label>
                    <select
                      value={newPageCategory}
                      onChange={(e) => setNewPageCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 outline-none"
                    >
                      <option>Anime</option>
                      <option>Manga</option>
                      <option>Cosplay</option>
                      <option>Gaming</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                      <span>Photo de la Page (URL, local ou Emoji)</span>
                      <span className="text-[9px] text-indigo-400">Ex: 🍥 ou https://...</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={newPageAvatar}
                        onChange={(e) => setNewPageAvatar(e.target.value)}
                        placeholder="Collez l'URL ou tapez un emoji"
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 outline-none"
                      />
                      <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 shrink-0 border border-slate-700">
                        <span>📁 Importer</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setNewPageAvatar(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Previews and Presets section */}
                <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-850">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 text-[10px] font-black text-slate-500 uppercase">Aperçu :</div>
                    {renderPageAvatar(newPageAvatar, "w-12 h-12 shadow-lg")}
                    <div className="text-[10px] text-slate-400 leading-tight">
                      La photo ou l'emoji s'affiche directement ci-dessus en temps réel.
                    </div>
                  </div>

                  <div>
                    <span className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                      Ou sélectionnez l'une de nos illustrations Anime :
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {ANIME_AVATAR_PRESETS.map(preset => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setNewPageAvatar(preset.url)}
                          className={`p-1 rounded-lg border transition-all flex flex-col items-center gap-1 bg-slate-950/60 hover:bg-slate-900 ${
                            newPageAvatar === preset.url ? 'border-pink-500 bg-pink-950/10' : 'border-slate-800/60'
                          }`}
                          title={preset.name}
                        >
                          <img src={preset.url} alt="" className="w-8 h-8 rounded object-cover" />
                          <span className="text-[8px] font-bold text-slate-500 truncate w-full text-center">
                            {preset.name.split(' ')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Description de la Page
                  </label>
                  <textarea
                    rows={3}
                    value={newPageDesc}
                    onChange={(e) => setNewPageDesc(e.target.value)}
                    placeholder="Dites-en plus aux otakus sur le contenu que vous allez poster..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreatePageModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-bold text-slate-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/15"
                  >
                    Créer la Page
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MODAL DE MISE A JOUR DU STATUT */}
      <AnimatePresence>
        {showStatusModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setShowStatusModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative text-slate-100 flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-sans font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <span>✍️</span>
                  <span>Ajouter une Story / Statut (24h)</span>
                </h3>
                <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddStory();
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Quoi de neuf ? (Texte de votre story)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="Ex: Hypé par la saison 2 de Solo Leveling ! ⚡"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Ce statut/story sera visible par vos amis pendant 24h.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Ajouter une Image ou Vidéo (Optionnel)
                  </label>
                  {storyMediaUrl ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      {storyMediaType === 'video' ? (
                        <video src={storyMediaUrl} className="w-full h-full object-cover" controls />
                      ) : (
                        <img src={storyMediaUrl} alt="Story Preview" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setStoryMediaUrl('');
                          setStoryMediaType(undefined);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black text-white rounded-full transition-colors border border-slate-800"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <label className="flex-1 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors flex items-center justify-center gap-2 rounded-xl text-xs font-bold">
                        <Image size={16} />
                        <span>Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setStoryMediaUrl(reader.result);
                                  setStoryMediaType('image');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <label className="flex-1 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-pink-400 cursor-pointer transition-colors flex items-center justify-center gap-2 rounded-xl text-xs font-bold">
                        <Video size={16} />
                        <span>Vidéo</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setStoryMediaUrl(reader.result);
                                  setStoryMediaType('video');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(false)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-bold text-slate-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!storyText.trim() && !storyMediaUrl}
                    className={`flex-1 py-2 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-colors ${
                      storyText.trim() || storyMediaUrl 
                        ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/15'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Publier (24h)
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. MODAL DE DETAILS D'UNE STORY / STATUT D'OTAKU */}
      <AnimatePresence>
        {selectedStoryFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md"
            onClick={() => setSelectedStoryFriend(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-sm w-full bg-slate-950 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl relative text-slate-100 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedStoryFriend(null)} 
                className="absolute top-3 right-3 bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-white p-1.5 rounded-full z-20 transition-all border border-slate-800/40"
              >
                <X size={15} />
              </button>

              {/* Cover Banner with story styling */}
              <div className={`h-40 bg-gradient-to-br ${selectedStoryFriend.coverColor} relative flex items-end justify-center p-4`}>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60" />
                
                {/* Big Avatar Ring */}
                <div className="w-18 h-18 rounded-full bg-slate-950 border-4 border-slate-950 flex items-center justify-center text-4xl shadow-xl translate-y-7 z-10 shrink-0">
                  <span>{selectedStoryFriend.avatar}</span>
                </div>
              </div>

              {/* Bio & Information */}
              <div className="p-5 pt-10 text-center flex-1 flex flex-col items-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full mb-1">
                  Social Card 👥
                </span>
                <h4 className="font-sans font-black text-base text-white">{selectedStoryFriend.username}</h4>
                <p className="text-xs text-slate-400 font-medium mb-4">{selectedStoryFriend.title}</p>

                {/* Status bubble */}
                <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-2xl w-full text-center relative mb-5">
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-650 text-[8px] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Statut Actuel
                  </span>
                  <p className="text-xs text-slate-200 italic mt-1 font-semibold leading-relaxed">
                    "{selectedStoryFriend.description}"
                  </p>
                </div>

                {/* Actions bottom */}
                <div className="w-full space-y-2 mt-auto">
                  {friends.includes(selectedStoryFriend.id) ? (
                    <button
                      onClick={() => {
                        setActiveDmId(selectedStoryFriend.id);
                        setActiveView('dm');
                        setSelectedStoryFriend(null);
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare size={13} />
                      <span>Lui écrire en privé</span>
                    </button>
                  ) : friendRequests.some(r => r.id === selectedStoryFriend.id && r.type === 'sent') ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-slate-900 border border-slate-800 text-slate-500 font-bold text-xs rounded-xl"
                    >
                      ⏳ Demande d'ami en attente...
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        // Send request
                        const fid = selectedStoryFriend.id;
                        setFriendRequests(prev => [...prev, { id: fid, username: selectedStoryFriend.username, avatar: selectedStoryFriend.avatar, type: 'sent' }]);
                        
                        // Simulate auto accept
                        setTimeout(() => {
                          setFriends(prev => {
                            if (prev.includes(fid)) return prev;
                            const updated = [...prev, fid];
                            localStorage.setItem('otaku_friends_v2', JSON.stringify(updated));
                            return updated;
                          });
                          setFriendRequests(prev => prev.filter(r => r.id !== fid));
                          
                          setPrivateMessages(prev => {
                            const messages = prev[fid] || [];
                            const updated = {
                              ...prev,
                              [fid]: [
                                ...messages,
                                {
                                  senderId: fid,
                                  recipientId: user.id,
                                  content: `Salut ! Merci pour l'invitation d'ami ! Super de te rencontrer, parlons anime quand tu veux ! 😊🍃`,
                                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                }
                              ]
                            };
                            localStorage.setItem('otaku_private_messages_v2', JSON.stringify(updated));
                            return updated;
                          });
                        }, 1500);

                        alert(`📩 Demande d'ami envoyée à ${selectedStoryFriend.username} ! Elle sera bientôt acceptée.`);
                        setSelectedStoryFriend(null);
                      }}
                      className="w-full py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      <UserPlus size={13} />
                      <span>Ajouter en ami</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedStoryFriend(null)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-850/60 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all"
                  >
                    Fermer
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
