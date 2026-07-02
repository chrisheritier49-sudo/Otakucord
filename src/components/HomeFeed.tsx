import React from 'react';
import { motion } from 'motion/react';
import { Compass, Users, Sparkles, Hash, PlusCircle } from 'lucide-react';
import { Guild } from '../types';

interface HomeFeedProps {
  availableGuilds: Guild[];
  joinedGuilds: string[];
  onJoinGuild: (guildId: string) => void;
}

const MOCK_NEWS = [
  { id: 1, title: "Nouvelle Saison d'Anime !", content: "La saison de Printemps 2026 s'annonce incroyable. Venez en discuter !", tag: "News" },
  { id: 2, title: "Mise à jour du Bot Trivia", content: "Nouveau système de classement et de défis ! Défiez vos amis pour voir qui est le meilleur Otaku.", tag: "System" },
  { id: 3, title: "Événement Cosplay ce weekend", content: "Partagez vos meilleures créations dans les salons dédiés.", tag: "Event" },
];

export function HomeFeed({ availableGuilds, joinedGuilds, onJoinGuild }: HomeFeedProps) {
  const joinableGuilds = availableGuilds.filter(g => !joinedGuilds.includes(g.id));

  return (
    <div className="flex-1 flex bg-slate-900 text-slate-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Découverte</h1>
            <p className="text-slate-400 mt-1">Explorez les serveurs et restez informé des nouveautés.</p>
          </div>
        </div>

        {/* News Feed */}
        <section>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Files d'actualité
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {MOCK_NEWS.map((news) => (
              <motion.div 
                key={news.id}
                whileHover={{ y: -2 }}
                className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col gap-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">
                    {news.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{news.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{news.content}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Available Guilds */}
        <section className="pt-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-pink-400" />
            Serveurs à rejoindre
          </h2>
          {joinableGuilds.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
              <p className="text-slate-400">Vous avez rejoint tous les serveurs disponibles !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {joinableGuilds.map(guild => (
                <div key={guild.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center text-center gap-4 hover:border-slate-700 transition-colors group">
                  <div className={`w-20 h-20 rounded-3xl ${guild.banner || 'bg-slate-800'} flex items-center justify-center shadow-xl shadow-black/50 group-hover:scale-105 transition-transform`}>
                    <span className="text-4xl">{guild.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{guild.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{guild.channels.length} salons disponibles</p>
                  </div>
                  <button
                    onClick={() => onJoinGuild(guild.id)}
                    className="mt-2 w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Rejoindre
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
