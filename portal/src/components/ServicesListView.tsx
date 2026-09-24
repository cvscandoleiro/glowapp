import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Trash,
  CheckCircle,
  X,
  Sparkle,
  CurrencyCircleDollar,
  Check,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';
import { serviceService, type ServiceItem } from '../services/serviceService';

export const ServicesListView: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ativo' | 'inativo'>('all');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Inline Quick Add Row State (under the list)
  const [inlineName, setInlineName] = useState('');
  const [inlineDescription, setInlineDescription] = useState('');
  const [inlinePrice, setInlinePrice] = useState('');
  const [inlineStatus, setInlineStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [isInlineAdding, setIsInlineAdding] = useState(false);

  // Edit / New Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [modalFormData, setModalFormData] = useState({
    name: '',
    description: '',
    price: '',
    durationMinutes: '60',
    status: 'ativo' as 'ativo' | 'inativo',
    category: 'Estética'
  });

  const loadServices = async () => {
    setLoading(true);
    const data = await serviceService.getServices();
    setServices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // Filter services
  const filteredServices = services.filter(srv => {
    const matchesSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.description && srv.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (srv.category && srv.category.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'ativo') return srv.status === 'ativo';
    if (activeFilter === 'inativo') return srv.status === 'inativo';

    return true;
  });

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, startIndex + itemsPerPage);

  const activeCount = services.filter(s => s.status === 'ativo').length;
  const inactiveCount = services.filter(s => s.status === 'inativo').length;

  // Handle Save from Inline Row below list
  const handleInlineSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineName.trim()) return;

    const priceNum = parseFloat(inlinePrice.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

    const newSrv: ServiceItem = {
      id: `srv-${Date.now()}`,
      name: inlineName.trim(),
      description: inlineDescription.trim(),
      price: priceNum,
      durationMinutes: 60,
      status: inlineStatus,
      category: 'Estética'
    };

    const updated = [newSrv, ...services];
    setServices(updated);
    await serviceService.saveService(newSrv);

    // Reset inline inputs
    setInlineName('');
    setInlineDescription('');
    setInlinePrice('');
    setInlineStatus('ativo');
    setIsInlineAdding(false);
    showNotification(`Serviço "${newSrv.name}" adicionado com sucesso!`);
  };

  // Open Modal for New Service
  const handleOpenNewModal = () => {
    setEditingService(null);
    setModalFormData({
      name: '',
      description: '',
      price: '',
      durationMinutes: '60',
      status: 'ativo',
      category: 'Estética'
    });
    setIsModalOpen(true);
  };

  // Open Modal for Editing Service
  const handleOpenEditModal = (srv: ServiceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingService(srv);
    setModalFormData({
      name: srv.name,
      description: srv.description || '',
      price: srv.price ? String(srv.price) : '',
      durationMinutes: srv.durationMinutes ? String(srv.durationMinutes) : '60',
      status: srv.status,
      category: srv.category || 'Estética'
    });
    setIsModalOpen(true);
  };

  // Save Modal (Create or Edit)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalFormData.name.trim()) return;

    const priceNum = parseFloat(modalFormData.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const durationNum = parseInt(modalFormData.durationMinutes, 10) || 60;

    const srvToSave: ServiceItem = {
      id: editingService ? editingService.id : `srv-${Date.now()}`,
      name: modalFormData.name.trim(),
      description: modalFormData.description.trim(),
      price: priceNum,
      durationMinutes: durationNum,
      status: modalFormData.status,
      category: modalFormData.category
    };

    let updatedList: ServiceItem[];
    if (editingService) {
      updatedList = services.map(s => (s.id === srvToSave.id ? srvToSave : s));
    } else {
      updatedList = [srvToSave, ...services];
    }

    setServices(updatedList);
    await serviceService.saveService(srvToSave);
    setIsModalOpen(false);
    showNotification(editingService ? 'Serviço atualizado com sucesso!' : 'Novo serviço cadastrado com sucesso!');
  };

  // Toggle Service Status
  const handleToggleStatus = async (srv: ServiceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSrv: ServiceItem = {
      ...srv,
      status: srv.status === 'ativo' ? 'inativo' : 'ativo'
    };
    const updatedList = services.map(s => (s.id === srv.id ? updatedSrv : s));
    setServices(updatedList);
    await serviceService.saveService(updatedSrv);
    showNotification(`Status alterado para ${updatedSrv.status === 'ativo' ? 'Ativo' : 'Inativo'}`);
  };

  // Delete Service
  const handleDeleteService = async (srv: ServiceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Deseja realmente excluir o serviço "${srv.name}"?`)) {
      const updatedList = services.filter(s => s.id !== srv.id);
      setServices(updatedList);
      await serviceService.deleteService(srv.id);
      showNotification('Serviço excluído com sucesso!');
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto px-4 sm:px-8 py-4 max-w-7xl mx-auto scrollbar-thin scrollbar-thumb-[#E2D8CA]/60 scrollbar-track-transparent">
      
      {/* ========================================================= */}
      {/* TOP HEADER & ACTION BAR                                   */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#3D3028] tracking-tight">
            Serviços
          </h1>
          <p className="text-xs text-[#8C7A6B] font-semibold mt-0.5">
            {services.length} {services.length === 1 ? 'serviço cadastrado' : 'serviços cadastrados no sistema'}
          </p>
        </div>

        {/* Top Right Controls: Search + Button "Novo Serviço" */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c5922a]" />
            <input
              type="text"
              placeholder="Buscar serviço por nome, descrição..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 bg-white/90 backdrop-blur-md border border-[#E2D8CA] rounded-2xl text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm w-56 sm:w-72 transition-all"
            />
          </div>

          {/* "+ Novo Serviço" Button at top right */}
          <button
            type="button"
            onClick={handleOpenNewModal}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 rounded-2xl text-xs font-black shadow-md shadow-amber-900/15 hover:shadow-lg active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} weight="bold" />
            <span>Novo Serviço</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTER TABS BAR                                           */}
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
            <span>Todos os serviços</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeFilter === 'all' ? 'bg-amber-200/30 text-amber-100' : 'bg-[#EAE2D5] text-[#6A5A4D]'}`}>
              {services.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter('ativo');
              setCurrentPage(1);
            }}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeFilter === 'ativo'
                ? 'bg-[#3D3028] text-amber-50 shadow-sm'
                : 'text-[#6A5A4D] hover:text-[#3D3028] hover:bg-white/60'
            }`}
          >
            <span>Ativos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeFilter === 'ativo' ? 'bg-amber-200/30 text-amber-100' : 'bg-[#EAE2D5] text-[#6A5A4D]'}`}>
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter('inativo');
              setCurrentPage(1);
            }}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-2 ${
              activeFilter === 'inativo'
                ? 'bg-[#3D3028] text-amber-50 shadow-sm'
                : 'text-[#6A5A4D] hover:text-[#3D3028] hover:bg-white/60'
            }`}
          >
            <span>Inativos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeFilter === 'inativo' ? 'bg-amber-200/30 text-amber-100' : 'bg-[#EAE2D5] text-[#6A5A4D]'}`}>
              {inactiveCount}
            </span>
          </button>
        </div>

        {notification && (
          <div className="flex items-center space-x-2 bg-[#FAF6F0] text-[#3D3028] border border-[#E2D8CA] px-3.5 py-1.5 rounded-2xl text-xs font-bold shadow-sm animate-fade-in">
            <CheckCircle size={15} weight="fill" className="text-[#c5922a]" />
            <span>{notification}</span>
          </div>
        )}

        <div className="text-[11px] font-semibold text-[#8C7A6B]">
          Mostrando {paginatedServices.length} de {filteredServices.length}
        </div>
      </div>

      {/* ========================================================= */}
      {/* GRID / TABLE SECTION                                      */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col justify-between">
        
        {/* Table Header Row */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-1.5 mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#8C7A6B] select-none">
          <div className="col-span-6">Serviço</div>
          <div className="col-span-3 text-left">Preço</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-10 text-center border border-[#EBE4D8] shadow-sm flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#c5922a]/30 border-t-[#c5922a] rounded-full animate-spin" />
            <span className="text-xs font-bold text-[#6A5A4D]">Carregando serviços...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredServices.length === 0 && (
          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-10 text-center border border-[#EBE4D8] shadow-sm flex flex-col items-center justify-center space-y-4 my-4">
            <div className="w-16 h-16 rounded-full bg-[#F6F3EE] border border-[#E2D8CA] flex items-center justify-center text-[#c5922a]">
              <Sparkle size={32} weight="duotone" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#3D3028]">Nenhum serviço encontrado</h3>
              <p className="text-xs text-[#8C7A6B] mt-1 max-w-sm">
                {searchQuery ? `Não foram encontrados serviços com o termo "${searchQuery}".` : 'Comece cadastrando seu primeiro serviço no sistema.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNewModal}
              className="px-5 py-2.5 bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-amber-50 rounded-2xl text-xs font-black shadow-md shadow-amber-900/15 hover:shadow-lg active:scale-95 transition-all"
            >
              + Cadastrar Novo Serviço
            </button>
          </div>
        )}

        {/* Service Rows List */}
        {!loading && paginatedServices.length > 0 && (
          <div className="space-y-2">
            {paginatedServices.map((srv) => {
              const isSelected = selectedRowId === srv.id;

              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedRowId(srv.id)}
                  onMouseEnter={() => setSelectedRowId(srv.id)}
                  className={`relative group rounded-2xl transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-amber-50 border-amber-300/40 shadow-[0_10px_25px_-5px_rgba(197,146,42,0.35)] scale-[1.008]'
                      : 'bg-white/95 hover:bg-white text-[#3D3028] border-[#EBE4D8] hover:border-[#c5922a]/50 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="p-3 sm:p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center">

                    {/* Column 1: Serviço (Icon + Nome + Descrição) */}
                    <div className="col-span-1 md:col-span-6 flex items-center space-x-3 min-w-0">
                      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm ${
                        isSelected
                          ? 'bg-white/20 border-amber-200/90 text-amber-100'
                          : 'bg-[#F9F6F0] border-amber-200/60 text-[#c5922a]'
                      }`}>
                        <Sparkle size={18} weight="fill" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-xs sm:text-sm font-black truncate ${isSelected ? 'text-white' : 'text-[#3D3028]'}`}>
                            {srv.name}
                          </h4>
                          {srv.category && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isSelected ? 'bg-white/20 text-amber-100' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {srv.category}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] font-medium truncate ${isSelected ? 'text-amber-100/90' : 'text-[#8C7A6B]'}`}>
                          {srv.description || 'Procedimento estético profissional'}
                        </p>
                      </div>
                    </div>

                    {/* Column 2: Preço */}
                    <div className="col-span-1 md:col-span-3 flex items-center space-x-2 text-xs font-black">
                      <CurrencyCircleDollar size={18} className={`shrink-0 ${isSelected ? 'text-amber-200' : 'text-[#c5922a]'}`} weight="bold" />
                      <span className={`text-sm ${isSelected ? 'text-white' : 'text-[#3D3028]'}`}>
                        {formatCurrency(srv.price)}
                      </span>
                    </div>

                    {/* Column 3: Status Badge */}
                    <div className="col-span-1 md:col-span-1 flex items-center justify-start md:justify-center">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        isSelected
                          ? 'bg-white/25 text-white border border-white/40 shadow-sm backdrop-blur-sm'
                          : srv.status === 'ativo'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border border-stone-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-amber-100'
                            : srv.status === 'ativo'
                            ? 'bg-emerald-500'
                            : 'bg-stone-400'
                        }`} />
                        <span className="capitalize">{srv.status}</span>
                      </span>
                    </div>

                    {/* Column 4: Ações (Editar, Toggle Status, Excluir) */}
                    <div className="col-span-1 md:col-span-2 flex items-center justify-end space-x-2">
                      {/* Toggle status button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(srv, e)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          isSelected
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : srv.status === 'ativo'
                            ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                        title={srv.status === 'ativo' ? 'Desativar Serviço' : 'Ativar Serviço'}
                      >
                        {srv.status === 'ativo' ? 'Desativar' : 'Ativar'}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(srv, e)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-white/25 hover:bg-white/35 text-white border border-white/40 shadow-sm'
                            : 'bg-[#F6F3EE] hover:bg-[#EFE9DF] text-[#6A5A4D] hover:text-[#3D3028] border border-[#E2D8CA]'
                        }`}
                        title="Editar Serviço"
                      >
                        <PencilSimple size={14} weight="bold" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteService(srv, e)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-rose-500/30 hover:bg-rose-500/50 text-white border border-rose-300/30'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                        }`}
                        title="Excluir Serviço"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* INLINE QUICK ADD ROW (Criar novo nas linhas abaixo)       */}
        {/* ========================================================= */}
        <div className="mt-3">
          {!isInlineAdding ? (
            <button
              type="button"
              onClick={() => setIsInlineAdding(true)}
              className="w-full py-2.5 px-4 bg-white/70 hover:bg-white border-2 border-dashed border-[#D5C7B7] hover:border-[#c5922a] rounded-2xl flex items-center justify-center space-x-2 text-xs font-bold text-[#6A5A4D] hover:text-[#3D3028] shadow-sm transition-all group cursor-pointer active:scale-[0.99]"
            >
              <div className="w-5 h-5 rounded-full bg-[#FAF6F0] group-hover:bg-[#c5922a] text-[#c5922a] group-hover:text-white flex items-center justify-center transition-all">
                <Plus size={12} weight="bold" />
              </div>
              <span>+ Adicionar Novo Serviço na Linha Abaixo</span>
            </button>
          ) : (
            <form
              onSubmit={handleInlineSave}
              className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#c5922a]/40 p-3 sm:p-4 shadow-md transition-all animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-[#EBE4D8] pb-2 mb-2.5">
                <div className="flex items-center space-x-2">
                  <Sparkle size={16} weight="fill" className="text-[#c5922a]" />
                  <span className="text-xs font-black text-[#3D3028]">
                    Adicionar Novo Serviço
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInlineAdding(false)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  <X size={15} weight="bold" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                {/* Nome do Serviço (5 cols) */}
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Nome do Serviço (ex: Limpeza de Pele)"
                    value={inlineName}
                    onChange={e => setInlineName(e.target.value)}
                    required
                    className="w-full bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>

                {/* Preço (3 cols) */}
                <div className="sm:col-span-3">
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-[#8C7A6B]">R$</span>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={inlinePrice}
                      onChange={e => setInlinePrice(e.target.value)}
                      required
                      className="w-full bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                </div>

                {/* Status (2 cols) */}
                <div className="sm:col-span-2">
                  <select
                    value={inlineStatus}
                    onChange={e => setInlineStatus(e.target.value as 'ativo' | 'inativo')}
                    className="w-full bg-[#FAF6F0] border border-[#E2D8CA] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                {/* Botões Ação (2 cols) */}
                <div className="sm:col-span-2 flex items-center space-x-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsInlineAdding(false)}
                    className="px-3 py-1.5 rounded-xl border border-[#E2D8CA] bg-white text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-amber-50 text-xs font-black shadow-sm hover:shadow active:scale-95 transition-all flex items-center space-x-1"
                  >
                    <Check size={14} weight="bold" />
                    <span>Salvar</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* ========================================================= */}
        {/* BOTTOM PAGINATION CONTROLS                                */}
        {/* ========================================================= */}
        {!loading && filteredServices.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-3 border-t border-[#E2D8CA]/80">
            <div className="text-xs font-semibold text-[#8C7A6B]">
              Mostrando <strong className="text-[#3D3028]">{startIndex + 1}</strong> a <strong className="text-[#3D3028]">{Math.min(startIndex + itemsPerPage, filteredServices.length)}</strong> de <strong className="text-[#3D3028]">{filteredServices.length}</strong> serviços
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

      {/* ========================================================= */}
      {/* MODAL DIALOG (Criar ou Editar Serviço)                    */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-stone-950/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="relative bg-[#F6F3EE] rounded-[26px] overflow-hidden border border-[#E2D8CA] shadow-[0_20px_60px_-15px_rgba(180,155,130,0.25)] max-w-md w-full my-auto">
            
            {/* Modal Glow overlays */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none z-0"
              style={{ backgroundImage: "url('/glowapp_background.png')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/70 via-white/50 to-[#E8DFD3]/40 pointer-events-none z-0" />
            
            <div className="relative z-10 p-5 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E2D8CA] pb-2.5 mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#FAF6F0] border border-[#c5922a]/40 flex items-center justify-center text-[#c5922a]">
                    <Sparkle size={18} weight="fill" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#c5922a]">
                      GlowApp Serviços
                    </span>
                    <h3 className="text-lg font-black text-[#3D3028] tracking-tight">
                      {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-stone-600 border border-[#E2D8CA] flex items-center justify-center transition-all shadow-sm active:scale-95"
                >
                  <X size={15} weight="bold" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveModal} className="space-y-3">
                {/* Nome do Serviço */}
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                    Nome do Serviço *
                  </label>
                  <input
                    type="text"
                    value={modalFormData.name}
                    onChange={e => setModalFormData({ ...modalFormData, name: e.target.value })}
                    placeholder="Ex: Harmonização Facial, Limpeza de Pele..."
                    required
                    className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                  />
                </div>

                {/* Preço & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                      Preço (R$) *
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-[#8C7A6B]">R$</span>
                      <input
                        type="text"
                        value={modalFormData.price}
                        onChange={e => setModalFormData({ ...modalFormData, price: e.target.value })}
                        placeholder="0,00"
                        required
                        className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                      Status
                    </label>
                    <select
                      value={modalFormData.status}
                      onChange={e => setModalFormData({ ...modalFormData, status: e.target.value as 'ativo' | 'inativo' })}
                      className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3 py-2 text-xs font-bold text-[#3D3028] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-[11px] font-bold text-[#4A3B31] mb-1">
                    Descrição do Procedimento
                  </label>
                  <textarea
                    rows={2}
                    value={modalFormData.description}
                    onChange={e => setModalFormData({ ...modalFormData, description: e.target.value })}
                    placeholder="Detalhes ou cuidados inclusos no serviço..."
                    className="w-full bg-white/95 border border-[#E2D8CA] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#3D3028] placeholder-[#A6978A] focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E2D8CA]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E2D8CA] bg-white/80 hover:bg-white text-stone-700 font-extrabold text-xs transition-all shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#c5922a] to-[#966b1a] hover:from-[#d4a34b] hover:to-[#a77820] text-amber-50 font-extrabold text-xs shadow-md shadow-amber-900/15 transition-all active:scale-95 flex items-center space-x-1.5"
                  >
                    <CheckCircle size={15} weight="bold" />
                    <span>{editingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}</span>
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
