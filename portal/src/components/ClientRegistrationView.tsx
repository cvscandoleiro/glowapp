import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Cake,
  EnvelopeSimple,
  PencilSimple,
  InstagramLogo,
  TwitterLogo,
  FacebookLogo,
  WhatsappLogo,
  Check,
  CaretRight,
  DeviceMobile,
  Desktop,
  MagicWand,
  MagnifyingGlass,
  CheckCircle,
  X,
  Spinner,
  MapPinLine
} from '@phosphor-icons/react';

interface ProcedureItem {
  id: string;
  title: string;
  subtitle: string;
  modules: string;
  status: 'concluido' | 'em_andamento';
  statusLabel: string;
  colorScheme: 'blue' | 'purple' | 'pink' | 'emerald' | 'amber';
  iconType: 'desktop' | 'mobile' | 'wand';
}

interface ClientProfile {
  id: string;
  name: string;
  gender: 'female' | 'male';
  avatar: string;
  inscriptionDate: string;
  birthDate: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  location: string;
  phone: string;
  isWhatsapp: boolean;
  email: string;
  instagram: string;
  xTwitter: string;
  facebook: string;
  cardNumber: string;
  planName: string;
  planBenefits: string[];
  procedures: ProcedureItem[];
}

const CLIENT_DATA: ClientProfile[] = [
  {
    id: '1',
    name: 'Clara Martin',
    gender: 'female',
    avatar: '/default_avatar_female.png',
    inscriptionDate: '03 Fevereiro 2023',
    birthDate: '21/07/1992',
    cep: '01310-100',
    address: 'Av. Paulista',
    number: '1000',
    complement: 'Apto 102',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    location: 'Lyon, France',
    phone: '06 48 72 95 31',
    isWhatsapp: true,
    email: 'clara.martin@mail.fr',
    instagram: '@clara.martin',
    xTwitter: '@claramartin_x',
    facebook: 'claramartin.glow',
    cardNumber: '•••• •••• •••• 4242',
    planName: 'Abonnement Premium',
    planBenefits: [
      'Accès à tous les soins & protocolos',
      'Ressources & cosméticos exclusivos',
      'Anamnese e acompanhamento VIP',
      'Assistance prioritaire 24/7',
      'Mises à jour e consultas regulares'
    ],
    procedures: [
      {
        id: 'p1',
        title: "Introduction au design d'interface",
        subtitle: 'Princípios chaves e cuidados fundamentais',
        modules: '6 sessões',
        status: 'concluido',
        statusLabel: 'Terminé',
        colorScheme: 'blue',
        iconType: 'desktop'
      },
      {
        id: 'p2',
        title: 'UX mobile avancé',
        subtitle: 'Tratamento regenerativo e revitalização',
        modules: '8 sessões',
        status: 'concluido',
        statusLabel: 'Terminé',
        colorScheme: 'purple',
        iconType: 'mobile'
      },
      {
        id: 'p3',
        title: 'Prototypage interactif',
        subtitle: 'Harmonização, glow skin e microagulhamento',
        modules: '5 sessões',
        status: 'em_andamento',
        statusLabel: 'En cours',
        colorScheme: 'pink',
        iconType: 'wand'
      }
    ]
  },
  {
    id: '2',
    name: 'Sophia Alcântara',
    gender: 'female',
    avatar: '/default_avatar_female.png',
    inscriptionDate: '15 Janeiro 2024',
    birthDate: '14/05/1996',
    cep: '01415-000',
    address: 'Rua Bela Cintra',
    number: '890',
    complement: 'Bloco B',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    state: 'SP',
    location: 'São Paulo, Brasil',
    phone: '(11) 98765-4321',
    isWhatsapp: true,
    email: 'sophia.alcantara@glowapp.com',
    instagram: '@sophia.glow',
    xTwitter: '@sophia_alcantara',
    facebook: 'sophia.alcantara.vip',
    cardNumber: '•••• •••• •••• 8890',
    planName: 'Glow Platinum VIP',
    planBenefits: [
      'Acesso total aos protocolos Glow',
      'Produtos home care personalizados',
      'Atendimento prioritário aos sábados',
      'Sessões de manutenção inclusas',
      'Check-in facial trimestral'
    ],
    procedures: [
      {
        id: 'p4',
        title: 'Peeling de Diamante & Glow Facial',
        subtitle: 'Renovação da derme e clareamento uniforme',
        modules: '4 sessões',
        status: 'concluido',
        statusLabel: 'Terminé',
        colorScheme: 'blue',
        iconType: 'desktop'
      },
      {
        id: 'p5',
        title: 'Bioestimulador de Colágeno',
        subtitle: 'Firmeza e contorno com ácido polilático',
        modules: '3 sessões',
        status: 'em_andamento',
        statusLabel: 'En cours',
        colorScheme: 'pink',
        iconType: 'wand'
      }
    ]
  },
  {
    id: '3',
    name: 'Mariana Vasconcelos',
    gender: 'female',
    avatar: '/default_avatar_female.png',
    inscriptionDate: '10 Março 2024',
    birthDate: '05/11/1994',
    cep: '22041-001',
    address: 'Av. Atlântica',
    number: '2500',
    complement: 'Cobertura',
    neighborhood: 'Copacabana',
    city: 'Rio de Janeiro',
    state: 'RJ',
    location: 'Rio de Janeiro, Brasil',
    phone: '(21) 98877-6655',
    isWhatsapp: true,
    email: 'mariana.vasconcelos@glowapp.com',
    instagram: '@mari.vasconcelos',
    xTwitter: '@marivasconcelos',
    facebook: 'mariana.glow',
    cardNumber: '•••• •••• •••• 9921',
    planName: 'Glow Gold Experience',
    planBenefits: [
      'Protocolos personalizados de estética',
      'Desconto especial em produtos Glow',
      'Atendimento flexível',
      'Consultoria de imagem facial'
    ],
    procedures: [
      {
        id: 'p6',
        title: 'Limpeza de Pele Profunda & LED',
        subtitle: 'Extração e fotoativação celular',
        modules: '2 sessões',
        status: 'em_andamento',
        statusLabel: 'En cours',
        colorScheme: 'blue',
        iconType: 'desktop'
      }
    ]
  },
  {
    id: '4',
    name: 'Lucas Silveira',
    gender: 'male',
    avatar: '/default_avatar_male.png',
    inscriptionDate: '12 Abril 2024',
    birthDate: '18/09/1988',
    cep: '80010-000',
    address: 'Rua XV de Novembro',
    number: '750',
    complement: 'Conjunto 401',
    neighborhood: 'Centro',
    city: 'Curitiba',
    state: 'PR',
    location: 'Curitiba, PR',
    phone: '(41)99157-3394',
    isWhatsapp: true,
    email: 'lucas.silveira@glowapp.com',
    instagram: '@lucas.silveira',
    xTwitter: '@lucas_silveira',
    facebook: 'lucas.silveira.vip',
    cardNumber: '•••• •••• •••• 5541',
    planName: 'Glow Gentleman Executive',
    planBenefits: [
      'Protocolos faciais masculinos de alta performance',
      'Atendimento privativo e exclusivo',
      'Alinhamento e rejuvenescimento facial',
      'Acompanhamento estético trimestral'
    ],
    procedures: [
      {
        id: 'p7',
        title: 'Revitalização Facial Masculina & Laser',
        subtitle: 'Tonificação celular e redução de linhas de expressão',
        modules: '4 sessões',
        status: 'em_andamento',
        statusLabel: 'En cours',
        colorScheme: 'blue',
        iconType: 'desktop'
      }
    ]
  },
  {
    id: '5',
    name: 'Dra. Camila Vasconcelos',
    gender: 'female',
    avatar: '/default_avatar_female.png',
    inscriptionDate: '20 Maio 2024',
    birthDate: '12/03/1985',
    cep: '01414-000',
    address: 'Rua Oscar Freire',
    number: '1200',
    complement: 'Sala 84',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    location: 'Jardins, São Paulo - SP',
    phone: '(11) 98123-4567',
    isWhatsapp: true,
    email: 'camila.vasconcelos@glowapp.com',
    instagram: '@dra.camila',
    xTwitter: '@dracamila',
    facebook: 'dracamila.glow',
    cardNumber: '•••• •••• •••• 1029',
    planName: 'Glow Master VIP',
    planBenefits: [
      'Protocolos Full Face Injetáveis',
      'Atendimento VIP com sala privativa',
      'Desconto em dermocosméticos',
      'Suporte prioritário 24/7'
    ],
    procedures: [
      {
        id: 'p8',
        title: 'Harmonização Facial Full Face',
        subtitle: 'Toxina botulínica e preenchimento com ácido hialurônico',
        modules: '3 sessões',
        status: 'em_andamento',
        statusLabel: 'En cours',
        colorScheme: 'purple',
        iconType: 'wand'
      }
    ]
  },
  {
    id: '6',
    name: 'Fernanda Martins',
    gender: 'female',
    avatar: '/default_avatar_female.png',
    inscriptionDate: '05 Junho 2024',
    birthDate: '28/08/1997',
    cep: '05422-000',
    address: 'Rua dos Pinheiros',
    number: '450',
    complement: 'Apto 32',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    state: 'SP',
    location: 'Pinheiros, São Paulo - SP',
    phone: '(11) 97654-3210',
    isWhatsapp: true,
    email: 'fernanda.martins@glowapp.com',
    instagram: '@fe.martins',
    xTwitter: '@femartins',
    facebook: 'femartins.glow',
    cardNumber: '•••• •••• •••• 3314',
    planName: 'Glow Express',
    planBenefits: [
      'Design e micropigmentação de sobrancelhas',
      'Manutenção periódica inclusa',
      'Kit home care'
    ],
    procedures: [
      {
        id: 'p9',
        title: 'Micropigmentação Shadow Line',
        subtitle: 'Definição natural e preenchimento de fios',
        modules: '2 sessões',
        status: 'em_andamento',
        statusLabel: 'En cours',
        colorScheme: 'pink',
        iconType: 'wand'
      }
    ]
  },
  {
    id: '7',
    name: 'Mariana Lima Santos',
    gender: 'female',
    avatar: '/default_avatar_female.png',
    inscriptionDate: '18 Julho 2024',
    birthDate: '30/01/1991',
    cep: '22070-010',
    address: 'Av. Nossa Sra. de Copacabana',
    number: '800',
    complement: 'Apto 1204',
    neighborhood: 'Copacabana',
    city: 'Rio de Janeiro',
    state: 'RJ',
    location: 'Copacabana, Rio de Janeiro - RJ',
    phone: '(21) 99876-5432',
    isWhatsapp: true,
    email: 'mariana.lima@glowapp.com',
    instagram: '@mari.limasantos',
    xTwitter: '@marilima',
    facebook: 'marilima.glow',
    cardNumber: '•••• •••• •••• 6672',
    planName: 'Glow Corporal Prime',
    planBenefits: [
      'Drenagem linfática e massagem modeladora',
      'Avaliação bioimpedância periódica',
      'Acompanhamento estético'
    ],
    procedures: [
      {
        id: 'p10',
        title: 'Drenagem Linfática & Modeladora',
        subtitle: 'Redução de retenção e contorno corporal',
        modules: '8 sessões',
        status: 'em_andamento',
        statusLabel: 'En cours',
        colorScheme: 'blue',
        iconType: 'desktop'
      }
    ]
  },
  {
    id: '8',
    name: 'Luciana Queiroz',
    gender: 'female',
    avatar: '/default_avatar_female.png',
    inscriptionDate: '01 Agosto 2024',
    birthDate: '19/12/1989',
    cep: '04515-000',
    address: 'Av. Moema',
    number: '310',
    complement: 'Bloco A',
    neighborhood: 'Moema',
    city: 'São Paulo',
    state: 'SP',
    location: 'Moema, São Paulo - SP',
    phone: '(11) 99432-1098',
    isWhatsapp: true,
    email: 'luciana.queiroz@glowapp.com',
    instagram: '@lu.queiroz',
    xTwitter: '@luqueiroz',
    facebook: 'luqueiroz.glow',
    cardNumber: '•••• •••• •••• 9981',
    planName: 'Glow Platinum',
    planBenefits: [
      'Consultoria de skincare personalizada',
      'Limpeza de pele com fototerapia',
      'Acompanhamento trimestral'
    ],
    procedures: [
      {
        id: 'p11',
        title: 'Avaliação de Retorno e Skincare',
        subtitle: 'Check-up cutâneo e ajuste da rotina home care',
        modules: '1 sessão',
        status: 'concluido',
        statusLabel: 'Terminé',
        colorScheme: 'emerald',
        iconType: 'wand'
      }
    ]
  },
  {
    id: '9',
    name: 'Juliana Paes Ferreira',
    gender: 'female',
    avatar: '/default_avatar_female.png',
    inscriptionDate: '14 Agosto 2024',
    birthDate: '08/04/1993',
    cep: '22631-000',
    address: 'Av. Lúcio Costa',
    number: '3500',
    complement: 'Apto 502',
    neighborhood: 'Barra da Tijuca',
    city: 'Rio de Janeiro',
    state: 'RJ',
    location: 'Barra da Tijuca, Rio de Janeiro - RJ',
    phone: '(21) 98765-1122',
    isWhatsapp: true,
    email: 'juliana.paes@glowapp.com',
    instagram: '@ju.paesferreira',
    xTwitter: '@jupaes',
    facebook: 'jupaes.glow',
    cardNumber: '•••• •••• •••• 4455',
    planName: 'Glow Diamond Exclusive',
    planBenefits: [
      'Peelings químicos e renovação celular',
      'Microagulhamento drug delivery',
      'Atendimento com dermatologista associada'
    ],
    procedures: [
      {
        id: 'p12',
        title: 'Peeling Químico Iluminador',
        subtitle: 'Ácido glicólico e vitamina C nanoencapsulada',
        modules: '3 sessões',
        status: 'em_andamento',
        statusLabel: 'En cours',
        colorScheme: 'amber',
        iconType: 'wand'
      }
    ]
  }
];

