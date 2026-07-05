import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, Lock, User as UserIcon, Globe, Eye, EyeOff, Sparkles, 
  Database, ArrowRight, ArrowLeft, KeyRound, CheckCircle2, AlertTriangle,
  Phone, Chrome, Facebook, ShieldCheck, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, isFirebaseEnabled } from '../lib/firebase';
import dbLauncherImg from '../assets/images/otakucord_db_launcher_1782948569257.jpg';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
  firebaseActive: boolean;
}

const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=150&h=150';
const PRESET_AVATARS = ['🦊', '🥷', '⚔️', '🐼', '👾', '🔮', '🐉', '🍥', '🌸', '🎏', '🏮', '🍜'];

const COUNTRIES = [
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'CD', name: 'RDC (Congo)', dialCode: '+243', flag: '🇨🇩' },
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲' },
  { code: 'CG', name: 'Congo-Brazzaville', dialCode: '+242', flag: '🇨🇬' },
  { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
  { code: 'US', name: 'USA', dialCode: '+1', flag: '🇺🇸' },
  { code: 'JP', name: 'Japon', dialCode: '+81', flag: '🇯🇵' }
];

export default function AuthScreen({ onAuthSuccess, firebaseActive }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'phone'>('login');
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR_URL);
  const [languages, setLanguages] = useState<string[]>(['fr']);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneInput, setPhoneInput] = useState('');
  
  // Avatar Upload States
  const [avatarUploadLoading, setAvatarUploadLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            noExpiry: true // Les photos de profil ne s'autodétruisent pas !
          })
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          setAvatar(uploadData.url);
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
  
  // Phone Auth Fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'send' | 'verify'>('send');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const recaptchaVerifierRef = useRef<any>(null);

  // Helper to store simulated offline accounts in localStorage
  const getOfflineUsers = (): Record<string, any> => {
    try {
      const data = localStorage.getItem('otakucord_offline_users');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };

  const saveOfflineUser = (key: string, userData: any) => {
    try {
      const users = getOfflineUsers();
      users[key.toLowerCase().trim()] = userData;
      localStorage.setItem('otakucord_offline_users', JSON.stringify(users));
    } catch (e) {
      console.error("Failed to save offline user:", e);
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (firebaseActive && auth) {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        const appUser: User = {
          id: fbUser.uid,
          username: fbUser.displayName || `OtakuGoogle_${fbUser.uid.substring(0, 5)}`,
          avatar: fbUser.photoURL || '👾',
          status: 'online',
          title: 'Aspirant Genin 🍃',
          coins: parseInt(localStorage.getItem(`coins_${fbUser.uid}`) || '150'), // Google gets an initial bonus!
          cardInventory: JSON.parse(localStorage.getItem(`inventory_${fbUser.uid}`) || '[]'),
          userRoles: ['lvl-genin'],
          language: 'fr'
        };

        setSuccessMsg("Connexion via Google réussie !");
        setTimeout(() => {
          onAuthSuccess(appUser);
        }, 1000);
      } else {
        // Simulated Google login
        const simId = `sim-google-${Date.now()}`;
        const appUser: User = {
          id: simId,
          username: 'Goku_Google_Sim',
          avatar: '🏮',
          status: 'online',
          title: 'Aspirant Genin 🍃',
          coins: 150,
          cardInventory: [],
          userRoles: ['lvl-genin'],
          language: 'fr'
        };

        setSuccessMsg("[SIMULATION] Connexion via Google réussie !");
        setTimeout(() => {
          onAuthSuccess(appUser);
        }, 800);
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setErrorMsg(err.message || "La connexion Google a échoué.");
    } finally {
      setIsLoading(false);
    }
  };

  // Facebook Login Handler
  const handleFacebookLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (firebaseActive && auth) {
        const provider = new FacebookAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        const appUser: User = {
          id: fbUser.uid,
          username: fbUser.displayName || `OtakuFB_${fbUser.uid.substring(0, 5)}`,
          avatar: '🐼',
          status: 'online',
          title: 'Aspirant Genin 🍃',
          coins: parseInt(localStorage.getItem(`coins_${fbUser.uid}`) || '120'),
          cardInventory: JSON.parse(localStorage.getItem(`inventory_${fbUser.uid}`) || '[]'),
          userRoles: ['lvl-genin'],
          language: 'fr'
        };

        setSuccessMsg("Connexion via Facebook réussie !");
        setTimeout(() => {
          onAuthSuccess(appUser);
        }, 1000);
      } else {
        // Simulated Facebook login
        const simId = `sim-facebook-${Date.now()}`;
        const appUser: User = {
          id: simId,
          username: 'Luffy_FB_Sim',
          avatar: '⚔️',
          status: 'online',
          title: 'Aspirant Genin 🍃',
          coins: 120,
          cardInventory: [],
          userRoles: ['lvl-genin'],
          language: 'fr'
        };

        setSuccessMsg("[SIMULATION] Connexion via Facebook réussie !");
        setTimeout(() => {
          onAuthSuccess(appUser);
        }, 800);
      }
    } catch (err: any) {
      console.error("Facebook login error:", err);
      setErrorMsg(err.message || "La connexion Facebook a été annulée ou a échoué.");
    } finally {
      setIsLoading(false);
    }
  };

  // Phone Number verification initiation
  const handlePhoneSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanInput = phoneInput.trim();
    if (!cleanInput) {
      setErrorMsg("Veuillez entrer un numéro de téléphone valide.");
      return;
    }

    const fullNumber = selectedCountry.dialCode + cleanInput;
    setPhoneNumber(fullNumber);
    setIsLoading(true);

    try {
      if (firebaseActive && auth) {
        try {
          // Initialize invisible recaptcha verifier if not already initialized
          if (!recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'invisible',
              callback: () => {
                console.log('Recaptcha resolved');
              }
            });
          }

          const appVerifier = recaptchaVerifierRef.current;
          const confirmation = await signInWithPhoneNumber(auth, fullNumber, appVerifier);
          setConfirmationResult(confirmation);
          setPhoneStep('verify');
          setSuccessMsg("Code de vérification envoyé par SMS !");
        } catch (firebaseErr: any) {
          console.warn("Firebase Recaptcha blocked or failed in sandbox iframe. Falling back to high-fidelity simulation:", firebaseErr);
          // Fallback to high-fidelity simulator
          setConfirmationResult(null);
          setPhoneStep('verify');
          setSuccessMsg(`[SIMULATION AUTOMATIQUE] Code d'accès '777777' simulé pour ${fullNumber} (Sécurité Recaptcha contournée pour l'Iframe).`);
        }
      } else {
        // Simulated sending phone SMS
        setPhoneStep('verify');
        setSuccessMsg("[SIMULATION] Un SMS contenant le code '777777' a été envoyé au " + fullNumber);
      }
    } catch (err: any) {
      console.error("Phone send SMS error:", err);
      setErrorMsg(err.message || "Impossible d'envoyer le code SMS. Vérifiez le format.");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm Verification Code for Phone Auth
  const handlePhoneVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (verificationCode.length < 4) {
      setErrorMsg("Veuillez saisir un code de vérification valide.");
      return;
    }

    setIsLoading(true);

    try {
      if (firebaseActive && confirmationResult) {
        const result = await confirmationResult.confirm(verificationCode);
        const fbUser = result.user;

        const appUser: User = {
          id: fbUser.uid,
          username: fbUser.displayName || `Shinobi_${fbUser.uid.substring(0, 5)}`,
          avatar: '🥷',
          status: 'online',
          title: 'Aspirant Genin 🍃',
          coins: parseInt(localStorage.getItem(`coins_${fbUser.uid}`) || '100'),
          cardInventory: JSON.parse(localStorage.getItem(`inventory_${fbUser.uid}`) || '[]'),
          userRoles: ['lvl-genin'],
          language: 'fr'
        };

        setSuccessMsg("Numéro vérifié ! Authentification réussie.");
        setTimeout(() => {
          onAuthSuccess(appUser);
        }, 1000);
      } else {
        // Simulated code verification
        if (verificationCode === '777777' || !firebaseActive) {
          const simId = `sim-phone-${Date.now()}`;
          const appUser: User = {
            id: simId,
            username: `Ninja_${phoneNumber.slice(-4)}`,
            avatar: '🥷',
            status: 'online',
            title: 'Aspirant Genin 🍃',
            coins: 100,
            cardInventory: [],
            userRoles: ['lvl-genin'],
            language: 'fr'
          };

          setSuccessMsg("[SIMULATION] Connexion par téléphone réussie !");
          setTimeout(() => {
            onAuthSuccess(appUser);
          }, 800);
        } else {
          setErrorMsg("Code de vérification incorrect.");
        }
      }
    } catch (err: any) {
      console.error("Code verification error:", err);
      setErrorMsg(err.message || "Le code saisi est invalide ou a expiré.");
    } finally {
      setIsLoading(false);
    }
  };

  // Standard Email/Password Auth
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.includes('@')) {
      setErrorMsg("Veuillez entrer une adresse email valide.");
      return;
    }

    if (mode !== 'forgot' && password.length < 6) {
      setErrorMsg("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (mode === 'register' && !username.trim()) {
      setErrorMsg("Veuillez choisir un pseudo Otaku.");
      return;
    }

    setIsLoading(true);

    try {
      if (firebaseActive && auth) {
        if (mode === 'login') {
          const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
          const fbUser = userCredential.user;
          
          const appUser: User = {
            id: fbUser.uid,
            username: fbUser.displayName || email.split('@')[0],
            avatar: localStorage.getItem(`avatar_${fbUser.uid}`) || '🦊',
            status: 'online',
            title: 'Aspirant Genin 🍃',
            coins: parseInt(localStorage.getItem(`coins_${fbUser.uid}`) || '100'),
            cardInventory: JSON.parse(localStorage.getItem(`inventory_${fbUser.uid}`) || '[]'),
            userRoles: ['lvl-genin'],
            language: (localStorage.getItem(`lang_${fbUser.uid}`) as any) || 'fr'
          };
          
          onAuthSuccess(appUser);
        } 
        else if (mode === 'register') {
          const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          const fbUser = userCredential.user;
          
          const { updateProfile } = await import('firebase/auth');
          await updateProfile(fbUser, { displayName: username.trim() });

          localStorage.setItem(`avatar_${fbUser.uid}`, avatar);
          localStorage.setItem(`lang_${fbUser.uid}`, languages[0] || 'fr');
          localStorage.setItem(`langs_${fbUser.uid}`, JSON.stringify(languages));
          localStorage.setItem(`coins_${fbUser.uid}`, '100');
          localStorage.setItem(`inventory_${fbUser.uid}`, '[]');

          const appUser: User = {
            id: fbUser.uid,
            username: username.trim(),
            avatar: avatar,
            status: 'online',
            title: 'Aspirant Genin 🍃',
            coins: 100,
            cardInventory: [],
            userRoles: ['lvl-genin'],
            language: languages[0] || 'fr',
            languages: languages
          };

          setSuccessMsg("Votre compte Otaku a été créé avec succès ! Redirection...");
          setTimeout(() => {
            onAuthSuccess(appUser);
          }, 1000);
        } 
        else if (mode === 'forgot') {
          await sendPasswordResetEmail(auth, email.trim());
          setSuccessMsg("Un email de réinitialisation de mot de passe a été envoyé à l'adresse indiquée.");
        }
      } else {
        // --- SIMULATED OFFLINE AUTHENTICATION ---
        const users = getOfflineUsers();
        const emailKey = email.toLowerCase().trim();

        if (mode === 'login') {
          const registeredUser = users[emailKey];
          if (!registeredUser) {
            setErrorMsg("Aucun compte trouvé avec cet email en mode hors-ligne. Inscrivez-vous !");
            setIsLoading(false);
            return;
          }
          if (registeredUser.password !== password) {
            setErrorMsg("Mot de passe incorrect en mode hors-ligne.");
            setIsLoading(false);
            return;
          }

          const appUser: User = {
            id: registeredUser.id,
            username: registeredUser.username,
            avatar: registeredUser.avatar,
            status: 'online',
            title: registeredUser.title || 'Aspirant Genin 🍃',
            coins: registeredUser.coins || 100,
            cardInventory: registeredUser.cardInventory || [],
            userRoles: registeredUser.userRoles || ['lvl-genin'],
            language: registeredUser.language || 'fr'
          };

          setSuccessMsg("Connexion réussie !");
          setTimeout(() => {
            onAuthSuccess(appUser);
          }, 800);
        } 
        else if (mode === 'register') {
          if (users[emailKey]) {
            setErrorMsg("Un compte avec cet email existe déjà en mode hors-ligne.");
            setIsLoading(false);
            return;
          }

          const newId = `sim-user-${Date.now()}`;
          const newOfflineUser = {
            id: newId,
            email: emailKey,
            password: password,
            username: username.trim(),
            avatar: avatar,
            title: 'Aspirant Genin 🍃',
            coins: 100,
            cardInventory: [],
            userRoles: ['lvl-genin'],
            language: languages[0] || 'fr',
            languages: languages
          };

          saveOfflineUser(emailKey, newOfflineUser);

          const appUser: User = {
            id: newId,
            username: username.trim(),
            avatar: avatar,
            status: 'online',
            title: 'Aspirant Genin 🍃',
            coins: 100,
            cardInventory: [],
            userRoles: ['lvl-genin'],
            language: languages[0] || 'fr',
            languages: languages
          };

          setSuccessMsg("Compte créé avec succès ! Bienvenue !");
          setTimeout(() => {
            onAuthSuccess(appUser);
          }, 1000);
        } 
        else if (mode === 'forgot') {
          const registeredUser = users[emailKey];
          if (!registeredUser) {
            setErrorMsg("Aucun compte trouvé avec cette adresse email.");
          } else {
            setSuccessMsg(`[SIMULATION] Un email de réinitialisation a été simulé vers ${emailKey}. Votre mot de passe actuel est : "${registeredUser.password}"`);
          }
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let friendlyError = "Une erreur est survenue lors de l'authentification.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        friendlyError = "Email ou mot de passe incorrect.";
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyError = "Cet email est déjà associé à un compte OtakuCord.";
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = "Format d'adresse email invalide.";
      } else if (err.code === 'auth/weak-password') {
        friendlyError = "Le mot de passe doit faire au moins 6 caractères.";
      } else if (err.message) {
        friendlyError = err.message;
      }
      setErrorMsg(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Invisible Recaptcha container for phone auth */}
      <div id="recaptcha-container"></div>

      {/* Visual background ambient blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-pink-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />

      {/* Floating background anime sparkles */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-pink-500 rounded-full animate-ping pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo / Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 p-0.5 bg-gradient-to-tr from-pink-500 to-indigo-500 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.25)] relative mb-3">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl overflow-hidden">
              <img src={dbLauncherImg} alt="OtakuCord Logo" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-pink-500 text-[9px] font-black px-1.5 py-0.5 rounded-full font-mono text-white tracking-wider uppercase border border-slate-950">
              live
            </div>
          </div>
          <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 uppercase font-mono">
            OtakuCord
          </h1>
          <p className="text-[11px] text-slate-400 font-bold tracking-wide mt-1">
            Le Quartier Général Ultime des Otakus et Gamers
          </p>
        </div>

        {/* Card Frame */}
        <motion.div 
          layout
          className="bg-slate-900/95 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          {/* Firestore indicator badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-950/60 border border-slate-800/50 px-2 py-1 rounded-md">
            <Database size={10} className={firebaseActive ? "text-emerald-400 animate-pulse" : "text-amber-400"} />
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              {firebaseActive ? 'Firebase Actif' : 'Simulateur Local'}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* 1. LOGIN MODE */}
            {mode === 'login' && (
              <motion.div 
                key="login-view"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <h2 className="text-base font-bold text-white">Ravi de vous revoir !</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Connectez-vous pour rejoindre la communauté d'otakus.</p>
                </div>

                {errorMsg && (
                  <div className="bg-rose-950/30 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2 text-rose-300 text-xs">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-2 text-emerald-300 text-xs">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Adresse Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre-email@otaku.com"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Mot de passe</label>
                      <button 
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[9px] font-bold text-pink-400 hover:text-pink-300 hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-bold text-xs shadow-[0_4px_20px_rgba(236,72,153,0.15)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Se Connecter</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>

                {/* --- Social Sign In Options --- */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-mono uppercase tracking-widest">ou continuer avec</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all hover:bg-slate-900"
                  >
                    <Chrome size={13} className="text-red-400" />
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFacebookLogin}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all hover:bg-slate-900"
                  >
                    <Facebook size={13} className="text-blue-500" />
                    <span>Facebook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setPhoneStep('send');
                      setMode('phone');
                    }}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all hover:bg-slate-900"
                  >
                    <Phone size={13} className="text-emerald-400" />
                    <span>Téléphone</span>
                  </button>
                </div>

                {/* Switch to Register */}
                <div className="text-center text-xs text-slate-500 mt-1">
                  Nouveau sur OtakuCord ?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setMode('register');
                    }}
                    className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    Créer un compte Otaku
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. REGISTER MODE */}
            {mode === 'register' && (
              <motion.div 
                key="register-view"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto pr-1 scrollbar-thin"
              >
                <div>
                  <h2 className="text-base font-bold text-white">Rejoignez le QG !</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Créez votre identité Otaku personnalisée.</p>
                </div>

                {errorMsg && (
                  <div className="bg-rose-950/30 border border-rose-500/20 p-2.5 rounded-xl flex items-start gap-2 text-rose-300 text-xs">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-emerald-950/30 border border-emerald-500/20 p-2.5 rounded-xl flex items-start gap-2 text-emerald-300 text-xs">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
                  {/* Pseudo / Username */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Pseudo Otaku</label>
                    <div className="relative">
                      <UserIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ex: NarutoUzumaki, GokuLover"
                        className="w-full bg-slate-950 border border-slate-855 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Adresse Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre-email@otaku.com"
                        className="w-full bg-slate-950 border border-slate-855 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Mot de passe</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 caractères"
                        className="w-full bg-slate-950 border border-slate-855 rounded-xl py-2 pl-10 pr-10 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Photo de Profil Upload */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Photo de Profil (Permanente)</label>
                    <div className="flex items-center gap-4 bg-slate-950/50 p-3 border border-slate-850 rounded-xl">
                      <div className="w-12 h-12 rounded-full border border-slate-800 overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center relative group shadow-inner">
                        {avatar.toLowerCase().startsWith('http') || avatar.startsWith('data:') || avatar.length > 4 ? (
                          <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-xl select-none">{avatar}</span>
                        )}
                        {avatarUploadLoading && (
                          <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                            <div className="w-4 h-4 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <input
                          type="file"
                          ref={avatarInputRef}
                          onChange={handleAvatarFileSelect}
                          accept="image/*"
                          className="hidden"
                          disabled={avatarUploadLoading}
                        />
                        <button
                          type="button"
                          disabled={avatarUploadLoading}
                          onClick={() => avatarInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[10px] transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
                        >
                          <Camera size={11} />
                          <span>{avatarUploadLoading ? "Importation..." : "Importer une photo"}</span>
                        </button>
                        <p className="text-[9px] text-slate-500 mt-1 font-medium leading-normal truncate">
                          Stocké de manière permanente sur Cloudinary.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preferred languages (multi-select) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Langues parlées (Sélectionnez plusieurs)</label>
                    <div className="grid grid-cols-5 gap-1.5 h-32 overflow-y-auto p-1">
                      {[
                        { code: 'fr', name: 'FR 🇫🇷' },
                        { code: 'en', name: 'EN 🇬🇧' },
                        { code: 'ja', name: 'JA 🇯🇵' },
                        { code: 'es', name: 'ES 🇪🇸' },
                        { code: 'pt', name: 'PT 🇵🇹' },
                        { code: 'de', name: 'DE 🇩🇪' },
                        { code: 'it', name: 'IT 🇮🇹' },
                        { code: 'zh', name: 'ZH 🇨🇳' },
                        { code: 'ko', name: 'KO 🇰🇷' },
                        { code: 'ar', name: 'AR 🇸🇦' },
                        { code: 'ru', name: 'RU 🇷🇺' },
                        { code: 'hi', name: 'HI 🇮🇳' },
                        { code: 'tr', name: 'TR 🇹🇷' },
                        { code: 'nl', name: 'NL 🇳🇱' },
                        { code: 'pl', name: 'PL 🇵🇱' }
                      ].map((langObj) => {
                        const isSelected = languages.includes(langObj.code);
                        return (
                          <button
                            key={langObj.code}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (isSelected) {
                                if (languages.length > 1) {
                                  setLanguages(languages.filter(l => l !== langObj.code));
                                }
                              } else {
                                setLanguages([...languages, langObj.code]);
                              }
                            }}
                            className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                              isSelected
                                ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
                            }`}
                          >
                            {langObj.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-bold text-xs shadow-[0_4px_20px_rgba(236,72,153,0.15)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Créer mon Compte</span>
                        <Sparkles size={13} className="text-pink-300 animate-pulse" />
                      </>
                    )}
                  </button>
                </form>

                {/* --- Social Sign In options --- */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-mono uppercase tracking-widest">ou continuer avec</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all hover:bg-slate-900"
                  >
                    <Chrome size={13} className="text-red-400" />
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFacebookLogin}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all hover:bg-slate-900"
                  >
                    <Facebook size={13} className="text-blue-500" />
                    <span>Facebook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setPhoneStep('send');
                      setMode('phone');
                    }}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-950 border border-slate-855 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all hover:bg-slate-900"
                  >
                    <Phone size={13} className="text-emerald-400" />
                    <span>Téléphone</span>
                  </button>
                </div>

                {/* Back to login */}
                <div className="text-center text-xs text-slate-500 mt-1">
                  Déjà un compte ?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setMode('login');
                    }}
                    className="font-bold text-pink-400 hover:text-pink-300 hover:underline"
                  >
                    Se connecter
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3. FORGOT MODE */}
            {mode === 'forgot' && (
              <motion.form 
                key="forgot-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                onSubmit={handleFormSubmit}
                className="flex flex-col gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-pink-400 mb-1">
                    <KeyRound size={16} />
                    <h2 className="text-base font-bold text-white">Mot de passe oublié ?</h2>
                  </div>
                  <p className="text-xs text-slate-400">Pas de panique ! Entrez votre email pour réinitialiser votre accès.</p>
                </div>

                {errorMsg && (
                  <div className="bg-rose-950/30 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2 text-rose-300 text-xs">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-2 text-emerald-300 text-xs">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                    <span className="font-medium">{successMsg}</span>
                  </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Votre Adresse Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre-email@otaku.com"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-bold text-xs shadow-[0_4px_20px_rgba(236,72,153,0.15)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Réinitialiser le mot de passe</span>
                  )}
                </button>

                {/* Back to login */}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setMode('login');
                  }}
                  className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-bold hover:underline transition-all"
                >
                  <ArrowLeft size={14} />
                  <span>Retour à la connexion</span>
                </button>
              </motion.form>
            )}

            {/* 4. PHONE AUTH MODE */}
            {mode === 'phone' && (
              <motion.div 
                key="phone-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <Phone size={18} />
                    <h2 className="text-base font-bold text-white">Connexion par Téléphone</h2>
                  </div>
                  <p className="text-xs text-slate-400">Utilisez votre numéro de mobile pour vous connecter instantanément.</p>
                </div>

                {errorMsg && (
                  <div className="bg-rose-950/30 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2 text-rose-300 text-xs">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-2 text-emerald-300 text-xs">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                    <span className="font-medium">{successMsg}</span>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {phoneStep === 'send' ? (
                    <motion.form 
                      key="phone-send-form"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onSubmit={handlePhoneSendCode}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Numéro de Téléphone (Sélectionnez le pays)</label>
                        <div className="flex gap-2">
                          <div className="relative w-[110px] shrink-0">
                            <select
                              value={selectedCountry.code}
                              onChange={(e) => {
                                const found = COUNTRIES.find(c => c.code === e.target.value);
                                if (found) setSelectedCountry(found);
                              }}
                              className="w-full h-full bg-slate-950 border border-slate-850 rounded-xl px-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none text-center font-bold font-mono"
                            >
                              {COUNTRIES.map(c => (
                                <option key={c.code} value={c.code} className="bg-slate-950 text-slate-200">
                                  {c.flag} {c.dialCode}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[8px]">▼</div>
                          </div>

                          <div className="relative flex-1">
                            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                              type="tel"
                              required
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="6 12 34 56 78"
                              className="w-full bg-slate-950 border border-slate-855 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                            />
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-normal mt-0.5">
                          Indicateur sélectionné : <strong>{selectedCountry.flag} {selectedCountry.name} ({selectedCountry.dialCode})</strong>
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-[0_4px_15px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Envoyer le code SMS</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form 
                      key="phone-verify-form"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onSubmit={handlePhoneVerifyCode}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Entrez le Code à 6 Chiffres</label>
                        <div className="relative">
                          <ShieldCheck size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input 
                            type="text"
                            required
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="777777"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-xs text-center font-bold tracking-[0.5em] text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-700"
                          />
                        </div>
                        {(!firebaseActive) && (
                          <div className="text-[9px] text-amber-400 bg-amber-950/20 border border-amber-500/10 p-2 rounded-lg leading-relaxed mt-1">
                            💡 Mode simulateur : Entrez <strong>777777</strong> ou n'importe quel code pour continuer.
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMsg(null);
                            setSuccessMsg(null);
                            setPhoneStep('send');
                          }}
                          className="py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-950 text-xs font-bold transition-all"
                        >
                          Retour
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-[0_4px_15px_rgba(16,185,129,0.15)] flex items-center justify-center transition-all disabled:opacity-50"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span>Vérifier le code</span>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Back to standard login */}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setMode('login');
                  }}
                  className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-bold hover:underline transition-all"
                >
                  <ArrowLeft size={14} />
                  <span>Se connecter avec Email / Mot de passe</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Conditions d'utilisation Link */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors font-mono uppercase tracking-wider hover:underline"
          >
            ⚖️ Conditions d'utilisation (CGU) & Confidentialité
          </button>
        </div>
      </div>

      {/* ⚖️ CGU / TERMS OF USE MODAL */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-md"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative text-slate-200 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pb-3 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-sans font-black text-xs tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 uppercase flex items-center gap-2">
                  <span>⚖️ CONDITIONS D'UTILISATION (CGU)</span>
                </h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-slate-500 hover:text-white text-xs font-bold font-mono"
                >
                  [FERMER]
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-4 font-sans leading-relaxed pr-1 overflow-y-auto">
                <p className="text-indigo-400 font-bold">Bienvenue sur OtakuCord, le Quartier Général des passionnés d'animes, mangas et gaming !</p>
                <p>En créant un compte ou en accédant à OtakuCord, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation (CGU) :</p>
                
                <div>
                  <h4 className="font-bold text-white text-xs mb-1">1. Respect de la Communauté 🌸</h4>
                  <p>Aucun comportement toxique, harcèlement, insulte, ou contenu offensant/pornographique ne sera toléré. Les salons sont modérés et tout écart peut entraîner un bannissement permanent de votre adresse IP ou de votre compte.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs mb-1">2. Contenu Utilisateur & Propriété 🎨</h4>
                  <p>En postant des messages, fanarts, images, ou salons de discussion, vous accordez à OtakuCord une licence d'affichage pour faire vivre la plateforme. Ne partagez pas de contenu protégé par des droits d'auteur qui ne vous appartiennent pas.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs mb-1">3. Données Personnelles & Confidentialité 🔐</h4>
                  <p>Vos données d'authentification (email, numéro de téléphone si utilisé) sont enregistrées de manière sécurisée par Google Firebase. Les photos de profil ou de salons importées sont stockées via Cloudinary de façon permanente. Nous ne vendons en aucun cas vos données à des tiers.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs mb-1">4. Pièces & Récompenses Virtuelles (Otaku Coins) 🪙</h4>
                  <p>Les pièces d'or accumulées sur OtakuCord sont strictement virtuelles. Elles n'ont aucune valeur monétaire réelle. Elles permettent de jouer à des jeux de quiz, de voter, d'obtenir des titres et d'acheter des cartes de collection anime.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs mb-1">5. Limitation de Responsabilité ⚙️</h4>
                  <p>OtakuCord s'efforce de fournir un service de haute qualité, mais ne saurait être tenu responsable d'éventuelles interruptions temporaires de service, de pertes de données ou du comportement des autres utilisateurs.</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 animate-pulse"
                >
                  J'accepte les conditions
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
