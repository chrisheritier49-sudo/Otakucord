import React, { useState, useRef, useEffect } from 'react';
import { Send, Shield, Trash2, AlertTriangle, Users, MessageSquare, ArrowLeft, Volume2, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Message } from '../types';

interface DmChatSectionProps {
  activeDmId: string;
  user: User;
  privateMessages: Record<string, any[]>;
  setPrivateMessages: React.Dispatch<React.SetStateAction<any>>;
  privateGroups: any[];
  setPrivateGroups: React.Dispatch<React.SetStateAction<any[]>>;
  friends: string[];
  setFriends: React.Dispatch<React.SetStateAction<string[]>>;
  friendRequests: any[];
  setFriendRequests: React.Dispatch<React.SetStateAction<any[]>>;
  onOpenReportModal: (targetName: string) => void;
  onDeleteDiscussion: (targetId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  setActiveView: (view: 'home' | 'guild' | 'dm') => void;
  setActiveDmId: (id: string | null) => void;
}

export default function DmChatSection({
  activeDmId,
  user,
  privateMessages,
  setPrivateMessages,
  privateGroups,
  setPrivateGroups,
  friends,
  setFriends,
  friendRequests,
  setFriendRequests,
  onOpenReportModal,
  onDeleteDiscussion,
  onLeaveGroup,
  setActiveView,
  setActiveDmId
}: DmChatSectionProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isGroup = activeDmId.startsWith('group-');
  const currentGroup = isGroup ? privateGroups.find(g => g.id === activeDmId) : null;

  // Bot Info details
  const getBotDetails = (id: string) => {
    const bots: Record<string, { username: string; avatar: string; title: string; status: string; botStyle: string }> = {
      'NarutoBot': { username: 'NarutoBot', avatar: '🍥', title: '7ème Hokage', status: 'online', botStyle: 'text-orange-400 bg-orange-950/40 border border-orange-500/20 px-1.5 py-0.5 rounded text-[10px]' },
      'SasukeBot': { username: 'SasukeBot', avatar: '👁️', title: 'Uchiwa Survivant', status: 'dnd', botStyle: 'text-purple-400 bg-purple-950/40 border border-purple-500/20 px-1.5 py-0.5 rounded text-[10px]' },
      'GokuBot': { username: 'GokuBot', avatar: '👊', title: 'Super Saiyan God', status: 'idle', botStyle: 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]' },
      'RemBot': { username: 'RemBot', avatar: '🌸', title: 'Waifu de l\'année', status: 'online', botStyle: 'text-pink-400 bg-pink-950/40 border border-pink-500/20 px-1.5 py-0.5 rounded text-[10px]' }
    };
    return bots[id] || { username: id, avatar: '👤', title: 'Otaku', status: 'offline', botStyle: 'text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[10px]' };
  };

  // Chat details
  const chatTitle = isGroup ? currentGroup?.name || 'Groupe Privé' : getBotDetails(activeDmId).username;
  const chatAvatar = isGroup ? currentGroup?.avatar || '👥' : getBotDetails(activeDmId).avatar;
  const chatTitleSub = isGroup 
    ? `${currentGroup?.members?.length || 0} participants` 
    : getBotDetails(activeDmId).title;
  const chatStatus = isGroup ? 'online' : getBotDetails(activeDmId).status;

  // Get conversation list
  const currentMessages: any[] = privateMessages[activeDmId] || [];
 
  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);
 
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
 
    const textToSend = inputText;
    setInputText('');
 
