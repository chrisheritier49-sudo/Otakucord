import React from 'react';
import { User, Role } from '../types';
import { PRESET_ROLES } from '../data/mockDiscord';
import { Shield, Sparkles, Award, Star, Check, HelpCircle, Coins } from 'lucide-react';

const renderAvatar = (avatarStr: string) => {
  const isUrl = avatarStr && (avatarStr.toLowerCase().startsWith('http') || avatarStr.startsWith('data:') || avatarStr.length > 4);
  if (isUrl) {
    return <img src={avatarStr} alt="Avatar" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />;
  }
  return <span className="select-none">{avatarStr || '👤'}</span>;
};

interface RolesSectionProps {
  user: User;
  onUpdateUser: React.Dispatch<React.SetStateAction<User>>;
  onAddSystemMessage: (content: string) => void;
}

export default function RolesSection({ user, onUpdateUser, onAddSystemMessage }: RolesSectionProps) {
  const userRoles = user.userRoles || [];

  const handleToggleRole = (role: Role) => {
    const isLevel = role.category === 'level';
    let updatedRoles = [...userRoles];

    // If it's a level role, we only allow one level role at a time
    if (isLevel) {
      // Remove all other level roles
      updatedRoles = updatedRoles.filter(rId => {
        const rObj = PRESET_ROLES.find(pr => pr.id === rId);
        return rObj?.category !== 'level';
      });
    }

    const hasRole = userRoles.includes(role.id);
    if (hasRole) {
      updatedRoles = updatedRoles.filter(rId => rId !== role.id);
      onAddSystemMessage(`🛡️ Rôle retiré : "${role.name}". Ton profil a été mis à jour !`);
    } else {
      // Level unlocks might have a simulated coin requirement for gameplay loop!
      if (isLevel) {
        let cost = 0;
        if (role.id === 'lvl-chunin') cost = 100;
        if (role.id === 'lvl-jonin') cost = 300;
        if (role.id === 'lvl-hokage') cost = 1000;

        if (user.coins < cost) {
          onAddSystemMessage(`❌ Oh non ! Débloquer le grade de "${role.name}" requiert ${cost} Otaku Coins. Continue de chatter et de faire des quiz ! 🎮`);
          playFailSound();
          return;
        }

        if (cost > 0) {
          onUpdateUser(prev => ({ ...prev, coins: prev.coins - cost }));
          onAddSystemMessage(`🔥 Félicitations ! Tu as dépensé ${cost} Coins pour être promu au rang suprême de "${role.name}" ! 🎉`);
          playPromotionSound();
        } else {
          onAddSystemMessage(`🛡️ Grade équipé : "${role.name}".`);
        }
      } else {
        onAddSystemMessage(`🛡️ Nouveau rôle équipé : "${role.name}" !`);
      }

      updatedRoles.push(role.id);
    }

    onUpdateUser(prev => ({
      ...prev,
      userRoles: updatedRoles
    }));
  };

  // Sound effects
  const playPromotionSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.1); // C#5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.2); // E5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.55);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.55);
    } catch (e) {}
  };

  const playFailSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime); 
      osc.frequency.setValueAtTime(140, audioCtx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  };

  const levels = PRESET_ROLES.filter(r => r.category === 'level');
  const interests = PRESET_ROLES.filter(r => r.category === 'interest');
  const genres = PRESET_ROLES.filter(r => r.category === 'genre');

  const getLevelCostLabel = (roleId: string) => {
    if (roleId === 'lvl-genin') return 'Gratuit (Départ)';
    if (roleId === 'lvl-chunin') return '100 Coins 🪙';
    if (roleId === 'lvl-jonin') return '300 Coins 🪙';
    if (roleId === 'lvl-hokage') return '1000 Coins 🪙';
    return '';
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-y-auto p-6 h-full">
      
      {/* Header */}
      <div className="pb-4 mb-6 border-b border-slate-800 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold font-sans text-white flex items-center gap-2">
            <Shield className="text-pink-500" size={22} /> Rôles Otaku Personnalisables
          </h2>
          <p className="text-xs text-slate-400 mt-1">Gère tes badges d'identification et tes grades de prestige !</p>
        </div>

        {/* Dynamic Coins Status */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs">
          <Coins className="text-yellow-500 shrink-0 animate-bounce" size={14} />
          <span className="text-slate-400 font-bold">Solde actuel:</span>
          <span className="font-mono text-yellow-400 font-black">{user.coins} Coins</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Profile Card Mockup with updated roles badge (Col 4) */}
        <div className="md:col-span-4 bg-slate-900/60 rounded-3xl border border-slate-800/80 p-5 shadow-xl flex flex-col items-center justify-between text-center min-h-[300px]">
          <div className="w-full">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 justify-center mb-4">
              <Sparkles size={14} /> Aperçu de ton Profil
            </h3>

            {/* Avatar frame */}
            <div className="relative inline-block mx-auto mb-3">
              <div className="w-20 h-20 rounded-full bg-slate-950 border-4 border-pink-500/40 flex items-center justify-center text-4xl shadow-xl overflow-hidden">
                {renderAvatar(user.avatar)}
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-inner" />
            </div>

            <h4 className="font-sans font-black text-base text-white">{user.username}</h4>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">{user.title}</p>
            
            {/* Displaying current active roles inside card */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-4 max-h-[140px] overflow-y-auto p-1 bg-slate-950/40 rounded-xl border border-slate-800/40">
              {userRoles.length === 0 ? (
                <span className="text-[10px] text-slate-500 font-mono py-1.5 px-3">Aucun rôle sélectionné</span>
              ) : (
                userRoles.map(roleId => {
                  const role = PRESET_ROLES.find(r => r.id === roleId);
                  if (!role) return null;
                  return (
                    <span 
                      key={roleId} 
                      className={`text-[9px] font-bold px-2 py-1 rounded-md shadow-sm border ${role.color}`}
                    >
                      {role.name}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl text-[10px] text-indigo-200">
            Les rôles activés s'affichent automatiquement sur ton profil et modifient la manière dont <strong className="text-pink-400">@Senpai</strong> s'adresse à toi !
          </div>
        </div>

        {/* Roles config container (Col 8) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* 1. NIVEAUX D'ANCIENNETÉ */}
          <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="font-sans font-black text-xs text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800/60 pb-2">
              <Award size={14} /> Grades & Niveaux d'Ancienneté (Un seul actif)
            </h3>
            
            <div className="flex flex-col gap-2.5">
              {levels.map(role => {
                const isEquipped = userRoles.includes(role.id);
                return (
                  <div 
                    key={role.id}
                    onClick={() => handleToggleRole(role)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center group ${
                      isEquipped 
                        ? 'bg-pink-950/20 border-pink-500/30 shadow-md' 
                        : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border shrink-0 ${role.color}`}>
                        {role.name}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-300 font-medium">{role.description}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Requis: <strong className="text-slate-400">{getLevelCostLabel(role.id)}</strong></p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isEquipped 
                        ? 'border-pink-500 bg-pink-600 text-white' 
                        : 'border-slate-800 bg-slate-950 group-hover:border-slate-600'
                    }`}>
                      {isEquipped && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. CENTRES D'INTÉRÊT */}
          <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="font-sans font-black text-xs text-pink-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800/60 pb-2">
              <Star size={14} /> Centres d'Intérêt Otaku (Cumulables)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {interests.map(role => {
                const isEquipped = userRoles.includes(role.id);
                return (
                  <div 
                    key={role.id}
                    onClick={() => handleToggleRole(role)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 group ${
                      isEquipped 
                        ? 'bg-pink-950/20 border-pink-500/30' 
                        : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="min-w-0 flex flex-col gap-1">
                      <span className={`inline-block self-start px-2 py-0.5 rounded-md text-[10px] font-bold border ${role.color}`}>
                        {role.name}
                      </span>
                      <p className="text-[10px] text-slate-400 leading-tight mt-1 truncate" title={role.description}>
                        {role.description}
                      </p>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isEquipped 
                        ? 'border-pink-500 bg-pink-600 text-white' 
                        : 'border-slate-800 bg-slate-950 group-hover:border-slate-600'
                    }`}>
                      {isEquipped && <Check size={10} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. GENRES PRÉFÉRÉS */}
          <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="font-sans font-black text-xs text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800/60 pb-2">
              <HelpCircle size={14} /> Genres préférés d'Anime & Mangas (Cumulables)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {genres.map(role => {
                const isEquipped = userRoles.includes(role.id);
                return (
                  <div 
                    key={role.id}
                    onClick={() => handleToggleRole(role)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 group ${
                      isEquipped 
                        ? 'bg-pink-950/20 border-pink-500/30' 
                        : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="min-w-0 flex flex-col gap-1">
                      <span className={`inline-block self-start px-2 py-0.5 rounded-md text-[10px] font-bold border ${role.color}`}>
                        {role.name}
                      </span>
                      <p className="text-[10px] text-slate-400 leading-tight mt-1 truncate" title={role.description}>
                        {role.description}
                      </p>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isEquipped 
                        ? 'border-pink-500 bg-pink-600 text-white' 
                        : 'border-slate-800 bg-slate-950 group-hover:border-slate-600'
                    }`}>
                      {isEquipped && <Check size={10} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
