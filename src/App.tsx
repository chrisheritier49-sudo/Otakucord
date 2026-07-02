import React, { useState, useEffect, useRef } from 'react';
import { 
  Hash, Volume2, Send, Users, Coins, Award, Sparkles, MessageSquare, 
  Settings, ChevronDown, Check, User as UserIcon, Bell, HelpCircle,
  Menu, X, Globe, Tv, Shield, LogOut, Database, Paperclip, Clock, Image, Video, Trash2, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRESET_GUILDS, INITIAL_MESSAGES, PRESET_ROLES } from './data/mockDiscord';
import { User, Message, Guild, Channel } from './types';
import { QuizSection } from './components/QuizSection';
import TriviaSection from './components/TriviaSection';
import VoiceRoom from './components/VoiceRoom';
import WatchPartySection from './components/WatchPartySection';
import RolesSection from './components/RolesSection';
import AuthScreen from './components/AuthScreen';
import { HomeFeed } from './components/HomeFeed';

// Firebase imports
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, auth, isFirebaseEnabled } from './lib/firebase';

const renderUserAvatar = (avatarStr: string, className: string = "w-7 h-7") => {
  const isUrl = avatarStr && (avatarStr.toLowerCase().startsWith('http') || avatarStr.startsWith('data:') || avatarStr.length > 4);
  if (isUrl) {
    return <img src={avatarStr} alt="Avatar" className={`${className} object-cover rounded-full`} referrerPolicy="no-referrer" />;
  }
  return <span className="select-none">{avatarStr || '👤'}</span>;
};