    const newMsg = {
      id: `dm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: textToSend,
      senderId: user.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: {
        username: user.username,
        avatar: user.avatar,
        title: user.title,
        isBot: false
      },
      guildId: 'private-dm'
    };
 
    // Save message to local dictionary
    setPrivateMessages((prev: any) => ({
      ...prev,
      [activeDmId]: [...(prev[activeDmId] || []), newMsg]
    }));
 
    // Auto trigger friend request if not friends (individual DMs only)
    if (!isGroup && !friends.includes(activeDmId) && !friendRequests.some(r => r.id === activeDmId)) {
      setFriendRequests(prev => [...prev, { id: activeDmId, username: getBotDetails(activeDmId).username, avatar: getBotDetails(activeDmId).avatar, type: 'sent' }]);
    }
 
    // Preset replies for bots
    if (!isGroup) {
      const PRESET_MESSAGES_FOR_BOTS: Record<string, string[]> = {
        'NarutoBot': [
          "Dattebayo! Je ne reviens jamais sur ma parole, c'est ça mon nindo ! 🍥",
          "Si tu crois que je vais abandonner, tu te trompes de ninja ! 💪",
          "Je serai le plus grand Hokage de tous les temps, regarde-moi bien ! 🍃",
          "Allons manger des ramens chez Ichiraku pour fêter notre amitié ! 🍜"
        ],
        'SasukeBot': [
          "Hmph... Pourquoi m'écris-tu en privé ? Je n'ai pas de temps à perdre. 👁️",
          "La vengeance est un chemin solitaire, mais ton message est parvenu jusqu'à moi.",
          "Tu es persistant... Très bien, je consens à être ton ami. Ne me ralentis pas.",
          "Mes yeux voient clair dans l'obscurité. Que veux-tu ?"
        ],
        'GokuBot': [
          "Salut ! C'est moi Goku ! Tu as l'air fort, on s'entraîne ensemble ? 👊",
          "Je sens un ki impressionnant chez toi ! Prêt à repousser tes limites ?",
          "Même face au danger absolu, je ne reculerai jamais ! Kamehameha ! 🐉",
          "J'ai un peu faim là... Tu as de la nourriture ?"
        ],
        'RemBot': [
          "Bonjour ! Comment puis-je vous aider aujourd'hui ? 🌸",
          "Peu importe la difficulté, je resterai à vos côtés pour vous soutenir ! ✨",
          "Rem est très heureuse de chatter avec un otaku aussi attentionné !",
          "Avez-vous complété votre entraînement quotidien ? N'oubliez pas les Otaku Coins !"
        ]
      };
 
      const botReplyOptions = PRESET_MESSAGES_FOR_BOTS[activeDmId];
      if (botReplyOptions) {
        setTimeout(() => {
          const randomReply = botReplyOptions[Math.floor(Math.random() * botReplyOptions.length)];
          const botPvMsg = {
            id: `bot-dm-${Date.now()}`,
            content: randomReply,
            senderId: activeDmId,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: {
              username: getBotDetails(activeDmId).username,
              avatar: getBotDetails(activeDmId).avatar,
              title: getBotDetails(activeDmId).title,
              isBot: true,
              botStyle: getBotDetails(activeDmId).botStyle
            },
            guildId: 'private-dm'
          };
 
          setPrivateMessages((prev: any) => ({
            ...prev,
            [activeDmId]: [...(prev[activeDmId] || []), botPvMsg]
          }));
        }, 1200);
      }
    } else {
      // Group simulated bot response
      const groupMembers = currentGroup?.members || [];
      const botMembers = groupMembers.filter((m: string) => ['NarutoBot', 'SasukeBot', 'GokuBot', 'RemBot'].includes(m));
      if (botMembers.length > 0) {
        setTimeout(() => {
          const randomBot = botMembers[Math.floor(Math.random() * botMembers.length)];
          const botInfos = getBotDetails(randomBot);
          const groupReplies = [
            `Moi, ${botInfos.username}, je valide totalement ! 👊`,
            `Hahaha, incroyable discussion ici ! 🎌`,
            `Intéressant... continuons ainsi ! ⚔️`,
            `Dattebayo ! Tout le monde est d'accord ? 🍥`,
            `Ne vous battez pas, on est tous des otakus solidaires ! 🌸`
          ];
          const randomReply = groupReplies[Math.floor(Math.random() * groupReplies.length)];
 
          const botMsg = {
            id: `bot-group-${Date.now()}`,
            content: randomReply,
            senderId: randomBot,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: {
              username: botInfos.username,
              avatar: botInfos.avatar,
              title: botInfos.title,
              isBot: true,
              botStyle: botInfos.botStyle
            },
            guildId: 'private-dm'
          };
 
