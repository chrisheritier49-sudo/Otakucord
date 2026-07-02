import React, { useState, useEffect, useRef } from 'react';
import { User, WatchPartyEvent, Message } from '../types';
import { 
  Calendar, Clock, Play, Users, MessageSquare, Send, Globe, Plus, 
  Tv, Volume2, Sparkles, Bell, Check, Heart, Smile, Flame, Award, Trash2, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS, LANGUAGES, LanguageCode } from '../utils/translations';

const renderAvatar = (avatarStr: string) => {
  const isUrl = avatarStr && (avatarStr.toLowerCase().startsWith('http') || avatarStr.startsWith('data:') || avatarStr.length > 4);
  if (isUrl) {
    return <img src={avatarStr} alt="Avatar" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />;
  }
  return <span className="select-none">{avatarStr || '👤'}</span>;
};

interface WatchPartySectionProps {
  user: User;
  onUpdateUser: React.Dispatch<React.SetStateAction<User>>;
  onAddSystemMessage: (content: string) => void;
}

interface SyncedComment {
  timeOffset: number; // seconds into stream
  author: {
    username: string;
    avatar: string;
    title: string;
    botStyle?: string;
  };
  contentFr: string;
  contentEn: string;
  contentJa: string;
  contentEs: string;
}

// Predefined immersive synced comments in multiple languages
const SYNCED_COMMENTS: SyncedComment[] = [
  {
    timeOffset: 2,
    author: { username: 'RemBot', avatar: '🌸', title: 'Waifu de l\'année', botStyle: 'text-pink-400 bg-pink-950/40 border border-pink-500/20 px-1 py-0.5 rounded text-[9px]' },
    contentFr: "C'est parti ! L'animation de l'intro est absolument magnifique !",
    contentEn: "Here we go! The animation of the intro is absolutely gorgeous!",
    contentJa: "始まりました！イントロのアニメーションが本当に美しい！",
    contentEs: "¡Aquí vamos! ¡La animación de la intro es absolutamente preciosa!"
  },
  {
    timeOffset: 8,
    author: { username: 'NarutoBot', avatar: '🍥', title: '7ème Hokage', botStyle: 'text-orange-400 bg-orange-950/40 border border-orange-500/20 px-1 py-0.5 rounded text-[9px]' },
    contentFr: "Oh mon dieu ! Le Studio ufotable a encore augmenté le budget ! Regardez ces effets de lumière ! 🔥✨",
    contentEn: "Oh my god! Studio ufotable increased the budget again! Look at those lighting effects! 🔥✨",
    contentJa: "すげえ！ufotableスタジオがまた予算を増やしたぞ！この光のエフェクトを見てくれ！🔥✨",
    contentEs: "¡Dios mío! ¡El estudio ufotable volvió a subir el presupuesto! ¡Miren esos efectos de luz! 🔥✨"
  },
  {
    timeOffset: 15,
    author: { username: 'SasukeBot', avatar: '👁️', title: 'Uchiwa Survivant', botStyle: 'text-zinc-400 bg-zinc-900 border border-zinc-750 px-1 py-0.5 rounded text-[9px]' },
    contentFr: "La musique de fond donne des frissons... Yuki Kajiura est un génie.",
    contentEn: "The background music gives goosebumps... Yuki Kajiura is a genius.",
    contentJa: "BGMが鳥肌ものだな… 梶浦由記は天才だ。",
    contentEs: "La música de fondo pone los pelos de punta... Yuki Kajiura es un genio."
  },
  {
    timeOffset: 22,
    author: { username: 'GokuBot', avatar: '👊', title: 'Super Saiyan Blue', botStyle: 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-1 py-0.5 rounded text-[9px]' },
    contentFr: "INCROYABLE ! Le combat va commencer ! Il est temps de montrer sa vraie puissance ! 💪⚡",
    contentEn: "INCREDIBLE! The fight is about to start! Time to show true power! 💪⚡",
    contentJa: "ワクワクすっぞ！戦闘が始まるぞ！本当の力を見せてくれ！💪⚡",
    contentEs: "¡INCREÍBLE! ¡La pelea está por comenzar! ¡Es hora de mostrar el verdadero poder! 💪⚡"
  },
  {
    timeOffset: 32,
    author: { username: 'Senpai', avatar: '🔮', title: 'AI Anime Expert', botStyle: 'text-purple-400 bg-purple-950/40 border border-purple-500/20 px-1 py-0.5 rounded text-[9px]' },
    contentFr: "Le découpage des plans rappelle beaucoup le chapitre 187 du manga original. Une adaptation très fidèle !",
    contentEn: "The scene composition is highly reminiscent of chapter 187 in the original manga. Extremely faithful adaptation!",
    contentJa: "コマ割りが原作マンガの第187話にとてもよく似ています。非常に忠実なアニメ化です！",
    contentEs: "La composición de la escena recuerda mucho al capítulo 187 del manga original. ¡Una adaptación muy fiel!"
  },
  {
    timeOffset: 45,
    author: { username: 'RemBot', avatar: '🌸', title: 'Waifu de l\'année', botStyle: 'text-pink-400 bg-pink-950/40 border border-pink-500/20 px-1 py-0.5 rounded text-[9px]' },
    contentFr: "Cette scène d'émotion me met les larmes aux yeux à chaque fois... 😭💔",
    contentEn: "This emotional scene brings tears to my eyes every single time... 😭💔",
    contentJa: "この感動的なシーンは毎回涙が出ちゃいます… 😭💔",
    contentEs: "Esta escena emocional me hace llorar cada vez... 😭💔"
  },
  {
    timeOffset: 55,
    author: { username: 'NarutoBot', avatar: '🍥', title: '7ème Hokage', botStyle: 'text-orange-400 bg-orange-950/40 border border-orange-500/20 px-1 py-0.5 rounded text-[9px]' },
    contentFr: "NE PERDS PAS ESPOIR ! Tu es le héros ! Ne lâche rien ! 👊🍜",
    contentEn: "DON'T LOSE HOPE! You are the hero! Never give up! 👊🍜",
    contentJa: "諦めるな！お前が主役だ！まっすぐ自分の言葉は曲げねえ！👊🍜",
    contentEs: "¡NO PIERDAS LA ESPERANZA! ¡Tú eres el héroe! ¡No te rindas! 👊🍜"
  }
];

// Synced Subtitles for the mock video player
const SYNCED_SUBTITLES = [
  { start: 0, end: 4, text: "[Narrateur] Épisode Spécial - La Forteresse Infinie s'éveille." },
  { start: 4, end: 10, text: "Tanjiro: L'odeur des démons est partout ici... Restez sur vos gardes !" },
  { start: 10, end: 16, text: "Zenitsu: AH ! C'est trop effrayant ! On va tous mourir, j'en suis sûr !" },
  { start: 16, end: 21, text: "Inosuke: HAHAHA ! Laissez passer le Roi de la Montagne ! À l'attaque !" },
  { start: 21, end: 28, text: "Muzan: Pathétiques humains... Vous osez pénétrer dans mon domaine ?" },
  { start: 28, end: 35, text: "Tanjiro: Muzan ! Quoi qu'il en coûte, je vais te vaincre aujourd'hui !" },
  { start: 35, end: 44, text: "Muzan: Ta détermination n'est qu'un grain de poussière face à l'éternité." },
  { start: 44, end: 50, text: "Nezuko: (Bruit de grognement étouffé) Mmmh ! Mmh !" },
  { start: 50, end: 60, text: "Tanjiro: SOUFFLE DE L'EAU - DIXIÈME MOUVEMENT : LE DRAGON DE FLUIDE !" }
];

export default function WatchPartySection({ user, onUpdateUser, onAddSystemMessage }: WatchPartySectionProps) {
  // --- Persistent Event State ---
  const [events, setEvents] = useState<WatchPartyEvent[]>(() => {
    const saved = localStorage.getItem('otakucord_watch_parties');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'ev-1',
        animeTitle: 'Demon Slayer - Forteresse Infinie',
        episodeNumber: 1,
        scheduledTime: 'En Direct - Maintenant ! 🔴',
        host: 'RemBot',
        participants: ['GokuFan99', 'NarutoBot', 'SasukeBot'],
        isLive: true,
        genre: 'Shōnen',
        coverImage: '⚡'
      },
      {
        id: 'ev-2',
        animeTitle: 'Jujutsu Kaisen - Le Drame de Shibuya',
        episodeNumber: 12,
        scheduledTime: 'Demain à 18:30',
        host: 'Oracle',
        participants: ['GokuFan99', 'GokuBot'],
        isLive: false,
        genre: 'Seinen',
        coverImage: '👁️'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('otakucord_watch_parties', JSON.stringify(events));
  }, [events]);

  // --- Translation State ---
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>((user.language as LanguageCode) || 'fr');

  const handleLanguageChange = (lang: LanguageCode) => {
    setActiveLanguage(lang);
    onUpdateUser(prev => ({ ...prev, language: lang }));
  };

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.fr;

  // --- Live Stream States ---
  const [liveEvent, setLiveEvent] = useState<WatchPartyEvent | null>(null);
  const [streamProgress, setStreamProgress] = useState(0); // in seconds
  const [isPlaying, setIsPlaying] = useState(true);
  const [liveChat, setLiveChat] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Share & Auto-delete rules
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  // Floating reactions container
  const [reactions, setReactions] = useState<{ id: string; emoji: string; left: number }[]>([]);

  // Simulation of other users' screens translating in real-time
  const [otherUsersTranslation, setOtherUsersTranslation] = useState<{
    original: string;
    english: string;
    japanese: string;
    spanish: string;
  } | null>(null);

  // --- Event Planning Modal States ---
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEpisode, setNewEpisode] = useState(1);
  const [newTime, setNewTime] = useState('');
  const [newGenre, setNewGenre] = useState('Shōnen');
  const [newCover, setNewCover] = useState('🍿');
  const [newVideoUrl, setNewVideoUrl] = useState<string | undefined>(undefined);

  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of Watch Party chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveChat]);

  // --- Live Stream Simulation ---
  useEffect(() => {
    if (liveEvent && isPlaying) {
      streamTimerRef.current = setInterval(() => {
        setStreamProgress(prev => {
          if (prev >= 60) {
            if (liveEvent.host === user.username) {
              setIsPlaying(false);
              setShowSharePrompt(true);
              return 60;
            }
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    }

    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, [liveEvent, isPlaying, user.username]);

  // Sync Live Chat comments with progress
  useEffect(() => {
    if (streamProgress === 0) {
      setLiveChat([]);
      return;
    }

    const matchingComment = SYNCED_COMMENTS.find(c => c.timeOffset === streamProgress);
    if (matchingComment) {
      let content = matchingComment.contentFr;
      if (activeLanguage === 'en') content = matchingComment.contentEn;
      if (activeLanguage === 'ja') content = matchingComment.contentJa;
      if (activeLanguage === 'es') content = matchingComment.contentEs;

      const newMsg: Message = {
        id: `sync-msg-${streamProgress}-${matchingComment.author.username}`,
        channelId: 'watch-party-live',
        guildId: 'otaku-lounge',
        author: matchingComment.author,
        content: content,
        timestamp: 'À l\'instant',
        translatedContent: {
          'fr': matchingComment.contentFr,
          'en': matchingComment.contentEn,
          'ja': matchingComment.contentJa,
          'es': matchingComment.contentEs
        }
      };

      setLiveChat(old => {
        if (old.some(m => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });
    }
  }, [streamProgress, activeLanguage]);

  // Handle Event Notification Register
  const handleToggleNotify = (eventId: string) => {
    // Play sound effect with Web Audio API for maximum craft
    playNotificationSound();

    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const isRegistered = ev.participants.includes(user.username);
        let updatedParticipants;
        if (isRegistered) {
          updatedParticipants = ev.participants.filter(p => p !== user.username);
          onAddSystemMessage(`🔔 Tu t'es désinscrit des notifications de visionnage pour "${ev.animeTitle}".`);
        } else {
          updatedParticipants = [...ev.participants, user.username];
          onAddSystemMessage(`🔔 Super ! Tu recevras une alerte dès que "${ev.animeTitle}" passera en direct ! 🍿`);
          // Fast simulated bot reaction
          setTimeout(() => {
            onAddSystemMessage(`💬 RemBot: "Trop cool que tu viennes avec nous @${user.username} !"`);
          }, 1000);
        }
        return { ...ev, participants: updatedParticipants };
      }
      return ev;
    }));
  };

  // Play crisp notification sound
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // AudioContext blocked or unsupported
    }
  };

  // Start a Watch Party Event
  const handleLaunchEvent = (event: WatchPartyEvent) => {
    setLiveEvent(event);
    setStreamProgress(0);
    setLiveChat([
      {
        id: 'start-sys',
        channelId: 'watch-party-live',
        guildId: 'otaku-lounge',
        author: { username: 'System', avatar: '🤖', title: 'Stream Server' },
        content: `🔴 ${t.watchPartyStarted} "${event.animeTitle}" (${event.host}) ! 🥤`,
        timestamp: 'À l\'instant'
      }
    ]);
  };

  // Submit dynamic user comment in live Watch Party
  const handleSendLiveComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const currentText = chatInput;
    setChatInput('');

    // Add user message to live chat
    const userMsg: Message = {
      id: `live-user-${Date.now()}`,
      channelId: 'watch-party-live',
      guildId: 'otaku-lounge',
      author: {
        username: user.username,
        avatar: user.avatar,
        title: user.title
      },
      content: currentText,
      timestamp: 'En direct'
    };

    setLiveChat(old => [...old, userMsg]);
    setIsTranslating(true);

    // Call translation endpoint to show automatic translations to "other mock users" on the server!
    try {
      // Simulated translation setup to prevent stalling, then execute actual Gemini translation in background
      setOtherUsersTranslation({
        original: currentText,
        english: '🌐 Senpai is translating to English...',
        japanese: '🌐 翻訳中...',
        spanish: '🌐 Traduciendo...'
      });

      // Call Express Gemini translation APIs for the French user's content!
      const [resEn, resJa, resEs] = await Promise.all([
        fetch('/api/gemini/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: currentText, targetLanguage: 'en' })
        }),
        fetch('/api/gemini/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: currentText, targetLanguage: 'ja' })
        }),
        fetch('/api/gemini/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: currentText, targetLanguage: 'es' })
        })
      ]);

      const dataEn = resEn.ok ? await resEn.json() : { translated: currentText };
      const dataJa = resJa.ok ? await resJa.json() : { translated: currentText };
      const dataEs = resEs.ok ? await resEs.json() : { translated: currentText };

      setOtherUsersTranslation({
        original: currentText,
        english: dataEn.translated,
        japanese: dataJa.translated,
        spanish: dataEs.translated
      });

      // Update message translations
      setLiveChat(old => old.map(m => {
        if (m.id === userMsg.id) {
          return {
            ...m,
            translatedContent: {
              'fr': currentText,
              'en': dataEn.translated,
              'ja': dataJa.translated,
              'es': dataEs.translated
            }
          };
        }
        return m;
      }));

    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Flying reactions triggers
  const triggerReaction = (emoji: string) => {
    const id = `react-${Date.now()}-${Math.random()}`;
    const left = 15 + Math.random() * 70; // percent position across player
    setReactions(prev => [...prev, { id, emoji, left }]);

    // Remove reaction after animate ends
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  // Submit plan watch party
  const handleSavePlanEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTime.trim()) return;

    const newEv: WatchPartyEvent = {
      id: `ev-${Date.now()}`,
      animeTitle: newTitle,
      episodeNumber: newEpisode,
      scheduledTime: newTime,
      host: user.username,
      participants: [user.username],
      isLive: false,
      genre: newGenre,
      coverImage: newCover,
      videoUrl: newVideoUrl
    };

    setEvents(prev => [...prev, newEv]);
    setShowPlanModal(false);
    setNewTitle('');
    setNewTime('');
    setNewVideoUrl(undefined);

    onAddSystemMessage(`📅 ${t.scheduledEvents} : "${newEv.animeTitle}" Ep. ${newEv.episodeNumber} !`);
  };

  // Share stream to keep it
  const handleShareStream = () => {
    if (!liveEvent) return;
    setShowSharePrompt(false);
    onAddSystemMessage(`✨ ${t.streamShared} : "${liveEvent.animeTitle}"`);
    setLiveEvent(null);
  };

  // Delete stream automatically if not shared
  const handleDeleteStream = () => {
    if (!liveEvent) return;
    setEvents(prev => prev.filter(ev => ev.id !== liveEvent.id));
    setShowSharePrompt(false);
    onAddSystemMessage(t.streamStoppedDeleted);
    setLiveEvent(null);
  };

  // Cancel / Delete Watch Party
  const handleDeleteEvent = (id: string, title: string) => {
    setEvents(prev => prev.filter(ev => ev.id !== id));
    onAddSystemMessage(`🗑️ Événement de visionnage annulé : "${title}".`);
  };

  // Determine active subtitles
  const currentSubtitle = SYNCED_SUBTITLES.find(sub => streamProgress >= sub.start && streamProgress < sub.end);

  const getLanguageLabel = (code: string) => {
    const found = LANGUAGES.find(lang => lang.code === code);
    return found ? `${found.label} ${found.flag}` : code;
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden h-full">
      
      {/* 1. NOTIFICATION PANEL / HEADER BAR */}
      <div className="h-14 bg-slate-900 border-b border-slate-900 px-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-2.5">
          <Tv className="text-pink-500" size={20} />
          <span className="font-sans font-black text-sm text-white tracking-wider uppercase">{t.watchParties}</span>
        </div>

        {/* Global Language translation bar */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400 font-bold hidden sm:flex items-center gap-1">
            <Globe size={13} className="text-indigo-400" /> {t.profileSettings} / {t.status} :
          </span>
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <select
              value={activeLanguage}
              onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
              className="bg-slate-900 text-xs font-black text-pink-400 py-1 px-2.5 rounded border border-slate-800 focus:outline-none focus:border-pink-500 transition-colors cursor-pointer"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. LIVE VISIONNAGE ACTIVE STAGE OR SCHEDULED EVENTS */}
      {liveEvent ? (
        /* ================= ACTIVE LIVE STREAM CINEMA PLAYER ================= */
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden bg-slate-950">
          
          {/* THE MOCK VIDEO CANVAS STAGE (Col 8) */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-black relative overflow-hidden group border-b lg:border-b-0 lg:border-r border-slate-900 min-h-[240px] md:min-h-[380px]">
            
            {/* Top Bar with Live Info */}
            <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> DIRECT
                </span>
                <span className="text-white/80 font-bold text-[10px] bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1">
                  <Users size={10} /> {liveEvent.participants.length > 0 ? liveEvent.participants.length * 42 : 42} Spectateurs
                </span>
                <h3 className="text-white font-bold text-sm tracking-wide line-clamp-1">{liveEvent.animeTitle} - Ép. {liveEvent.episodeNumber}</h3>
              </div>
              <button 
                onClick={() => {
                  if (liveEvent.host === user.username) {
                    setShowSharePrompt(true);
                  } else {
                    setLiveEvent(null);
                  }
                }}
                className="bg-slate-900/80 hover:bg-red-600 hover:text-white text-slate-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-800/60 transition-colors"
              >
                {t.quitCinema}
              </button>
            </div>

            {/* Immersive Cinema Canvas Screen */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-black">
              
              {/* Dynamic Animated Scene Generator */}
              <div className="w-full max-w-4xl aspect-video rounded-2xl border border-indigo-500/10 bg-black shadow-2xl relative overflow-hidden flex flex-col justify-between p-4">
                
                {liveEvent.videoUrl ? (
                  <video 
                    src={liveEvent.videoUrl} 
                    className="absolute inset-0 w-full h-full object-contain" 
                    autoPlay 
                    controls
                    loop 
                    muted={isMuted} 
                  />
                ) : (
                  <>
                    {/* Background moving stars/particles */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20" />
                    
                    {/* Animated colored pulse waves matching anime scene */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`w-48 h-48 rounded-full bg-pink-500/5 blur-3xl transition-transform duration-1000 ${streamProgress % 2 === 0 ? 'scale-125' : 'scale-90'}`} />
                      <div className={`absolute w-36 h-36 rounded-full bg-violet-500/5 blur-2xl transition-transform duration-700 ${streamProgress % 3 === 0 ? 'scale-75' : 'scale-110'}`} />
                    </div>

                    {/* Simulated Character Portrait Avatar representing the animated focus on screen */}
                    <div className="flex justify-between items-start z-10">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-pink-400">ufotable Anim. v1.4</span>
                        <span className="text-xs font-mono text-indigo-300">FPS: 60/60</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/60 border border-slate-800 px-2 py-1 rounded-md">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-slate-300 font-black">PLAYING</span>
                      </div>
                    </div>

                    {/* Center Big Anime Visual Mockup */}
                    <div className="flex flex-col items-center justify-center my-auto z-10 gap-2">
                      <div className="text-6xl animate-bounce duration-3000">
                        {streamProgress < 15 ? '⚔️' : streamProgress < 28 ? '👑' : streamProgress < 44 ? '👿' : '🐉'}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-12 bg-indigo-500 rounded animate-[pulse_0.5s_infinite]" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                          {streamProgress < 15 ? t.combatKatana : streamProgress < 28 ? t.muzanAwakening : streamProgress < 44 ? t.tanjiroAnger : t.waterDragon}
                        </span>
                        <div className="h-1 w-12 bg-indigo-500 rounded animate-[pulse_0.5s_infinite]" />
                      </div>
                    </div>

                    {/* Subtitle Display Overlay inside Player */}
                    <div className="w-full text-center z-20 bg-black/70 py-2.5 px-4 rounded-xl border border-slate-800/80 backdrop-blur-sm shadow-xl">
                      <p className="text-sm font-sans font-bold text-yellow-300 tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
                        {currentSubtitle ? currentSubtitle.text : "..."}
                      </p>
                    </div>
                  </>
                )}

                {/* Flying Reactions Container */}
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                  <AnimatePresence>
                    {reactions.map(react => (
                      <motion.div
                        key={react.id}
                        initial={{ opacity: 0, y: 150, scale: 0.5 }}
                        animate={{ opacity: [0, 1, 1, 0], y: -80, scale: [0.5, 1.3, 1, 0.8] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.8, ease: 'easeOut' }}
                        className="absolute text-3xl"
                        style={{ left: `${react.left}%`, bottom: '20px' }}
                      >
                        {react.emoji}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

              </div>
            </div>

            {/* Bottom Stream Player Control Overlay */}
            <div className="p-4 bg-gradient-to-t from-black to-transparent flex flex-col gap-3">
              {/* Progress Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400">00:{streamProgress.toString().padStart(2, '0')}</span>
                <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden relative cursor-pointer">
                  <div className="h-full bg-pink-500" style={{ width: `${(streamProgress / 60) * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-slate-400">01:00</span>
              </div>

              {/* Player Quick Actions */}
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-white transition-colors"
                  >
                    {isPlaying ? <span className="text-xs font-bold px-1.5 py-0.5">Pause ⏸️</span> : <span className="text-xs font-bold px-1.5 py-0.5">Play ▶️</span>}
                  </button>
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-slate-300 transition-colors"
                  >
                    {isMuted ? <Volume2 size={16} className="text-red-400" /> : <Volume2 size={16} />}
                  </button>
                  <span className="text-xs text-slate-400 font-medium">{t.ownerLabel}: <strong className="text-pink-400">{liveEvent.host}</strong></span>
                </div>

                {/* Flying emoji reactions bar */}
                <div className="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Réagir :</span>
                  {['🔥', '❤️', '😂', '😮', '🌸', '👍'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => triggerReaction(emoji)}
                      className="text-lg hover:scale-125 hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* THE SYNCED LIVE CHAT BAR (Col 4) */}
          <div className="lg:col-span-4 flex flex-col bg-slate-900/80 border-t lg:border-t-0 border-slate-950 h-[320px] lg:h-full justify-between">
            
            {/* Live Chat Header */}
            <div className="p-3 border-b border-slate-950/80 bg-slate-900 flex justify-between items-center shrink-0">
              <span className="font-bold text-xs text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare size={13} className="text-pink-500" /> {t.channels} ({liveChat.length})
              </span>
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                <Globe size={11} /> AUTO-TRANSLATE ({getLanguageLabel(activeLanguage)})
              </div>
            </div>

            {/* Live Messages List */}
            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3.5 bg-slate-950/20 max-h-[180px] lg:max-h-none">
              {liveChat.map(msg => {
                // Get content translation based on user's selected language
                let content = msg.content;
                if (msg.translatedContent) {
                  content = msg.translatedContent[activeLanguage] || msg.content;
                }

                return (
                  <div key={msg.id} className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-sm border border-slate-700/40 shrink-0 overflow-hidden">
                      {renderAvatar(msg.author.avatar)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-white truncate max-w-[120px]">{msg.author.username}</span>
                        {msg.author.isBot && (
                          <span className="bg-indigo-950 text-indigo-300 text-[8px] font-black px-1 rounded uppercase">BOT</span>
                        )}
                        {/* Display a little globe badge if the message was simulated translated */}
                        {msg.translatedContent && activeLanguage !== 'fr' && (
                          <span className="text-[8px] text-pink-400 font-bold font-mono px-1 bg-pink-950/20 rounded border border-pink-500/10 flex items-center gap-0.5" title="Traduit automatiquement">
                            <Globe size={8} /> TRADUIT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mt-0.5 break-words select-text">
                        {content}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Automatic Translation feedback panel! */}
            {otherUsersTranslation && (
              <div className="p-2.5 bg-indigo-950/40 border-t border-indigo-500/10 shrink-0">
                <div className="text-[9px] font-black tracking-wider text-indigo-300 uppercase flex items-center gap-1">
                  <Globe size={10} /> Traduction multi-écrans des autres utilisateurs :
                </div>
                <div className="grid grid-cols-3 gap-1.5 mt-1.5 text-[10px] font-mono font-medium">
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[8px] font-bold">🇺🇸 EN-US</span>
                    <p className="text-slate-300 line-clamp-2 mt-0.5">{otherUsersTranslation.english}</p>
                  </div>
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[8px] font-bold">🇯🇵 JA-JP</span>
                    <p className="text-slate-300 line-clamp-2 mt-0.5">{otherUsersTranslation.japanese}</p>
                  </div>
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[8px] font-bold">🇪🇸 ES-ES</span>
                    <p className="text-slate-300 line-clamp-2 mt-0.5">{otherUsersTranslation.spanish}</p>
                  </div>
                </div>
              </div>
            )}

            {/* User Input Stage */}
            <form onSubmit={handleSendLiveComment} className="p-3 bg-slate-900 border-t border-slate-950 flex gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ressenti sur l'épisode... (En français)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-pink-500/50"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white transition-all shadow-md shadow-pink-500/10"
              >
                <Send size={14} />
              </button>
            </form>

          </div>

        </div>
      ) : (
        /* ================= LIST OF SCHEDULED WATCH PARTIES ================= */
        <div className="flex-1 p-6 overflow-y-auto">
          
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            
            {/* Hero banner for watch party scheduling */}
            <div className="bg-gradient-to-r from-pink-900/40 via-purple-950/30 to-indigo-950/40 border border-pink-500/15 rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-2 z-10 text-center md:text-left">
                <span className="text-[10px] font-black uppercase text-pink-400 tracking-widest flex items-center justify-center md:justify-start gap-1.5">
                  <Sparkles size={12} /> visionnages en direct synchronisés
                </span>
                <h2 className="text-xl md:text-2xl font-sans font-black text-white">Prépare ton Pop-corn ! 🍿</h2>
                <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                  Rejoins des salons de diffusion en direct pour regarder tes animes de saison préférés en totale synchronisation avec le chat communautaire et les sous-titres !
                </p>
              </div>

              <button
                onClick={() => setShowPlanModal(true)}
                className="px-5 py-3 rounded-2xl bg-pink-600 hover:bg-pink-500 hover:shadow-lg hover:shadow-pink-500/20 font-bold text-xs text-white tracking-wider flex items-center gap-2 transition-all z-10 shrink-0"
              >
                <Plus size={16} /> PROGRAMMER UN VISIONNAGE
              </button>

              <div className="absolute right-0 top-0 w-72 h-72 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* List of Watch Parties Events */}
            <div className="flex flex-col gap-4">
              <h3 className="font-sans font-black text-sm text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={16} className="text-indigo-400" /> Événements programmés ({events.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(event => {
                  const isUserRegistered = event.participants.includes(user.username);
                  
                  return (
                    <div 
                      key={event.id}
                      className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all hover:scale-[1.01] hover:shadow-xl relative overflow-hidden ${
                        event.isLive 
                          ? 'bg-slate-900/80 border-pink-500/30 shadow-lg shadow-pink-500/5' 
                          : 'bg-slate-900/40 border-slate-800/80'
                      }`}
                    >
                      {/* Background banner */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-cyan-500 opacity-60" />

                      <div className="flex gap-4">
                        {/* Mock Avatar cover image */}
                        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                          {event.coverImage || '🍿'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                              {event.genre || 'Otaku Theme'}
                            </span>
                            {event.isLive && (
                              <span className="bg-red-600 text-white font-bold text-[8px] px-1.5 rounded animate-pulse">🔴 EN DIRECT</span>
                            )}
                          </div>
                          <h4 className="font-sans font-black text-sm text-white mt-1 truncate hover:underline cursor-pointer">{event.animeTitle}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Ep. {event.episodeNumber}</p>
                        </div>
                      </div>

                      {/* Schedule info & participant count */}
                      <div className="flex justify-between items-center bg-slate-950/60 rounded-xl px-3 py-2 border border-slate-800/40">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-medium">
                          <Clock size={11} className="text-pink-500 shrink-0" />
                          <span>{event.scheduledTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Users size={11} className="text-indigo-400 shrink-0" />
                          <span>{event.participants.length}</span>
                        </div>
                      </div>

                      {/* Participant Avatars preview list */}
                      <div className="flex items-center justify-between gap-2 flex-wrap mt-1">
                        <div className="flex -space-x-2 overflow-hidden">
                          {event.participants.slice(0, 4).map((p, i) => (
                            <div key={p} className="w-6 h-6 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] overflow-hidden" title={p}>
                              {p === user.username ? renderAvatar(user.avatar) : '👤'}
                            </div>
                          ))}
                          {event.participants.length > 4 && (
                            <div className="w-6 h-6 rounded-full border border-slate-900 bg-slate-950 text-slate-400 text-[8px] font-bold flex items-center justify-center">
                              +{event.participants.length - 4}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          {/* Cancel if host */}
                          {event.host === user.username && (
                            <button
                              onClick={() => handleDeleteEvent(event.id, event.animeTitle)}
                              className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 hover:bg-red-950/30 hover:border-red-500/30 hover:text-red-400 text-slate-400 transition-all"
                              title={t.cancel}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}

                          {event.isLive ? (
                            <button
                              onClick={() => handleLaunchEvent(event)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-xs font-black text-white flex items-center gap-1.5 transition-all shadow-md shadow-pink-600/10"
                            >
                              <Play size={12} fill="white" /> {t.joinLive}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleNotify(event.id)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                isUserRegistered 
                                  ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 hover:bg-slate-950' 
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                              }`}
                            >
                              {isUserRegistered ? (
                                <>
                                  <Check size={12} className="text-emerald-400" /> {t.subscribed}
                                </>
                              ) : (
                                <>
                                  <Bell size={12} className="text-slate-400" /> {t.notifyMe}
                                </>
                              )}
                            </button>
                          )}

                          {/* Quick manual Live start for unstarted custom events */}
                          {!event.isLive && event.host === user.username && (
                            <button
                              onClick={() => {
                                setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, isLive: true } : ev));
                                playNotificationSound();
                                onAddSystemMessage(`🔔 ${t.watchPartyStarted} "${event.animeTitle}" !`);
                              }}
                              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all"
                            >
                              {t.joinLive}
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Immersive Watch Party Rules */}
            <div className="p-4 bg-slate-900/20 border border-slate-800/40 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 mt-0.5">
                <Award size={16} />
              </div>
              <div>
                <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider">{t.howItWorks}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  {t.howItWorksDesc}
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 3. EVENT CREATION MODAL */}
      <AnimatePresence>
        {showPlanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setShowPlanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative text-slate-100 flex flex-col gap-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-sans font-black text-base text-white flex items-center gap-2">
                  <Calendar size={18} className="text-pink-500" /> {t.scheduleWatchParty}
                </h3>
              </div>

              <form onSubmit={handleSavePlanEvent} className="flex flex-col gap-3.5">
                
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t.title}</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-pink-500"
                    placeholder="Ex: Chainsaw Man, Solo Leveling, Bleach..."
                  />
                </div>

                {/* Episode & Genre */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ep. N°</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newEpisode}
                      onChange={e => setNewEpisode(parseInt(e.target.value) || 1)}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t.category}</label>
                    <select
                      value={newGenre}
                      onChange={e => setNewGenre(e.target.value)}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-pink-500"
                    >
                      <option value="Shōnen">👊 Shōnen</option>
                      <option value="Seinen">💀 Seinen</option>
                      <option value="Shōjo">🌸 Shōjo</option>
                      <option value="Isekai">🌀 Isekai</option>
                    </select>
                  </div>
                </div>

                {/* Time Schedule */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Date / Time</label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-pink-500"
                    placeholder="Ex: Ce soir à 21:00, Dimanche à 15:00..."
                  />
                </div>

                {/* Video Upload */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Importer une vidéo (Optionnel)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setNewVideoUrl(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-transparent file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:bg-pink-600 file:text-white hover:file:bg-pink-500 cursor-pointer"
                  />
                </div>

                {/* Cover Emoji */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Icône de Couverture</label>
                  <div className="grid grid-cols-6 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    {['🍿', '🎮', '⚔️', '🔥', '🌸', '💀', '🌀', '🍥', '🎤', '🪐', '🦄', '👁️'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCover(emoji)}
                        className={`w-9 h-9 text-lg flex items-center justify-center rounded-lg border-2 transition-all ${
                          newCover === emoji 
                            ? 'border-pink-500 bg-pink-950/20 scale-105' 
                            : 'border-slate-850 hover:border-slate-700 bg-slate-900/40'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowPlanModal(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 transition-colors rounded-xl font-bold text-xs text-slate-300"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-pink-600 hover:bg-pink-500 hover:shadow-lg hover:shadow-pink-500/20 transition-all rounded-xl font-bold text-xs text-white"
                  >
                    Programmer le Direct
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHARE / AUTO-DELETE EVENT MODAL (TIKTOK POWER INSPIRED) */}
      <AnimatePresence>
        {showSharePrompt && liveEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 backdrop-blur-xl"
            onClick={handleDeleteStream} // Default to delete if clicking outside as requested (must press share to keep)
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="max-w-md w-full bg-slate-900 border border-pink-500/30 rounded-3xl shadow-2xl p-6 relative text-slate-100 flex flex-col gap-6 text-center overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Sleek neon gradient background glow */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
              <div className="absolute right-0 top-0 w-44 h-44 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-0 bottom-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-pink-500/10 border-2 border-pink-500 flex items-center justify-center text-3xl animate-pulse">
                  🍿
                </div>
                <h3 className="font-sans font-black text-xl text-white tracking-wider uppercase">
                  {t.watchParties} - END
                </h3>
                <p className="text-sm font-bold text-pink-400">
                  {liveEvent.animeTitle} - Ep. {liveEvent.episodeNumber}
                </p>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col gap-3">
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  {t.liveAutoDeleteWarning}
                </p>
                <span className="text-[10px] font-mono text-slate-500 leading-normal block">
                  🛡️ OtakuCord Copyright Protection Protocol
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleShareStream}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 hover:shadow-lg hover:shadow-pink-500/30 transition-all rounded-2xl font-black text-xs text-white uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
                >
                  <Share2 size={15} />
                  <span>{t.shareButton}</span>
                </button>
                <button
                  onClick={handleDeleteStream}
                  className="w-full py-3 bg-slate-800/80 hover:bg-red-950/40 hover:text-red-400 border border-slate-750 transition-all rounded-2xl font-bold text-xs text-slate-400 uppercase tracking-wider active:scale-95"
                >
                  {t.deleteMedia} & Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