export default function App() {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('otakucord_user_v2');
  });

  // --- Persistent User State ---
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('otakucord_user_v2');
    if (saved) {
      try {
        const parsedUser = JSON.parse(saved);
        if (!parsedUser.joinedGuilds) parsedUser.joinedGuilds = [];
        if (!parsedUser.notifications) parsedUser.notifications = [];
        return parsedUser;
      } catch (e) {
        // Fallback
      }
    }
    return {
      id: 'otaku-user',
      username: 'GokuFan99',
      avatar: '🦊',
      status: 'online',
      title: 'Aspirant Genin 🍃',
      coins: 100,
      quizPoints: 0,
      cardInventory: [],
      userRoles: ['lvl-genin'],
      language: 'fr',
      joinedGuilds: [],
      notifications: [
        { id: '1', title: 'Bienvenue !', message: 'Bienvenue sur OtakuCord ! Rejoignez un serveur pour commencer.', read: false, timestamp: new Date().toISOString() }
      ]
    };
  });

  const [activeView, setActiveView] = useState<'home' | 'guild'>('home');

  useEffect(() => {
    localStorage.setItem('otakucord_user_v2', JSON.stringify(user));
  }, [user]);

  // Track if Firestore is active, falling back to local storage on errors
  const [firebaseActive, setFirebaseActive] = useState(isFirebaseEnabled);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // --- Guilds State with Local Storage and Pre-loaded presets ---
  const [guilds, setGuilds] = useState<Guild[]>(() => {
    const saved = localStorage.getItem('otakucord_guilds_v3');
    return saved ? JSON.parse(saved) : PRESET_GUILDS;
  });

  useEffect(() => {
    localStorage.setItem('otakucord_guilds_v3', JSON.stringify(guilds));
  }, [guilds]);

  // --- Discord UI Selection State ---
  const [activeGuild, setActiveGuild] = useState<Guild>(() => {
    const saved = localStorage.getItem('otakucord_guilds_v3');
    const parsed = saved ? JSON.parse(saved) : PRESET_GUILDS;
    return parsed[0];
  });
  const [activeChannel, setActiveChannel] = useState<Channel>(() => {
    const saved = localStorage.getItem('otakucord_guilds_v3');
    const parsed = saved ? JSON.parse(saved) : PRESET_GUILDS;
    return parsed[0].channels[0];
  });
  
  // Voice connection state
  const [connectedVoiceChannel, setConnectedVoiceChannel] = useState<string | null>(null);

  // --- Mobile Responsiveness States ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- New Private Messages & Friends States ---
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [friends, setFriends] = useState<string[]>(() => {
    const saved = localStorage.getItem('otaku_friends_v2');
    return saved ? JSON.parse(saved) : ['NarutoBot', 'GokuBot'];
  });
  const [friendRequests, setFriendRequests] = useState<any[]>(() => {
    const saved = localStorage.getItem('otaku_friend_requests_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [privateMessages, setPrivateMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem('otaku_private_messages_v2');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('otaku_friends_v2', JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem('otaku_friend_requests_v2', JSON.stringify(friendRequests));
  }, [friendRequests]);

  useEffect(() => {
    localStorage.setItem('otaku_private_messages_v2', JSON.stringify(privateMessages));
  }, [privateMessages]);

  const [selectedProfileMember, setSelectedProfileMember] = useState<any | null>(null);
  const [firstPvMessage, setFirstPvMessage] = useState('');
  const [pvMessageInput, setPvMessageInput] = useState('');

  // --- Channel Creator & Custom Rules States ---
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelCategory, setNewChannelCategory] = useState('Salons Principaux');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text');
  const [newChannelRules, setNewChannelRules] = useState('');

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [editedRulesText, setEditedRulesText] = useState('');

  // --- Message Log State ---
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const savedLogs = localStorage.getItem('otakucord_messages_v2');
    if (savedLogs) {
      try {
        return JSON.parse(savedLogs);
      } catch (e) {}
    }
    return INITIAL_MESSAGES;
  });

  useEffect(() => {
    localStorage.setItem('otakucord_messages_v2', JSON.stringify(messages));
  }, [messages]);

  // Automatically calculate title / rank based on user interaction (messages sent, cards collected, etc.)
  useEffect(() => {
    let sentCount = 0;
    // Count total messages sent by this user
    Object.values(messages).forEach((channelMsgs) => {
      if (Array.isArray(channelMsgs)) {
        channelMsgs.forEach((msg) => {
          if (msg.author && msg.author.username === user.username) {
            sentCount++;
          }
        });
      }
    });

    const cardsCount = user.cardInventory?.length || 0;
    
    // Choose dynamic title
    let determinedTitle = 'Aspirant Genin 🍃';
    if (cardsCount >= 12 || sentCount >= 25) {
      determinedTitle = 'Hokage Légendaire 👑';
    } else if (cardsCount >= 6 || sentCount >= 12) {
      determinedTitle = 'Sannin d\'Élite 🔮';
    } else if (cardsCount >= 3 || sentCount >= 6) {
      determinedTitle = 'Chûnin Aguerri ⚔️';
    } else if (cardsCount >= 1 || sentCount >= 2) {
      determinedTitle = 'Chûnin Novice 🛡️';
    }

    if (user.title !== determinedTitle) {
      setUser(prev => ({
        ...prev,
        title: determinedTitle
      }));
    }
  }, [messages, user.cardInventory?.length, user.username, user.title]);

  // --- UI Control States ---
  const [isDbStartingUp, setIsDbStartingUp] = useState(true);
  const [dbStartupStatus, setDbStartupStatus] = useState("Initialisation d'OtakuCord...");
  const [messageInput, setMessageInput] = useState('');
  const [isBotResponding, setIsBotResponding] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMembersList, setShowMembersList] = useState(true);

  // --- Translation States for Standard Chat ---
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [showOriginalMessage, setShowOriginalMessage] = useState<Record<string, boolean>>({});

  // --- Media & Cloudinary States ---
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<'image' | 'video' | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [testExpirySeconds, setTestExpirySeconds] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');

    if (!isImg && !isVid) {
      alert("Seuls les fichiers images et vidéos sont acceptés !");
      return;
    }

    setSelectedFileType(isImg ? 'image' : 'video');
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile(event.target?.result as string);
    };
    reader.onerror = (err) => {
      console.error("Failed to read file", err);
      alert("Impossible de lire ce fichier.");
    };
    reader.readAsDataURL(file);
  };

  const getMediaExpiryLabel = (expiryStr?: string): string => {
    if (!expiryStr) return '';
    const expiry = new Date(expiryStr).getTime();
    const diff = expiry - Date.now();
    if (diff <= 0) return 'Expiré';
    
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    if (hours <= 1) {
      const mins = Math.ceil(diff / (1000 * 60));
      return `S'autodétruit dans ${mins} min`;
    }
    if (hours <= 96) {
      return `S'autodétruit dans ${hours}h`;
    }
    const days = Math.ceil(hours / 24);
    return `S'autodétruit dans ${days} j`;
  };

  // Temp form values for profile modification
  const [editUsername, setEditUsername] = useState(user.username);
  const [editTitle, setEditTitle] = useState(user.title);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [avatarUploadLoading, setAvatarUploadLoading] = useState(false);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);

  const handleEditAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner un fichier image valide (JPG, PNG, etc.).");
      return;
    }

    setAvatarUploadLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64File = event.target?.result as string;
        const uploadRes = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64File,
            fileType: 'image',
            noExpiry: true // Profile pictures do not expire!
          })
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          setEditAvatar(uploadData.url);
        } else {
          const errData = await uploadRes.json();
          console.error("Cloudinary avatar upload failed:", errData);
          alert(`Erreur d'upload: ${errData.error || 'Impossible d\'enregistrer l\'image'}`);
        }
      } catch (err) {
        console.error("Connection error during avatar upload:", err);
        alert("Erreur de connexion lors de l'upload de l'avatar.");
      } finally {
        setAvatarUploadLoading(false);
      }
    };
    reader.onerror = () => {
      alert("Impossible de lire ce fichier.");
      setAvatarUploadLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const messageEndRef = useRef<HTMLDivElement>(null);

  // Simulated Database startup sequence showing the gorgeous launcher icon we generated!
  useEffect(() => {
    const statuses = [
      "Connexion à la base de données Otaku QG...",
      "Chargement du module de Traduction Universelle IA...",
      "Indexation des cartes Gacha légendaires...",
      "Membres et serveurs synchronisés !",
      "OtakuCord prêt !"
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < statuses.length - 1) {
        setDbStartupStatus(statuses[currentStep]);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsDbStartingUp(false);
        }, 500);
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  // Firestore Real-Time Message Listener & Synchronizer
  useEffect(() => {
    if (!firebaseActive || !db) return;

    const messagesCol = collection(db, 'messages');
    const q = query(
      messagesCol, 
      where('channelId', '==', activeChannel.id)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let channelMsgs: Message[] = [];
      snapshot.forEach(docSnap => {
        channelMsgs.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });

      // Sort client-side by timestamp to prevent missing index errors on Firestore
      channelMsgs.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      });

      // Seed the Firestore channel if it doesn't have any messages yet
      if (channelMsgs.length === 0 && INITIAL_MESSAGES[activeChannel.id]) {
        const defaultMsgs = INITIAL_MESSAGES[activeChannel.id];
        for (const defaultMsg of defaultMsgs) {
          const docId = `seed-${defaultMsg.id}-${activeChannel.id}`;
          await setDoc(doc(messagesCol, docId), {
            channelId: defaultMsg.channelId,
            guildId: defaultMsg.guildId,
            author: defaultMsg.author,
            content: defaultMsg.content,
            timestamp: new Date().toISOString(),
            originalLanguage: 'fr',
            translatedContent: {
              fr: defaultMsg.content,
              en: defaultMsg.content,
              ja: defaultMsg.content,
              es: defaultMsg.content
            }
          });
        }
        return; // The snapshot listener will re-fire
      }

      setMessages(prev => ({
        ...prev,
        [activeChannel.id]: channelMsgs
      }));
    }, (error) => {
      console.error("Firestore sync error, falling back to local database engine:", error);
      setFirebaseActive(false);
      setFirebaseError(error.message || String(error));
    });

    return () => unsubscribe();
  }, [activeChannel.id, firebaseActive]);

  // Scroll to bottom whenever messages list update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  // Handle server/guild switch
  const handleGuildSelect = (guild: Guild) => {
    setActiveGuild(guild);
    setActiveChannel(guild.channels[0]);
    setIsMobileMenuOpen(false); // Auto close menu on mobile
  };

  // Handle channel click
  const handleChannelSelect = (channel: Channel) => {
    if (channel.type === 'voice') {
      setConnectedVoiceChannel(channel.name);
    } else {
      setActiveChannel(channel);
    }
    setIsMobileMenuOpen(false); // Auto close menu on mobile
  };

  // Add system message (used by Gacha & Trivia sections)
  const addSystemMessage = (content: string) => {
    const sysMsg: Message = {
      id: `sys-${Date.now()}-${Math.random()}`,
      channelId: activeChannel.id,
      guildId: activeGuild.id,
      author: {
        username: 'System',
        avatar: '🤖',
        title: 'Serveur OtakuCord',
        isBot: true,
        botStyle: 'text-red-400 bg-red-950/40 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px]'
      },
      content,
      timestamp: 'À l\'instant'
    };

    setMessages(prev => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), sysMsg]
    }));
  };

  // Translate a specific message on demand using Gemini API
  const handleTranslateMessage = async (msgId: string, content: string) => {
    if (translatingId) return;
    setTranslatingId(msgId);
    
    // Quick local check: if already translated, toggle clear it
    if (translatedMessages[msgId]) {
      setTranslatedMessages(prev => {
        const copy = { ...prev };
        delete copy[msgId];
        return copy;
      });
      setTranslatingId(null);
      return;
    }

    try {
      const res = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          targetLanguage: user.language || 'en'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTranslatedMessages(prev => ({
          ...prev,
          [msgId]: data.translated
        }));
      } else {
        // Simple mock translate fallback
        setTranslatedMessages(prev => ({
          ...prev,
          [msgId]: `🌐 (Auto-TR) ${content} [Translated to ${user.language?.toUpperCase() || 'EN'}]`
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTranslatingId(null);
    }
  };

  // General message saving engine (writes to Firestore if enabled, falls back to local storage)
  const saveMessage = async (msg: Message, useFirebase: boolean) => {
    if (useFirebase && firebaseActive && db) {
      try {
        const sourceLang = msg.originalLanguage || 'fr';
        
        // Fetch translations for all other languages
        let finalTranslations: Record<string, string> = { [sourceLang]: msg.content };
        try {
          const resTrans = await fetch('/api/gemini/translate-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: msg.content,
              sourceLanguage: sourceLang
            })
          });

          if (resTrans.ok) {
            const transData = await resTrans.json();
            finalTranslations = { ...finalTranslations, ...transData };
          }
        } catch (transErr) {
          console.warn("Translation API failed, saving with source content only", transErr);
        }

        const messagesCol = collection(db, 'messages');
        const docPayload: any = {
          channelId: msg.channelId,
          guildId: msg.guildId,
          author: msg.author,
          content: msg.content,
          timestamp: msg.timestamp || new Date().toISOString(),
          originalLanguage: sourceLang,
          translatedContent: finalTranslations
        };

        if (msg.mediaUrl) docPayload.mediaUrl = msg.mediaUrl;
        if (msg.mediaType) docPayload.mediaType = msg.mediaType;
        if (msg.mediaExpiry) docPayload.mediaExpiry = msg.mediaExpiry;

        await setDoc(doc(messagesCol, msg.id), docPayload);
      } catch (err: any) {
        console.error("Firestore write failed, falling back to local state:", err);
        setFirebaseActive(false);
        setFirebaseError(err?.message || String(err));
        setMessages(prev => ({
          ...prev,
          [msg.channelId]: [...(prev[msg.channelId] || []), msg]
        }));
      }
    } else {
      // Local State/Offline Fallback mode
      setMessages(prev => ({
        ...prev,
        [msg.channelId]: [...(prev[msg.channelId] || []), msg]
      }));
    }
  };

  // Channel Creation and Rules modification handlers
  const handleAddChannel = (newChan: Channel) => {
    const updatedGuilds = guilds.map(g => {
      if (g.id === activeGuild.id) {
        return {
          ...g,
          channels: [...g.channels, newChan]
        };
      }
      return g;
    });
    setGuilds(updatedGuilds);
    
    // Update active selections
    const targetGuild = updatedGuilds.find(g => g.id === activeGuild.id);
    if (targetGuild) {
      setActiveGuild(targetGuild);
      const chan = targetGuild.channels.find(c => c.id === newChan.id);
      if (chan) setActiveChannel(chan);
    }
  };

  const handleUpdateChannelRules = (channelId: string, rulesText: string) => {
    const updatedGuilds = guilds.map(g => {
      return {
        ...g,
        channels: g.channels.map(c => {
          if (c.id === channelId) {
            return { ...c, rules: rulesText };
          }
          return c;
        })
      };
    });
    setGuilds(updatedGuilds);

    // Update active channel state
    const currentG = updatedGuilds.find(g => g.id === activeGuild.id);
    if (currentG) {
      setActiveGuild(currentG);
      const currentC = currentG.channels.find(c => c.id === channelId);
      if (currentC) setActiveChannel(currentC);
    }
  };

  // Handle sending text message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() && !selectedFile) return;

    // --- Pornography & NSFW Content Filter ---
    const isNsfwContent = (text: string, filename?: string): boolean => {
      const lowercaseText = text.toLowerCase();
      const lowercaseFilename = filename ? filename.toLowerCase() : '';

      const nsfwPatterns = [
        // Explicit domains and websites
        /pornhub/i, /xvideos/i, /xnxx/i, /onlyfans/i, /rule34/i, /hentai/i, /pornography/i, /pornographique/i, /porn/i, /nude/i, /naked/i, /sexy/i, /xxx/i, /redtube/i, /youporn/i, /chaturbate/i, /myfreecams/i, /stripchat/i,
        // Explicit terms in French and English
        /sexe/i, /baiser/i, /cochon/i, /bite/i, /chatte/i, /vagin/i, /penis/i, /pussy/i, /cock/i, /dick/i, /boobs/i, /nichons/i, /fesses/i, /ass/i, /anal/i, /orgie/i, /ejaculation/i, /sperme/i, /jouir/i, /clitoris/i, /orgasme/i
      ];

      for (const pattern of nsfwPatterns) {
        if (pattern.test(lowercaseText) || pattern.test(lowercaseFilename)) {
          return true;
        }
      }
      return false;
    };

    if (isNsfwContent(messageInput, selectedFileName)) {
      alert("❌ [Contrôle Parental & Sécurité OtakuCord] Le contenu de votre message, de votre lien ou de votre fichier a été identifié comme inapproprié ou pornographique. OtakuCord interdit formellement la diffusion de contenu pour adultes. L'envoi a été bloqué.");
      setSelectedFile(null);
      setSelectedFileType(null);
      setSelectedFileName('');
      return;
    }

    let mediaUrl: string | undefined = undefined;
    let mediaType: 'image' | 'video' | undefined = undefined;
    let mediaExpiry: string | undefined = undefined;

    const sourceLang = user.language || 'fr';
    const msgId = `msg-${Date.now()}`;

    // If there is a selected file, upload it first to Cloudinary via our Express API
    if (selectedFile) {
      setIsUploading(true);
      try {
        const uploadRes = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: selectedFile,
            fileType: selectedFileType,
            customExpirySeconds: testExpirySeconds
          })
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          mediaUrl = uploadData.url;
          mediaType = selectedFileType || undefined;
          mediaExpiry = uploadData.expiresAt;
        } else {
          const errData = await uploadRes.json();
          console.error("Cloudinary upload failed:", errData);
          alert(`Erreur d'upload Cloudinary: ${errData.error || 'Inconnu'}`);
        }
      } catch (err) {
        console.error("Upload connection error:", err);
        alert("Impossible de se connecter au serveur pour l'upload.");
      } finally {
        setIsUploading(false);
        // Clear media states
        setSelectedFile(null);
        setSelectedFileType(null);
        setSelectedFileName('');
      }
    }

    const currentInput = messageInput || (mediaType === 'video' ? "🎥 A partagé une vidéo" : "🖼️ A partagé une image");
    setMessageInput('');

    // Create message object
    const userMsg: Message = {
      id: msgId,
      channelId: activeChannel.id,
      guildId: activeGuild.id,
      author: {
        username: user.username,
        avatar: user.avatar,
        title: user.title
      },
      content: currentInput,
      timestamp: new Date().toISOString(),
      originalLanguage: sourceLang,
      translatedContent: {
        [sourceLang]: currentInput
      },
      mediaUrl,
      mediaType,
      mediaExpiry
    };

    // Trigger local optimistic coins reward (+10 coins)
    setUser(prev => ({
      ...prev,
      coins: prev.coins + 10
    }));

    // Save message via general engine
    await saveMessage(userMsg, firebaseActive);

    // Trigger AI Senpai Bot if mentioned or if in the AI channel
    const isSenpaiMentioned = currentInput.toLowerCase().includes('@senpai');
    const isRecChannel = activeChannel.id === 'ol-mangas' || activeChannel.id === 'ol-recommande-ia';

    if (isSenpaiMentioned || isRecChannel) {
      await triggerSenpaiBot(currentInput, firebaseActive);
    } else {
      simulateCharacterResponse(currentInput, firebaseActive);
    }
  };

  // Trigger Gemini API for @Senpai bot on backend
  const triggerSenpaiBot = async (promptText: string, useFirebase: boolean) => {
    setIsBotResponding(true);
    
    // Add temporary loading indicator message locally
    const tempBotId = `bot-loading-${Date.now()}`;
    const loadingMsg: Message = {
      id: tempBotId,
      channelId: activeChannel.id,
      guildId: activeGuild.id,
      author: {
        username: 'Senpai',
        avatar: '🔮',
        title: 'AI Anime Expert',
        isBot: true,
        botStyle: 'text-purple-400 bg-purple-950/40 border border-purple-500/20 px-1.5 py-0.5 rounded text-[10px]'
      },
      content: '⚡ Senpai réfléchit aux meilleurs animes...',
      timestamp: new Date().toISOString(),
      originalLanguage: 'fr'
    };

    setMessages(prev => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), loadingMsg]
    }));

    try {
      // Build brief local history
      const channelHistory = (messages[activeChannel.id] || [])
        .slice(-6)
        .map(m => ({
          role: m.author.isBot ? 'model' : 'user',
          text: m.content
        }));

      // Gather current roles for context
      const userRolesNames = (user.userRoles || [])
        .map(rId => PRESET_ROLES.find(pr => pr.id === rId)?.name || '')
        .filter(Boolean)
        .join(', ');

      const contextInstruction = `Tu es Senpai, l'hôte expert en animes, mangas et culture otaku de ce Discord OtakuCord. Tu parles en français avec enthousiasme, clarté et un ton amical de fan. Tu t'y connais extrêmement bien en culture pop japonaise, lore, théories, auteurs de manga et animes de saisons. Utilise un langage dynamique de Discord et n'hésite pas à recommander des œuvres méconnues ! Le membre à qui tu t'adresses est @${user.username} (ses rôles et badges sur le serveur : ${userRolesNames || 'aucun rôle'}). Personnalise légèrement ta réponse par rapport à ses rôles s'ils sont pertinents !`;

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          systemInstruction: contextInstruction,
          history: channelHistory
        })
      });

      // Remove loading indicator message locally
      setMessages(prev => ({
        ...prev,
        [activeChannel.id]: (prev[activeChannel.id] || []).filter(m => m.id !== tempBotId)
      }));

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || "Désolé, j'ai eu un petit problème de connexion neuronale ! Recommence s'il te plaît.";
        
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          channelId: activeChannel.id,
          guildId: activeGuild.id,
          author: {
            username: 'Senpai',
            avatar: '🔮',
            title: 'AI Anime Expert',
            isBot: true,
            botStyle: 'text-purple-400 bg-purple-950/40 border border-purple-500/20 px-1.5 py-0.5 rounded text-[10px]'
          },
          content: reply,
          timestamp: new Date().toISOString(),
          originalLanguage: 'fr'
        };

        await saveMessage(botMsg, useFirebase);
      } else {
        throw new Error('Gemini call failed');
      }
    } catch (e) {
      console.error("Gemini chatbot error:", e);
      // Remove loading indicator
      setMessages(prev => ({
        ...prev,
        [activeChannel.id]: (prev[activeChannel.id] || []).filter(m => m.id !== tempBotId)
      }));

      const errMsg: Message = {
        id: `bot-err-${Date.now()}`,
        channelId: activeChannel.id,
        guildId: activeGuild.id,
        author: {
          username: 'Senpai',
          avatar: '🔮',
          title: 'AI Anime Expert',
          isBot: true,
          botStyle: 'text-purple-400 bg-purple-950/40 border border-purple-500/20 px-1.5 py-0.5 rounded text-[10px]'
        },
        content: '🌸 Gomen nasai! J\'ai perdu le fil de notre discussion... Peux-tu me reposer ta question ? (Vérifie aussi si la clé d\'API Gemini est bien configurée dans AI Studio)',
        timestamp: new Date().toISOString(),
        originalLanguage: 'fr'
      };

      await saveMessage(errMsg, useFirebase);
    } finally {
      setIsBotResponding(false);
    }
  };

  // Simulate replies from preset characters like Naruto, Sasuke, Goku
  const simulateCharacterResponse = (userPrompt: string, useFirebase: boolean) => {
    // 35% chance to trigger a fun preset bot reaction depending on current guild
    if (Math.random() > 0.35) return;

    let botAuthor = { username: 'RemBot', avatar: '🌸', title: 'Waifu', isBot: true, botStyle: 'text-pink-400 bg-pink-950/40 border border-pink-500/20 px-1.5 py-0.5 rounded text-[10px]' };
    let replyContent = "Wow ! C'est super intéressant ! 🌸";

    if (activeGuild.id === 'konoha') {
      const responses = [
        "Dattebayo ! Moi aussi je m'entraîne dur aujourd'hui ! 🍥",
        "Ne sous-estime jamais le pouvoir de l'amitié et des ramens ! 🍜",
        "Je serai le prochain Hokage, croyez-moi ! 🍃",
        "Sasuke, arrête de faire ton mystérieux !"
      ];
      botAuthor = { username: 'NarutoBot', avatar: '🍥', title: '7ème Hokage', isBot: true, botStyle: 'text-orange-400 bg-orange-950/40 border border-orange-500/20 px-1.5 py-0.5 rounded text-[10px]' };
      replyContent = responses[Math.floor(Math.random() * responses.length)];
    } else {
      // General lounge
      const responses = [
        "Tu as tout à fait raison ! Au fait, n'oublie pas de tester notre Gacha collector dans #🎰-gacha-collector ! 🍀",
        "Saitama, arrête de te plaindre du prix des légumes !",
        "D'accord d'accord ! C'est noté ! ✨",
        "Qui est chaud pour la prochaine Watch Party en direct ? 🍿",
        "N'oubliez pas d'équiper vos rôles Otaku dans le salon #🛡️-obtenir-des-rôles !"
      ];
      replyContent = responses[Math.floor(Math.random() * responses.length)];
    }

    setTimeout(async () => {
      const characterMsg: Message = {
        id: `sim-bot-${Date.now()}`,
        channelId: activeChannel.id,
        guildId: activeGuild.id,
        author: botAuthor,
        content: replyContent,
        timestamp: new Date().toISOString(),
        originalLanguage: 'fr'
      };

      await saveMessage(characterMsg, useFirebase);
    }, 1200);
  };

  // Save profile modifications
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser(prev => ({
      ...prev,
      username: editUsername.trim() || prev.username,
      avatar: editAvatar
    }));
    setShowProfileModal(false);
  };

  // Handle user logout
  const handleLogout = async () => {
    localStorage.removeItem('otakucord_user_v2');
    setIsAuthenticated(false);
    if (isFirebaseEnabled && auth) {
      try {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      } catch (err) {
        console.error("Firebase signOut error:", err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'idle': return 'bg-amber-500';
      case 'dnd': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  // Predefined avatars
  const avatarList = ['🦊', '🍥', '🌸', '👊', '🥚', '👁️', '🎴', '🥦', '⚡', '👑', '🍙', '⚔️', '👾', '🐱', '🔥'];

  // Check custom tabs/views
  const isQuizChannel = activeChannel.id === 'ol-quiz';
  const isTriviaChannel = activeChannel.id === 'ol-trivia';
  const isWatchPartyChannel = activeChannel.id === 'ol-watch-party';
  const isRolesChannel = activeChannel.id === 'ol-roles';

  // Quick helper to fetch role category colors or list
  const getUserLevelsBadges = (rolesIds: string[] = []) => {
    return rolesIds.map(rId => {
      const role = PRESET_ROLES.find(pr => pr.id === rId);
      if (!role) return null;
      return (
        <span 
          key={rId} 
          className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${role.color}`}
          title={role.description}
        >
          {role.name}
        </span>
      );
    }).filter(Boolean);
  };

  if (isDbStartingUp) {
    return (
      <div id="db-startup-loader" className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6 select-none font-sans relative overflow-hidden">
        {/* Background ambient glowing circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-sm w-full flex flex-col items-center text-center z-10">
          {/* Pulsing rounded-3xl container for the gorgeous launcher icon */}
          <div className="relative w-36 h-36 mb-6 p-1 bg-gradient-to-tr from-pink-500 to-indigo-500 rounded-3xl shadow-[0_0_50px_rgba(236,72,153,0.35)]">
            <img 
              src="/src/assets/images/otakucord_db_launcher_1782948569257.jpg" 
              alt="OtakuCord Database Launcher" 
              className="w-full h-full object-cover rounded-[22px]"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Titles & Logs */}
          <h2 className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 uppercase font-mono">
            OtakuCord Core v3.2
          </h2>
          <p className="text-xs text-slate-400 font-medium tracking-wide mt-1">
            Système de Traduction & Base Firestore
          </p>

          {/* Progress bar */}
          <div className="w-full bg-slate-900 border border-slate-800/80 rounded-full h-2 mt-8 overflow-hidden relative">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
              className="bg-gradient-to-r from-pink-500 to-indigo-500 h-full" 
            />
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-mono font-bold text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
            <span>{dbStartupStatus}</span>
          </div>

          {/* Features check-list during bootup */}
          <div className="mt-10 border-t border-slate-800/55 pt-4 w-full flex justify-around text-[10px] font-mono font-black tracking-wider text-slate-600">
            <div className="flex items-center gap-1">
              <span className="text-emerald-500">●</span> FIRESTORE SYNC
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-500">●</span> GEMINI TRANSLATION
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-500">●</span> OTAKU QG LIVE
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen 
        onAuthSuccess={(authUser) => {
          setUser(authUser);
          setIsAuthenticated(true);
        }}
        firebaseActive={firebaseActive}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none antialiased">
      
      {/* 1. GUILDS SIDEBAR (Far Left) - Hidden on mobile unless drawer open */}
      <div className="w-[72px] bg-slate-950 hidden md:flex flex-col items-center py-3 gap-2 border-r border-slate-900/50 shrink-0">
        {/* Discord Home Logo */}
        <div 
          onClick={() => setActiveView('home')}
          className={`w-12 h-12 rounded-3xl bg-slate-800 hover:bg-indigo-500 text-white flex items-center justify-center text-xl cursor-pointer hover:rounded-2xl transition-all relative group ${
            activeView === 'home' ? 'bg-indigo-500 rounded-2xl' : ''
          }`}
        >
          <span className="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </span>
          {/* Active Indicator Bar */}
          <div className={`absolute left-0 w-1 bg-white rounded-r transition-all duration-300 ${
            activeView === 'home' ? 'h-10 top-1 animate-pulse' : 'h-0 group-hover:h-5'
          }`} />
          {/* Tooltip */}
          <div className="absolute left-16 bg-black text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap shadow-xl border border-slate-800 z-50">
            Accueil
          </div>
        </div>

        <div className="w-8 h-[2px] bg-slate-800 my-1 rounded" />

        {/* Dynamic Guild List */}
        {PRESET_GUILDS.filter(g => user.joinedGuilds?.includes(g.id)).map(guild => {
          const isActive = activeView === 'guild' && activeGuild.id === guild.id;
          return (
            <div
              key={guild.id}
              onClick={() => {
                handleGuildSelect(guild);
                setActiveView('guild');
              }}
              className={`w-12 h-12 rounded-3xl flex items-center justify-center text-xl cursor-pointer hover:rounded-2xl transition-all relative group shadow-lg ${
                isActive ? 'bg-slate-800 border-2 border-indigo-500 rounded-2xl' : 'bg-slate-900 hover:bg-slate-850'
              }`}
            >
              <span>{guild.icon}</span>
              <div className={`absolute left-0 w-1 bg-white rounded-r transition-all duration-300 ${
                isActive ? 'h-8' : 'h-0 group-hover:h-4'
              }`} />
              
              {/* Tooltip */}
              <div className="absolute left-16 bg-black text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap shadow-xl border border-slate-800 z-50">
                {guild.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. CHANNELS & STATE SIDEBAR (Middle Left) - Hidden on mobile unless drawer open */}
      <div className="w-60 bg-slate-900 hidden md:flex flex-col justify-between shrink-0 border-r border-slate-950/60">
        <div>
          {/* Guild Banner header */}
          <div className="h-12 border-b border-slate-950 px-4 flex items-center justify-between font-bold text-sm text-white bg-slate-900/60 shadow-sm relative overflow-hidden">
            <span className="tracking-wide z-10">{activeGuild.name}</span>
            <ChevronDown size={16} className="text-slate-400 z-10 shrink-0" />
            <div className={`absolute top-0 left-0 w-full h-1 opacity-20 ${activeGuild.banner}`} />
          </div>

          {/* Create Channel Action Bar */}
          <div className="px-3 py-1.5 border-b border-slate-950/60 flex items-center justify-between bg-slate-950/20">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Salons de discussion</span>
            <button
              onClick={() => {
                setNewChannelName('');
                setNewChannelDesc('');
                setNewChannelRules('1. Restez poli et respectueux.\n2. Pas de spam ni de publicité.\n3. Tout contenu offensant ou pornographique est strictement banni.');
                setNewChannelCategory('DISCUSSIONS');
                setNewChannelType('text');
                setShowCreateChannelModal(true);
              }}
              className="px-2 py-0.5 rounded bg-slate-950 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-slate-800"
              title="Créer un nouveau salon"
              id="btn-create-channel"
            >
              <span>+ Créer</span>
            </button>
          </div>

          {/* Channels Scroll Area */}
          <div className="p-2 overflow-y-auto max-h-[calc(100vh-120px)] flex flex-col gap-4">
            {/* Group channels by category */}
            {['DISCUSSIONS', 'OTAKU FUN', 'ADMINISTRATION', 'ACTIVITÉS', 'GÉNÉRAL', 'RECOMMANDATIONS', 'SALONS VOCAUX'].map(category => {
              const catChannels = activeGuild.channels.filter(c => c.category === category);
              if (catChannels.length === 0) return null;

              return (
                <div key={category} className="flex flex-col gap-0.5">
                  <div className="text-[10px] font-black tracking-wider text-slate-500 px-2 py-1 uppercase flex items-center justify-between">
                    <span>{category}</span>
                  </div>

                  {catChannels.map(channel => {
                    const isActive = activeChannel.id === channel.id;
                    const isVoice = channel.type === 'voice';

                    return (
                      <div
                        key={channel.id}
                        onClick={() => handleChannelSelect(channel)}
                        className={`group px-2 py-2 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                          isActive 
                            ? 'bg-slate-800 text-white' 
                            : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate text-sm">
                          {isVoice ? (
                            <Volume2 size={16} className="text-slate-400 group-hover:text-slate-200 shrink-0" />
                          ) : (
                            <Hash size={16} className="text-slate-400 group-hover:text-slate-200 shrink-0" />
                          )}
                          <span className="truncate font-medium">{channel.name}</span>
                        </div>
                        {isVoice && connectedVoiceChannel === channel.name && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Firestore Sync Status Badge */}
        {isFirebaseEnabled && (
          <div className="mx-2 mb-2 p-2 bg-slate-950/40 border border-slate-800 rounded-lg flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${firebaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-mono font-bold tracking-wide text-slate-400 truncate">
                {firebaseActive ? 'Firestore Actif' : 'Mode Hors-ligne'}
              </span>
            </div>
            {firebaseError && (
              <button
                type="button"
                onClick={() => {
                  setEditUsername(user.username);
                  setEditTitle(user.title);
                  setEditAvatar(user.avatar);
                  setShowProfileModal(true);
                }}
                className="text-[9px] font-bold text-pink-400 hover:text-pink-300 hover:underline shrink-0"
              >
                Aide Rules
              </button>
            )}
          </div>
        )}

        {/* User Status Bar (Bottom Left) */}
        <div className="p-2.5 bg-slate-950/80 border-t border-slate-950 flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2 min-w-0">
            {/* Status Indicator */}
            <div className="relative cursor-pointer shrink-0" onClick={() => setShowProfileModal(true)}>
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg hover:scale-105 transition-transform overflow-hidden">
                {renderUserAvatar(user.avatar, "w-8 h-8")}
              </div>
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-slate-950 ${getStatusColor(user.status)}`} />
            </div>

            <div className="min-w-0" onClick={() => setShowProfileModal(true)}>
              <div className="font-bold text-xs text-white truncate cursor-pointer hover:underline">{user.username}</div>
              <div className="text-[9px] text-slate-400 font-medium truncate max-w-[100px]">{user.title}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md text-[10px] text-yellow-400 font-mono font-bold" title="Otaku Coins">
              <Coins size={12} className="text-yellow-400" />
              <span>{user.coins}</span>
            </div>
            
            <button 
              onClick={() => {
                setEditUsername(user.username);
                setEditTitle(user.title);
                setEditAvatar(user.avatar);
                setShowProfileModal(true);
              }}
              className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
              title="Modifier le Profil"
            >
              <Settings size={14} />
            </button>

            <button 
              onClick={handleLogout}
              className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-500/10 transition-colors animate-pulse-subtle"
              title="Se déconnecter"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER PORTAL */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs flex"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-72 h-full bg-slate-900 border-r border-slate-950/80 flex flex-col justify-between"
              onClick={e => e.stopPropagation()}
            >
              <div>
                <div className="p-4 border-b border-slate-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌸</span>
                    <span className="font-bold text-white text-base">OtakuCord Menu</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1">
                    <X size={18} />
                  </button>
                </div>

                {/* Guild Quick Selector */}
                <div className="p-3 bg-slate-950/40 border-b border-slate-950 flex gap-2.5 overflow-x-auto">
                  {PRESET_GUILDS.map(g => (
                    <button 
                      key={g.id}
                      onClick={() => handleGuildSelect(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                        activeGuild.id === g.id 
                          ? 'bg-pink-600 text-white' 
                          : 'bg-slate-900 border border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>{g.icon}</span>
                      <span>{g.name}</span>
                    </button>
                  ))}
                </div>
                
                {/* Create Channel Mobile */}
                <div className="px-4 pt-4 pb-2">
                  <button
                    onClick={() => {
                      setNewChannelName('');
                      setNewChannelDesc('');
                      setNewChannelRules('1. Restez poli et respectueux.\n2. Pas de spam ni de publicité.\n3. Tout contenu offensant ou pornographique est strictement banni.');
                      setNewChannelCategory('DISCUSSIONS');
                      setNewChannelType('text');
                      setShowCreateChannelModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                  >
                    <span>+ Créer un nouveau salon</span>
                  </button>
                </div>

                {/* Mobile Channels List */}
                <div className="p-3 overflow-y-auto max-h-[calc(100vh-190px)] flex flex-col gap-4">
                  {['DISCUSSIONS', 'OTAKU FUN', 'ADMINISTRATION', 'ACTIVITÉS', 'GÉNÉRAL', 'RECOMMANDATIONS', 'SALONS VOCAUX'].map(category => {
                    const catChannels = activeGuild.channels.filter(c => c.category === category);
                    if (catChannels.length === 0) return null;

                    return (
                      <div key={category} className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-500 px-2 py-0.5 uppercase block">{category}</span>
                        {catChannels.map(channel => {
                          const isActive = activeChannel.id === channel.id;
                          return (
                            <button
                              key={channel.id}
                              onClick={() => handleChannelSelect(channel)}
                              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                                isActive ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                              }`}
                            >
                              <Hash size={14} className="text-slate-500" />
                              <span>{channel.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Drawer Footer with user info */}
              <div className="p-3 bg-slate-950/80 border-t border-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-lg bg-slate-800 shrink-0">
                    {renderUserAvatar(user.avatar, "w-8 h-8")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user.username}</p>
                    <p className="text-[9px] text-slate-500 truncate">{user.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-yellow-400 font-mono text-[10px] font-bold">
                  <Coins size={11} />
                  <span>{user.coins}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN WORKSPACE / CHAT STAGE (Center) */}
      <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden h-full">
        
        {/* MOBILE HEADER BAR */}
        <div className="h-12 bg-slate-900 border-b border-slate-950/60 px-4 md:hidden flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-400 hover:text-white p-1 bg-slate-950 border border-slate-850 rounded-lg active:scale-95 transition-all"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-1 text-sm font-bold text-white truncate">
              <Hash size={16} className="text-slate-500 shrink-0" />
              <span className="truncate">{activeChannel.name}</span>
            </div>
            {/* Rules Button if rules exist or user is creator of the channel */}
            {(activeChannel.rules || activeChannel.creatorId === user.id) && (
              <button
                onClick={() => {
                  setEditedRulesText(activeChannel.rules || '');
                  setShowRulesModal(true);
                }}
                className="px-2 py-0.5 rounded bg-slate-950 border border-teal-500/30 text-teal-400 text-[10px] flex items-center gap-1"
                title="Règles du salon"
              >
                <Shield size={10} />
                <span>Règles</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Gacha/Trivia/Watch parties icons for mobile shortcut */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-850/60 text-yellow-400 font-mono text-xs font-bold">
              <Coins size={12} />
              <span>{user.coins}</span>
            </div>
            <button 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center justify-center border border-slate-700/60 rounded-full"
            >
              {renderUserAvatar(user.avatar, "w-7 h-7")}
            </button>
          </div>
        </div>

        {/* Custom check for Active voice channel */}
        {connectedVoiceChannel ? (
          <VoiceRoom 
            user={user} 
            channelName={connectedVoiceChannel} 
            onDisconnect={() => setConnectedVoiceChannel(null)} 
          />
        ) : isQuizChannel ? (
          <QuizSection 
            activeLanguage={user.language as any || 'fr'}
            onUpdateUser={(coins) => setUser(prev => ({ ...prev, coins: prev.coins + coins }))}
            onAddSystemMessage={addSystemMessage} 
          />
        ) : isTriviaChannel ? (
          <TriviaSection 
            user={user} 
            onUpdateUser={setUser} 
            onAddSystemMessage={addSystemMessage} 
          />
        ) : isWatchPartyChannel ? (
          <WatchPartySection
            user={user}
            onUpdateUser={setUser}
            onAddSystemMessage={addSystemMessage}
          />
        ) : isRolesChannel ? (
          <RolesSection
            user={user}
            onUpdateUser={setUser}
            onAddSystemMessage={addSystemMessage}
          />
        ) : (
          /* STANDARD TEXT CHAT */
          <>
            {/* Desktop-only Top Info Bar */}
            <div className="h-12 bg-slate-900 border-b border-slate-950/60 px-4 hidden md:flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Hash className="text-slate-400 shrink-0" size={18} />
                <span className="font-bold text-sm text-white shrink-0">{activeChannel.name}</span>
                <span className="text-slate-500 text-xs shrink-0">|</span>
                <p className="text-slate-400 text-xs truncate max-w-lg hidden sm:block">{activeChannel.description}</p>
                {/* Rules Button if rules exist or user is creator of the channel */}
                {(activeChannel.rules || activeChannel.creatorId === user.id) && (
                  <button
                    onClick={() => {
                      setEditedRulesText(activeChannel.rules || '');
                      setShowRulesModal(true);
                    }}
                    className="ml-2.5 px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-teal-400 hover:text-teal-300 border border-teal-500/30 transition-all text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-md"
                    title="Règles du groupe"
                  >
                    <Shield size={10} />
                    <span>Règles</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 text-slate-400">
                {/* Global Language translation indicator */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-md border border-slate-850/60 text-[10px] font-bold text-indigo-400 font-mono">
                  <Globe size={11} /> TRAD: {user.language?.toUpperCase() || 'FR'}
                </div>

                <button 
                  onClick={() => setShowMembersList(!showMembersList)}
                  className={`p-1.5 rounded transition-colors hover:text-slate-200 ${showMembersList ? 'text-indigo-400' : 'text-slate-400'}`}
                  title="Afficher/Masquer les membres"
                >
                  <Users size={18} />
                </button>
                <HelpCircle size={18} className="cursor-help hover:text-slate-200" title="Aide" />
              </div>
            </div>

            {/* Chat Messages Scrolling Area */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-slate-900/45">
              
              {/* Channel Greeting Prompt */}
              <div className="mb-6 mt-2 pb-6 border-b border-slate-800/40">
                <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-2xl border border-slate-700/40 mb-3 shadow-md">
                  #
                </div>
                <h3 className="font-black text-xl text-white">Bienvenue dans #{activeChannel.name} !</h3>
                <p className="text-slate-400 text-sm mt-1">C'est le début de l'histoire du salon #{activeChannel.name}.</p>
              </div>

              {/* Message List */}
              {(messages[activeChannel.id] || []).map((msg) => {
                const viewerLanguage = user.language || 'fr';
                const originalLang = msg.originalLanguage || 'fr';
                
                // Determine if we should show the translation automatically
                const hasTranslation = msg.translatedContent && msg.translatedContent[viewerLanguage];
                const shouldTranslateAuto = originalLang !== viewerLanguage && hasTranslation;
                const isToggledOriginal = !!showOriginalMessage[msg.id];
                const displayingOriginal = !shouldTranslateAuto || isToggledOriginal;
                
                const textToDisplay = displayingOriginal 
                  ? msg.content 
                  : (msg.translatedContent?.[viewerLanguage] || msg.content);

                const authorRoles = msg.author.username === user.username ? (user.userRoles || []) : [];

                // Language names mapping
                const langNames: Record<string, string> = {
                  fr: 'Français 🇫🇷',
                  en: 'English 🇬🇧',
                  ja: '日本語 🇯🇵',
                  es: 'Español 🇪🇸'
                };

                return (
                  <div key={msg.id} className="flex gap-3 hover:bg-slate-950/20 p-2 rounded-xl transition-all group relative border border-transparent hover:border-slate-850/30">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-lg shadow-sm shrink-0 select-none overflow-hidden">
                      {renderUserAvatar(msg.author.avatar, "w-9 h-9")}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-200 hover:underline cursor-pointer">
                          {msg.author.username}
                        </span>
                        
                        {/* Bot style tag */}
                        {msg.author.isBot && (
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${msg.author.botStyle || 'bg-indigo-950 text-indigo-300'}`}>
                            BOT
                          </span>
                        )}

                        {/* Title display */}
                        {msg.author.title && (
                          <span className="text-[10px] font-medium text-slate-400 px-1.5 py-0.5 bg-slate-950/40 rounded border border-slate-800/60">
                            {msg.author.title}
                          </span>
                        )}

                        {/* Custom Badges for User Roles */}
                        {authorRoles.length > 0 && (
                          <div className="flex gap-1 items-center">
                            {getUserLevelsBadges(authorRoles)}
                          </div>
                        )}

                        <span className="text-[10px] text-slate-500 font-mono">
                          {msg.timestamp && msg.timestamp.includes('T') 
                            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : msg.timestamp || 'À l\'instant'}
                        </span>
                      </div>

                      {/* Text content with auto-translation indication */}
                      <div className="mt-1 text-sm text-slate-300 leading-relaxed break-words select-text">
                        <p className="font-normal">{textToDisplay}</p>
                        
                        {/* Auto-translation notification banner */}
                        {shouldTranslateAuto && (
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono font-bold select-none">
                            <Globe size={10} className="text-pink-400 animate-pulse" />
                            <span>
                              {displayingOriginal 
                                ? `Texte original (${langNames[originalLang] || originalLang})` 
                                : `Traduit automatiquement du ${langNames[originalLang]?.split(' ')[0] || originalLang}`}
                            </span>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => setShowOriginalMessage(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                              className="text-pink-400 hover:text-pink-300 hover:underline font-bold"
                            >
                              {displayingOriginal ? "Voir la traduction" : "Voir l'original"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Render attached Cloudinary media */}
                      {msg.mediaUrl && (
                        <div className="mt-2.5 max-w-sm rounded-xl overflow-hidden border border-slate-850 bg-slate-950/80 relative group/media shadow-inner">
                          {msg.mediaType === 'video' ? (
                            <video 
                              src={msg.mediaUrl} 
                              controls 
                              className="w-full max-h-64 object-contain rounded-lg"
                              preload="metadata"
                              playsInline
                            />
                          ) : (
                            <img 
                              src={msg.mediaUrl} 
                              alt="Fichier partagé" 
                              className="w-full max-h-64 object-cover rounded-lg cursor-pointer hover:scale-[1.01] transition-transform duration-200"
                              onClick={() => window.open(msg.mediaUrl, '_blank')}
                              referrerPolicy="no-referrer"
                            />
                          )}
                          
                          {/* Expiry Clock Badge */}
                          {msg.mediaExpiry && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/90 backdrop-blur-sm border border-pink-500/30 text-[9px] font-mono font-bold text-pink-300 flex items-center gap-1 shadow-md select-none">
                              <Clock size={10} className="text-pink-400 animate-pulse" />
                              <span>{getMediaExpiryLabel(msg.mediaExpiry)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Translate Button on hover of messages (for on-demand translation of messages without pre-translation) */}
                    {!msg.author.isBot && !hasTranslation && (
                      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTranslateMessage(msg.id, msg.content)}
                          disabled={translatingId === msg.id}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1"
                          title="Traduire le message"
                        >
                          <Globe size={11} className={translatingId === msg.id ? 'animate-spin text-pink-400' : 'text-indigo-400'} />
                          <span>Traduire</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messageEndRef} />
            </div>

            {/* Chat Input Area (Bottom) */}
            <div className="p-4 bg-slate-900 border-t border-slate-950/30 shrink-0">
              {/* File Preview & Expiry Selector Panel */}
              {selectedFile && (
                <div className="mb-3 p-3 bg-slate-950/85 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-850 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {selectedFileType === 'video' ? (
                        <div className="text-pink-400 font-bold text-xs flex flex-col items-center">
                          <Video size={16} />
                          <span className="text-[8px] font-mono mt-0.5">Vidéo</span>
                        </div>
                      ) : (
                        <img src={selectedFile} alt="Preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-300 truncate max-w-[200px] sm:max-w-xs">{selectedFileName}</p>
                      <p className="text-[10px] text-pink-400 font-mono mt-0.5 flex items-center gap-1">
                        <Clock size={10} className="animate-pulse text-pink-400" />
                        <span>S'autodétruira automatiquement</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    {/* Expiry Selector (Demo override option for testing!) */}
                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Délai avant suppression</label>
                      <select
                        value={testExpirySeconds === null ? 'normal' : String(testExpirySeconds)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTestExpirySeconds(val === 'normal' ? null : Number(val));
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 px-2 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        <option value="normal">Normal (Vidéo: 80h / Image: 1 mois)</option>
                        <option value="10">⚡ Test Démo : 10 secondes</option>
                        <option value="60">⚡ Test Démo : 1 minute</option>
                        <option value="300">⚡ Test Démo : 5 minutes</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setSelectedFileType(null);
                        setSelectedFileName('');
                      }}
                      className="p-2 rounded-lg bg-slate-900/50 hover:bg-red-950/30 border border-slate-850 hover:border-red-900/40 text-slate-400 hover:text-red-400 transition-all mt-4 sm:mt-0"
                      title="Supprimer le fichier"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Status */}
              {isUploading && (
                <div className="mb-3 p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex items-center gap-2.5 text-xs text-indigo-300 animate-pulse">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                  <span>Envoi sécurisé du média vers Cloudinary...</span>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 shadow-lg focus-within:border-indigo-500/50 transition-colors items-center">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  className="hidden"
                />

                {/* Attachment Trigger Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBotResponding || isUploading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-900 transition-all shrink-0"
                  title="Ajouter une image ou une vidéo (S'autodétruit après 80h/1 mois)"
                >
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={isBotResponding || isUploading}
                  placeholder={
                    activeChannel.id === 'ol-recommande-ia'
                      ? "Conseille-moi un manga de dark fantasy, @Senpai..."
                      : `Discuter dans #${activeChannel.name} (Gagne +10 coins par message)`
                  }
                  className="flex-1 bg-transparent border-none text-slate-200 placeholder-slate-500 focus:outline-none text-sm min-w-0"
                />
                <button
                  type="submit"
                  disabled={isBotResponding || isUploading || (!messageInput.trim() && !selectedFile)}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    messageInput.trim() || selectedFile
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow shadow-indigo-500/20' 
                      : 'text-slate-600 bg-transparent'
                  }`}
                >
                  <Send size={16} />
                </button>
              </form>
              <div className="flex justify-between items-center px-1 mt-1.5">
                <p className="text-[10px] text-slate-500 italic hidden sm:block">
                  Astuce : Tape <strong className="text-indigo-400">@Senpai</strong> suivi de ta question pour solliciter l'IA de l'Oracle Otaku !
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  +10 Otaku Coins par message
                </p>
              </div>
            </div>
          </>
        )}

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="h-14 bg-slate-950 border-t border-slate-900/80 md:hidden flex justify-around items-center shrink-0 z-10 px-2">
          {/* 1. Chat Tab */}
          <button 
            onClick={() => {
              // Switch to general if in a custom app channel
              if (isQuizChannel || isTriviaChannel || isWatchPartyChannel || isRolesChannel) {
                const textChan = activeGuild.channels.find(c => c.type === 'text' && c.id !== 'ol-quiz' && c.id !== 'ol-trivia' && c.id !== 'ol-watch-party' && c.id !== 'ol-roles');
                if (textChan) setActiveChannel(textChan);
              }
            }}
            className={`flex flex-col items-center gap-0.5 py-1 text-center shrink-0 ${
              !isQuizChannel && !isTriviaChannel && !isWatchPartyChannel && !isRolesChannel 
                ? 'text-pink-500' 
                : 'text-slate-400'
            }`}
          >
            <MessageSquare size={16} />
            <span className="text-[9px] font-bold">💬 Chat</span>
          </button>

          {/* 2. Direct Watch Party Tab */}
          <button 
            onClick={() => {
              const chan = activeGuild.channels.find(c => c.id === 'ol-watch-party');
              if (chan) setActiveChannel(chan);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 text-center shrink-0 ${
              isWatchPartyChannel ? 'text-pink-500' : 'text-slate-400'
            }`}
          >
            <Tv size={16} />
            <span className="text-[9px] font-bold">📺 Direct</span>
          </button>

          {/* 3. Quiz Tab */}
          <button 
            onClick={() => {
              const chan = activeGuild.channels.find(c => c.id === 'ol-quiz');
              if (chan) setActiveChannel(chan);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 text-center shrink-0 ${
              isQuizChannel || isTriviaChannel ? 'text-pink-500' : 'text-slate-400'
            }`}
          >
            <Coins size={16} />
            <span className="text-[9px] font-bold">🧠 Quiz</span>
          </button>

          {/* 4. Roles Manager Tab */}
          <button 
            onClick={() => {
              const chan = activeGuild.channels.find(c => c.id === 'ol-roles');
              if (chan) setActiveChannel(chan);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 text-center shrink-0 ${
              isRolesChannel ? 'text-pink-500' : 'text-slate-400'
            }`}
          >
            <Shield size={16} />
            <span className="text-[9px] font-bold">🛡️ Rôles</span>
          </button>

          {/* 5. Profile Trigger */}
          <button 
            onClick={() => {
              setEditUsername(user.username);
              setEditTitle(user.title);
              setEditAvatar(user.avatar);
              setShowProfileModal(true);
            }}
            className="flex flex-col items-center gap-0.5 py-1 text-center text-slate-400 shrink-0"
          >
            <Settings size={16} />
            <span className="text-[9px] font-bold">⚙️ Profil</span>
          </button>

          {/* 6. Mobile Logout */}
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 py-1 text-center text-rose-400 shrink-0"
          >
            <LogOut size={16} />
            <span className="text-[9px] font-bold">Déconnexion</span>
          </button>
        </div>

      </div>

      {/* 4. ONLINE MEMBERS LIST (Far Right) - Hidden on desktop if inactive or connected voice */}
      {showMembersList && !connectedVoiceChannel && !isWatchPartyChannel && !isRolesChannel && (
        <div className="w-56 bg-slate-900 border-l border-slate-950/60 hidden lg:flex flex-col shrink-0">
          <div className="h-12 border-b border-slate-950/60 px-4 flex items-center justify-between font-bold text-xs text-slate-400 uppercase tracking-widest shrink-0">
            <span>Membres en ligne</span>
          </div>

          {/* Member Search Bar */}
          <div className="px-3 py-2 border-b border-slate-950/40 bg-slate-950/15 shrink-0">
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium"
              id="member-search-input"
            />
          </div>
          
          <div className="p-3 overflow-y-auto flex-1 flex flex-col gap-4">
            {/* Online Bots group */}
            <div>
              <div className="text-[10px] font-black text-slate-500 px-2 py-1 uppercase mb-1">Bots de l'Oracle (4)</div>
              {[
                { id: 'senpai', name: 'Senpai', status: 'online', title: 'AI Anime Expert', avatar: '🔮' },
                { id: 'oracle', name: 'Oracle', status: 'online', title: 'Trivia Master', avatar: '🧠' },
                { id: 'rembot', name: 'RemBot', status: 'online', title: 'Waifu de l\'année', avatar: '🌸' },
                { id: 'system', name: 'System', status: 'online', title: 'Serveur Admin', avatar: '🤖' }
              ].filter(b => !memberSearchQuery || b.name.toLowerCase().includes(memberSearchQuery.toLowerCase())).map(bot => (
                <div 
                  key={bot.name} 
                  onClick={() => setSelectedProfileMember({ id: bot.id, username: bot.name, avatar: bot.avatar, title: bot.title, status: bot.status })}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="relative shrink-0">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-sm overflow-hidden">
                      {renderUserAvatar(bot.avatar, "w-7 h-7")}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-950 bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-indigo-300 truncate flex items-center gap-1">
                      {bot.name} <span className="bg-indigo-950 text-indigo-300 px-1 py-0.5 rounded text-[8px] font-black scale-90">BOT</span>
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">{bot.title}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Presets Otaku group */}
            <div>
              <div className="text-[10px] font-black text-slate-500 px-2 py-1 uppercase mb-1">Membres (4)</div>
              {[
                { id: user.id, name: user.username, status: user.status, title: user.title, avatar: user.avatar, isUser: true, rolesIds: user.userRoles },
                { id: 'naruto', name: 'NarutoBot', status: 'online', title: '7ème Hokage', avatar: '🍥' },
                { id: 'sasuke', name: 'SasukeBot', status: 'dnd', title: 'Uchiwa Survivant', avatar: '👁️' },
                { id: 'goku', name: 'GokuBot', status: 'idle', title: 'Saiyan Blue', avatar: '👊' }
              ].filter(m => !memberSearchQuery || m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())).map(member => (
                <div 
                  key={member.name} 
                  onClick={() => {
                    if (member.isUser) {
                      setEditUsername(user.username);
                      setEditTitle(user.title);
                      setEditAvatar(user.avatar);
                      setShowProfileModal(true);
                    } else {
                      setSelectedProfileMember({ id: member.id, username: member.name, avatar: member.avatar, title: member.title, status: member.status });
                    }
                  }}
                  className="flex flex-col p-2 rounded hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative shrink-0 select-none">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-sm overflow-hidden">
                        {renderUserAvatar(member.avatar, "w-7 h-7")}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-950 ${getStatusColor(member.status)}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1">
                        {member.name}
                        {member.isUser && <span className="bg-slate-850 px-1 text-[8px] rounded text-slate-400 font-bold">Moi</span>}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">{member.title}</div>
                    </div>
                  </div>
                  {/* Small badge pills on bottom in online list */}
                  {member.isUser && member.rolesIds && member.rolesIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 pl-9">
                      {member.rolesIds.slice(0, 2).map(rId => {
                        const r = PRESET_ROLES.find(pr => pr.id === rId);
                        if (!r) return null;
                        return (
                          <span key={rId} className="text-[7px] font-extrabold scale-90 px-1 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                            {r.name.split(' ')[0]}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Global Search Results (Add friends) */}
            {memberSearchQuery.trim() && (
              <div>
                <div className="text-[10px] font-black text-indigo-400 px-2 py-1 uppercase mb-1 border-b border-indigo-950/40">Recherche Otaku globale</div>
                {[
                  { id: 'luffy', username: 'LuffyBot', avatar: '👑', title: 'Roi des Pirates 🏴‍☠️', status: 'online' },
                  { id: 'zoro', username: 'Zoro', avatar: '⚔️', title: 'Chasseur de Tempêtes', status: 'idle' },
                  { id: 'sakura', username: 'SakuraHaruno', avatar: '🌸', title: 'Ninja Médecin', status: 'online' },
                  { id: 'deku', username: 'Deku', avatar: '🥦', title: 'Héros N.1', status: 'online' },
                  { id: 'tanjirou', username: 'Tanjirou', avatar: '🎴', title: 'Pourfendeur de Démons', status: 'online' },
                  { id: 'zenitsu', username: 'Zenitsu', avatar: '⚡', title: 'Pilier de la Foudre', status: 'idle' },
                  { id: 'gojo', username: 'GojoSatoru', avatar: '🕶️', title: 'L\'infini sans limite 🌌', status: 'online' }
                ].filter(u => 
                  u.username.toLowerCase().includes(memberSearchQuery.toLowerCase()) && 
                  u.username !== user.username
                ).map(searchUser => (
                  <div 
                    key={searchUser.id}
                    onClick={() => setSelectedProfileMember({ id: searchUser.id, username: searchUser.username, avatar: searchUser.avatar, title: searchUser.title, status: searchUser.status })}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-800"
                  >
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-full bg-slate-950 flex items-center justify-center text-sm overflow-hidden">
                        {renderUserAvatar(searchUser.avatar, "w-7 h-7")}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-950 ${getStatusColor(searchUser.status)}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-300 truncate">{searchUser.username}</div>
                      <div className="text-[9px] text-slate-500 truncate">{searchUser.title}</div>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-bold hover:bg-indigo-600 hover:text-white transition-all">Ajouter</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. USER PROFILE SETTINGS MODAL */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-sans font-black text-lg text-white flex items-center gap-2">
                  <Settings size={20} className="text-pink-500" /> MODIFIER TON PROFIL OTAKU
                </h3>
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                
                {/* Username Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Pseudo Otaku</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-pink-500 text-sm"
                    placeholder="Ex: GokuFan99, DemonSlayerMaster..."
                  />
                </div>

                {/* Dynamic Title / Rank Badge */}
                <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950 border border-slate-850 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-pink-500/10 transition-all duration-300" />
                  <label className="text-xs font-black uppercase text-pink-400 tracking-wider flex items-center gap-1">
                    <Award size={13} className="text-pink-400" /> Titre & Rang Actuel
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono bg-pink-950/40 border border-pink-500/20 px-2.5 py-1 rounded-lg">
                      {user.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5">
                    Votre titre et rang s'adaptent automatiquement selon votre activité sur OtakuCord : messages envoyés, cartes collectionnées et salons vocaux !
                  </p>
                </div>

                {/* Status selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Statut de Connexion</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'online', label: 'En ligne', color: 'bg-emerald-500' },
                      { val: 'idle', label: 'Inactif', color: 'bg-amber-500' },
                      { val: 'dnd', label: 'Ne Pas Déranger', color: 'bg-rose-500' }
                    ].map(st => (
                      <button
                        key={st.val}
                        type="button"
                        onClick={() => setUser(prev => ({ ...prev, status: st.val as any }))}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 justify-center ${
                          user.status === st.val
                            ? 'bg-pink-950/30 border-pink-500/30 text-pink-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${st.color}`} />
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Language for automatic translation translation translation */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <Globe size={13} className="text-indigo-400" /> Langue Préférée de Traduction
                  </label>
                  <select
                    value={user.language || 'fr'}
                    onChange={e => {
                      const newLang = e.target.value as any;
                      setUser(prev => ({ ...prev, language: newLang }));
                    }}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-pink-500 text-sm"
                  >
                    <option value="fr">Français 🇫🇷</option>
                    <option value="en">English (US/UK) 🇬🇧</option>
                    <option value="ja">日本語 (Japanese) 🇯🇵</option>
                    <option value="es">Español 🇪🇸</option>
                    <option value="pt">Português 🇵🇹</option>
                    <option value="de">Deutsch 🇩🇪</option>
                    <option value="it">Italiano 🇮🇹</option>
                    <option value="zh">中文 (Chinese) 🇨🇳</option>
                    <option value="ko">한국어 (Korean) 🇰🇷</option>
                    <option value="ar">العربية (Arabic) 🇸🇦</option>
                    <option value="ru">Русский (Russian) 🇷🇺</option>
                    <option value="hi">हिन्दी (Hindi) 🇮🇳</option>
                    <option value="tr">Türkçe (Turkish) 🇹🇷</option>
                    <option value="nl">Nederlands 🇳🇱</option>
                    <option value="pl">Polski 🇵🇱</option>
                  </select>
                  <p className="text-[10px] text-slate-500">
                    Les messages écrits en français ou d'autres langues par d'autres utilisateurs se traduiront dans ta langue préférée quand tu cliques sur "Traduire".
                  </p>
                </div>

                {/* Firestore Connection & Rules Status Helper Card */}
                {isFirebaseEnabled && (
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 font-mono">
                        <Database size={12} className="text-pink-500" /> base firestore
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        firebaseActive 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-950/40 text-rose-400 border border-rose-500/20'
                      }`}>
                        {firebaseActive ? 'Connectée ⚡' : 'Mode Hors-ligne 💾'}
                      </span>
                    </div>

                    {!firebaseActive && firebaseError && (
                      <div className="mt-1 bg-rose-950/25 border border-rose-500/10 rounded-lg p-2.5 text-xs">
                        <p className="font-bold text-rose-400 flex items-center gap-1">⚠️ Erreur de permissions détectée :</p>
                        <p className="text-slate-300 font-mono text-[10px] mt-1 break-words bg-slate-950/80 p-2 rounded border border-slate-850 select-all overflow-x-auto">
                          {firebaseError}
                        </p>
                        
                        <div className="mt-3.5 text-slate-400 space-y-1.5">
                          <p className="font-bold text-white flex items-center gap-1">🔑 Résolution rapide :</p>
                          <p className="leading-relaxed">
                            Votre base de données Firestore rejette les requêtes d'écriture à cause de règles de sécurité restrictives. 
                            Copiez-collez la règle suivante dans l'onglet <strong>Console Firebase &gt; Firestore &gt; Rules (Règles)</strong> :
                          </p>
                          
                          <pre className="mt-2 p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-pink-400 font-mono overflow-x-auto select-all cursor-pointer font-bold leading-normal" title="Cliquer pour tout sélectionner">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{id} {
      allow read, write: if true;
    }
  }
}`}
                          </pre>
                        </div>
                      </div>
                    )}

                    {firebaseActive && (
                      <p className="text-[10px] text-slate-500">
                        La synchronisation en temps réel est active. Tous tes messages sont enregistrés de façon persistante dans ta base Firestore.
                      </p>
                    )}
                  </div>
                )}

                {/* Photo de profil Upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Photo de Profil (Permanente)</label>
                  <div className="flex items-center gap-4 bg-slate-950 p-3.5 border border-slate-800 rounded-xl">
                    <div className="w-14 h-14 rounded-full border border-slate-700 overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center relative shadow-inner">
                      {editAvatar && (editAvatar.toLowerCase().startsWith('http') || editAvatar.startsWith('data:') || editAvatar.length > 4) ? (
                        <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-2xl select-none">{editAvatar || '👤'}</span>
                      )}
                      {avatarUploadLoading && (
                        <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                          <div className="w-4 h-4 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <input
                        type="file"
                        ref={editAvatarInputRef}
                        onChange={handleEditAvatarFileSelect}
                        accept="image/*"
                        className="hidden"
                        disabled={avatarUploadLoading}
                      />
                      <button
                        type="button"
                        disabled={avatarUploadLoading}
                        onClick={() => editAvatarInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow"
                      >
                        <Camera size={12} />
                        <span>{avatarUploadLoading ? "Importation..." : "Importer une photo"}</span>
                      </button>
                      <p className="text-[10px] text-slate-500 mt-1.5 font-medium leading-normal">
                        La photo ne s'autodétruit pas et s'enregistre de manière permanente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 transition-colors rounded-xl font-bold text-sm text-slate-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-pink-600 hover:bg-pink-500 hover:shadow-lg hover:shadow-pink-500/20 transition-all rounded-xl font-bold text-sm text-white"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. CREATE CHANNEL MODAL */}
      <AnimatePresence>
        {showCreateChannelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setShowCreateChannelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-sans font-black text-lg text-white flex items-center gap-2">
                  <Hash size={20} className="text-indigo-400" /> CRÉER UN NOUVEAU SALON
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Nom du salon</label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="ex: fanarts-manga"
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Description</label>
                  <input
                    type="text"
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                    placeholder="Décrivez brièvement l'utilité du salon..."
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Règles Spécifiques du Salon (Groupe)</label>
                  <textarea
                    rows={3}
                    value={newChannelRules}
                    onChange={(e) => setNewChannelRules(e.target.value)}
                    placeholder="Définissez les règles que les membres devront accepter..."
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Catégorie</label>
                  <select
                    value={newChannelCategory}
                    onChange={(e) => setNewChannelCategory(e.target.value as any)}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none text-sm"
                  >
                    <option value="DISCUSSIONS">DISCUSSIONS 💬</option>
                    <option value="OTAKU FUN">OTAKU FUN 🎮</option>
                    <option value="ACTIVITÉS">ACTIVITÉS ⚔️</option>
                    <option value="GÉNÉRAL">GÉNÉRAL 🌐</option>
                    <option value="RECOMMANDATIONS">RECOMMANDATIONS 📚</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Type de salon</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'text', label: 'Salon Textuel', icon: <Hash size={14} /> },
                      { val: 'voice', label: 'Salon Vocal', icon: <Volume2 size={14} /> }
                    ].map(type => (
                      <button
                        key={type.val}
                        type="button"
                        onClick={() => setNewChannelType(type.val as any)}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 justify-center ${
                          newChannelType === type.val
                            ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {type.icon}
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowCreateChannelModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 transition-colors rounded-xl font-bold text-xs text-slate-300"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (!newChannelName.trim()) {
                      alert("Veuillez saisir un nom pour le salon.");
                      return;
                    }
                    const newChan: Channel = {
                      id: `chan-${Date.now()}`,
                      name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
                      description: newChannelDesc || "Aucune description fournie.",
                      category: newChannelCategory,
                      type: newChannelType,
                      rules: newChannelRules || "Pas de règles spécifiques.",
                      creatorId: user.id
                    };
                    handleAddChannel(newChan);
                    setShowCreateChannelModal(false);
                  }}
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 transition-all rounded-xl font-bold text-xs text-white"
                >
                  Créer le salon
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. SHOW & EDIT CHANNEL RULES MODAL */}
      <AnimatePresence>
        {showRulesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setShowRulesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-sans font-black text-base text-white flex items-center gap-2">
                  <Shield size={18} className="text-teal-400 animate-pulse" /> RÈGLES DE #{activeChannel.name}
                </h3>
                {activeChannel.creatorId === user.id && (
                  <span className="text-[9px] font-extrabold uppercase bg-teal-950 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-md">PROPRIÉTAIRE</span>
                )}
              </div>

              {activeChannel.creatorId === user.id ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] text-slate-400 leading-normal">
                    En tant que créateur de ce groupe/salon, vous avez le droit de modifier les règles du salon à tout moment. Elles seront visibles pour tous les membres en haut de l'écran.
                  </p>
                  <textarea
                    rows={6}
                    value={editedRulesText}
                    onChange={(e) => setEditedRulesText(e.target.value)}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500 text-xs font-mono leading-relaxed"
                  />
                  <button
                    onClick={() => {
                      handleUpdateChannelRules(activeChannel.id, editedRulesText);
                      setShowRulesModal(false);
                    }}
                    className="py-2 bg-teal-600 hover:bg-teal-500 transition-colors rounded-xl font-bold text-xs text-white"
                  >
                    Enregistrer les règles
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                    {activeChannel.rules || "Aucune règle spécifique n'a été rédigée pour ce salon."}
                  </div>
                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex gap-2.5">
                    <span className="text-lg">🛡️</span>
                    <p className="text-[10px] text-indigo-300 leading-normal">
                      En participant à ce salon, vous vous engagez à respecter ces consignes locales de modération. Tout abus sera signalé aux administrateurs d'OtakuCord.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRulesModal(false)}
                    className="py-2.5 bg-slate-800 hover:bg-slate-750 transition-colors rounded-xl font-bold text-xs text-slate-200"
                  >
                    Fermer et Accepter
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. DETAILED PROFILE / DIRECT MESSAGE & FRIENDS MODAL */}
      <AnimatePresence>
        {selectedProfileMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setSelectedProfileMember(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-lg w-full bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col md:flex-row max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Column: Card Profile Avatar / Info */}
              <div className="w-full md:w-52 bg-slate-950 p-5 flex flex-col items-center gap-4 border-b md:border-b-0 md:border-r border-slate-850 shrink-0">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-4xl border-2 border-slate-800 shadow-xl overflow-hidden">
                    {renderUserAvatar(selectedProfileMember.avatar, "w-20 h-20")}
                  </div>
                  <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-slate-950 ${getStatusColor(selectedProfileMember.status)}`} />
                </div>

                <div className="text-center min-w-0 w-full">
                  <h4 className="font-bold text-base text-white truncate">{selectedProfileMember.username}</h4>
                  <p className="text-[10px] text-pink-400 font-bold tracking-wide uppercase mt-1">{selectedProfileMember.title || 'Otaku'}</p>
                </div>

                {/* Friend Status Banner */}
                <div className="w-full">
                  {friends.includes(selectedProfileMember.id) ? (
                    <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-xl py-1.5 text-center text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                      <span>✓ Ami connecté</span>
                    </div>
                  ) : friendRequests.some(r => r.id === selectedProfileMember.id && r.type === 'sent') ? (
                    <div className="bg-amber-950/40 border border-amber-500/20 text-amber-400 rounded-xl py-1.5 text-center text-[10px] font-black uppercase tracking-wider">
                      Demande en attente
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        // Send Friend request
                        if (!friendRequests.some(r => r.id === selectedProfileMember!.id)) {
                          setFriendRequests(prev => [...prev, { id: selectedProfileMember!.id, username: selectedProfileMember!.username, avatar: selectedProfileMember!.avatar, type: 'sent' }]);
                          alert(`🌸 Demande d'ami envoyée avec succès à ${selectedProfileMember!.username} !`);
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white transition-all text-[11px] font-bold uppercase tracking-wider"
                    >
                      Ajouter en ami
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Dynamic Private Messages Panel */}
              <div className="flex-1 p-5 flex flex-col justify-between min-w-0 max-h-[500px]">
                <div>
                  <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-indigo-400" /> Discussion Privée (PV)
                    </h5>
                    <button onClick={() => setSelectedProfileMember(null)} className="text-slate-500 hover:text-white text-xs">Fermer</button>
                  </div>

                  {/* PV Scroll panel messages */}
                  <div className="my-3 space-y-2 max-h-[220px] overflow-y-auto p-1.5 bg-slate-950/40 rounded-xl border border-slate-850/60 flex flex-col">
                    {/* Filter local state messages for this specific user */}
                    {privateMessages[selectedProfileMember.id] && privateMessages[selectedProfileMember.id].length > 0 ? (
                      privateMessages[selectedProfileMember.id].map((m, i) => {
                        const isMe = m.senderId === user.id;
                        return (
                          <div key={i} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                            <div className={`p-2.5 rounded-2xl text-xs font-medium leading-relaxed ${
                              isMe ? 'bg-indigo-650 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'
                            }`}>
                              {m.content}
                            </div>
                            <span className="text-[8px] text-slate-500 font-mono mt-0.5">{m.timestamp}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                        <span className="text-2xl opacity-60">✉️</span>
                        <p className="text-[11px] text-slate-500 leading-normal max-w-xs">
                          Aucun message privé. Écris un premier message ci-dessous et une demande d'ami lui sera envoyée simultanément !
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* PV Message Input Box */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!pvMessageInput.trim()) return;

                    const msgText = pvMessageInput;
                    setPvMessageInput('');

                    const isMe = user.id;
                    const recipientId = selectedProfileMember.id;
                    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    // Write message to state
                    const newPvMsg = {
                      senderId: isMe,
                      recipientId: recipientId,
                      content: msgText,
                      timestamp: timestampStr
                    };

                    setPrivateMessages(prev => ({
                      ...prev,
                      [recipientId]: [...(prev[recipientId] || []), newPvMsg]
                    }));

                    // Automatically trigger friend request if not already friends
                    if (!friends.includes(recipientId) && !friendRequests.some(r => r.id === recipientId)) {
                      setFriendRequests(prev => [...prev, { id: recipientId, username: selectedProfileMember!.username, avatar: selectedProfileMember!.avatar, type: 'sent' }]);
                    }

                    // Preset replies for bots
                    const PRESET_MESSAGES_FOR_BOTS: Record<string, string[]> = {
                      'NarutoBot': [
                        "Dattebayo! Je ne reviens jamais sur ma parole, c'est ça mon nindo ! 🍥",
                        "Si tu crois que je vais abandonner, tu te trompes de ninja ! 💪",
                        "Je serai le plus grand Hokage de tous les temps, regarde-moi bien ! 🍃"
                      ],
                      'SasukeBot': [
                        "Hmph... Pourquoi m'écris-tu en privé ? Je n'ai pas de temps à perdre. 👁️",
                        "La vengeance est un chemin solitaire, mais ton message est parvenu jusqu'à moi.",
                        "Tu es persistant... Très bien, je consens à être ton ami. Ne me ralentis pas."
                      ],
                      'GokuBot': [
                        "Salut ! C'est moi, Goku ! Tu as l'air fort, on s'entraîne ensemble ? 👊",
                        "J'adore le combat, mais j'adore aussi me faire de nouveaux amis !",
                        "Wow, ton énergie est incroyable ! Mangeons un énorme bol de ramen !"
                      ],
                      'LuffyBot': [
                        "Sugoiii ! Tu veux faire partie de mon équipage ? Devenons amis ! 👑🏴‍☠️",
                        "Je vais devenir le Roi des Pirates ! Viens faire la fête avec moi ! 🍖",
                        "La viande, c'est la vie ! Partageons un morceau !"
                      ],
                      'Zoro': [
                        "Où suis-je encore perdu... ? Oh, salut à toi. Tu as vu mon sabre ? ⚔️",
                        "Je serai le plus grand bretteur du monde. Pas le temps de flâner."
                      ],
                      'GojoSatoru': [
                        "Ne t'inquiète pas, je suis le plus fort ! 😉🌌",
                        "L'infini nous sépare, mais ton message est passé à travers. Impressionnant !"
                      ]
                    };

                    // Simulated dynamic bots responses to make the chat interaction alive
                    const botReplyOptions = PRESET_MESSAGES_FOR_BOTS[selectedProfileMember.username];
                    if (botReplyOptions) {
                      setTimeout(() => {
                        const randomReply = botReplyOptions[Math.floor(Math.random() * botReplyOptions.length)];
                        const botPvMsg = {
                          senderId: recipientId,
                          recipientId: isMe,
                          content: randomReply,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        setPrivateMessages(prev => ({
                          ...prev,
                          [recipientId]: [...(prev[recipientId] || []), botPvMsg]
                        }));

                        // Auto accept friend request and join friends!
                        if (!friends.includes(recipientId)) {
                          setFriends(prev => [...prev, recipientId]);
                          // Notify
                          alert(`✨ ${selectedProfileMember!.username} a accepté votre demande d'ami ! Vous pouvez désormais chatter en illimité.`);
                        }
                      }, 1500);
                    }
                  }} 
                  className="flex gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 shadow-md"
                >
                  <input
                    type="text"
                    placeholder="Écrire un message en PV..."
                    value={pvMessageInput}
                    onChange={(e) => setPvMessageInput(e.target.value)}
                    className="flex-1 bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none min-w-0"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 rounded-lg text-white font-bold text-xs"
                  >
                    Envoyer
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
