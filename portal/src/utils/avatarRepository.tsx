import React from 'react';

export interface AvatarOption {
  id: string;
  name: string;
  gradient: string;
  icon: React.ReactNode;
}

export const AVATAR_LIST: AvatarOption[] = [
  // ══════════════════════════════════════════════
  //  ANIMALS (Original 8)
  // ══════════════════════════════════════════════
  {
    id: 'cat',
    name: 'Gato',
    gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', // Orange
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="50" cy="52" r="28" />
        {/* Ears */}
        <path d="M22 36l12 12H18z" />
        <path d="M78 36l-12 12h16z" />
        {/* Inner Ears */}
        <path d="M24 39l8 8H20z" opacity="0.4" fill="#f87171" />
        <path d="M76 39l-8 8h8z" opacity="0.4" fill="#f87171" />
        {/* Eyes */}
        <circle cx="40" cy="48" r="4.5" fill="#000" />
        <circle cx="60" cy="48" r="4.5" fill="#000" />
        <circle cx="39.5" cy="46.5" r="1.5" fill="#fff" />
        <circle cx="59.5" cy="46.5" r="1.5" fill="#fff" />
        {/* Nose & Mouth */}
        <polygon points="50,56 46,52 54,52" fill="#ef4444" />
        <path d="M47 58c1 2 3 2 3 2s2 0 3-2" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Whiskers */}
        <line x1="14" y1="52" x2="28" y2="54" stroke="white" strokeWidth="2" opacity="0.6" />
        <line x1="12" y1="58" x2="27" y2="59" stroke="white" strokeWidth="2" opacity="0.6" />
        <line x1="86" y1="52" x2="72" y2="54" stroke="white" strokeWidth="2" opacity="0.6" />
        <line x1="88" y1="58" x2="73" y2="59" stroke="white" strokeWidth="2" opacity="0.6" />
      </svg>
    )
  },
  {
    id: 'dog',
    name: 'Cachorro',
    gradient: 'linear-gradient(135deg, #a16207 0%, #78350f 100%)', // Brown
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="50" cy="52" r="27" />
        {/* Floppy Ears */}
        <path d="M19 40c-3 10-1 22 5 22s8-8 8-18z" />
        <path d="M81 40c3 10 1 22-5 22s-8-8-8-18z" />
        {/* Eyes */}
        <circle cx="41" cy="47" r="4" fill="#000" />
        <circle cx="59" cy="47" r="4" fill="#000" />
        <circle cx="40" cy="45.5" r="1.5" fill="#fff" />
        <circle cx="58" cy="45.5" r="1.5" fill="#fff" />
        {/* Snout */}
        <ellipse cx="50" cy="59" rx="11" ry="8" fill="#e2e8f0" opacity="0.9" />
        <polygon points="50,58 45,54 55,54" fill="#000" />
        <path d="M48 60c1 2 2 2 2 2s1 0 2-2" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'panda',
    name: 'Panda',
    gradient: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)', // Green
    icon: (
      <svg viewBox="0 0 100 100" className="w-[75%] h-[75%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Ears */}
        <circle cx="28" cy="30" r="11" fill="#1e293b" />
        <circle cx="72" cy="30" r="11" fill="#1e293b" />
        {/* Head */}
        <circle cx="50" cy="53" r="28" fill="#fff" />
        {/* Black Eye Patches */}
        <ellipse cx="40" cy="50" rx="7.5" ry="10" transform="rotate(-15 40 50)" fill="#1e293b" />
        <ellipse cx="60" cy="50" rx="7.5" ry="10" transform="rotate(15 60 50)" fill="#1e293b" />
        {/* Eyes */}
        <circle cx="41" cy="48" r="3" fill="#fff" />
        <circle cx="59" cy="48" r="3" fill="#fff" />
        <circle cx="41.5" cy="47.5" r="1" fill="#000" />
        <circle cx="58.5" cy="47.5" r="1" fill="#000" />
        {/* Nose */}
        <ellipse cx="50" cy="59" rx="5" ry="3.5" fill="#1e293b" />
        {/* Cheeks */}
        <circle cx="28" cy="58" r="3.5" fill="#f43f5e" opacity="0.4" />
        <circle cx="72" cy="58" r="3.5" fill="#f43f5e" opacity="0.4" />
      </svg>
    )
  },
  {
    id: 'fox',
    name: 'Raposa',
    gradient: 'linear-gradient(135deg, #f97316 0%, #b91c1c 100%)', // Fox Red
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Ears */}
        <polygon points="18,25 34,45 14,48" fill="#c2410c" />
        <polygon points="82,25 66,45 86,48" fill="#c2410c" />
        <polygon points="21,28 31,43 17,45" fill="#1e293b" opacity="0.7" />
        <polygon points="79,28 69,43 83,45" fill="#1e293b" opacity="0.7" />
        {/* Head */}
        <polygon points="50,75 16,42 84,42" />
        {/* White Cheeks */}
        <polygon points="50,75 16,42 35,42" fill="#fff" opacity="0.95" />
        <polygon points="50,75 84,42 65,42" fill="#fff" opacity="0.95" />
        {/* Eyes */}
        <ellipse cx="37" cy="45" rx="3.5" ry="5.5" transform="rotate(-10 37 45)" fill="#1e293b" />
        <ellipse cx="63" cy="45" rx="3.5" ry="5.5" transform="rotate(10 63 45)" fill="#1e293b" />
        <circle cx="36" cy="44" r="1.2" fill="#fff" />
        <circle cx="62" cy="44" r="1.2" fill="#fff" />
        {/* Nose */}
        <circle cx="50" cy="74" r="4.5" fill="#1e293b" />
      </svg>
    )
  },
  {
    id: 'lion',
    name: 'Leão',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)', // Gold
    icon: (
      <svg viewBox="0 0 100 100" className="w-[72%] h-[72%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Mane */}
        <circle cx="50" cy="50" r="33" fill="#92400e" />
        <circle cx="50" cy="30" r="10" fill="#92400e" />
        <circle cx="30" cy="40" r="10" fill="#92400e" />
        <circle cx="70" cy="40" r="10" fill="#92400e" />
        <circle cx="30" cy="60" r="10" fill="#92400e" />
        <circle cx="70" cy="60" r="10" fill="#92400e" />
        <circle cx="50" cy="70" r="10" fill="#92400e" />
        {/* Head */}
        <circle cx="50" cy="51" r="24" />
        {/* Ears */}
        <circle cx="31" cy="35" r="7" />
        <circle cx="69" cy="35" r="7" />
        <circle cx="31" cy="35" r="4" fill="#fca5a5" opacity="0.5" />
        <circle cx="69" cy="35" r="4" fill="#fca5a5" opacity="0.5" />
        {/* Eyes */}
        <circle cx="42" cy="45" r="3.5" fill="#000" />
        <circle cx="58" cy="45" r="3.5" fill="#000" />
        <circle cx="41" cy="43.5" r="1" fill="#fff" />
        <circle cx="57" cy="43.5" r="1" fill="#fff" />
        {/* Nose & Snout */}
        <polygon points="50,56 46,51 54,51" fill="#d97706" />
        <path d="M47 58c1 2 3 2 3 2s2 0 3-2" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'owl',
    name: 'Coruja',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%)', // Purple
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <ellipse cx="50" cy="55" rx="27" ry="29" />
        {/* Ears/Tufts */}
        <polygon points="26,30 36,36 18,46" />
        <polygon points="74,30 64,36 82,46" />
        {/* Eye Circles */}
        <circle cx="37" cy="48" r="11" fill="#fff" />
        <circle cx="63" cy="48" r="11" fill="#fff" />
        {/* Pupils */}
        <circle cx="37" cy="48" r="5" fill="#1e293b" />
        <circle cx="63" cy="48" r="5" fill="#1e293b" />
        <circle cx="35" cy="46" r="1.5" fill="#fff" />
        <circle cx="61" cy="46" r="1.5" fill="#fff" />
        {/* Beak */}
        <polygon points="50,60 46,52 54,52" fill="#fbbf24" />
        {/* Breast feathers details */}
        <path d="M43 66c2 2 5 2 7 0M46 72c1 1 3 1 5 0M40 70c1 1 3 1 5 0" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
      </svg>
    )
  },
  {
    id: 'rabbit',
    name: 'Coelho',
    gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)', // Pink
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Ears */}
        <ellipse cx="37" cy="26" rx="7.5" ry="21" transform="rotate(-8 37 26)" />
        <ellipse cx="63" cy="26" rx="7.5" ry="21" transform="rotate(8 63 26)" />
        <ellipse cx="37" cy="26" rx="4.5" ry="16" transform="rotate(-8 37 26)" fill="#fda4af" opacity="0.6" />
        <ellipse cx="63" cy="26" rx="4.5" ry="16" transform="rotate(8 63 26)" fill="#fda4af" opacity="0.6" />
        {/* Head */}
        <circle cx="50" cy="56" r="25" />
        {/* Eyes */}
        <circle cx="40" cy="53" r="3.5" fill="#000" />
        <circle cx="60" cy="53" r="3.5" fill="#000" />
        <circle cx="39" cy="51.5" r="1.2" fill="#fff" />
        <circle cx="59" cy="51.5" r="1.2" fill="#fff" />
        {/* Nose & Mouth */}
        <polygon points="50,59 47,56 53,56" fill="#fca5a5" />
        <path d="M47 62c1 1 2 2 3 2s2-1 3-2" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Teeth */}
        <rect x="48" y="64" width="4" height="4" rx="0.5" fill="#fff" />
        {/* Cheeks */}
        <circle cx="30" cy="60" r="3.5" fill="#fda4af" opacity="0.5" />
        <circle cx="70" cy="60" r="3.5" fill="#fda4af" opacity="0.5" />
      </svg>
    )
  },
  {
    id: 'monkey',
    name: 'Macaco',
    gradient: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)', // Brown
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Ears */}
        <circle cx="21" cy="50" r="9" />
        <circle cx="79" cy="50" r="9" />
        <circle cx="21" cy="50" r="5" fill="#fed7aa" opacity="0.5" />
        <circle cx="79" cy="50" r="5" fill="#fed7aa" opacity="0.5" />
        {/* Head */}
        <circle cx="50" cy="51" r="26" />
        {/* Face Overlay */}
        <path d="M50 32c-7 0-13 5-13 11s5 9 13 9 13-3 13-9-6-11-13-11z" fill="#fed7aa" opacity="0.9" />
        <path d="M37 43c0 7 6 22 13 22s13-15 13-22z" fill="#fed7aa" opacity="0.9" />
        {/* Eyes */}
        <circle cx="43" cy="42" r="3.5" fill="#000" />
        <circle cx="57" cy="42" r="3.5" fill="#000" />
        <circle cx="42" cy="40.5" r="1" fill="#fff" />
        <circle cx="56" cy="40.5" r="1" fill="#fff" />
        {/* Nose & Mouth */}
        <ellipse cx="50" cy="48" rx="2.5" ry="1.5" fill="#000" opacity="0.7" />
        <path d="M43 54c3 3 11 3 14 0" stroke="black" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  },

  // ══════════════════════════════════════════════
  //  CHARACTERS (Original 8)
  // ══════════════════════════════════════════════
  {
    id: 'astronaut',
    name: 'Astronauta',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', // Dark Space
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Suit shoulders */}
        <path d="M50 64c-12 0-21 7-23 16h46c-2-9-11-16-23-16z" opacity="0.8" />
        {/* Helmet */}
        <circle cx="50" cy="43" r="24" stroke="white" strokeWidth="3.5" fill="none" />
        <circle cx="50" cy="43" r="23" />
        {/* Visor */}
        <ellipse cx="50" cy="41" rx="17" ry="11" fill="#0284c7" />
        {/* Visor reflection */}
        <path d="M42 34c4-2 9-2 12-1 4 1 6 3 6 3" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
        <circle cx="61" cy="45" r="1.5" fill="white" opacity="0.5" />
      </svg>
    )
  },
  {
    id: 'robot',
    name: 'Robô',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Metal Blue
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Ears/Side screws */}
        <rect x="18" y="44" width="6" height="12" rx="1.5" />
        <rect x="76" y="44" width="6" height="12" rx="1.5" />
        {/* Antenna */}
        <line x1="50" y1="36" x2="50" y2="24" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="20" r="4.5" fill="#f43f5e" />
        {/* Head */}
        <rect x="24" y="32" width="52" height="38" rx="8" />
        {/* Eyes (Glowing screens) */}
        <rect x="33" y="40" width="12" height="10" rx="2" fill="#000" />
        <rect x="55" y="40" width="12" height="10" rx="2" fill="#000" />
        <circle cx="39" cy="45" r="2.5" fill="#22c55e" />
        <circle cx="61" cy="45" r="2.5" fill="#22c55e" />
        {/* Mouth */}
        <rect x="36" y="56" width="28" height="6" rx="1" fill="#1e293b" />
        <line x1="43" y1="56" x2="43" y2="62" stroke="white" strokeWidth="1.5" />
        <line x1="50" y1="56" x2="50" y2="62" stroke="white" strokeWidth="1.5" />
        <line x1="57" y1="56" x2="57" y2="62" stroke="white" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'ninja',
    name: 'Ninja',
    gradient: 'linear-gradient(135deg, #374151 0%, #111827 100%)', // Dark grey/black
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Mask Head */}
        <circle cx="50" cy="50" r="28" />
        {/* Bandana tie on back */}
        <path d="M74 38c3 4 5 10 3 13L88 56l-1-6-6-8z" />
        {/* Eye cut-out */}
        <ellipse cx="50" cy="45" rx="19" ry="8" fill="#fed7aa" />
        {/* Eyes */}
        <path d="M38 45c2-1 4-1 6 1" stroke="black" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M56 45c2-1 4-1 6 1" stroke="black" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="41" cy="46" r="2" fill="#000" />
        <circle cx="59" cy="46" r="2" fill="#000" />
      </svg>
    )
  },
  {
    id: 'wizard',
    name: 'Mago',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', // Purple magic
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Beard */}
        <path d="M32 50c0 14 18 28 18 28s18-14 18-28" />
        {/* Head */}
        <circle cx="50" cy="42" r="15" fill="#fbcfe8" opacity="0.8" />
        {/* Mustache */}
        <path d="M42 52c3 1 8 0 8-2s5 3 8 2" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Eyes */}
        <circle cx="45" cy="41" r="2.5" fill="#000" />
        <circle cx="55" cy="41" r="2.5" fill="#000" />
        {/* Wizard Hat */}
        <polygon points="50,12 28,36 72,36" fill="#1e1b4b" stroke="white" strokeWidth="1.5" />
        {/* Hat Brim */}
        <ellipse cx="50" cy="36" rx="26" ry="4" fill="#1e1b4b" stroke="white" strokeWidth="1" />
        {/* Star details on hat */}
        <circle cx="50" cy="22" r="1.5" fill="#fbbf24" />
        <circle cx="44" cy="28" r="1" fill="#fbbf24" />
        <circle cx="54" cy="30" r="1" fill="#fbbf24" />
      </svg>
    )
  },
  {
    id: 'detective',
    name: 'Detetive',
    gradient: 'linear-gradient(135deg, #b45309 0%, #451a03 100%)', // Vintage Sepia
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="50" cy="50" r="25" fill="#fed7aa" opacity="0.9" />
        {/* Sunglasses / Glasses */}
        <rect x="32" y="44" width="14" height="9" rx="1.5" fill="#111827" />
        <rect x="54" y="44" width="14" height="9" rx="1.5" fill="#111827" />
        <line x1="46" y1="48" x2="54" y2="48" stroke="#111827" strokeWidth="2.5" />
        {/* Mustache */}
        <path d="M42 58c3 2 8 0 8-2s5 4 8 2" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* Fedora Hat */}
        <polygon points="50,22 30,36 70,36" fill="#1e293b" />
        <ellipse cx="50" cy="36" rx="27" ry="4" fill="#1e293b" />
        {/* Fedora Band */}
        <rect x="33" y="32" width="34" height="4" fill="#ef4444" />
      </svg>
    )
  },
  {
    id: 'superhero',
    name: 'Super-herói',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #1e3a8a 100%)', // Heroic Red/Blue
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Cape back */}
        <path d="M22 68l-8 16h72l-8-16z" fill="#dc2626" />
        {/* Head */}
        <circle cx="50" cy="42" r="22" fill="#fed7aa" />
        {/* Mask */}
        <path d="M28 42c6-3 12 1 12 1s5-4 10-4 10 4 10 4 6-4 12-1v-8c-12 0-22-2-22-2s-10 2-22 2v8z" fill="#dc2626" />
        {/* Eyes (Glowing white mask holes) */}
        <polygon points="34,40 44,40 42,43 36,43" fill="#fff" />
        <polygon points="66,40 56,40 58,43 64,43" fill="#fff" />
        {/* Smile */}
        <path d="M44 54c3 2 9 2 12 0" stroke="black" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'pirate',
    name: 'Pirata',
    gradient: 'linear-gradient(135deg, #0d9488 0%, #115e59 100%)', // Ocean Teal
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="50" cy="49" r="23" fill="#fed7aa" />
        {/* Bandana */}
        <path d="M27 42c6-6 16-8 23-8s17 2 23 8v-9c-12-8-34-8-46 0v9z" fill="#dc2626" />
        {/* Bandana tie */}
        <path d="M72 40c4-2 9 0 8 5l-7 8z" fill="#dc2626" />
        {/* Eye Patch */}
        <circle cx="41" cy="48" r="4.5" fill="#1e293b" />
        <line x1="28" y1="40" x2="52" y2="54" stroke="#1e293b" strokeWidth="3" />
        {/* Eye */}
        <circle cx="59" cy="48" r="2.5" fill="#000" />
        {/* Earring */}
        <circle cx="26" cy="51" r="4.5" stroke="#fbbf24" strokeWidth="2" fill="none" />
        {/* Smile */}
        <path d="M46 59c2 1 6 1 8 0" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'gamer',
    name: 'Gamer / Hacker',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #6366f1 100%)', // Neon Pink/Indigo
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="50" cy="48" r="24" fill="#fed7aa" />
        {/* Headset Earcups */}
        <rect x="20" y="40" width="8" height="18" rx="4" fill="#1e293b" stroke="white" strokeWidth="1.5" />
        <rect x="72" y="40" width="8" height="18" rx="4" fill="#1e293b" stroke="white" strokeWidth="1.5" />
        {/* Headset Band */}
        <path d="M24 43c0-14 11-25 26-25s26 11 26 25" stroke="#1e293b" strokeWidth="4" fill="none" />
        {/* VR Goggles */}
        <rect x="30" y="40" width="40" height="14" rx="4" fill="#1e293b" />
        <rect x="33" y="43" width="34" height="8" rx="2" fill="#06b6d4" opacity="0.8" />
        {/* Goggles Glow Detail */}
        <line x1="37" y1="47" x2="63" y2="47" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </svg>
    )
  },

  // ══════════════════════════════════════════════
  //  NEW ANIMALS (15)
  // ══════════════════════════════════════════════
  {
    id: 'koala',
    name: 'Koala',
    gradient: 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="28" cy="40" r="14" />
        <circle cx="72" cy="40" r="14" />
        <circle cx="28" cy="40" r="8" fill="#fda4af" opacity="0.5" />
        <circle cx="72" cy="40" r="8" fill="#fda4af" opacity="0.5" />
        <circle cx="50" cy="54" r="26" />
        <ellipse cx="50" cy="62" rx="12" ry="9" fill="#e2e8f0" opacity="0.8" />
        <circle cx="42" cy="50" r="3.5" fill="#000" />
        <circle cx="58" cy="50" r="3.5" fill="#000" />
        <circle cx="41" cy="48.5" r="1.2" fill="#fff" />
        <circle cx="57" cy="48.5" r="1.2" fill="#fff" />
        <ellipse cx="50" cy="58" rx="5" ry="3" fill="#1e293b" />
      </svg>
    )
  },
  {
    id: 'bear',
    name: 'Urso',
    gradient: 'linear-gradient(135deg, #a16207 0%, #713f12 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="10" />
        <circle cx="70" cy="30" r="10" />
        <circle cx="30" cy="30" r="5.5" fill="#d97706" opacity="0.6" />
        <circle cx="70" cy="30" r="5.5" fill="#d97706" opacity="0.6" />
        <circle cx="50" cy="52" r="28" />
        <ellipse cx="50" cy="60" rx="14" ry="10" fill="#fed7aa" opacity="0.7" />
        <circle cx="40" cy="47" r="3.5" fill="#000" />
        <circle cx="60" cy="47" r="3.5" fill="#000" />
        <circle cx="39" cy="45.5" r="1.2" fill="#fff" />
        <circle cx="59" cy="45.5" r="1.2" fill="#fff" />
        <ellipse cx="50" cy="56" rx="4" ry="3" fill="#1e293b" />
        <path d="M47 60c1.5 2 4.5 2 6 0" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'tiger',
    name: 'Tigre',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="28" r="9" />
        <circle cx="70" cy="28" r="9" />
        <circle cx="30" cy="28" r="5" fill="#000" opacity="0.3" />
        <circle cx="70" cy="28" r="5" fill="#000" opacity="0.3" />
        <circle cx="50" cy="52" r="27" />
        {/* Stripes */}
        <path d="M35 30c-3 4-2 8 0 8" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M65 30c3 4 2 8 0 8" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M30 45c3 2 4 6 2 8" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M70 45c-3 2-4 6-2 8" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <ellipse cx="50" cy="60" rx="12" ry="9" fill="#fff" opacity="0.9" />
        <circle cx="42" cy="48" r="3.5" fill="#000" />
        <circle cx="58" cy="48" r="3.5" fill="#000" />
        <circle cx="41" cy="46.5" r="1.2" fill="#fff" />
        <circle cx="57" cy="46.5" r="1.2" fill="#fff" />
        <polygon points="50,56 47,53 53,53" fill="#f43f5e" />
        <path d="M47 59c1.5 1.5 4.5 1.5 6 0" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'frog',
    name: 'Sapo',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #15803d 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[72%] h-[72%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="35" cy="30" r="12" fill="#22c55e" />
        <circle cx="65" cy="30" r="12" fill="#22c55e" />
        <circle cx="35" cy="30" r="7" fill="#fff" />
        <circle cx="65" cy="30" r="7" fill="#fff" />
        <circle cx="36" cy="29" r="4" fill="#000" />
        <circle cx="66" cy="29" r="4" fill="#000" />
        <circle cx="35" cy="27.5" r="1.5" fill="#fff" />
        <circle cx="65" cy="27.5" r="1.5" fill="#fff" />
        <ellipse cx="50" cy="55" rx="28" ry="22" fill="#22c55e" />
        <path d="M30 58c8 8 24 8 40 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="34" cy="52" r="4" fill="#f43f5e" opacity="0.35" />
        <circle cx="66" cy="52" r="4" fill="#f43f5e" opacity="0.35" />
      </svg>
    )
  },
  {
    id: 'pig',
    name: 'Porquinho',
    gradient: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <polygon points="28,28 38,40 20,42" />
        <polygon points="72,28 62,40 80,42" />
        <circle cx="50" cy="54" r="27" />
        <ellipse cx="50" cy="60" rx="13" ry="9" fill="#fda4af" opacity="0.8" />
        <circle cx="46" cy="59" r="2.5" fill="#e11d48" />
        <circle cx="54" cy="59" r="2.5" fill="#e11d48" />
        <circle cx="40" cy="48" r="3" fill="#000" />
        <circle cx="60" cy="48" r="3" fill="#000" />
        <circle cx="39" cy="46.5" r="1" fill="#fff" />
        <circle cx="59" cy="46.5" r="1" fill="#fff" />
      </svg>
    )
  },
  {
    id: 'elephant',
    name: 'Elefante',
    gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 38c-5 6-5 18 2 24h12V38z" />
        <path d="M82 38c5 6 5 18-2 24H68V38z" />
        <path d="M20 42c2 4 6 8 8 8" stroke="#94a3b8" strokeWidth="2" fill="none" opacity="0.5" />
        <path d="M80 42c-2 4-6 8-8 8" stroke="#94a3b8" strokeWidth="2" fill="none" opacity="0.5" />
        <circle cx="50" cy="50" r="26" />
        <circle cx="40" cy="44" r="3" fill="#000" />
        <circle cx="60" cy="44" r="3" fill="#000" />
        <circle cx="39" cy="42.5" r="1" fill="#fff" />
        <circle cx="59" cy="42.5" r="1" fill="#fff" />
        <path d="M50 54c0 6-2 14-4 18" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'sheep',
    name: 'Ovelha',
    gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[72%] h-[72%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="8" fill="#fff" />
        <circle cx="50" cy="26" r="8" fill="#fff" />
        <circle cx="70" cy="30" r="8" fill="#fff" />
        <circle cx="25" cy="44" r="8" fill="#fff" />
        <circle cx="75" cy="44" r="8" fill="#fff" />
        <circle cx="50" cy="55" r="24" fill="#fff" />
        <circle cx="30" cy="62" r="8" fill="#fff" />
        <circle cx="70" cy="62" r="8" fill="#fff" />
        <ellipse cx="50" cy="52" rx="14" ry="16" fill="#1e293b" />
        <circle cx="44" cy="48" r="2.5" fill="#fff" />
        <circle cx="56" cy="48" r="2.5" fill="#fff" />
        <circle cx="44.5" cy="47.5" r="1" fill="#000" />
        <circle cx="55.5" cy="47.5" r="1" fill="#000" />
        <ellipse cx="50" cy="56" rx="3" ry="2" fill="#94a3b8" />
        <circle cx="38" cy="56" r="3" fill="#f43f5e" opacity="0.3" />
        <circle cx="62" cy="56" r="3" fill="#f43f5e" opacity="0.3" />
      </svg>
    )
  },
  {
    id: 'penguin',
    name: 'Pinguim',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[68%] h-[68%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="54" rx="24" ry="30" fill="#1e293b" />
        <ellipse cx="50" cy="58" rx="16" ry="22" fill="#fff" />
        <circle cx="40" cy="42" r="3.5" fill="#fff" />
        <circle cx="60" cy="42" r="3.5" fill="#fff" />
        <circle cx="40.5" cy="42" r="2" fill="#000" />
        <circle cx="60.5" cy="42" r="2" fill="#000" />
        <polygon points="50,50 44,45 56,45" fill="#f97316" />
        <circle cx="36" cy="48" r="3" fill="#f43f5e" opacity="0.35" />
        <circle cx="64" cy="48" r="3" fill="#f43f5e" opacity="0.35" />
      </svg>
    )
  },
  {
    id: 'shark',
    name: 'Tubarão',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[72%] h-[72%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="52" rx="30" ry="22" fill="#64748b" />
        <polygon points="50,22 44,38 56,38" fill="#64748b" />
        <ellipse cx="50" cy="56" rx="18" ry="10" fill="#e2e8f0" />
        <circle cx="38" cy="46" r="3" fill="#fff" />
        <circle cx="62" cy="46" r="3" fill="#fff" />
        <circle cx="38.5" cy="46" r="1.5" fill="#000" />
        <circle cx="62.5" cy="46" r="1.5" fill="#000" />
        <path d="M40 58l3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3" stroke="#64748b" strokeWidth="2" fill="none" />
      </svg>
    )
  },
  {
    id: 'chicken',
    name: 'Galinha',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 18c-3 0-6 3-6 6s3 6 6 6 6-3 6-6-3-6-6-6z" fill="#ef4444" />
        <path d="M46 22c-2 0-4 2-4 4s2 4 4 4" fill="#ef4444" />
        <path d="M54 22c2 0 4 2 4 4s-2 4-4 4" fill="#ef4444" />
        <circle cx="50" cy="52" r="26" fill="#fff" />
        <circle cx="42" cy="46" r="3" fill="#000" />
        <circle cx="58" cy="46" r="3" fill="#000" />
        <circle cx="41" cy="44.5" r="1" fill="#fff" />
        <circle cx="57" cy="44.5" r="1" fill="#fff" />
        <polygon points="50,54 44,50 56,50" fill="#f97316" />
        <path d="M42 64c0 4 4 6 8 6s8-2 8-6" fill="#ef4444" opacity="0.6" />
      </svg>
    )
  },
  {
    id: 'dolphin',
    name: 'Golfinho',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[72%] h-[72%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 50c0-18 14-30 30-30 16 0 30 12 30 30 0 12-8 22-18 26l-12-6-12 6C28 72 20 62 20 50z" fill="#38bdf8" />
        <path d="M50 20c-3-6-8-6-10 0" stroke="#38bdf8" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="50" cy="56" rx="18" ry="12" fill="#e0f2fe" />
        <circle cx="38" cy="46" r="3" fill="#fff" />
        <circle cx="38.5" cy="46" r="1.5" fill="#000" />
        <path d="M46 56c2 1 6 1 8 0" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'turtle',
    name: 'Tartaruga',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #166534 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[72%] h-[72%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="55" rx="30" ry="22" fill="#15803d" />
        <path d="M35 42l15-8 15 8-15 8z" fill="#166534" stroke="#22c55e" strokeWidth="1.5" />
        <path d="M35 42l15 8 0 14" stroke="#22c55e" strokeWidth="1.5" fill="none" />
        <path d="M65 42l-15 8 0 14" stroke="#22c55e" strokeWidth="1.5" fill="none" />
        <circle cx="50" cy="38" r="12" fill="#4ade80" />
        <circle cx="46" cy="36" r="2.5" fill="#000" />
        <circle cx="54" cy="36" r="2.5" fill="#000" />
        <circle cx="45.5" cy="35" r="0.8" fill="#fff" />
        <circle cx="53.5" cy="35" r="0.8" fill="#fff" />
        <path d="M47 42c1.5 1 4.5 1 6 0" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'hamster',
    name: 'Hamster',
    gradient: 'linear-gradient(135deg, #fdba74 0%, #ea580c 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="30" r="9" />
        <circle cx="68" cy="30" r="9" />
        <circle cx="32" cy="30" r="5" fill="#fda4af" opacity="0.5" />
        <circle cx="68" cy="30" r="5" fill="#fda4af" opacity="0.5" />
        <circle cx="50" cy="53" r="27" />
        <circle cx="32" cy="56" r="10" fill="#fed7aa" opacity="0.7" />
        <circle cx="68" cy="56" r="10" fill="#fed7aa" opacity="0.7" />
        <circle cx="42" cy="48" r="3.5" fill="#000" />
        <circle cx="58" cy="48" r="3.5" fill="#000" />
        <circle cx="41" cy="46.5" r="1.2" fill="#fff" />
        <circle cx="57" cy="46.5" r="1.2" fill="#fff" />
        <polygon points="50,56 47,53 53,53" fill="#f43f5e" />
        <rect x="47" y="60" width="3" height="3" rx="0.5" fill="#fff" />
        <rect x="50" y="60" width="3" height="3" rx="0.5" fill="#fff" />
      </svg>
    )
  },
  {
    id: 'deer',
    name: 'Cervo',
    gradient: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 35l-4-12-6 4M32 35l-8-18 6-2M32 35l0-20-4-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M68 35l4-12 6 4M68 35l8-18-6-2M68 35l0-20 4-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="50" cy="54" r="25" />
        <ellipse cx="50" cy="62" rx="10" ry="7" fill="#fed7aa" opacity="0.7" />
        <circle cx="42" cy="50" r="3" fill="#000" />
        <circle cx="58" cy="50" r="3" fill="#000" />
        <circle cx="41" cy="48.5" r="1" fill="#fff" />
        <circle cx="57" cy="48.5" r="1" fill="#fff" />
        <ellipse cx="50" cy="60" rx="3.5" ry="2.5" fill="#1e293b" />
      </svg>
    )
  },
  {
    id: 'seal',
    name: 'Leão-Marinho',
    gradient: 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="52" rx="28" ry="26" fill="#94a3b8" />
        <ellipse cx="50" cy="60" rx="14" ry="10" fill="#cbd5e1" opacity="0.8" />
        <circle cx="42" cy="46" r="3.5" fill="#000" />
        <circle cx="58" cy="46" r="3.5" fill="#000" />
        <circle cx="41" cy="44.5" r="1.2" fill="#fff" />
        <circle cx="57" cy="44.5" r="1.2" fill="#fff" />
        <ellipse cx="50" cy="55" rx="3" ry="2" fill="#1e293b" />
        <line x1="20" y1="54" x2="34" y2="56" stroke="#94a3b8" strokeWidth="2" />
        <line x1="18" y1="58" x2="33" y2="59" stroke="#94a3b8" strokeWidth="2" />
        <line x1="20" y1="62" x2="34" y2="62" stroke="#94a3b8" strokeWidth="2" />
        <line x1="80" y1="54" x2="66" y2="56" stroke="#94a3b8" strokeWidth="2" />
        <line x1="82" y1="58" x2="67" y2="59" stroke="#94a3b8" strokeWidth="2" />
        <line x1="80" y1="62" x2="66" y2="62" stroke="#94a3b8" strokeWidth="2" />
      </svg>
    )
  },

  // ══════════════════════════════════════════════
  //  FANTASY & SCI-FI (10)
  // ══════════════════════════════════════════════
  {
    id: 'alien',
    name: 'Alienígena',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #064e3b 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="48" rx="26" ry="30" fill="#4ade80" />
        <ellipse cx="38" cy="44" rx="8" ry="11" fill="#000" />
        <ellipse cx="62" cy="44" rx="8" ry="11" fill="#000" />
        <ellipse cx="38" cy="44" rx="5" ry="7" fill="#22c55e" opacity="0.5" />
        <ellipse cx="62" cy="44" rx="5" ry="7" fill="#22c55e" opacity="0.5" />
        <circle cx="37" cy="42" r="2" fill="#fff" opacity="0.7" />
        <circle cx="61" cy="42" r="2" fill="#fff" opacity="0.7" />
        <ellipse cx="50" cy="62" rx="4" ry="1.5" fill="#15803d" />
      </svg>
    )
  },
  {
    id: 'ghost',
    name: 'Fantasma',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #581c87 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M26 50c0-13 10.7-24 24-24s24 11 24 24v28l-8-6-8 6-8-6-8 6-8-6-8 6V50z" fill="#fff" />
        <circle cx="42" cy="48" r="4" fill="#1e293b" />
        <circle cx="58" cy="48" r="4" fill="#1e293b" />
        <circle cx="41" cy="46.5" r="1.5" fill="#fff" />
        <circle cx="57" cy="46.5" r="1.5" fill="#fff" />
        <ellipse cx="50" cy="58" rx="4" ry="3" fill="#1e293b" />
      </svg>
    )
  },
  {
    id: 'dragon',
    name: 'Dragão',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <polygon points="24,22 34,36 18,40" fill="#fbbf24" />
        <polygon points="76,22 66,36 82,40" fill="#fbbf24" />
        <circle cx="50" cy="52" r="26" fill="#ef4444" />
        <ellipse cx="50" cy="62" rx="12" ry="8" fill="#fbbf24" opacity="0.7" />
        <ellipse cx="40" cy="46" rx="4" ry="5.5" fill="#fbbf24" />
        <ellipse cx="60" cy="46" rx="4" ry="5.5" fill="#fbbf24" />
        <ellipse cx="40" cy="47" rx="2" ry="4" fill="#000" />
        <ellipse cx="60" cy="47" rx="2" ry="4" fill="#000" />
        <circle cx="50" cy="56" r="1.5" fill="#000" />
        <circle cx="46" cy="56" r="1.5" fill="#000" />
        <circle cx="54" cy="56" r="1.5" fill="#000" />
        <path d="M43 66c3 2 11 2 14 0" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'vampire',
    name: 'Vampiro',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 24c-12 0-22 8-22 20v20h44V44c0-12-10-20-22-20z" fill="#e2e8f0" />
        <path d="M30 24l-2-10 14 10z" fill="#1e293b" />
        <path d="M70 24l2-10-14 10z" fill="#1e293b" />
        <path d="M35 22c4-8 12-10 15-10" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="42" cy="42" r="3" fill="#000" />
        <circle cx="58" cy="42" r="3" fill="#000" />
        <circle cx="43" cy="42" r="1.5" fill="#ef4444" opacity="0.8" />
        <circle cx="59" cy="42" r="1.5" fill="#ef4444" opacity="0.8" />
        <path d="M42 54c4 2 12 2 16 0" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" fill="none" />
        <polygon points="45,56 44,62 47,56" fill="#fff" />
        <polygon points="55,56 56,62 53,56" fill="#fff" />
      </svg>
    )
  },
  {
    id: 'cute-monster',
    name: 'Monstrinho',
    gradient: 'linear-gradient(135deg, #a3e635 0%, #4d7c0f 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[72%] h-[72%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="26" r="12" fill="#a3e635" />
        <circle cx="50" cy="26" r="8" fill="#fff" />
        <circle cx="50" cy="26" r="5" fill="#1e293b" />
        <circle cx="48.5" cy="24" r="2" fill="#fff" />
        <rect x="22" y="38" width="56" height="40" rx="14" fill="#84cc16" />
        <polygon points="32,40 28,30 36,36" fill="#84cc16" />
        <polygon points="68,40 72,30 64,36" fill="#84cc16" />
        <path d="M34 60c6 6 20 6 32 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
        <rect x="42" y="62" width="4" height="4" rx="1" fill="#fff" />
        <rect x="50" y="62" width="4" height="4" rx="1" fill="#fff" />
        <rect x="58" y="60" width="3" height="3" rx="0.5" fill="#fff" />
      </svg>
    )
  },
  {
    id: 'unicorn',
    name: 'Unicórnio',
    gradient: 'linear-gradient(135deg, #f0abfc 0%, #a855f7 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,8 46,30 54,30" fill="#fbbf24" />
        <circle cx="50" cy="52" r="26" fill="#fff" />
        <path d="M24 40c-2 4 0 10 4 10" stroke="#f472b6" strokeWidth="3" fill="none" />
        <path d="M76 40c2 4 0 10-4 10" stroke="#a78bfa" strokeWidth="3" fill="none" />
        <path d="M36 26c4-2 8 2 10 6" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M44 28c2-2 6 0 8 4" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M52 28c2-2 6 0 6 4" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="42" cy="50" r="3" fill="#a855f7" />
        <circle cx="58" cy="50" r="3" fill="#a855f7" />
        <circle cx="41" cy="48.5" r="1" fill="#fff" />
        <circle cx="57" cy="48.5" r="1" fill="#fff" />
        <path d="M46 60c2 1 6 1 8 0" stroke="#f0abfc" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="34" cy="56" r="3" fill="#f9a8d4" opacity="0.4" />
        <circle cx="66" cy="56" r="3" fill="#f9a8d4" opacity="0.4" />
      </svg>
    )
  },
  {
    id: 'zombie',
    name: 'Zumbi',
    gradient: 'linear-gradient(135deg, #6b7280 0%, #1f2937 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="26" fill="#86efac" opacity="0.7" />
        <path d="M36 32c2-6 8-8 14-8s12 2 14 8" stroke="#4ade80" strokeWidth="3" fill="none" />
        <circle cx="40" cy="46" r="4" fill="#fff" />
        <circle cx="60" cy="46" r="4" fill="#fff" />
        <circle cx="40" cy="47" r="2.5" fill="#000" />
        <circle cx="61" cy="45" r="2.5" fill="#000" />
        <path d="M30 46l-4 2" stroke="#86efac" strokeWidth="2" strokeLinecap="round" />
        <path d="M38 58c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        <line x1="42" y1="56" x2="42" y2="62" stroke="#1e293b" strokeWidth="1.5" />
        <line x1="50" y1="56" x2="50" y2="62" stroke="#1e293b" strokeWidth="1.5" />
        <line x1="58" y1="56" x2="58" y2="62" stroke="#1e293b" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'cyborg',
    name: 'Ciborgue',
    gradient: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="26" fill="#94a3b8" />
        <rect x="50" y="24" width="26" height="52" rx="13" fill="#475569" />
        <circle cx="40" cy="46" r="4" fill="#fff" />
        <circle cx="40" cy="46" r="2" fill="#1e293b" />
        <circle cx="39" cy="44.5" r="0.8" fill="#fff" />
        <rect x="54" y="40" width="12" height="10" rx="2" fill="#ef4444" opacity="0.9" />
        <circle cx="60" cy="45" r="3" fill="#ef4444" />
        <circle cx="60" cy="45" r="1.5" fill="#fff" opacity="0.8" />
        <line x1="66" y1="44" x2="72" y2="42" stroke="#64748b" strokeWidth="2" />
        <line x1="66" y1="46" x2="74" y2="47" stroke="#64748b" strokeWidth="2" />
        <path d="M42 60c4 2 12 2 16 0" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'fairy',
    name: 'Fada',
    gradient: 'linear-gradient(135deg, #f0abfc 0%, #c026d3 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="34" cy="40" rx="12" ry="18" fill="#f0abfc" opacity="0.4" transform="rotate(-20 34 40)" />
        <ellipse cx="66" cy="40" rx="12" ry="18" fill="#f0abfc" opacity="0.4" transform="rotate(20 66 40)" />
        <ellipse cx="30" cy="48" rx="8" ry="14" fill="#e9d5ff" opacity="0.3" transform="rotate(-30 30 48)" />
        <ellipse cx="70" cy="48" rx="8" ry="14" fill="#e9d5ff" opacity="0.3" transform="rotate(30 70 48)" />
        <circle cx="50" cy="52" r="18" fill="#fce7f3" />
        <circle cx="44" cy="50" r="2.5" fill="#a855f7" />
        <circle cx="56" cy="50" r="2.5" fill="#a855f7" />
        <circle cx="43.5" cy="49" r="0.8" fill="#fff" />
        <circle cx="55.5" cy="49" r="0.8" fill="#fff" />
        <path d="M46 57c2 1 6 1 8 0" stroke="#d946ef" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="38" cy="55" r="2.5" fill="#f9a8d4" opacity="0.4" />
        <circle cx="62" cy="55" r="2.5" fill="#f9a8d4" opacity="0.4" />
        <circle cx="72" cy="28" r="2" fill="#fbbf24" opacity="0.8" />
        <circle cx="28" cy="32" r="1.5" fill="#fbbf24" opacity="0.6" />
        <circle cx="50" cy="22" r="1.5" fill="#fbbf24" opacity="0.7" />
      </svg>
    )
  },
  {
    id: 'genie',
    name: 'Gênio',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #312e81 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 72c-4 2-10 4-12 6h44c-2-2-8-4-12-6" fill="#818cf8" opacity="0.4" />
        <path d="M42 72c2-8 4-14 8-20s4-14 2-22" stroke="#a5b4fc" strokeWidth="6" fill="none" opacity="0.4" strokeLinecap="round" />
        <circle cx="50" cy="40" r="18" fill="#818cf8" />
        <path d="M50 22c-8 0-16 4-16 8s4 4 8 2" fill="#6366f1" />
        <path d="M56 22c-2 4 0 6 4 6s6-4 4-8" fill="#fbbf24" />
        <circle cx="44" cy="38" r="2.5" fill="#fff" />
        <circle cx="56" cy="38" r="2.5" fill="#fff" />
        <circle cx="44.5" cy="38" r="1" fill="#000" />
        <circle cx="56.5" cy="38" r="1" fill="#000" />
        <path d="M44 48c3 2 9 2 12 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="36" cy="44" r="2.5" fill="#c084fc" opacity="0.4" />
        <circle cx="64" cy="44" r="2.5" fill="#c084fc" opacity="0.4" />
      </svg>
    )
  },

  // ══════════════════════════════════════════════
  //  PROFESSIONS & POPULAR CHARACTERS (15)
  // ══════════════════════════════════════════════
  {
    id: 'doctor',
    name: 'Médico',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="44" r="20" fill="#fed7aa" />
        <path d="M50 64c-14 0-24 6-26 16h52c-2-10-12-16-26-16z" fill="#fff" />
        <circle cx="50" cy="80" r="4" fill="#ef4444" />
        <line x1="50" y1="77" x2="50" y2="83" stroke="#fff" strokeWidth="2" />
        <line x1="47" y1="80" x2="53" y2="80" stroke="#fff" strokeWidth="2" />
        <circle cx="43" cy="42" r="2.5" fill="#000" />
        <circle cx="57" cy="42" r="2.5" fill="#000" />
        <path d="M46 50c2 1 6 1 8 0" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M30 60c0 6 4 10 10 10" stroke="#06b6d4" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="30" cy="56" r="3" fill="#94a3b8" />
      </svg>
    )
  },
  {
    id: 'chef',
    name: 'Chef',
    gradient: 'linear-gradient(135deg, #f97316 0%, #9a3412 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="16" r="10" fill="#fff" />
        <circle cx="38" cy="20" r="8" fill="#fff" />
        <circle cx="62" cy="20" r="8" fill="#fff" />
        <rect x="34" y="24" width="32" height="14" fill="#fff" />
        <circle cx="50" cy="52" r="22" fill="#fed7aa" />
        <circle cx="43" cy="48" r="2.5" fill="#000" />
        <circle cx="57" cy="48" r="2.5" fill="#000" />
        <path d="M40 58c3 3 8 3 10 3s7 0 10-3" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M42 60c4 1 12 1 16 0" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'firefighter',
    name: 'Bombeiro',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="52" r="22" fill="#fed7aa" />
        <rect x="28" y="28" width="44" height="16" rx="4" fill="#dc2626" />
        <rect x="32" y="22" width="36" height="10" rx="2" fill="#b91c1c" />
        <rect x="44" y="24" width="12" height="6" rx="1" fill="#fbbf24" />
        <rect x="26" y="40" width="48" height="4" rx="1" fill="#1e293b" />
        <circle cx="43" cy="50" r="2.5" fill="#000" />
        <circle cx="57" cy="50" r="2.5" fill="#000" />
        <path d="M45 58c2 1 8 1 10 0" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'artist',
    name: 'Artista',
    gradient: 'linear-gradient(135deg, #c084fc 0%, #7e22ce 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="52" r="22" fill="#fed7aa" />
        <ellipse cx="50" cy="30" rx="20" ry="10" fill="#1e293b" />
        <path d="M30 30c-4-2-6-6-2-8s8 0 8 4" fill="#1e293b" />
        <circle cx="43" cy="48" r="2.5" fill="#000" />
        <circle cx="57" cy="48" r="2.5" fill="#000" />
        <path d="M46 58c2 1 6 1 8 0" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" />
        <line x1="72" y1="30" x2="78" y2="16" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
        <circle cx="80" cy="14" r="3" fill="#f43f5e" />
        <ellipse cx="22" cy="70" rx="10" ry="8" fill="#94a3b8" opacity="0.6" />
        <circle cx="18" cy="66" r="3" fill="#ef4444" />
        <circle cx="24" cy="64" r="2.5" fill="#3b82f6" />
        <circle cx="20" cy="72" r="2.5" fill="#fbbf24" />
        <circle cx="26" cy="70" r="2" fill="#22c55e" />
      </svg>
    )
  },
  {
    id: 'scientist',
    name: 'Cientista',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #134e4a 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="48" r="22" fill="#fed7aa" />
        <rect x="32" y="38" width="14" height="10" rx="5" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        <rect x="54" y="38" width="14" height="10" rx="5" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        <line x1="46" y1="43" x2="54" y2="43" stroke="#1e293b" strokeWidth="2.5" />
        <circle cx="39" cy="43" r="2" fill="#0ea5e9" opacity="0.6" />
        <circle cx="61" cy="43" r="2" fill="#0ea5e9" opacity="0.6" />
        <path d="M34 26c4-6 12-8 16-8s12 2 16 8" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M46 56c2 1 6 1 8 0" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" />
        <rect x="70" y="56" width="8" height="18" rx="3" fill="#22d3ee" opacity="0.6" />
        <circle cx="74" cy="56" r="2" fill="#a3e635" />
      </svg>
    )
  },
  {
    id: 'pilot',
    name: 'Piloto',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="52" r="22" fill="#fed7aa" />
        <rect x="30" y="22" width="40" height="14" rx="2" fill="#1e3a8a" />
        <ellipse cx="50" cy="36" rx="26" ry="3" fill="#1e3a8a" />
        <circle cx="50" cy="28" r="4" fill="#fbbf24" />
        <rect x="32" y="42" width="14" height="8" rx="4" fill="#1e293b" />
        <rect x="54" y="42" width="14" height="8" rx="4" fill="#1e293b" />
        <rect x="35" y="44" width="8" height="4" rx="2" fill="#a5b4fc" opacity="0.5" />
        <rect x="57" y="44" width="8" height="4" rx="2" fill="#a5b4fc" opacity="0.5" />
        <path d="M46 58c2 1 6 1 8 0" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'builder',
    name: 'Construtor',
    gradient: 'linear-gradient(135deg, #eab308 0%, #a16207 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="54" r="22" fill="#fed7aa" />
        <rect x="28" y="30" width="44" height="14" rx="2" fill="#eab308" />
        <rect x="32" y="24" width="36" height="10" rx="2" fill="#fbbf24" />
        <rect x="26" y="40" width="48" height="4" rx="1" fill="#1e293b" />
        <circle cx="43" cy="50" r="2.5" fill="#000" />
        <circle cx="57" cy="50" r="2.5" fill="#000" />
        <path d="M45 60c2 1 8 1 10 0" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'diver',
    name: 'Mergulhador',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #075985 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="26" fill="#fed7aa" />
        <rect x="30" y="38" width="40" height="16" rx="8" fill="#0ea5e9" />
        <rect x="34" y="42" width="32" height="8" rx="4" fill="#fff" opacity="0.8" />
        <circle cx="42" cy="46" r="2" fill="#000" />
        <circle cx="58" cy="46" r="2" fill="#000" />
        <path d="M72 40c4-2 8 0 8 4v6" stroke="#64748b" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="80" cy="54" r="3" fill="#64748b" />
        <path d="M46 60c2 1 6 1 8 0" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'king',
    name: 'Rei',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #92400e 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="54" r="22" fill="#fed7aa" />
        <polygon points="28,32 34,16 42,28 50,10 58,28 66,16 72,32" fill="#fbbf24" />
        <rect x="28" y="30" width="44" height="8" rx="1" fill="#fbbf24" />
        <circle cx="50" cy="16" r="3" fill="#ef4444" />
        <circle cx="36" cy="22" r="2" fill="#3b82f6" />
        <circle cx="64" cy="22" r="2" fill="#22c55e" />
        <path d="M36 50c2-8 8-12 14-12s12 4 14 12" stroke="#92400e" strokeWidth="3" fill="none" />
        <circle cx="43" cy="50" r="2.5" fill="#000" />
        <circle cx="57" cy="50" r="2.5" fill="#000" />
        <path d="M44 60c3 2 9 2 12 0" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'queen',
    name: 'Rainha',
    gradient: 'linear-gradient(135deg, #e879f9 0%, #86198f 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="54" r="22" fill="#fed7aa" />
        <polygon points="30,30 36,14 44,26 50,8 56,26 64,14 70,30" fill="#fbbf24" />
        <rect x="30" y="28" width="40" height="8" rx="1" fill="#fbbf24" />
        <circle cx="50" cy="14" r="3" fill="#f43f5e" />
        <circle cx="38" cy="20" r="2" fill="#a855f7" />
        <circle cx="62" cy="20" r="2" fill="#06b6d4" />
        <path d="M32 40c4-4 10-8 18-8s14 4 18 8" stroke="#78350f" strokeWidth="3" fill="none" />
        <circle cx="43" cy="50" r="2.5" fill="#000" />
        <circle cx="57" cy="50" r="2.5" fill="#000" />
        <path d="M46 58c2 1 6 1 8 0" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="50" cy="66" r="3" fill="#fbbf24" opacity="0.6" />
      </svg>
    )
  },
  {
    id: 'viking',
    name: 'Viking',
    gradient: 'linear-gradient(135deg, #78716c 0%, #44403c 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="52" r="24" fill="#fed7aa" />
        <rect x="26" y="28" width="48" height="16" rx="4" fill="#78716c" />
        <path d="M24 36c-2-10 2-18 6-20" stroke="#a8a29e" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M76 36c2-10-2-18-6-20" stroke="#a8a29e" strokeWidth="4" fill="none" strokeLinecap="round" />
        <rect x="26" y="40" width="48" height="4" rx="1" fill="#57534e" />
        <circle cx="43" cy="50" r="2.5" fill="#000" />
        <circle cx="57" cy="50" r="2.5" fill="#000" />
        <path d="M38 60c2 4 6 8 12 8s10-4 12-8" fill="#d97706" />
        <path d="M42 64c0 6 4 10 8 10s8-4 8-10" stroke="#b45309" strokeWidth="2" fill="none" />
      </svg>
    )
  },
  {
    id: 'cowboy',
    name: 'Caubói',
    gradient: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="54" r="22" fill="#fed7aa" />
        <path d="M16 36c4 4 16 4 34 4s30 0 34-4c-2-8-14-14-34-14S18 28 16 36z" fill="#92400e" />
        <rect x="34" y="22" width="32" height="14" rx="4" fill="#a16207" />
        <rect x="42" y="26" width="16" height="6" rx="1" fill="#78350f" />
        <circle cx="43" cy="50" r="2.5" fill="#000" />
        <circle cx="57" cy="50" r="2.5" fill="#000" />
        <path d="M45 60c2 1 8 1 10 0" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'elf',
    name: 'Elfo',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #14532d 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="52" r="22" fill="#fef3c7" />
        <path d="M18 44l10 6c0 0-2-12 4-16" stroke="#fef3c7" strokeWidth="3" fill="#fef3c7" />
        <path d="M82 44l-10 6c0 0 2-12-4-16" stroke="#fef3c7" strokeWidth="3" fill="#fef3c7" />
        <path d="M34 30c4-8 10-10 16-10s12 2 16 10" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
        <polygon points="50,20 46,32 54,32" fill="#15803d" />
        <circle cx="43" cy="50" r="2.5" fill="#15803d" />
        <circle cx="57" cy="50" r="2.5" fill="#15803d" />
        <circle cx="42.5" cy="49" r="0.8" fill="#fff" />
        <circle cx="56.5" cy="49" r="0.8" fill="#fff" />
        <path d="M46 58c2 1 6 1 8 0" stroke="#15803d" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'mystic',
    name: 'Místico',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #3b0764 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="54" r="22" fill="#fed7aa" />
        <path d="M28 38c6-10 16-14 22-14s16 4 22 14" fill="#6d28d9" />
        <ellipse cx="50" cy="38" rx="26" ry="4" fill="#6d28d9" />
        <circle cx="50" cy="26" r="5" fill="#fbbf24" opacity="0.8" />
        <circle cx="43" cy="50" r="2.5" fill="#000" />
        <circle cx="57" cy="50" r="2.5" fill="#000" />
        <path d="M46 58c2 1 6 1 8 0" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="76" cy="68" r="8" fill="#c084fc" opacity="0.3" stroke="#a78bfa" strokeWidth="1.5" />
        <circle cx="76" cy="68" r="3" fill="#e9d5ff" opacity="0.5" />
      </svg>
    )
  },
  {
    id: 'clown',
    name: 'Palhaço',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="52" r="24" fill="#fff" />
        <circle cx="26" cy="34" r="8" fill="#ef4444" />
        <circle cx="50" cy="26" r="8" fill="#fbbf24" />
        <circle cx="74" cy="34" r="8" fill="#3b82f6" />
        <circle cx="30" cy="50" r="6" fill="#a3e635" />
        <circle cx="70" cy="50" r="6" fill="#a855f7" />
        <circle cx="50" cy="54" r="8" fill="#ef4444" />
        <circle cx="42" cy="46" r="3" fill="#000" />
        <circle cx="58" cy="46" r="3" fill="#000" />
        <circle cx="41" cy="44.5" r="1" fill="#fff" />
        <circle cx="57" cy="44.5" r="1" fill="#fff" />
        <path d="M38 62c5 4 14 4 24 0" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    )
  },

  // ══════════════════════════════════════════════
  //  GEEK CULTURE, FOOD & MODERN OBJECTS (10)
  // ══════════════════════════════════════════════
  {
    id: 'cactus',
    name: 'Cacto',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[68%] h-[68%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="24" width="20" height="52" rx="10" fill="#22c55e" />
        <path d="M40 50c-6 0-12-2-12-8s4-8 8-8c2 0 4 2 4 4" fill="#22c55e" />
        <path d="M60 42c6 0 12-2 12-8s-4-8-8-8c-2 0-4 2-4 4" fill="#22c55e" />
        <circle cx="50" cy="38" r="2" fill="#f43f5e" />
        <circle cx="46" cy="50" r="1.5" fill="#fbbf24" />
        <circle cx="54" cy="44" r="1.5" fill="#fbbf24" />
        <line x1="50" y1="28" x2="50" y2="30" stroke="#15803d" strokeWidth="1.5" />
        <line x1="46" y1="32" x2="46" y2="34" stroke="#15803d" strokeWidth="1.5" />
        <line x1="54" y1="36" x2="54" y2="38" stroke="#15803d" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'sunflower',
    name: 'Girassol',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #3f6212 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[72%] h-[72%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="16" rx="6" ry="12" fill="#fbbf24" />
        <ellipse cx="50" cy="16" rx="6" ry="12" fill="#fbbf24" transform="rotate(45 50 50)" />
        <ellipse cx="50" cy="16" rx="6" ry="12" fill="#fbbf24" transform="rotate(90 50 50)" />
        <ellipse cx="50" cy="16" rx="6" ry="12" fill="#fbbf24" transform="rotate(135 50 50)" />
        <ellipse cx="50" cy="16" rx="6" ry="12" fill="#f59e0b" transform="rotate(22.5 50 50)" />
        <ellipse cx="50" cy="16" rx="6" ry="12" fill="#f59e0b" transform="rotate(67.5 50 50)" />
        <ellipse cx="50" cy="16" rx="6" ry="12" fill="#f59e0b" transform="rotate(112.5 50 50)" />
        <ellipse cx="50" cy="16" rx="6" ry="12" fill="#f59e0b" transform="rotate(157.5 50 50)" />
        <circle cx="50" cy="50" r="14" fill="#78350f" />
        <circle cx="46" cy="46" r="2" fill="#000" />
        <circle cx="54" cy="46" r="2" fill="#000" />
        <circle cx="45.5" cy="45" r="0.7" fill="#fff" />
        <circle cx="53.5" cy="45" r="0.7" fill="#fff" />
        <path d="M47 53c1.5 1 4.5 1 6 0" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'pizza',
    name: 'Pizza',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,14 14,80 86,80" fill="#fbbf24" />
        <polygon points="50,22 20,76 80,76" fill="#fde68a" />
        <circle cx="42" cy="52" r="6" fill="#ef4444" />
        <circle cx="58" cy="48" r="5" fill="#ef4444" />
        <circle cx="50" cy="66" r="5.5" fill="#ef4444" />
        <circle cx="36" cy="66" r="3" fill="#22c55e" opacity="0.6" />
        <circle cx="62" cy="62" r="3" fill="#22c55e" opacity="0.6" />
        <path d="M14 80c24 6 48 6 72 0" stroke="#d97706" strokeWidth="3" fill="none" />
      </svg>
    )
  },
  {
    id: 'taco',
    name: 'Taco',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[72%] h-[72%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 60c0-20 15-36 34-36s34 16 34 36" fill="#d97706" />
        <path d="M20 60c0-16 13-30 30-30s30 14 30 30" fill="#fde68a" />
        <path d="M24 54c6-4 14-8 26-8s20 4 26 8" fill="#22c55e" />
        <circle cx="36" cy="50" r="4" fill="#ef4444" />
        <circle cx="50" cy="46" r="3.5" fill="#fbbf24" />
        <circle cx="64" cy="50" r="4" fill="#ef4444" />
        <circle cx="44" cy="54" r="3" fill="#fed7aa" opacity="0.8" />
        <circle cx="56" cy="54" r="3" fill="#fed7aa" opacity="0.8" />
      </svg>
    )
  },
  {
    id: 'rocket',
    name: 'Foguete',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[68%] h-[68%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 12c-8 10-14 24-14 38v10h28V50c0-14-6-28-14-38z" fill="#e2e8f0" />
        <path d="M36 50c-6 4-10 10-10 14h10z" fill="#3b82f6" />
        <path d="M64 50c6 4 10 10 10 14H64z" fill="#3b82f6" />
        <ellipse cx="50" cy="40" rx="6" ry="8" fill="#0ea5e9" />
        <circle cx="50" cy="38" r="3" fill="#1e293b" />
        <path d="M40 60c3 6 6 14 10 20 4-6 7-14 10-20" fill="#f97316" />
        <path d="M43 60c2 4 4 10 7 14 3-4 5-10 7-14" fill="#fbbf24" />
      </svg>
    )
  },
  {
    id: 'saturn',
    name: 'Saturno',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #1e1b4b 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[74%] h-[74%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="20" fill="#f59e0b" />
        <circle cx="50" cy="50" r="20" fill="#fbbf24" opacity="0.5" />
        <path d="M46 42c1-2 4-2 6-1" stroke="#d97706" strokeWidth="2" fill="none" opacity="0.5" />
        <ellipse cx="50" cy="50" rx="38" ry="8" fill="none" stroke="#a5b4fc" strokeWidth="3" transform="rotate(-20 50 50)" opacity="0.7" />
        <circle cx="44" cy="46" r="2" fill="#000" opacity="0.5" />
        <circle cx="56" cy="46" r="2" fill="#000" opacity="0.5" />
        <path d="M47 54c1.5 1 4.5 1 6 0" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'gamepad',
    name: 'Controle',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[72%] h-[72%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <rect x="16" y="34" width="68" height="36" rx="16" fill="#1e293b" />
        <rect x="20" y="38" width="60" height="28" rx="12" fill="#334155" />
        <rect x="32" y="48" width="12" height="4" rx="1" fill="#fff" opacity="0.8" />
        <rect x="36" y="44" width="4" height="12" rx="1" fill="#fff" opacity="0.8" />
        <circle cx="62" cy="46" r="3.5" fill="#22c55e" />
        <circle cx="70" cy="50" r="3.5" fill="#ef4444" />
        <circle cx="62" cy="54" r="3.5" fill="#3b82f6" />
        <circle cx="54" cy="50" r="3.5" fill="#fbbf24" />
      </svg>
    )
  },
  {
    id: 'coffee',
    name: 'Café',
    gradient: 'linear-gradient(135deg, #92400e 0%, #451a03 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[68%] h-[68%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M38 24c0-4 4-6 4-10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
        <path d="M50 22c0-4 4-6 4-10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
        <path d="M62 24c0-4 4-6 4-10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
        <rect x="26" y="32" width="48" height="40" rx="4" fill="#fff" />
        <rect x="30" y="36" width="40" height="32" rx="2" fill="#78350f" />
        <path d="M74 42c6 0 10 4 10 10s-4 10-10 10" stroke="#fff" strokeWidth="4" fill="none" />
        <rect x="22" y="72" width="56" height="6" rx="3" fill="#e2e8f0" />
        <circle cx="50" cy="50" r="5" fill="#92400e" opacity="0.4" />
      </svg>
    )
  },
  {
    id: 'diamond',
    name: 'Diamante',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #155e75 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,14 18,38 50,86 82,38" fill="#67e8f9" />
        <polygon points="50,14 18,38 50,38" fill="#a5f3fc" />
        <polygon points="50,14 82,38 50,38" fill="#22d3ee" />
        <polygon points="18,38 50,86 50,38" fill="#06b6d4" />
        <polygon points="82,38 50,86 50,38" fill="#0891b2" />
        <line x1="34" y1="38" x2="50" y2="14" stroke="#fff" strokeWidth="1" opacity="0.3" />
        <line x1="66" y1="38" x2="50" y2="14" stroke="#fff" strokeWidth="1" opacity="0.3" />
        <line x1="18" y1="38" x2="82" y2="38" stroke="#fff" strokeWidth="1" opacity="0.3" />
        <path d="M38 34l6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </svg>
    )
  },
  {
    id: 'hourglass',
    name: 'Ampulheta',
    gradient: 'linear-gradient(135deg, #d946ef 0%, #701a75 100%)',
    icon: (
      <svg viewBox="0 0 100 100" className="w-[64%] h-[64%] text-white fill-current" xmlns="http://www.w3.org/2000/svg">
        <rect x="26" y="14" width="48" height="6" rx="2" fill="#fff" />
        <rect x="26" y="80" width="48" height="6" rx="2" fill="#fff" />
        <path d="M30 20c0 14 8 24 20 30-12 6-20 16-20 30" stroke="#fff" strokeWidth="3" fill="none" />
        <path d="M70 20c0 14-8 24-20 30 12 6 20 16 20 30" stroke="#fff" strokeWidth="3" fill="none" />
        <path d="M34 24c0 10 6 18 16 24" fill="#fbbf24" opacity="0.5" />
        <path d="M66 24c0 10-6 18-16 24" fill="#fbbf24" opacity="0.5" />
        <path d="M34 76c0-8 6-14 16-20" fill="#fbbf24" opacity="0.3" />
        <path d="M66 76c0-8-6-14-16-20" fill="#fbbf24" opacity="0.3" />
        <circle cx="50" cy="50" r="2" fill="#fbbf24" />
      </svg>
    )
  }
];

export const getAvatarById = (id: string | null | undefined): AvatarOption | undefined => {
  if (!id) return undefined;
  return AVATAR_LIST.find(avatar => avatar.id === id);
};

export const defaultAvatarGradient = 'linear-gradient(135deg, #64183f 0%, #1a1f44 100%)';
