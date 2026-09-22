import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CaretLeft,
  CaretRight,
  Sparkle
} from '@phosphor-icons/react';

import { PlanningStoreProvider, usePlanningStore } from './store/PlanningStore';
import { ClientRegistrationView } from './components/ClientRegistrationView';
import { AgendaView } from './components/AgendaView';

function MainAppContent() {
  const { 
    saving,
    notification, clearNotification
  } = usePlanningStore();

  const [activeTab, setActiveTab] = useState('clientes');
  const [selectedClientForView, setSelectedClientForView] = useState<string | null>(null);

  const handleNavigateToClient = (clientName: string) => {
    setSelectedClientForView(clientName);
    setActiveTab('clientes');
  };

  if (typeof window !== 'undefined') {
    (window as any).setActiveTab = setActiveTab;
  }

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  const menuGroups = [
    {
      title: 'Menu',
      items: [
        { id: 'clientes', label: 'Clientes', icon: <Users size={18} /> },
        { id: 'agenda', label: 'Agenda', icon: <Calendar size={18} /> },
      ]
    }
  ];

  return (
    <div className="flex h-screen text-slate-800 overflow-hidden font-sans relative bg-[#fdf0f4] select-none">
      {/* Background Wallpaper with 50% opacity */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/glowapp_background.png')"
        }}
      />

      {/* Subtle ethereal glow overlays to blend seamlessly */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-rose-200/15 pointer-events-none z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/25 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#f472b6]/10 blur-[150px] pointer-events-none z-0" />

      {/* Sliding Left Sidebar (Overlay Drawer) */}
      {/* Sliding Left Sidebar (Overlay Drawer) */}
      {/* Backdrop (Mobile Only) */}
      {isSidebarExpanded && (
        <div
          className="fixed inset-0 bg-rose-950/20 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarExpanded(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full border-r border-rose-300/80 shadow-[15px_0_35px_-10px_rgba(244,114,182,0.22)] flex flex-col z-50 backdrop-blur-2xl transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-[280px] translate-x-0' : 'w-[280px] -translate-x-full lg:w-[80px] lg:translate-x-0'}`}
        style={{ background: "linear-gradient(180deg, rgba(255, 225, 238, 0.96) 0%, rgba(253, 195, 218, 0.94) 50%, rgba(247, 162, 198, 0.97) 100%)" }}
      >
        {/* Toggle button — floats on the top-right edge of the sidebar */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3 top-3.5 z-50 w-6 h-6 flex items-center justify-center rounded-full bg-white/95 hover:bg-white text-[#c5922a] hover:text-[#b38222] border border-amber-200/90 shadow-sm transition-all duration-200 backdrop-blur-sm"
          title={isSidebarExpanded ? 'Recolher Menu' : 'Expandir Menu'}
        >
          {isSidebarExpanded
            ? <CaretLeft size={11} weight="bold" />
            : <CaretRight size={11} weight="bold" />}
        </button>

        {/* Brand Icon Header */}
        <div className={`flex flex-col border-b border-rose-200/60 transition-all duration-300 relative ${isSidebarExpanded ? 'p-5 items-center' : 'items-center py-4 space-y-2'}`}>
          <div className="flex flex-col items-center justify-center">
            <div className={`relative transition-all duration-300 rounded-2xl overflow-hidden shadow-[0_6px_20px_rgba(244,114,182,0.22)] border-2 border-amber-200/90 bg-white ${isSidebarExpanded ? 'w-24 h-24' : 'w-12 h-12'}`}>
              <img
                src="/glowapp_logo.png"
                alt="GlowApp"
                className="w-full h-full object-cover"
              />
            </div>
            {isSidebarExpanded && (
              <span className="mt-2 text-xs font-black tracking-widest uppercase text-rose-900/90 font-sans">
                GlowApp
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 mt-4 overflow-y-auto overflow-x-hidden pl-4 pr-0 scrollbar-thin scrollbar-thumb-rose-200/50 scrollbar-track-transparent">
          {menuGroups.map((group, gIdx) => (
            <React.Fragment key={gIdx}>
              {gIdx > 0 && (
                <div className="my-4 mx-3 border-t border-rose-200/60 flex flex-col pt-3 relative">
                  {isSidebarExpanded && (
                    <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest pl-1 mb-2 select-none">
                      {group.title}
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-col mb-2">
                {group.items.map((item, idx) => {
                  const isActive = activeTab === item.id;
                  const isPrevActive = idx > 0 && group.items[idx - 1].id === activeTab;
                  const isNextActive = idx < group.items.length - 1 && group.items[idx + 1].id === activeTab;
                  const isAdjacent = isPrevActive || isNextActive;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center py-2.5 px-4 cursor-pointer transition-all duration-300 text-xs select-none relative
                         ${isActive
                          ? 'curved-active-tab font-bold text-rose-900 shadow-sm'
                          : `text-rose-900/75 font-semibold rounded-l-xl ${isAdjacent ? '' : 'hover:bg-white/40 hover:text-rose-950'}`}
                       `}
                    >
                      <div className={`mr-3 z-10 relative transition-all duration-300 ${isActive ? 'text-[#c5922a] drop-shadow-[0_2px_6px_rgba(197,146,42,0.35)] scale-110' : 'text-[#d4a34b] group-hover:text-[#b38222]'}`}>
                        {item.icon}
                      </div>
                      <span className={`whitespace-nowrap overflow-hidden z-10 relative transition-all duration-300 ${isSidebarExpanded ? 'opacity-100 w-auto ml-0.5' : 'opacity-0 w-0'}`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </nav>

        {/* Bottom Version / Brand Tag */}
        <div className={`px-4 pb-4 transition-all duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 lg:opacity-100 lg:px-2'}`}>
          <div className="py-2 px-3 rounded-xl text-[10px] font-bold text-rose-700/70 bg-white/40 border border-rose-200/50 flex items-center justify-center space-x-1">
            <Sparkle size={12} className="text-[#c5922a]" />
            {isSidebarExpanded && <span>GlowApp Local v1.0</span>}
          </div>
        </div>
      </aside>

      {/* Main Container with Soft Empty Background */}
      <main className={`flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300 ${isSidebarExpanded ? 'lg:pl-[280px]' : 'pl-0 lg:pl-[80px]'}`}>
        {/* Floating Menu Button (Only when sidebar is collapsed on smaller viewports) */}
        {!isSidebarExpanded && (
          <button
            onClick={() => setIsSidebarExpanded(true)}
            className="absolute top-6 left-6 z-30 bg-white/95 hover:bg-white text-[#c5922a] shadow-md border border-amber-200/90 p-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-amber-300 lg:hidden backdrop-blur-md"
            title="Expandir Menu"
          >
            <Sparkle size={20} weight="bold" />
          </button>
        )}

        {/* Dynamic Tab Content */}
        <div className="flex-1 w-full h-full overflow-hidden relative">
          {activeTab === 'clientes' && (
            <ClientRegistrationView initialClientName={selectedClientForView || undefined} />
          )}
          {activeTab === 'agenda' && (
            <AgendaView onNavigateToClient={handleNavigateToClient} />
          )}
          {activeTab !== 'clientes' && activeTab !== 'agenda' && (
            <div className="flex-1 w-full h-full" />
          )}
        </div>
      </main>

      {/* Global Saving Overlay */}
      {saving && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in-fast">
          <div className="bg-white/90 border border-white/50 px-6 py-4 rounded-2xl shadow-xl flex items-center space-x-3 backdrop-blur-md">
            <div className="w-5 h-5 border-2 border-[#64183f]/30 border-t-[#64183f] rounded-full animate-spin" />
            <span className="text-sm font-bold text-slate-700 tracking-wide">Salvando alterações...</span>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <>
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(120%) translateY(0);
                opacity: 0;
              }
              to {
                transform: translateX(0) translateY(0);
                opacity: 1;
              }
            }
            .animate-slide-in-right {
              animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div className="fixed bottom-6 right-6 z-[99999] animate-slide-in-right">
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/40 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 max-w-sm">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black tracking-widest uppercase text-rose-400">Acesso Restrito</p>
                <p className="text-xs font-semibold text-slate-100 mt-1 leading-snug">{notification.message}</p>
              </div>
              <button 
                onClick={clearNotification}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <PlanningStoreProvider>
      <MainAppContent />
    </PlanningStoreProvider>
  );
}

export default App;
