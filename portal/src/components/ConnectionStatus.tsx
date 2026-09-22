import React, { useState, useEffect, useRef } from 'react';
import { Database, ArrowsCounterClockwise, WifiHigh, Warning, WifiSlash } from '@phosphor-icons/react';

interface StatusResponse {
  vpnConnected: boolean;
  dbConnected: boolean;
  status: 'success' | 'db_error' | 'vpn_disconnected' | 'session_expired';
  error?: string;
  osUser?: string;
}

export const ConnectionStatus: React.FC<{ isSidebarExpanded?: boolean; onOsUserLoaded?: (user: string) => void }> = ({ isSidebarExpanded = true, onOsUserLoaded }) => {
  const [status, setStatus] = useState<StatusResponse>({
    vpnConnected: false,
    dbConnected: false,
    status: 'vpn_disconnected'
  });
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  // Stand-by / Inactivity States
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const idleSecondsRef = useRef(0);
  const showWarningRef = useRef(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const checkConnection = async () => {
    if (isSessionExpired) return;
    try {
      const res = await fetch('/api/connection-status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.osUser && onOsUserLoaded) {
          onOsUserLoaded(data.osUser);
        }
      } else {
        setStatus({
          vpnConnected: false,
          dbConnected: false,
          status: 'vpn_disconnected',
          error: `Erro HTTP: ${res.status}`
        });
      }
    } catch (err: any) {
      setStatus({
        vpnConnected: false,
        dbConnected: false,
        status: 'vpn_disconnected',
        error: err.message || 'Erro de conexão'
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset idle timer on any user action
  const resetIdleTimer = () => {
    idleSecondsRef.current = 0;
    if (showWarningRef.current) {
      showWarningRef.current = false;
      setShowWarning(false);
      setCountdown(300);
    }
  };

  // Activity listeners
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetIdleTimer));
    return () => {
      events.forEach(event => window.removeEventListener(event, resetIdleTimer));
    };
  }, []);

  // 1-second interval to track stand-by and warning countdown
  useEffect(() => {
    const timer = setInterval(() => {
      if (isSessionExpired) return;

      // Increment idle seconds
      idleSecondsRef.current += 1;

      // Faltando aos 30 segundos sem uso
      if (idleSecondsRef.current >= 30 && idleSecondsRef.current < 330) {
        showWarningRef.current = true;
        setShowWarning(true);
        setCountdown(330 - idleSecondsRef.current);
      }

      // Estourou 330 segundos sem ação (30s standby + 300s countdown)
      if (idleSecondsRef.current >= 330) {
        showWarningRef.current = false;
        setShowWarning(false);
        setIsSessionExpired(true);
        setStatus(prev => ({
          ...prev,
          status: 'session_expired',
          error: 'Sessão expirada devido a inatividade'
        }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionExpired]);

  // Poll server connection every 10 seconds (only if session is active)
  useEffect(() => {
    if (!isSessionExpired) {
      checkConnection();
      const interval = setInterval(checkConnection, 10000);
      return () => clearInterval(interval);
    }
  }, [isSessionExpired]);

  const handleManualCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    if (isSessionExpired) {
      setIsSessionExpired(false);
      idleSecondsRef.current = 0;
      checkConnection();
    } else {
      checkConnection();
    }
  };

  const getStatusColor = () => {
    if (isSessionExpired) {
      return {
        dotClass: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)] animate-pulse',
        label: 'Sessão Expirada',
        textClass: 'text-rose-500/80',
        icon: <WifiSlash size={16} className="text-rose-500" />
      };
    }

    switch (status.status) {
      case 'success':
        return {
          dotClass: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]',
          label: 'Oracle Conectado',
          textClass: 'text-emerald-400/80',
          icon: <WifiHigh size={16} className="text-emerald-400" />
        };
      case 'db_error':
        return {
          dotClass: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]',
          label: 'Erro no Banco',
          textClass: 'text-amber-400/80',
          icon: <Warning size={16} className="text-amber-400" />
        };
      case 'vpn_disconnected':
      default:
        return {
          dotClass: 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.4)] animate-pulse',
          label: 'VPN Desconectada',
          textClass: 'text-rose-400/80',
          icon: <WifiSlash size={16} className="text-rose-400" />
        };
    }
  };

  const config = getStatusColor();

  return (
    <div className="flex flex-col gap-2 w-full">
      <div 
        className={`p-3 border border-white/10 rounded-xl text-xs flex items-center bg-black/10 relative group cursor-pointer select-none transition-colors duration-200 hover:bg-black/20
          ${isSidebarExpanded ? 'justify-center space-x-3' : 'justify-center space-x-2'}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={handleManualCheck}
        title={isSessionExpired ? "Clique para reatar a sessão de banco" : "Clique para verificar a conexão"}
      >
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${loading ? 'bg-slate-400 animate-pulse' : config.dotClass}`}></span>
          <span className={`flex items-center space-x-1.5 transition-colors ${config.textClass}`}>
            {config.icon}
            {loading && <span className="font-bold tracking-wide uppercase text-[10px] animate-pulse">Verificando...</span>}
          </span>
        </div>

        {/* Dynamic Countdown display next to status */}
        {showWarning && !isSessionExpired && (
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black border border-amber-500/20 animate-pulse shrink-0">
            {formatTime(countdown)}
          </span>
        )}

        {isSessionExpired && (
          <button
            onClick={handleManualCheck}
            className="p-1 hover:bg-white/10 active:scale-95 rounded text-rose-400 hover:text-white transition-all duration-200 shrink-0"
            title="Reconectar à base de dados"
          >
            <ArrowsCounterClockwise size={14} className="hover:rotate-180 transition-transform duration-500" />
          </button>
        )}

      {/* Discreet tooltip on hover */}
      {showTooltip && (
        <div className="absolute bottom-full left-4 right-4 mb-2 p-3 bg-[#121218] border border-white/10 text-[10px] rounded-xl shadow-2xl z-30 animate-fade-in pointer-events-none text-[#d1cbf5]">
          <div className="font-black text-white mb-1 uppercase tracking-wider flex items-center space-x-1">
            <Database size={12} />
            <span>Diagnóstico de Rede</span>
          </div>
          <p className="leading-relaxed opacity-95">
            {isSessionExpired && 'Sua sessão expirou por inatividade. Clique para reatar.'}
            {!isSessionExpired && status.status === 'success' && 'Conexão estabelecida com sucesso com o banco Oracle.'}
            {!isSessionExpired && status.status === 'db_error' && `Erro de conexão com o banco Oracle. Verifique se a sua VPN está ativa. Detalhes: ${status.error}`}
          </p>
          <div className="mt-2 pt-1 border-t border-white/5 text-[8px] opacity-50 text-right">
            Clique para atualizar • IP: 10.129.181.131
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