const getClientAvatar = (gender?: 'female' | 'male', avatar?: string): string => {
  if (gender === 'male') {
    return avatar?.trim() ? avatar : '/default_avatar_male.png';
  }
  return avatar?.trim() ? avatar : '/default_avatar_female.png';
};

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)})${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)})${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
};

const formatDate = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};

export interface ClientRegistrationViewProps {
  initialClientId?: string;
  initialClientName?: string;
}

import { clientService } from '../services/clientService';

export const ClientRegistrationView: React.FC<ClientRegistrationViewProps> = ({
  initialClientId,
  initialClientName
}) => {
  const [clients, setClients] = useState<ClientProfile[]>(CLIENT_DATA);

  // Load clients asynchronously from Supabase / localStorage on mount
  useEffect(() => {
    clientService.getClients(CLIENT_DATA).then(loaded => {
      if (loaded && loaded.length > 0) {
        setClients(loaded);
      }
    });
  }, []);

  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (initialClientId) return initialClientId;
    if (initialClientName) {
      const found = CLIENT_DATA.find(c =>
        c.name.toLowerCase().includes(initialClientName.toLowerCase()) ||
        initialClientName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (found) return found.id;
    }
    return '1';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Sync selected client if initialClientId or initialClientName changes
  React.useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId);
    } else if (initialClientName) {
      const found = clients.find(c =>
        c.name.toLowerCase().includes(initialClientName.toLowerCase()) ||
        initialClientName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (found) {
        setSelectedClientId(found.id);
      }
    }
  }, [initialClientId, initialClientName, clients]);

  const currentClient = clients.find(c => c.id === selectedClientId) || clients[0];
  const [editFormData, setEditFormData] = useState<ClientProfile>(currentClient);

  // Sync editing form data when selected client changes
  React.useEffect(() => {
    if (currentClient) {
      setEditFormData(currentClient);
    }
  }, [selectedClientId, currentClient]);

  // Handle CEP automatic search on blur (ViaCEP)
  const handleCepBlur = async (cepInput: string) => {
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setEditFormData(prev => ({
            ...prev,
            cep: cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2'),
            address: data.logradouro || prev.address,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
            location: `${data.localidade || prev.city}, ${data.uf || prev.state}`
          }));
        }
      } catch (err) {
        console.error('Erro ao consultar CEP:', err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClients(prev =>
      prev.map(c => (c.id === editFormData.id ? { ...editFormData } : c))
    );
    await clientService.saveClient(editFormData);
    setIsEditing(false);
    setNotification('Informações da cliente salvas com sucesso!');
    setTimeout(() => setNotification(null), 4000);
  };

  const getProcedureIcon = (type: ProcedureItem['iconType'], scheme: ProcedureItem['colorScheme']) => {
    const iconClass =
      scheme === 'blue'
        ? 'text-[#6366f1]'
        : scheme === 'purple'
        ? 'text-[#8b5cf6]'
        : 'text-[#ec4899]';

    switch (type) {
      case 'desktop':
        return <Desktop size={24} className={iconClass} weight="duotone" />;
      case 'mobile':
        return <DeviceMobile size={24} className={iconClass} weight="duotone" />;
      case 'wand':
      default:
        return <MagicWand size={24} className={iconClass} weight="duotone" />;
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto px-4 sm:px-8 py-6 max-w-6xl mx-auto scrollbar-thin scrollbar-thumb-rose-200/50 scrollbar-track-transparent">
      
      {/* Top Controls Bar (Search & Client Quick Select) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 z-10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/90 backdrop-blur-md border border-rose-200/80 rounded-2xl text-xs font-semibold text-rose-950 placeholder-rose-400 focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm w-52 sm:w-64"
            />
          </div>

          {filteredClients.length > 1 && (
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="bg-white/90 backdrop-blur-md border border-rose-200/80 text-rose-900 text-xs font-bold py-2 px-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm cursor-pointer"
            >
              {filteredClients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {notification && (
          <div className="flex items-center space-x-2 bg-rose-50 text-rose-900 border border-rose-200 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm animate-fade-in">
            <CheckCircle size={16} weight="fill" className="text-rose-600" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      <div className="space-y-6 pb-12">
        {/* ========================================================= */}
        {/* TOP PROFILE HERO CARD (Matches Reference Image Top Section) */}
        {/* ========================================================= */}
        <div className="bg-white/95 backdrop-blur-xl border border-rose-100/80 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(244,114,182,0.14)] relative transition-all">
          
          {/* Top-Right Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 transition-all border border-rose-200/80 shadow-sm active:scale-95"
            title="Editar Informações da Cliente"
          >
            <PencilSimple size={18} weight="bold" />
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 sm:gap-8">
            {/* Left Column: Circular Profile Avatar with Social Media Icons Aligned with Telefone */}
            <div className="flex flex-col items-center justify-between shrink-0 space-y-3 sm:space-y-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-[#d8b4fe]/50 via-[#fbcfe8]/40 to-[#c7d2fe]/60 shadow-[0_10px_25px_rgba(192,132,252,0.22)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white flex items-center justify-center">
                  <img
                    src={getClientAvatar(currentClient.gender, currentClient.avatar)}
                    alt={currentClient.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getClientAvatar(currentClient.gender);
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Social / Channel Icon Badges (X, Instagram, Facebook, WhatsApp) */}
              <div className="flex items-center justify-center gap-2.5 pt-2">
                {/* X (Twitter) */}
                <a
                  href={`https://twitter.com/${currentClient.xTwitter.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`X: ${currentClient.xTwitter}`}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f472b6] to-[#db2777] text-[#fef08a] border border-amber-200/90 flex items-center justify-center hover:from-[#f472b6] hover:to-[#be185d] hover:text-amber-100 hover:border-amber-100 hover:scale-110 transition-all shadow-md shadow-pink-500/20"
                >
                  <TwitterLogo size={16} weight="fill" />
                </a>

                {/* Instagram */}
                <a
                  href={`https://instagram.com/${currentClient.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`Instagram: ${currentClient.instagram}`}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f472b6] to-[#db2777] text-[#fef08a] border border-amber-200/90 flex items-center justify-center hover:from-[#f472b6] hover:to-[#be185d] hover:text-amber-100 hover:border-amber-100 hover:scale-110 transition-all shadow-md shadow-pink-500/20"
                >
                  <InstagramLogo size={16} weight="bold" />
                </a>

                {/* Facebook */}
                <a
                  href={`https://facebook.com/${currentClient.facebook}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`Facebook: ${currentClient.facebook}`}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f472b6] to-[#db2777] text-[#fef08a] border border-amber-200/90 flex items-center justify-center hover:from-[#f472b6] hover:to-[#be185d] hover:text-amber-100 hover:border-amber-100 hover:scale-110 transition-all shadow-md shadow-pink-500/20"
                >
                  <FacebookLogo size={16} weight="fill" />
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/55${currentClient.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`WhatsApp: ${currentClient.phone}`}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f472b6] to-[#db2777] text-[#fef08a] border border-amber-200/90 flex items-center justify-center hover:from-[#f472b6] hover:to-[#be185d] hover:text-amber-100 hover:border-amber-100 hover:scale-110 transition-all shadow-md shadow-pink-500/20"
                >
                  <WhatsappLogo size={16} weight="fill" />
                </a>
              </div>
            </div>

            {/* Profile Info Details List */}
            <div className="flex-1 flex flex-col justify-between py-0.5 text-center md:text-left space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[#64183f] tracking-tight">
                {currentClient.name}
              </h1>

              <div className="space-y-2.5 text-xs sm:text-sm text-rose-900/80 font-medium">
                {/* 1. Bairro (Bairro, Cidade, UF) */}
                <div className="flex items-center justify-center md:justify-start space-x-2.5">
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-rose-400" />
                  </div>
                  <span>
                    <strong className="text-rose-950 font-bold">Bairro :</strong>{' '}
                    {currentClient.neighborhood || currentClient.city
                      ? `${currentClient.neighborhood ? currentClient.neighborhood + ', ' : ''}${currentClient.city || ''}${currentClient.state ? ' - ' + currentClient.state : ''}`
                      : currentClient.location || 'Não informado'}
                  </span>
                </div>

                {/* 2. Data Nascimento */}
                <div className="flex items-center justify-center md:justify-start space-x-2.5">
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <Cake size={18} className="text-rose-400" />
                  </div>
                  <span>
                    <strong className="text-rose-950 font-bold">Data Nascimento :</strong> {currentClient.birthDate}
                  </span>
                </div>

                {/* 3. Email */}
                <div className="flex items-center justify-center md:justify-start space-x-2.5">
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <EnvelopeSimple size={18} className="text-rose-400" />
                  </div>
                  <span>
                    <strong className="text-rose-950 font-bold">E-mail :</strong> {currentClient.email}
                  </span>
                </div>

                {/* 4. Telefone */}
                <div className="flex items-center justify-center md:justify-start space-x-2.5">
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <WhatsappLogo size={18} className="text-rose-400" />
                  </div>
                  <span>
                    <strong className="text-rose-950 font-bold">Telefone :</strong> {currentClient.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM 2-COLUMN SECTION (Timeline/Formations + Payment/VIP) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Mes formations / Histórico de Procedimentos (7 cols) */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-xl border border-rose-100/80 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(244,114,182,0.14)]">
            <h2 className="text-xl sm:text-2xl font-black text-[#64183f] tracking-tight mb-6">
              Mes formations
            </h2>

            {/* Vertical Timeline Container */}
            <div className="relative pl-6 space-y-6">
              {/* Vertical connecting line */}
              <div className="absolute left-2.5 top-5 bottom-8 w-0.5 bg-[#8b5cf6]/35" />

              {currentClient.procedures.map((proc) => {
                const isBlue = proc.colorScheme === 'blue';
                const isPurple = proc.colorScheme === 'purple';

                const cardBg = isBlue
                  ? 'bg-[#eff6ff]/90 border-[#dbeafe]'
                  : isPurple
                  ? 'bg-[#f5f3ff]/90 border-[#ede9fe]'
                  : 'bg-[#fdf2f8]/90 border-[#fce7f3]';

                const iconBoxBg = isBlue
                  ? 'bg-[#dbeafe]'
                  : isPurple
                  ? 'bg-[#ede9fe]'
                  : 'bg-[#fce7f3]';

                const arrowBtnBg = isBlue
                  ? 'bg-[#c7d2fe] text-[#4f46e5]'
                  : isPurple
                  ? 'bg-[#ddd6fe] text-[#7c3aed]'
                  : 'bg-[#fbcfe8] text-[#db2777]';

                return (
                  <div key={proc.id} className="relative flex items-center">
                    {/* Timeline circular node marker */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-4 border-[#6d5fb4] shadow-sm z-10" />

                    {/* Procedure Card */}
                    <div className={`w-full flex items-center justify-between p-4 sm:p-5 rounded-3xl border ${cardBg} shadow-sm hover:shadow-md transition-all`}>
                      <div className="flex items-center space-x-4">
                        {/* Icon Circle */}
                        <div className={`w-14 h-14 rounded-2xl ${iconBoxBg} flex items-center justify-center shrink-0`}>
                          {getProcedureIcon(proc.iconType, proc.colorScheme)}
                        </div>

                        {/* Title & Subtitle */}
                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-800 leading-snug">
                            {proc.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {proc.subtitle}
                          </p>
                          <span className="text-[11px] font-semibold text-slate-400 mt-1 inline-block">
                            {proc.modules}
                          </span>
                        </div>
                      </div>

                      {/* Right Status Badge & Arrow Action */}
                      <div className="flex items-center space-x-3 shrink-0 ml-3">
                        {proc.status === 'concluido' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#22c55e] text-white shadow-sm">
                            {proc.statusLabel}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#5d51a6] text-white shadow-sm">
                            {proc.statusLabel}
                          </span>
                        )}

                        <button
                          type="button"
                          className={`w-8 h-8 rounded-full ${arrowBtnBg} flex items-center justify-center transition-transform hover:scale-110 active:scale-95`}
                        >
                          <CaretRight size={16} weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Button "Voir toutes mes formations" */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                className="px-6 py-2.5 rounded-full bg-[#f1f0fb] hover:bg-[#e6e4f8] text-[#5d51a6] font-extrabold text-xs tracking-wide transition-all shadow-sm active:scale-95"
              >
                Voir toutes mes formations
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Informations de paiement + Abonnement Premium (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Card 1: Informations de paiement */}
            <div className="bg-white/95 backdrop-blur-xl border border-rose-100/80 rounded-[32px] p-6 sm:p-7 shadow-[0_20px_50px_-15px_rgba(244,114,182,0.14)]">
              <h3 className="text-base sm:text-lg font-black text-[#64183f] tracking-tight mb-4">
                Informations de paiement
              </h3>

              <label className="block text-xs font-bold text-rose-900 mb-2">
                Carte bancaire
              </label>

              {/* Masked Card Number Field */}
              <div className="w-full bg-[#f8fafc] border border-rose-100 rounded-2xl px-4 py-3 text-slate-700 font-mono text-sm tracking-widest mb-5 shadow-inner">
                {currentClient.cardNumber}
              </div>

              {/* Payment Methods Badges Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Mastercard */}
                <div className="h-12 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-center p-2 shadow-sm hover:shadow transition-all">
                  <div className="flex items-center -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-[#eb001b] opacity-90" />
                    <div className="w-6 h-6 rounded-full bg-[#f79e1b] opacity-90" />
                  </div>
                </div>

                {/* VISA */}
                <div className="h-12 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-center p-2 shadow-sm hover:shadow transition-all">
                  <span className="font-black italic text-lg tracking-tighter text-[#1a1f71]">
                    VISA
                  </span>
                </div>

                {/* AMEX */}
                <div className="h-12 bg-[#2e77bb] rounded-2xl flex items-center justify-center p-2 shadow-sm hover:shadow transition-all">
                  <span className="font-black text-xs text-white tracking-wider">
                    AMEX
                  </span>
                </div>

                {/* Apple Pay */}
                <div className="h-12 bg-black rounded-2xl flex items-center justify-center p-2 shadow-sm hover:shadow transition-all">
                  <span className="text-white text-xs font-bold flex items-center space-x-1">
                    <span></span>
                    <span>Pay</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Abonnement Premium (Deep Royal Violet Card) */}
            <div className="bg-[#534685] text-white rounded-[32px] p-6 sm:p-7 shadow-[0_20px_50px_-15px_rgba(83,70,133,0.4)] relative overflow-hidden">
              {/* Ethereal background gradient overlay */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
              
              <h3 className="text-lg font-black text-white tracking-tight mb-4 leading-snug">
                {currentClient.planName}
              </h3>

              {/* Plan checklist */}
              <ul className="space-y-2.5 mb-6 text-xs text-purple-100 font-medium">
                {currentClient.planBenefits.map((benefit, i) => (
                  <li key={i} className="flex items-start space-x-2.5">
                    <Check size={16} weight="bold" className="text-[#f472b6] shrink-0 mt-0.5" />
                    <span className="leading-snug">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Glowing Pink Action Button "Passer Premium" */}
              <button
                type="button"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#f472b6] to-[#ec4899] hover:from-[#f472b6] hover:to-[#db2777] text-white font-extrabold text-sm shadow-[0_10px_25px_rgba(236,72,153,0.35)] hover:shadow-[0_12px_30px_rgba(236,72,153,0.45)] transition-all duration-200 active:scale-[0.99] text-center"
              >
                Passer Premium
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* EDIT MODAL DIALOG (Redesigned with GlowApp Theme & Pink Fonts) */}
      {/* ========================================================= */}
      {/* Edit Client Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          
          {/* Modal Container: Matches Portal Main Background with 50% opacity wallpaper */}
          <div className="relative bg-[#fdf0f4] rounded-[26px] overflow-hidden border border-rose-200/80 shadow-[0_20px_60px_-15px_rgba(244,114,182,0.35)] max-w-2xl w-full my-auto">
            
            {/* 50% Opacity Wallpaper Background */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 pointer-events-none z-0"
              style={{ backgroundImage: "url('/glowapp_background.png')" }}
            />
            {/* Ethereal Glow overlays */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/70 via-white/50 to-rose-200/30 pointer-events-none z-0" />
            <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#f472b6]/15 blur-[90px] pointer-events-none z-0" />

            {/* Modal Content */}
            <div className="relative z-10 p-4 sm:p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-rose-200/70 pb-2.5 mb-3">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-rose-500">
                    GlowApp Management
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#64183f] tracking-tight leading-tight">
                    Editar Informações da Cliente
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-rose-600 hover:text-rose-900 border border-rose-200 flex items-center justify-center transition-all shadow-sm active:scale-95"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEdit} className="space-y-2.5 sm:space-y-3">
                
                {/* 1. Nome Completo & Sexo */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* Nome Completo (8 cols) */}
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                      placeholder="Nome completo da cliente"
                      required
                      className="w-full bg-white/95 border border-rose-200/90 rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                    />
                  </div>

                  {/* Sexo (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Sexo
                    </label>
                    <div className="flex items-center space-x-1.5 bg-white/95 border border-rose-200/90 rounded-xl p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, gender: 'female' })}
                        className={`flex-1 py-1 rounded-lg text-xs font-extrabold transition-all ${
                          editFormData.gender === 'female'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'text-rose-700 hover:text-rose-950'
                        }`}
                      >
                        Feminino
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, gender: 'male' })}
                        className={`flex-1 py-1 rounded-lg text-xs font-extrabold transition-all ${
                          editFormData.gender === 'male'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'text-rose-700 hover:text-rose-950'
                        }`}
                      >
                        Masculino
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. CEP & Busca Automática */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* CEP (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-rose-900 mb-1 flex items-center justify-between">
                      <span>CEP</span>
                      {isSearchingCep && (
                        <span className="text-[10px] text-rose-500 flex items-center space-x-1 font-semibold">
                          <Spinner size={12} className="animate-spin" />
                          <span>Buscando...</span>
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editFormData.cep}
                        onChange={e => setEditFormData({ ...editFormData, cep: formatCep(e.target.value) })}
                        onBlur={e => handleCepBlur(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full bg-white/95 border border-rose-200/90 rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                      />
                      <MapPinLine size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Endereço (Logradouro) (8 cols) */}
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={editFormData.address}
                      onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                      placeholder="Rua, Avenida, Praça..."
                      className="w-full bg-white/95 border border-rose-200/90 rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                    />
                  </div>
                </div>

                {/* 3. Número, Complemento & Bairro */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* Número (3 cols) */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={editFormData.number || ''}
                      onChange={e => setEditFormData({ ...editFormData, number: e.target.value })}
                      placeholder="123"
                      className="w-full bg-white/95 border border-rose-200/90 rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                    />
                  </div>

                  {/* Complemento (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={editFormData.complement || ''}
                      onChange={e => setEditFormData({ ...editFormData, complement: e.target.value })}
                      placeholder="Apto, Bloco..."
                      className="w-full bg-white/95 border border-rose-200/90 rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                    />
                  </div>

                  {/* Bairro (5 cols) */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={editFormData.neighborhood}
                      onChange={e => setEditFormData({ ...editFormData, neighborhood: e.target.value })}
                      placeholder="Bairro"
                      className="w-full bg-white/95 border border-rose-200/90 rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                    />
                  </div>
                </div>

                {/* 4. Cidade & Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* Cidade (8 cols) */}
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={e => setEditFormData({ ...editFormData, city: e.target.value })}
                      placeholder="Cidade"
                      className="w-full bg-white/95 border border-rose-200/90 rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                    />
                  </div>

                  {/* Estado / UF (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Estado (UF)
                    </label>
                    <input
                      type="text"
                      value={editFormData.state}
                      onChange={e => setEditFormData({ ...editFormData, state: e.target.value.toUpperCase() })}
                      placeholder="UF"
                      maxLength={2}
                      className="w-full bg-white/95 border border-rose-200/90 rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 uppercase placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all text-center"
                    />
                  </div>
                </div>

                {/* 5. Data de Nascimento, Telefone (com check WhatsApp) & E-mail */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* Data de Nascimento (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Data Nascimento
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editFormData.birthDate}
                        onChange={e => setEditFormData({ ...editFormData, birthDate: formatDate(e.target.value) })}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        className="w-full bg-white/95 border border-rose-200/90 rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                      />
                      <Cake size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Telefone & WhatsApp (4 cols) */}
                  <div className="sm:col-span-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-rose-900">
                        Telefone
                      </label>
                      <label className="flex items-center space-x-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editFormData.isWhatsapp}
                          onChange={e => setEditFormData({ ...editFormData, isWhatsapp: e.target.checked })}
                          className="rounded text-rose-600 focus:ring-rose-400 border-rose-300 w-3 h-3"
                        />
                        <span className="text-[10px] font-extrabold text-emerald-700 flex items-center space-x-0.5">
                          <WhatsappLogo size={12} weight="fill" className="text-emerald-600" />
                          <span>WhatsApp</span>
                        </span>
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={editFormData.phone}
                        onChange={e => setEditFormData({ ...editFormData, phone: formatPhoneNumber(e.target.value) })}
                        placeholder="(41)99999-9999"
                        maxLength={14}
                        className="w-full bg-white/95 border border-rose-200/90 rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                      />
                      <WhatsappLogo size={15} weight="fill" className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* E-mail (4 cols) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      E-mail
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                        placeholder="cliente@email.com"
                        required
                        className="w-full bg-white/95 border border-rose-200/90 rounded-xl px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                      />
                      <EnvelopeSimple size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* 6. Redes Sociais: Instagram, X (Twitter) & Facebook */}
                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-rose-900 mb-1.5">
                    Redes Sociais
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                    {/* Instagram */}
                    <div className="relative flex items-center">
                      <InstagramLogo size={15} className="absolute left-3 text-rose-500 pointer-events-none" weight="bold" />
                      <input
                        type="text"
                        value={editFormData.instagram}
                        onChange={e => setEditFormData({ ...editFormData, instagram: e.target.value })}
                        placeholder="@instagram"
                        className="w-full bg-white/95 border border-rose-200/90 rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                      />
                    </div>

                    {/* X (Twitter) */}
                    <div className="relative flex items-center">
                      <TwitterLogo size={15} className="absolute left-3 text-rose-500 pointer-events-none" weight="fill" />
                      <input
                        type="text"
                        value={editFormData.xTwitter}
                        onChange={e => setEditFormData({ ...editFormData, xTwitter: e.target.value })}
                        placeholder="@x_twitter"
                        className="w-full bg-white/95 border border-rose-200/90 rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                      />
                    </div>

                    {/* Facebook */}
                    <div className="relative flex items-center">
                      <FacebookLogo size={15} className="absolute left-3 text-rose-500 pointer-events-none" weight="fill" />
                      <input
                        type="text"
                        value={editFormData.facebook}
                        onChange={e => setEditFormData({ ...editFormData, facebook: e.target.value })}
                        placeholder="facebook.com/usuario"
                        className="w-full bg-white/95 border border-rose-200/90 rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs font-semibold text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 shadow-sm transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-rose-200/70 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-rose-300/80 bg-white/80 hover:bg-white text-rose-800 font-extrabold text-xs transition-all shadow-sm active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35 transition-all active:scale-95 flex items-center space-x-2"
                  >
                    <CheckCircle size={15} weight="bold" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
