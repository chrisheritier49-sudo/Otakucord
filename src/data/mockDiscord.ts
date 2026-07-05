import { Guild, Message, Role, WatchPartyEvent } from '../types';

export const PRESET_ROLES: Role[] = [
  // Levels
  { id: 'lvl-genin', name: 'Génin 🍃', color: 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20', category: 'level', description: 'Nouvel arrivant sur le serveur, commence sa formation.' },
  { id: 'lvl-chunin', name: 'Chūnin ⚡', color: 'text-blue-400 bg-blue-950/40 border border-blue-500/20', category: 'level', description: 'Membre actif, a prouvé ses connaissances Otaku.' },
  { id: 'lvl-jonin', name: 'Jōnin 🔥', color: 'text-amber-400 bg-amber-950/40 border border-amber-500/20', category: 'level', description: 'Elite du serveur, guide spirituel de la communauté.' },
  { id: 'lvl-hokage', name: 'Hokage 👑', color: 'text-red-400 bg-red-950/40 border border-red-500/20', category: 'level', description: 'Légende absolue ayant complété des centaines d\'animes.' },
  
  // Interests
  { id: 'int-critique', name: 'Critique ✍️', color: 'text-purple-400 bg-purple-950/40 border border-purple-500/20', category: 'interest', description: 'Analyse en profondeur les scénarios, l\'animation et les bandes-son.' },
  { id: 'int-collectionneur', name: 'Collectionneur 🎰', color: 'text-yellow-400 bg-yellow-950/40 border border-yellow-500/20', category: 'interest', description: 'Adore les gachas, figurines et les éditions limitées de mangas.' },
  { id: 'int-cosplayer', name: 'Cosplayer 🎭', color: 'text-pink-400 bg-pink-950/40 border border-pink-500/20', category: 'interest', description: 'Confectionne et présente de sublimes costumes de héros d\'animes.' },
  { id: 'int-gamer', name: 'J-RPG Gamer 🎮', color: 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/20', category: 'interest', description: 'Passionné de J-RPG (Final Fantasy, Persona, Genshin Impact...).' },

  // Genres
  { id: 'gen-shonen', name: 'Fan Shōnen 👊', color: 'text-orange-400 bg-orange-950/40 border border-orange-500/20', category: 'genre', description: 'Adore l\'action, les combats épiques et le dépassement de soi.' },
  { id: 'gen-seinen', name: 'Fan Seinen 💀', color: 'text-zinc-400 bg-zinc-900 border border-zinc-700/50', category: 'genre', description: 'Préfère les récits sombres, psychologiques et matures.' },
  { id: 'gen-shojo', name: 'Fan Shōjo 🌸', color: 'text-rose-400 bg-rose-950/40 border border-rose-500/20', category: 'genre', description: 'Fan d\'histoires d\'amour, de tranches de vie et d\'émotions fortes.' },
  { id: 'gen-isekai', name: 'Fan Isekai 🌀', color: 'text-sky-400 bg-sky-950/40 border border-sky-500/20', category: 'genre', description: 'Rêve d\'être réincarné dans un autre monde magique.' }
];

export const PRESET_GUILDS: Guild[] = [
  {
    id: 'otaku-lounge',
    name: 'Otaku QG',
    icon: '🌸',
    banner: 'bg-gradient-to-r from-pink-500 via-rose-500 to-red-500',
    themeColor: 'pink',
    channels: [
      { id: 'ol-general', name: 'général-otaku', type: 'text', description: 'Salon principal pour parler de tout et de rien entre passionnés.', category: 'GÉNÉRAL' },
      
      { id: 'ol-news', name: 'news-saison', type: 'text', description: 'Les dernières actualités des animés en cours et rumeurs de l\'industrie.', category: 'ACTUALITÉS ANIME' },
      { id: 'ol-planning', name: 'planning-sorties', type: 'text', description: 'Le calendrier des épisodes et des sorties de tomes en VF.', category: 'ACTUALITÉS ANIME' },
      
      { id: 'ol-shonen', name: 'shonen-lounge', type: 'text', description: 'Débats enflammés sur One Piece, Jujutsu Kaisen, Demon Slayer et consorts.', category: 'DISCUSSIONS MANGA' },
      { id: 'ol-seinen', name: 'seinen-lounge', type: 'text', description: 'Récits complexes et esthétiques : Berserk, Vinland Saga, Monster...', category: 'DISCUSSIONS MANGA' },
      
      { id: 'ol-jrpg', name: 'persona-and-ff', type: 'text', description: 'Pour parler de Persona, Final Fantasy, Chrono Trigger et J-RPG cultes.', category: 'JEUX VIDÉO J-RPG' },
      { id: 'ol-gacha-games', name: 'genshin-and-starrail', type: 'text', description: 'Tes pulls et théories sur Genshin Impact, Honkai Star Rail & WuWa.', category: 'JEUX VIDÉO J-RPG' },
      
      { id: 'ol-cosplays', name: 'vos-cosplays', type: 'text', description: 'Partage tes photos de conventions et tutoriels de craft pour tes costumes !', category: 'COSPLAY & CRÉATION' },
      { id: 'ol-dessins', name: 'dessins-et-arts', type: 'text', description: 'Montre tes fanarts et reçois des retours constructifs de la communauté.', category: 'COSPLAY & CRÉATION' },
      
      { id: 'ol-mangas', name: 'manga-conseils', type: 'text', description: 'Besoin d\'un nouveau coup de cœur ? Demande aux experts !', category: 'RECOMMANDATIONS' },
      { id: 'ol-recommande-ia', name: 'recommandateur-ia', type: 'text', description: 'Demande à @Senpai une liste personnalisée selon tes filtres.', category: 'RECOMMANDATIONS' },
      
      { id: 'ol-quiz', name: '🧠-deepseek-quiz', type: 'text', description: 'Teste tes connaissances contre l\'IA DeepSeek !', category: 'OTAKU FUN' },
      { id: 'ol-trivia', name: '🏆-trivia-quizz', type: 'text', description: 'Réponds aux questions de l\'Oracle pour gagner des Otaku Coins !', category: 'OTAKU FUN' },
      { id: 'ol-watch-party', name: '📺-watch-parties', type: 'text', description: 'Planifie et regarde des épisodes d\'animes en direct avec le chat synchronisé !', category: 'OTAKU FUN' },
      { id: 'ol-roles', name: '🛡️-obtenir-des-rôles', type: 'text', description: 'Choisis tes rôles Otaku personnalisables (genres, ancienneté, cosplayer...).', category: 'OTAKU FUN' },
      
      { id: 'ol-voice', name: 'Salon Lofi 🎧', type: 'voice', description: 'Viens te détendre en écoutant de la musique de fond lofi anime.', category: 'SALONS VOCAUX' }
    ]
  },
  {
    id: 'konoha',
    name: 'Village de Konoha',
    icon: '🍃',
    banner: 'bg-gradient-to-r from-green-500 to-emerald-700',
    themeColor: 'emerald',
    channels: [
      { id: 'kn-hokage', name: 'bureau-du-hokage', type: 'text', description: 'Annonces officielles du village cachée de la feuille.', category: 'ADMINISTRATION' },
      { id: 'kn-ninjutsu', name: 'entrainement-jutsu', type: 'text', description: 'Partage tes meilleures techniques et théories sur le chakra !', category: 'ACTIVITÉS' },
      { id: 'kn-ramen', name: 'ramen-ichiraku', type: 'text', description: 'Le meilleur endroit pour manger de délicieux ramens virtuels.', category: 'ACTIVITÉS' },
      { id: 'kn-voice', name: 'Académie de Konoha ⚔️', type: 'voice', description: 'Salon vocal pour s\'entraîner dur !', category: 'SALONS VOCAUX' }
    ]
  }
];

export const INITIAL_EVENTS: WatchPartyEvent[] = [
  {
    id: 'ev-1',
    animeTitle: 'Demon Slayer - Arc Forteresse Infinie',
    episodeNumber: 1,
    scheduledTime: 'Ce soir à 21:00',
    host: 'RemBot',
    participants: ['GokuFan99', 'NarutoBot', 'SasukeBot'],
    isLive: false
  },
  {
    id: 'ev-2',
    animeTitle: 'Jujutsu Kaisen - Le Drame de Shibuya',
    episodeNumber: 12,
    scheduledTime: 'Demain à 18:30',
    host: 'Oracle',
    participants: ['GokuFan99', 'GokuBot'],
    isLive: false
  }
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  'ol-recommande-ia': [
    {
      id: 'mri1',
      channelId: 'ol-recommande-ia',
      guildId: 'otaku-lounge',
      author: { username: 'Senpai', avatar: '🔮', title: 'AI Anime Expert', isBot: true, botStyle: 'text-purple-400 bg-purple-950/40 border border-purple-500/20 px-1.5 py-0.5 rounded text-[10px]' },
      content: 'Bonjour ! Je suis @Senpai. Ici, tu peux me demander n\'importe quelle recommandation d\'anime ou de manga ! Dis-moi ce que tu as aimé et je m\'occupe du reste. 🌸✨',
      timestamp: 'À l\'instant'
    }
  ],
  'ol-quiz': [
    {
      id: 'mq1',
      channelId: 'ol-quiz',
      guildId: 'otaku-lounge',
      author: { username: 'DeepSeek', avatar: '🧠', title: 'AI Host', isBot: true, botStyle: 'text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[10px]' },
      content: 'Bonjour ! Préparez-vous à tester vos connaissances avec le DeepSeek AI Quiz !',
      timestamp: 'À l\'instant'
    }
  ],
  'ol-trivia': [
    {
      id: 'mt1',
      channelId: 'ol-trivia',
      guildId: 'otaku-lounge',
      author: { username: 'Oracle', avatar: '🧠', title: 'Trivia Master', isBot: true, botStyle: 'text-yellow-400 bg-yellow-950/40 border border-yellow-500/20 px-1.5 py-0.5 rounded text-[10px]' },
      content: 'Prêt pour tester ta culture Otaku ? 🏆 Réponds à la question en cours ou demande une nouvelle question. Chaque bonne réponse te rapporte 50 Otaku Coins ! 🔥',
      timestamp: 'À l\'instant'
    }
  ]
};