          setPrivateMessages((prev: any) => ({
            ...prev,
            [activeDmId]: [...(prev[activeDmId] || []), botMsg]
          }));
        }, 1500);
      }
    }
  };
 
  const handleDeleteMessage = (msgId: string) => {
    setPrivateMessages((prev: any) => {
      const msgs = prev[activeDmId] || [];
      const updated = msgs.filter((m: any) => m.id !== msgId);
      return {
        ...prev,
        [activeDmId]: updated
      };
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900/40 relative h-full">
      
      {/* 1. CHAT HEADER */}
      <div className="h-12 border-b border-slate-950/60 px-4 flex items-center justify-between bg-slate-900/60 shadow-sm relative shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button for mobile */}
          <button 
            onClick={() => {
              setActiveView('home');
              setActiveDmId(null);
            }}
            className="md:hidden text-slate-400 hover:text-white p-1 bg-slate-950 border border-slate-800 rounded-lg mr-1 active:scale-95 transition-all"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg shadow-inner overflow-hidden">
              {chatAvatar.startsWith('http') || chatAvatar.startsWith('data:') ? (
                <img src={chatAvatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="select-none">{chatAvatar}</span>
              )}
            </div>
            {!isGroup && (
              <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-950 ${
                chatStatus === 'online' ? 'bg-emerald-500' :
                chatStatus === 'dnd' ? 'bg-rose-500' :
                chatStatus === 'idle' ? 'bg-amber-500' : 'bg-slate-500'
              }`} />
            )}
          </div>

          <div className="min-w-0">
            <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
              <span>{chatTitle}</span>
              {isGroup && (
                <span className="bg-slate-850 border border-slate-850 px-1 py-0.5 rounded text-[8px] text-slate-400 font-black uppercase tracking-wider">
                  Groupe
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate font-mono uppercase tracking-wide">
              {chatTitleSub}
            </div>
          </div>
        </div>

        {/* Action Controls: Quitter, Supprimer, Signaler */}
        <div className="flex items-center gap-2">
          {/* Signaler Button */}
          <button
            onClick={() => onOpenReportModal(chatTitle)}
            className="px-2.5 py-1.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md active:scale-95"
            title="Signaler ce chat ou un participant pour comportement toxique"
          >
            <AlertTriangle size={11} className="animate-pulse" />
            <span className="hidden sm:inline">Signaler</span>
          </button>

          {/* Supprimer / Quitter Button */}
          {isGroup ? (
            <button
              onClick={() => onLeaveGroup(activeDmId)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-850 hover:border-rose-500/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md active:scale-95"
              title="Quitter le groupe et effacer les messages"
            >
              <Trash2 size={11} />
              <span>Quitter le groupe</span>
            </button>
          ) : (
            <button
              onClick={() => onDeleteDiscussion(activeDmId)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-850 hover:border-rose-500/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md active:scale-95"
              title="Supprimer cette discussion et purger l'historique"
            >
              <Trash2 size={11} />
              <span>Effacer Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CHAT MESSAGES PANEL */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-sm text-center">
          <div className="inline-block px-3 py-1 bg-slate-950/60 border border-slate-850/60 rounded-full text-[9px] font-mono text-slate-500 uppercase tracking-widest backdrop-blur shadow">
            🛡️ Crypté de bout en bout & Modéré par IA
          </div>
        </div>

        {currentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 max-w-md mx-auto select-none pt-12">
            <div className="w-14 h-14 rounded-full bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
              <MessageSquare size={24} />
            </div>
            <h4 className="font-bold text-sm text-slate-300">Début d'une belle aventure !</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Il n'y a aucun message ici. Envoyez un salut amical à <span className="text-indigo-400 font-bold">{chatTitle}</span> pour briser la glace. Le respect est de mise !
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-8">
            {currentMessages.map((m, idx) => {
              const isMe = m.senderId === user.id;
              return (
                <div 
                  key={m.id || idx} 
                  className={`flex gap-3 group relative rounded-xl p-1 hover:bg-slate-950/20 transition-colors ${
                    isMe ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* User avatar */}
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-base shrink-0 overflow-hidden shadow-md">
                    {m.author.avatar.startsWith('http') || m.author.avatar.startsWith('data:') ? (
                      <img src={m.author.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="select-none">{m.author.avatar}</span>
                    )}
                  </div>

                  {/* Body text bubble */}
                  <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                      <span className="font-bold text-slate-300">{m.author.username}</span>
                      {m.author.isBot && (
                        <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded ${m.author.botStyle || 'bg-indigo-950 text-indigo-300'}`}>
                          BOT
                        </span>
                      )}
                      <span className="text-[9px] text-slate-500 font-mono">{m.timestamp}</span>
                    </div>

                    <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                      isMe 
                        ? 'bg-indigo-650 text-white rounded-tr-none' 
                        : 'bg-slate-800 text-slate-200 rounded-tl-none'
                    }`}>
                      {m.content || m.text}
                    </div>

                    {/* Report / Delete Message Hover Actions */}
                    <div className={`absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shadow-md ${
                      isMe ? 'left-4' : 'right-4'
                    }`}>
                      {isMe ? (
                        <button
                          onClick={() => handleDeleteMessage(m.id || '')}
                          className="p-1 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded transition-all"
                          title="Supprimer ce message"
                        >
                          <Trash2 size={11} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenReportModal(m.author.username)}
                          className="p-1 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded transition-all"
                          title="Signaler ce message pour toxicité"
                        >
                          <AlertTriangle size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. INPUT SENDER FIELD */}
      <div className="p-4 bg-slate-900/60 border-t border-slate-950/60 shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2 shadow-md focus-within:border-indigo-500/50 transition-colors items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Écrire un message privé à ${chatTitle}...`}
            className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-xs text-white px-2 placeholder-slate-500 py-1.5"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow shrink-0 ${
              inputText.trim() 
                ? 'bg-indigo-650 hover:bg-indigo-600 text-white cursor-pointer active:scale-95' 
                : 'bg-slate-900 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Send size={13} />
          </button>
        </form>
        <p className="text-[10px] text-slate-500 text-center mt-2 font-mono">
          Appuyez sur <span className="font-bold">[Entrée]</span> pour envoyer ou cliquez sur la flèche.
        </p>
      </div>

    </div>
  );
}
