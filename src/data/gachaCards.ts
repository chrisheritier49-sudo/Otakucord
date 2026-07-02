import { GachaCard } from '../types';

export const GACHA_CARDS: GachaCard[] = [
  // Legendary Cards
  {
    id: 'l1',
    name: 'Son Goku (Ultra Instinct)',
    anime: 'Dragon Ball Super',
    rarity: 'legendary',
    image: 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-cyan-400 text-cyan-200 border-cyan-400',
    stats: { hp: 999, atk: 999, def: 850 },
    description: 'La maîtrise ultime du corps et de l\'esprit, transcendant la puissance divine.',
    value: 200
  },
  {
    id: 'l2',
    name: 'Satoru Gojo',
    anime: 'Jujutsu Kaisen',
    rarity: 'legendary',
    image: 'bg-gradient-to-tr from-slate-900 via-purple-950 to-sky-400 text-sky-200 border-sky-400',
    stats: { hp: 950, atk: 980, def: 999 },
    description: 'Le détenteur du Sixième Œil et du Sort Infini. Le plus fort de tous.',
    value: 200
  },
  {
    id: 'l3',
    name: 'Monkey D. Luffy (Gear 5)',
    anime: 'One Piece',
    rarity: 'legendary',
    image: 'bg-gradient-to-tr from-yellow-500 via-white to-amber-200 text-amber-900 border-yellow-400',
    stats: { hp: 980, atk: 950, def: 900 },
    description: 'Le Guerrier de la Libération, incarnant le Dieu du Soleil Nika avec une liberté totale.',
    value: 200
  },
  {
    id: 'l4',
    name: 'Roronoa Zoro (King of Hell)',
    anime: 'One Piece',
    rarity: 'legendary',
    image: 'bg-gradient-to-tr from-zinc-950 via-emerald-950 to-green-500 text-emerald-300 border-emerald-400',
    stats: { hp: 890, atk: 970, def: 880 },
    description: 'Le maître du style à trois sabres, ayant dompté Enma pour libérer son Haki des Rois.',
    value: 200
  },

  // Epic Cards
  {
    id: 'e1',
    name: 'Naruto Uzumaki (Mode Chakra de Kurama)',
    anime: 'Naruto Shippuden',
    rarity: 'epic',
    image: 'bg-gradient-to-tr from-amber-950 via-orange-950 to-yellow-500 text-yellow-200 border-yellow-500',
    stats: { hp: 850, atk: 880, def: 800 },
    description: 'L\'union parfaite de la volonté de feu et du pouvoir dévastateur de Kyubi.',
    value: 100
  },
  {
    id: 'e2',
    name: 'Tanjiro Kamado (Danse du Dieu du Feu)',
    anime: 'Demon Slayer',
    rarity: 'epic',
    image: 'bg-gradient-to-tr from-stone-900 via-red-950 to-orange-600 text-red-200 border-red-500',
    stats: { hp: 800, atk: 850, def: 750 },
    description: 'L\'héritier du Souffle du Soleil, tranchant les ténèbres avec ses flammes sacrées.',
    value: 100
  },
  {
    id: 'e3',
    name: 'Nezuko Kamado (Forme Éveillée)',
    anime: 'Demon Slayer',
    rarity: 'epic',
    image: 'bg-gradient-to-tr from-pink-950 via-rose-950 to-rose-400 text-pink-200 border-pink-400',
    stats: { hp: 880, atk: 800, def: 820 },
    description: 'Un démon doté d\'une force surhumaine, qui protège l\'humanité avec ferveur.',
    value: 100
  },
  {
    id: 'e4',
    name: 'Rem (Mode Démon)',
    anime: 'Re:Zero',
    rarity: 'epic',
    image: 'bg-gradient-to-tr from-indigo-950 via-sky-950 to-indigo-400 text-sky-200 border-indigo-400',
    stats: { hp: 750, atk: 890, def: 650 },
    description: 'La servante dévouée du domaine Roswaal déchaînant la puissance de sa corne d\'ogre.',
    value: 100
  },

  // Rare Cards
  {
    id: 'r1',
    name: 'Levi Ackerman',
    anime: 'Attack on Titan',
    rarity: 'rare',
    image: 'bg-gradient-to-tr from-zinc-900 via-stone-800 to-green-800 text-stone-200 border-stone-500',
    stats: { hp: 600, atk: 850, def: 650 },
    description: 'Le soldat le plus fort de l\'humanité. Rapide, précis et impitoyable.',
    value: 50
  },
  {
    id: 'r2',
    name: 'Megumi Fushiguro',
    anime: 'Jujutsu Kaisen',
    rarity: 'rare',
    image: 'bg-gradient-to-tr from-stone-950 via-slate-900 to-indigo-900 text-slate-300 border-slate-600',
    stats: { hp: 700, atk: 720, def: 680 },
    description: 'Invocateur des ombres divines par le biais du Sort des Dix Ombres.',
    value: 50
  },
  {
    id: 'r3',
    name: 'Asuna Yuuki',
    anime: 'Sword Art Online',
    rarity: 'rare',
    image: 'bg-gradient-to-tr from-red-950 via-rose-900 to-amber-100 text-rose-200 border-rose-300',
    stats: { hp: 680, atk: 750, def: 700 },
    description: 'L\'Éclair de la guilde des Chevaliers de la Confrérie, redoutable à la rapière.',
    value: 50
  },

  // Common Cards
  {
    id: 'c1',
    name: 'Zenitsu Agatsuma',
    anime: 'Demon Slayer',
    rarity: 'common',
    image: 'bg-gradient-to-tr from-stone-900 via-amber-950 to-amber-500 text-yellow-300 border-yellow-600',
    stats: { hp: 550, atk: 680, def: 500 },
    description: 'Inconscient mais foudroyant lorsqu\'il s\'endort pour exécuter le Premier Mouvement.',
    value: 20
  },
  {
    id: 'c2',
    name: 'Killua Zoldyck',
    anime: 'Hunter x Hunter',
    rarity: 'common',
    image: 'bg-gradient-to-tr from-slate-900 via-indigo-900 to-violet-300 text-indigo-200 border-indigo-400',
    stats: { hp: 620, atk: 780, def: 580 },
    description: 'Jeune assassin de génie contrôlant l\'électricité avec son Nen de la Transformation.',
    value: 20
  },
  {
    id: 'c3',
    name: 'Deku (Izuku Midoriya)',
    anime: 'My Hero Academia',
    rarity: 'common',
    image: 'bg-gradient-to-tr from-emerald-950 via-teal-900 to-emerald-400 text-emerald-200 border-emerald-500',
    stats: { hp: 650, atk: 750, def: 600 },
    description: 'L\'héritier du One For All, donnant tout son être pour devenir le Héros Numéro 1.',
    value: 20
  }
];
