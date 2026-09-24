import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlass,
  Plus,
  CaretRight,
  CaretLeft,
  WhatsappLogo,
  MapPin,
  Users,
  Calendar,
  ArrowLeft
} from '@phosphor-icons/react';
import { clientService, type ClientProfile } from '../services/clientService';

interface ClientListViewProps {
  onSelectClient: (clientId: string) => void;
  onCreateNewClient: () => void;
  originFromAgenda?: boolean;
  agendaDate?: string;
  onBackToAgenda?: () => void;
}

export const ClientListView: React.FC<ClientListViewProps> = ({
  onSelectClient,
  onCreateNewClient,
  originFromAgenda,
  agendaDate: _agendaDate,
  onBackToAgenda
}) => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'female' | 'male'>('all');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    clientService.getClients([]).then(loaded => {
      if (isMounted) {
        setClients(loaded || []);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const getClientAvatar = (gender?: 'female' | 'male', avatar?: string): string => {
    if (avatar && avatar.trim() && !avatar.includes('default_avatar')) {
      return avatar;
    }
    if (gender === 'male') {
      return '/default_avatar_male.png';
    }
    return '/default_avatar_female.png';
  };

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      client.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'female') return client.gender === 'female';
    if (activeFilter === 'male') return client.gender === 'male';

    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const femaleCount = clients.filter(c => c.gender === 'female').length;
  const maleCount = clients.filter(c => c.gender === 'male').length;

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto px-4 sm:px-8 py-4 max-w-7xl mx-auto scrollbar-thin scrollbar-thumb-[#E2D8CA]/60 scrollbar-track-transparent">
      
      {/* Return to Agenda Banner when navigating from Agenda */}
      {originFromAgenda && onBackToAgenda && (
        <div className="mb-4 bg-gradient-to-r from-amber-50 to-[#FAF6F0] border border-[#c5922a]/40 rounded-2xl px-5 py-3 shadow-sm flex items-center justify-between animate-fade-in shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white border border-[#c5922a]/40 flex items-center justify-center text-[#c5922a] shadow-xs">
              <Calendar size={18} weight="bold" />
            </div>
            <div>
              <span className="text-xs font-black text-[#3D3028] block">
                Novo Agendamento: Selecione a cliente na lista
              </span>
              <span className="text-[11px] text-[#7A695B] font-medium">
                Clique na cliente desejada para abrir seu cadastro e agendar os procedimentos.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToAgenda}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-[#8C6418] border border-[#c5922a]/50 text-xs font-black shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Voltar para Agenda</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TOP HEADER & ACTION BAR (Reduced Spacing)                 */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#3D3028] tracking-tight">
            Clientes
          </h1>
          <p className="text-xs text-[#8C7A6B] font-semibold mt-0.5">
            {clients.length} {clients.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados no sistema'}
          </p>
        </div>

        {/* Top Right Controls: Search + Button "Novo Cliente" */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c5922a]" />
            <input
              type="text"
              placeholder="Buscar cliente por nome, e-mail, telefone..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 bg-white/90 backdrop-blur-md border border-[#E2D8CA] rounded-2xl text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm w-56 sm:w-72 transition-all"
            />
          </div>

          {/* "+ Novo Cliente" Button at top right */}
          <button
            type="button"
            onClick={onCreateNewClient}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 rounded-2xl text-xs font-black shadow-md shadow-amber-900/15 hover:shadow-lg active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} weight="bold" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTER TABS BAR (Reduced Spacing)                         */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2D8CA]/80 pb-2.5 mb-2">
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => {
              setActiveFilter('all');
              setCurrentPage(1);
            }}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeFilter === 'all'
                ? 'bg-[#3D3028] text-amber-50 shadow-sm'
                : 'text-[#6A5A4D] hover:text-[#3D3028] hover:bg-white/60'
            }`}
          >
            <span>Todos os clientes</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeFilter === 'all' ? 'bg-amber-200/30 text-amber-100' : 'bg-[#EAE2D5] text-[#6A5A4D]'}`}>
              {clients.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter('female');
              setCurrentPage(1);
            }}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeFilter === 'female'
                ? 'bg-[#3D3028] text-amber-50 shadow-sm'
                : 'text-[#6A5A4D] hover:text-[#3D3028] hover:bg-white/60'
            }`}
          >
            <span>Feminino</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeFilter === 'female' ? 'bg-amber-200/30 text-amber-100' : 'bg-[#EAE2D5] text-[#6A5A4D]'}`}>
              {femaleCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter('male');
              setCurrentPage(1);
            }}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeFilter === 'male'
                ? 'bg-[#3D3028] text-amber-50 shadow-sm'
                : 'text-[#6A5A4D] hover:text-[#3D3028] hover:bg-white/60'
            }`}
          >
            <span>Masculino</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeFilter === 'male' ? 'bg-amber-200/30 text-amber-100' : 'bg-[#EAE2D5] text-[#6A5A4D]'}`}>
              {maleCount}
            </span>
          </button>
        </div>

        <div className="text-[11px] font-semibold text-[#8C7A6B]">
          Mostrando {paginatedClients.length} de {filteredClients.length}
        </div>
      </div>

      {/* ========================================================= */}
      {/* GRID / TABLE SECTION                                      */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col justify-between">
        
        {/* Table Header Row (Compact Spacing) */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-1.5 mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#8C7A6B] select-none">
          <div className="col-span-5">Cliente</div>
          <div className="col-span-3">Endereço</div>
          <div className="col-span-2">Telefone / WhatsApp</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-right">Ações</div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-10 text-center border border-[#EBE4D8] shadow-sm flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#c5922a]/30 border-t-[#c5922a] rounded-full animate-spin" />
            <span className="text-xs font-bold text-[#6A5A4D]">Carregando clientes...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredClients.length === 0 && (
          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-10 text-center border border-[#EBE4D8] shadow-sm flex flex-col items-center justify-center space-y-4 my-4">
            <div className="w-16 h-16 rounded-full bg-[#F6F3EE] border border-[#E2D8CA] flex items-center justify-center text-[#c5922a]">
              <Users size={32} weight="duotone" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#3D3028]">Nenhum cliente encontrado</h3>
              <p className="text-xs text-[#8C7A6B] mt-1 max-w-sm">
                {searchQuery ? `Não foram encontrados clientes com o termo "${searchQuery}".` : 'Comece cadastrando seu primeiro cliente no sistema.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onCreateNewClient}
              className="px-5 py-2.5 bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-amber-50 rounded-2xl text-xs font-black shadow-md shadow-amber-900/15 hover:shadow-lg active:scale-95 transition-all"
            >
              + Cadastrar Novo Cliente
            </button>
          </div>
        )}

        {/* Client Rows List (Hover & Selected State matching Novo Cliente Button Gradient) */}
        {!loading && paginatedClients.length > 0 && (
          <div className="space-y-2">
            {paginatedClients.map((client) => {
              const rowId = client.id;
              const isSelected = selectedRowId === rowId;

              return (
                <div
                  key={client.id}
                  onClick={() => onSelectClient(client.id)}
                  onMouseEnter={() => setSelectedRowId(rowId)}
                  className={`relative group rounded-2xl transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-amber-50 border-amber-300/40 shadow-[0_10px_25px_-5px_rgba(197,146,42,0.35)] scale-[1.008]'
                      : 'bg-white/95 hover:bg-white text-[#3D3028] border-[#EBE4D8] hover:border-[#c5922a]/50 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="p-3 sm:p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center">

                    {/* Column 1: Cliente (Avatar + Name + Inscription Date) */}
                    <div className="col-span-1 md:col-span-5 flex items-center space-x-3 min-w-0">
                      <div className={`relative shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 shadow-sm ${isSelected ? 'border-amber-200/90' : 'border-white/90'}`}>
                        <img
                          src={getClientAvatar(client.gender, client.avatar)}
                          alt={client.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getClientAvatar(client.gender);
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-xs sm:text-sm font-black truncate ${isSelected ? 'text-white' : 'text-[#3D3028]'}`}>
                            {client.name || 'Cliente Sem Nome'}
                          </h4>
                        </div>
                        <p className={`text-[11px] font-medium truncate ${isSelected ? 'text-amber-100/90' : 'text-[#8C7A6B]'}`}>
                          {client.email || (client.inscriptionDate ? `Cadastrado em ${client.inscriptionDate}` : 'Sem e-mail')}
                        </p>
                      </div>
                    </div>

                    {/* Column 3: Endereço (Bairro, Cidade - UF) */}
                    <div className="col-span-1 md:col-span-3 flex items-center space-x-1.5 text-xs truncate">
                      <MapPin size={15} className={`shrink-0 ${isSelected ? 'text-amber-200' : 'text-[#c5922a]'}`} />
                      <span className={`truncate ${isSelected ? 'text-amber-50 font-medium' : 'text-[#5C4A3E]'}`}>
                        {client.neighborhood || client.city
                          ? `${client.neighborhood ? client.neighborhood + ', ' : ''}${client.city || ''}${client.state ? ' - ' + client.state : ''}`
                          : 'Endereço não informado'}
                      </span>
                    </div>

                    {/* Column 4: Telefone */}
                    <div className="col-span-1 md:col-span-2 flex items-center space-x-1.5 text-xs font-semibold">
                      <WhatsappLogo size={15} className={`shrink-0 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`} weight="fill" />
                      <span className={isSelected ? 'text-white font-bold' : 'text-[#3D3028]'}>
                        {client.phone || 'Sem telefone'}
                      </span>
                    </div>

                    {/* Column 5: Status Badge */}
                    <div className="col-span-1 md:col-span-1 flex items-center justify-start md:justify-center">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        isSelected
                          ? 'bg-white/25 text-white border border-white/40 shadow-sm backdrop-blur-sm'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-100' : 'bg-emerald-500'}`} />
                        <span className="truncate">Ativo</span>
                      </span>
                    </div>

                    {/* Column 6: Ações (Open Arrow) */}
                    <div className="col-span-1 md:col-span-1 flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClient(client.id);
                        }}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-white/25 hover:bg-white/35 text-white border border-white/40 shadow-sm'
                            : 'bg-[#F6F3EE] hover:bg-[#EFE9DF] text-[#6A5A4D] hover:text-[#3D3028] border border-[#E2D8CA]'
                        }`}
                        title="Ver Cadastro Completo"
                      >
                        <CaretRight size={15} weight="bold" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* BOTTOM PAGINATION CONTROLS                                */}
        {/* ========================================================= */}
        {!loading && filteredClients.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-3 border-t border-[#E2D8CA]/80">
            <div className="text-xs font-semibold text-[#8C7A6B]">
              Mostrando <strong className="text-[#3D3028]">{startIndex + 1}</strong> a <strong className="text-[#3D3028]">{Math.min(startIndex + itemsPerPage, filteredClients.length)}</strong> de <strong className="text-[#3D3028]">{filteredClients.length}</strong> clientes
            </div>

            {totalPages > 1 && (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="w-8 h-8 rounded-xl border border-[#E2D8CA] bg-white/90 text-[#5C4A3E] hover:bg-white flex items-center justify-center text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all shadow-sm ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-amber-50 shadow-md shadow-amber-900/15'
                        : 'border border-[#E2D8CA] bg-white/90 text-[#5C4A3E] hover:bg-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="w-8 h-8 rounded-xl border border-[#E2D8CA] bg-white/90 text-[#5C4A3E] hover:bg-white flex items-center justify-center text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
