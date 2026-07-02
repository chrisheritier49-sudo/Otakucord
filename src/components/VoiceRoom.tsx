import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Tv, ShieldAlert, Music, Play, Pause, Radio } from 'lucide-react';
import { motion } from 'motion/react';

const renderAvatar = (avatarStr: string) => {
  const isUrl = avatarStr && (avatarStr.toLowerCase().startsWith('http') || avatarStr.startsWith('data:') || avatarStr.length > 4);
  if (isUrl) {
    return <img src={avatarStr} alt="Avatar" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />;
  }
  return <span className="select-none">{avatarStr || '👤'}</span>;
};

interface VoiceRoomProps {
  user: User;
  channelName: string;
  onDisconnect: () => void;
}

interface Participant {
  id: string;
  username: string;
  avatar: string;
  title: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

export default function VoiceRoom({ user, channelName, onDisconnect }: VoiceRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSong, setActiveSong] = useState('Chill Lofi Ghibli Study');
  const [isPlayingSong, setIsPlayingSong] = useState(true);

  // Simulated participants
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'p1', username: 'NarutoBot', avatar: '🍥', title: '7ème Hokage', isMuted: false, isSpeaking: false },
    { id: 'p2', username: 'RemBot', avatar: '🌸', title: 'Waifu', isMuted: false, isSpeaking: false },
    { id: 'p3', username: 'SaitamaBot', avatar: '🥚', title: 'Saitama disciple', isMuted: true, isSpeaking: false }
  ]);

  // Simulate speaking activity
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants(prev =>
        prev.map(p => {
          if (p.isMuted) return { ...p, isSpeaking: false };
          // Randomly speak
          return {
            ...p,
            isSpeaking: Math.random() > 0.6
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleDeafen = () => {
    if (!isDeafened) {
      setIsDeafened(true);
      setIsMuted(true);
    } else {
      setIsDeafened(false);
      setIsMuted(false);
    }
  };

  const songs = [
    'Chill Lofi Ghibli Study',
    'Naruto Sadness & Sorrow Lofi',
    'Demon Slayer Tanjirou Theme Beats',
    'One Piece Bink\'s Sake Jazz Lofi'
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      {/* Top Title Bar */}
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Radio size={18} className="animate-pulse" />
            <span>Salon Vocal connecté</span>
          </div>
          <h2 className="text-xl font-bold font-sans text-white mt-1">🔊 {channelName}</h2>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-400">
          <span>Ping:</span>
          <span className="font-mono text-emerald-400 font-bold">24 ms</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
      </div>

      {/* Main Voice Room Stage */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
        
        {/* Participants grid (Left side) */}
        <div className="md:col-span-8 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-6 flex flex-col justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {/* Real User Card */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="relative">
                <div className={`w-20 h-20 rounded-full bg-slate-800 border-4 flex items-center justify-center text-3xl shadow-xl transition-all overflow-hidden ${
                  !isMuted && !isDeafened ? 'border-emerald-500 animate-pulse shadow-emerald-500/10' : 'border-slate-700'
                }`}>
                  {renderAvatar(user.avatar)}
                </div>
                {isMuted && (
                  <div className="absolute -bottom-1 -right-1 p-1 bg-red-600 rounded-full border border-slate-950">
                    <MicOff size={12} className="text-white" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="font-bold text-sm text-white flex items-center gap-1.5 justify-center">
                  {user.username} <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-400 uppercase font-mono">Moi</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{user.title}</div>
              </div>
            </div>

            {/* Simulated participants */}
            {participants.map(p => (
              <div key={p.id} className="flex flex-col items-center gap-2.5">
                <div className="relative">
                  <div className={`w-20 h-20 rounded-full bg-slate-800 border-4 flex items-center justify-center text-3xl shadow-xl transition-all overflow-hidden ${
                    p.isSpeaking && !isDeafened ? 'border-emerald-500 scale-[1.03] shadow-emerald-500/10' : 'border-slate-800'
                  }`}>
                    {renderAvatar(p.avatar)}
                  </div>
                  {p.isMuted && (
                    <div className="absolute -bottom-1 -right-1 p-1 bg-red-600 rounded-full border border-slate-950">
                      <MicOff size={12} className="text-white" />
                    </div>
                  )}
                  {p.isSpeaking && !p.isMuted && !isDeafened && (
                    <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border border-slate-950 animate-bounce">
                      <Mic size={12} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm text-white flex items-center gap-1 justify-center">
                    {p.username}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{p.title}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Voice status action row */}
          <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-slate-800/60">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full border transition-all ${
                isMuted 
                  ? 'bg-red-600 border-red-500 text-white hover:bg-red-500' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
              title={isMuted ? 'Activer le micro' : 'Couper le micro'}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button
              onClick={toggleDeafen}
              className={`p-4 rounded-full border transition-all ${
                isDeafened 
                  ? 'bg-red-600 border-red-500 text-white hover:bg-red-500' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
              title={isDeafened ? 'Activer le son' : 'Couper le son'}
            >
              {isDeafened ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <button
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className={`p-4 rounded-full border transition-all ${
                isScreenSharing 
                  ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
              title="Partager l'écran"
            >
              <Tv size={20} />
            </button>

            <button
              onClick={onDisconnect}
              className="p-4 rounded-full bg-red-600 border border-red-500 text-white hover:bg-red-500 transition-all shadow-lg hover:shadow-red-500/20"
              title="Se déconnecter"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>

        {/* Lofi Radio Player (Right side) */}
        <div className="md:col-span-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Music size={16} /> radio lofi otaku
            </h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-indigo-500/10 flex items-center justify-center text-3xl border border-indigo-500/20 mb-3 animate-spin duration-10000">
                📻
              </div>
              <h4 className="font-bold text-sm text-white line-clamp-1">{activeSong}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">En lecture dans le salon vocal</p>

              {/* Simulated Audio Visualizer Bars */}
              {isPlayingSong && !isDeafened && (
                <div className="flex gap-1 h-6 items-end justify-center mt-3 w-32">
                  <span className="w-1 bg-indigo-500 animate-[pulse_0.8s_infinite] h-4 rounded-full"></span>
                  <span className="w-1 bg-violet-500 animate-[pulse_1.2s_infinite] h-6 rounded-full"></span>
                  <span className="w-1 bg-pink-500 animate-[pulse_0.9s_infinite] h-3 rounded-full"></span>
                  <span className="w-1 bg-purple-500 animate-[pulse_1.1s_infinite] h-5 rounded-full"></span>
                  <span className="w-1 bg-indigo-500 animate-[pulse_0.7s_infinite] h-2 rounded-full"></span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-4">
              {songs.map(song => (
                <button
                  key={song}
                  onClick={() => {
                    setActiveSong(song);
                    setIsPlayingSong(true);
                  }}
                  className={`p-2.5 rounded-lg text-left text-xs transition-colors flex items-center justify-between ${
                    activeSong === song && isPlayingSong
                      ? 'bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-bold'
                      : 'bg-slate-950/40 border border-transparent text-slate-400 hover:bg-slate-950/80 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{song}</span>
                  {activeSong === song && isPlayingSong ? <Pause size={12} /> : <Play size={12} />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl text-[11px] text-indigo-200 flex items-start gap-2">
            <Volume2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <p>La radio est diffusée directement en arrière-plan du salon pour tous les auditeurs connectés.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
