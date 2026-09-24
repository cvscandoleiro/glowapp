import React, { useState, useEffect, useMemo } from 'react';
import {
  CurrencyDollar,
  Users,
  Sparkle,
  MapPin,
  TrendUp,
  CalendarCheck,
  ArrowsClockwise,
  ArrowSquareOut,
  Trophy,
  ChartLineUp,
  ChartPieSlice,
  Receipt,
  Star,
  ListBullets
} from '@phosphor-icons/react';

import { appointmentService, type Appointment } from '../services/appointmentService';
import { clientService, type ClientProfile } from '../services/clientService';
import { serviceService, type ServiceItem } from '../services/serviceService';

interface DashboardViewProps {
  onNavigateToClients?: () => void;
  onNavigateToClientDetail?: (clientId: string) => void;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
type TimelineGranularity = 'day' | 'month' | 'year';

// Luxury color palette for 3D Pie slices (Gold, Jewel & Metallic tones)
const LUXURY_PALETTE = [
  { top: '#c5922a', side: '#8c6416', light: '#e8be6b', glow: 'rgba(197, 146, 42, 0.45)', text: 'text-[#966b1a]', bg: 'bg-amber-50', border: 'border-amber-200' },
  { top: '#8b5cf6', side: '#6327d6', light: '#b293f9', glow: 'rgba(139, 92, 246, 0.45)', text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  { top: '#0ea5e9', side: '#0369a1', light: '#56c6f9', glow: 'rgba(14, 165, 233, 0.45)', text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  { top: '#10b981', side: '#047857', light: '#4ade80', glow: 'rgba(16, 185, 129, 0.45)', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { top: '#f43f5e', side: '#be123c', light: '#fb7185', glow: 'rgba(244, 63, 94, 0.45)', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  { top: '#f59e0b', side: '#b45309', light: '#fcd34d', glow: 'rgba(245, 158, 11, 0.45)', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToClients,
  onNavigateToClientDetail
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>('month');

  // View modes: 3D Pizza vs Lista
  const [servicesViewMode, setServicesViewMode] = useState<'3d' | 'list'>('3d');
  const [regionViewMode, setRegionViewMode] = useState<'3d' | 'list'>('3d');

  // Timeline Granularity (Dia, Mês, Ano) & Active Hover state
  const [timelineGranularity, setTimelineGranularity] = useState<TimelineGranularity>('day');
  const [activeTimelineHover, setActiveTimelineHover] = useState<number | null>(null);

  // Active hover states for 3D Pie charts
  const [activeServiceHover, setActiveServiceHover] = useState<number | null>(null);
  const [activeRegionHover, setActiveRegionHover] = useState<number | null>(null);

  // Load all foundational data
  const loadDashboardData = async () => {
    try {
      const [loadedApts, loadedClients, loadedServices] = await Promise.all([
        appointmentService.getAppointments(),
        clientService.getClients([]),
        serviceService.getServices()
      ]);

      setAppointments(loadedApts || []);
      setClients(loadedClients || []);
      setServices(loadedServices || []);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  // Helper date filters
  const dateRange = useMemo(() => {
    const now = new Date();
    const currentIso = now.toISOString().split('T')[0];

    const startOfToday = currentIso;
    const endOfToday = currentIso;

    // Week: current week starting monday
    const dWeek = new Date(now);
    const dayOfWeek = dWeek.getDay() || 7;
    dWeek.setDate(dWeek.getDate() - dayOfWeek + 1);
    const startOfWeek = dWeek.toISOString().split('T')[0];

    // Month: first day of current month
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // Quarter: 90 days back
    const dQuarter = new Date(now);
    dQuarter.setDate(dQuarter.getDate() - 90);
    const startOfQuarter = dQuarter.toISOString().split('T')[0];

    // Year: first day of current year
    const startOfYear = `${now.getFullYear()}-01-01`;

    return {
      today: { start: startOfToday, end: endOfToday },
      week: { start: startOfWeek, end: '9999-12-31' },
      month: { start: startOfMonth, end: '9999-12-31' },
      quarter: { start: startOfQuarter, end: '9999-12-31' },
      year: { start: startOfYear, end: '9999-12-31' },
      all: { start: '1900-01-01', end: '9999-12-31' }
    };
  }, []);

  // Filtered appointments in selected period
  const periodAppointments = useMemo(() => {
    const range = dateRange[period];
    return appointments.filter(apt => {
      if (apt.status === 'cancelado') return false;
      if (period === 'today') return apt.date === range.start;
      return apt.date >= range.start && apt.date <= range.end;
    });
  }, [appointments, period, dateRange]);

  // Clients mapping lookup by ID / Name
  const clientsMap = useMemo(() => {
    const map = new Map<string, ClientProfile>();
    clients.forEach(c => {
      map.set(c.id, c);
      if (c.name) map.set(c.name.trim().toLowerCase(), c);
    });
    return map;
  }, [clients]);

  // Helper to extract appointment procedures total & list
  const getAppointmentDetails = (apt: Appointment) => {
    const matchedClient = apt.clientId ? clientsMap.get(apt.clientId) : (apt.clientName ? clientsMap.get(apt.clientName.trim().toLowerCase()) : undefined);

    let items: { name: string; price: number; category: string }[] = [];
    let total = 0;

    if (apt.services && apt.services.length > 0) {
      items = apt.services.map(s => ({
        name: s.name,
        price: s.price || 0,
        category: s.category || apt.category || 'Geral'
      }));
      total = items.reduce((acc, i) => acc + i.price, 0);
    } else {
      let price = apt.price || 0;
      if (price === 0 && matchedClient && matchedClient.procedures) {
        const found = matchedClient.procedures.find(p => p.title.toLowerCase() === apt.title.toLowerCase());
        if (found && found.price) price = found.price;
      }
      if (price === 0) {
        const foundService = services.find(s => s.name.toLowerCase() === apt.title.toLowerCase());
        if (foundService) price = foundService.price;
      }
      items = [{
        name: apt.title,
        price,
        category: apt.category || 'Geral'
      }];
      total = price;
    }

    return { items, total, matchedClient };
  };

  // =========================================================
  // 1. FINANCIAL KPIS & GENERAL METRICS
  // =========================================================
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let completedRevenue = 0;
    let pendingRevenue = 0;
    let totalProceduresCount = 0;
    const uniqueClientNames = new Set<string>();

    periodAppointments.forEach(apt => {
      const { items, total } = getAppointmentDetails(apt);
      totalRevenue += total;
      if (apt.status === 'concluido') {
        completedRevenue += total;
      } else {
        pendingRevenue += total;
      }
      totalProceduresCount += items.length;
      if (apt.clientName) {
        uniqueClientNames.add(apt.clientName.trim().toLowerCase());
      }
    });

    const totalAptsCount = periodAppointments.length;
    const uniqueClientsCount = uniqueClientNames.size;
    const averageTicket = totalAptsCount > 0 ? totalRevenue / totalAptsCount : 0;
    const recurrenceRate = uniqueClientsCount > 0 ? Math.min(100, Math.round(((totalAptsCount - uniqueClientsCount) / totalAptsCount) * 100)) : 0;

    return {
      totalRevenue,
      completedRevenue,
      pendingRevenue,
      totalAptsCount,
      totalProceduresCount,
      uniqueClientsCount,
      averageTicket,
      recurrenceRate
    };
  }, [periodAppointments, clientsMap, services]);

  // =========================================================
  // 2. TIMELINE REVENUE CHART DATA (Agrupado por Dia, Mês, Ano)
  // =========================================================
  const chartSourceAppointments = useMemo(() => {
    if (timelineGranularity === 'year') {
      return appointments.filter(a => a.status !== 'cancelado');
    }
    if (timelineGranularity === 'month') {
      if (period === 'today' || period === 'week' || period === 'month') {
        const currentYear = new Date().getFullYear().toString();
        const yearApts = appointments.filter(a => a.status !== 'cancelado' && a.date.startsWith(currentYear));
        return yearApts.length > 0 ? yearApts : appointments.filter(a => a.status !== 'cancelado');
      }
      return periodAppointments;
    }
    return periodAppointments;
  }, [appointments, periodAppointments, timelineGranularity, period]);

  const timelineChartData = useMemo(() => {
    const map = new Map<string, { key: string; label: string; tooltipTitle: string; revenue: number; count: number }>();
    const monthShortNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthFullNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const sorted = [...chartSourceAppointments].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach(apt => {
      const { total } = getAppointmentDetails(apt);
      const d = apt.date; // YYYY-MM-DD
      if (!d) return;

      let key = d;
      let label = d;
      let tooltipTitle = d;

      if (timelineGranularity === 'day') {
        key = d;
        if (d.includes('-')) {
          const parts = d.split('-');
          label = `${parts[2]}/${parts[1]}`;
          tooltipTitle = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      } else if (timelineGranularity === 'month') {
        const yearMonth = d.slice(0, 7); // YYYY-MM
        key = yearMonth;
        if (yearMonth.includes('-')) {
          const [yr, mo] = yearMonth.split('-');
          const mIndex = parseInt(mo, 10) - 1;
          const shortM = monthShortNames[mIndex] || mo;
          const fullM = monthFullNames[mIndex] || mo;
          label = `${shortM}/${yr.slice(-2)}`;
          tooltipTitle = `${fullM} de ${yr}`;
        }
      } else if (timelineGranularity === 'year') {
        const yr = d.slice(0, 4); // YYYY
        key = yr;
        label = yr;
        tooltipTitle = `Ano de ${yr}`;
      }

      if (!map.has(key)) {
        map.set(key, { key, label, tooltipTitle, revenue: total, count: 1 });
      } else {
        const existing = map.get(key)!;
        existing.revenue += total;
        existing.count += 1;
      }
    });

    const list = Array.from(map.values());
    const maxRev = list.reduce((max, item) => Math.max(max, item.revenue), 0) || 1;
    const totalRevenue = list.reduce((sum, item) => sum + item.revenue, 0);

    return { list, maxRev, totalRevenue };
  }, [chartSourceAppointments, timelineGranularity, clientsMap, services]);

  // Calculations for Smooth Spline Line Chart
  const lineChartPoints = useMemo(() => {
    const count = timelineChartData.list.length;
    if (count === 0) return { points: [], linePath: '', areaPath: '', yLevels: [] };

    const paddingLeft = 55;
    const paddingRight = 25;
    const chartWidth = 650 - paddingLeft - paddingRight; // 570
    const paddingTop = 22;
    const chartHeight = 135; // from y=22 to y=157
    const baseY = paddingTop + chartHeight;

    const points = timelineChartData.list.map((item, index) => {
      const x = count === 1 ? paddingLeft + chartWidth / 2 : paddingLeft + (index / (count - 1)) * chartWidth;
      const ratio = timelineChartData.maxRev > 0 ? item.revenue / timelineChartData.maxRev : 0;
      const y = paddingTop + chartHeight - ratio * chartHeight;
      return { ...item, x, y, index };
    });

    // Generate smooth cubic Bezier path
    let linePath = '';
    if (points.length === 1) {
      linePath = `M ${points[0].x} ${points[0].y}`;
    } else if (points.length === 2) {
      linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
    } else if (points.length > 2) {
      linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < points.length - 2 ? points[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
    }

    const areaPath = points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${baseY} L ${points[0].x.toFixed(1)} ${baseY} Z`
      : '';

    const yLevels = [
      { y: paddingTop, val: timelineChartData.maxRev },
      { y: paddingTop + chartHeight * 0.5, val: timelineChartData.maxRev * 0.5 },
      { y: baseY, val: 0 }
    ];

    return { points, linePath, areaPath, yLevels, baseY, paddingLeft, chartWidth };
  }, [timelineChartData]);

  // =========================================================
  // 3. REVENUE BY CATEGORY
  // =========================================================
  const categoryData = useMemo(() => {
    const map = new Map<string, { category: string; revenue: number; count: number }>();

    periodAppointments.forEach(apt => {
      const { items } = getAppointmentDetails(apt);
      items.forEach(item => {
        const cat = item.category || 'Geral';
        if (!map.has(cat)) {
          map.set(cat, { category: cat, revenue: item.price, count: 1 });
        } else {
          const ex = map.get(cat)!;
          ex.revenue += item.price;
          ex.count += 1;
        }
      });
    });

    const list = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    const totalRev = list.reduce((sum, item) => sum + item.revenue, 0) || 1;

    return list.map(item => ({
      ...item,
      percentage: Math.round((item.revenue / totalRev) * 100)
    }));
  }, [periodAppointments, clientsMap, services]);

  // =========================================================
  // 4. SERVIÇOS MAIS SOLICITADOS (TOP PROCEDIMENTOS)
  // =========================================================
  const topServices = useMemo(() => {
    const map = new Map<string, {
      name: string;
      category: string;
      count: number;
      totalRevenue: number;
      avgPrice: number;
    }>();

    periodAppointments.forEach(apt => {
      const { items } = getAppointmentDetails(apt);
      items.forEach(item => {
        const key = item.name.trim();
        if (!map.has(key)) {
          map.set(key, {
            name: key,
            category: item.category,
            count: 1,
            totalRevenue: item.price,
            avgPrice: item.price
          });
        } else {
          const ex = map.get(key)!;
          ex.count += 1;
          ex.totalRevenue += item.price;
          ex.avgPrice = ex.totalRevenue / ex.count;
        }
      });
    });

    const list = Array.from(map.values()).sort((a, b) => b.count - a.count);
    const grandTotal = list.reduce((acc, s) => acc + s.count, 0) || 1;

    return list.map((s, idx) => ({
      ...s,
      rank: idx + 1,
      percentage: Math.round((s.count / grandTotal) * 100),
      color: LUXURY_PALETTE[idx % LUXURY_PALETTE.length]
    }));
  }, [periodAppointments, clientsMap, services]);

  // 3D PIE CALCULATIONS FOR SERVICES
  const servicesPie3DData = useMemo(() => {
    const topList = topServices.slice(0, 6);
    const totalCount = topList.reduce((sum, s) => sum + s.count, 0);
    if (totalCount === 0 || topList.length === 0) return { slices: [], totalCount: 0 };

    let currentAngle = -Math.PI / 2;
    const cx = 150;
    const cy = 110;
    const rx = 100;
    const ry = 58;
    const depth = 22;

    const slices = topList.map((srv, index) => {
      const sliceAngle = (srv.count / totalCount) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const x1 = cx + rx * Math.cos(startAngle);
      const y1 = cy + ry * Math.sin(startAngle);
      const x2 = cx + rx * Math.cos(endAngle);
      const y2 = cy + ry * Math.sin(endAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const topPath = `M ${cx} ${cy} L ${x1} ${y1} A ${rx} ${ry} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      const sidePath = `M ${x1} ${y1} L ${x1} ${y1 + depth} A ${rx} ${ry} 0 ${largeArc} 1 ${x2} ${y2 + depth} L ${x2} ${y2} A ${rx} ${ry} 0 ${largeArc} 0 ${x1} ${y1} Z`;

      const midAngle = startAngle + sliceAngle / 2;
      const liftDistance = 8;
      const liftX = Math.cos(midAngle) * liftDistance;
      const liftY = Math.sin(midAngle) * liftDistance;

      return {
        index,
        service: srv,
        startAngle,
        endAngle,
        midAngle,
        topPath,
        sidePath,
        liftX,
        liftY,
        color: srv.color
      };
    });

    return { slices, totalCount };
  }, [topServices]);

  // =========================================================
  // 5. SERVIÇOS POR REGIÃO / BAIRRO (GEOGRAFIA DE ATENDIMENTO)
  // =========================================================
  const regionalDemand = useMemo(() => {
    const map = new Map<string, {
      regionName: string;
      appointmentsCount: number;
      revenue: number;
      clientsSet: Set<string>;
    }>();

    periodAppointments.forEach(apt => {
      const { total, matchedClient } = getAppointmentDetails(apt);

      let region = 'Bela Vista, São Paulo - SP';
      if (matchedClient) {
        if (matchedClient.neighborhood && matchedClient.city) {
          region = `${matchedClient.neighborhood}, ${matchedClient.city}`;
        } else if (matchedClient.neighborhood) {
          region = matchedClient.neighborhood;
        } else if (matchedClient.location) {
          region = matchedClient.location;
        }
      } else if (apt.location) {
        region = apt.location;
      }

      const clientIdentifier = apt.clientName || 'Cliente';

      if (!map.has(region)) {
        map.set(region, {
          regionName: region,
          appointmentsCount: 1,
          revenue: total,
          clientsSet: new Set([clientIdentifier])
        });
      } else {
        const ex = map.get(region)!;
        ex.appointmentsCount += 1;
        ex.revenue += total;
        ex.clientsSet.add(clientIdentifier);
      }
    });

    const list = Array.from(map.values())
      .map(r => ({
        regionName: r.regionName,
        appointmentsCount: r.appointmentsCount,
        revenue: r.revenue,
        uniqueClients: r.clientsSet.size,
        avgTicket: r.appointmentsCount > 0 ? r.revenue / r.appointmentsCount : 0
      }))
      .sort((a, b) => b.appointmentsCount - a.appointmentsCount);

    const totalApts = list.reduce((acc, r) => acc + r.appointmentsCount, 0) || 1;

    return list.map((r, idx) => ({
      ...r,
      rank: idx + 1,
      percentage: Math.round((r.appointmentsCount / totalApts) * 100),
      color: LUXURY_PALETTE[idx % LUXURY_PALETTE.length]
    }));
  }, [periodAppointments, clientsMap, services]);

  // 3D PIE CALCULATIONS FOR REGIONAL DEMAND
  const regionalPie3DData = useMemo(() => {
    const topList = regionalDemand.slice(0, 6);
    const totalCount = topList.reduce((sum, r) => sum + r.appointmentsCount, 0);
    if (totalCount === 0 || topList.length === 0) return { slices: [], totalCount: 0 };

    let currentAngle = -Math.PI / 2;
    const cx = 150;
    const cy = 110;
    const rx = 100;
    const ry = 58;
    const depth = 22;

    const slices = topList.map((region, index) => {
      const sliceAngle = (region.appointmentsCount / totalCount) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const x1 = cx + rx * Math.cos(startAngle);
      const y1 = cy + ry * Math.sin(startAngle);
      const x2 = cx + rx * Math.cos(endAngle);
      const y2 = cy + ry * Math.sin(endAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const topPath = `M ${cx} ${cy} L ${x1} ${y1} A ${rx} ${ry} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      const sidePath = `M ${x1} ${y1} L ${x1} ${y1 + depth} A ${rx} ${ry} 0 ${largeArc} 1 ${x2} ${y2 + depth} L ${x2} ${y2} A ${rx} ${ry} 0 ${largeArc} 0 ${x1} ${y1} Z`;

      const midAngle = startAngle + sliceAngle / 2;
      const liftDistance = 8;
      const liftX = Math.cos(midAngle) * liftDistance;
      const liftY = Math.sin(midAngle) * liftDistance;

      return {
        index,
        region,
        startAngle,
        endAngle,
        midAngle,
        topPath,
        sidePath,
        liftX,
        liftY,
        color: region.color
      };
    });

    return { slices, totalCount };
  }, [regionalDemand]);

  // =========================================================
  // 6. TOP CLIENTES VIP / MAIS ATIVAS DO PERÍODO
  // =========================================================
  const topClients = useMemo(() => {
    const map = new Map<string, {
      clientId?: string;
      clientName: string;
      clientAvatar?: string;
      phone?: string;
      neighborhood?: string;
      appointmentsCount: number;
      totalSpent: number;
      lastDate: string;
    }>();

    periodAppointments.forEach(apt => {
      const { total, matchedClient } = getAppointmentDetails(apt);
      const nameKey = (apt.clientName || 'Cliente').trim();
      const avatar = apt.clientAvatar || matchedClient?.avatar;
      const phone = matchedClient?.phone;
      const neighborhood = matchedClient?.neighborhood || apt.location;

      if (!map.has(nameKey)) {
        map.set(nameKey, {
          clientId: apt.clientId || matchedClient?.id,
          clientName: nameKey,
          clientAvatar: avatar,
          phone,
          neighborhood,
          appointmentsCount: 1,
          totalSpent: total,
          lastDate: apt.date
        });
      } else {
        const ex = map.get(nameKey)!;
        ex.appointmentsCount += 1;
        ex.totalSpent += total;
        if (apt.date > ex.lastDate) ex.lastDate = apt.date;
        if (!ex.clientId && (apt.clientId || matchedClient?.id)) {
          ex.clientId = apt.clientId || matchedClient?.id;
        }
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 6);
  }, [periodAppointments, clientsMap, services]);

  // Format currency in BRL
  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-[#F6F3EE] p-4 sm:p-6 md:p-8 space-y-6 font-sans text-stone-800 select-none pb-24">
      
      {/* ========================================================= */}
      {/* 1. HEADER & PERIOD FILTER BAR                             */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl border border-[#E2D8CA] rounded-3xl p-5 sm:p-6 shadow-sm">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-[#966b1a] text-[10px] font-black uppercase tracking-wider mb-1.5 shadow-2xs">
            <Sparkle size={12} weight="fill" className="text-[#c5922a]" />
            <span>Hemillyn Costa Home SPA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#3D3028] tracking-tight">
            Dashboard Executivo
          </h1>
          <p className="text-xs text-[#8C7A6B] font-semibold mt-0.5">
            Visão financeira, volume de clientes, demanda por região e ranking de procedimentos.
          </p>
        </div>

        {/* Period Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#FAF6F0] p-1 rounded-2xl border border-[#E2D8CA] flex items-center shadow-2xs">
            {(
              [
                { id: 'today', label: 'Hoje' },
                { id: 'week', label: 'Semana' },
                { id: 'month', label: 'Este Mês' },
                { id: 'quarter', label: '3 Meses' },
                { id: 'year', label: 'Este Ano' },
                { id: 'all', label: 'Tudo' }
              ] as { id: PeriodFilter; label: string }[]
            ).map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  period === opt.id
                    ? 'bg-gradient-to-r from-[#c5922a] to-[#966b1a] text-amber-50 shadow-xs'
                    : 'text-[#6A5A4D] hover:text-[#3D3028] hover:bg-white/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-white hover:bg-[#FAF6F0] border border-[#E2D8CA] text-[#966b1a] hover:text-[#7d5610] shadow-2xs transition-all cursor-pointer"
            title="Atualizar dados do Supabase"
          >
            <ArrowsClockwise size={18} weight="bold" className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#c5922a]/30 border-t-[#c5922a] rounded-full animate-spin" />
          <span className="text-xs font-bold text-stone-500">Calculando indicadores financeiros e métricas...</span>
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* 2. KPIS CARDS (CARDS EXECUTIVOS)                          */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* Card 1: Faturamento Total */}
            <div className="bg-white/95 backdrop-blur-xl border border-[#E2D8CA] rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-amber-200/30 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#8C6D46]">
                  Faturamento do Período
                </span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#966b1a] shadow-2xs">
                  <CurrencyDollar size={20} weight="bold" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl sm:text-3xl font-black text-[#3D3028] tracking-tight">
                  {formatBrl(metrics.totalRevenue)}
                </h3>
                <div className="flex items-center space-x-1.5 mt-1 text-xs text-[#8C6D46] font-bold">
                  <TrendUp size={14} weight="bold" className="text-[#8C6D46]" />
                  <span>{metrics.totalAptsCount} atendimentos registrados</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#E2D8CA]/60 flex items-center justify-between text-[11px] text-[#8C7A6B] font-semibold">
                <span>Concluído: <strong className="text-[#3D3028]">{formatBrl(metrics.completedRevenue)}</strong></span>
                <span>Pendente: <strong className="text-[#966b1a]">{formatBrl(metrics.pendingRevenue)}</strong></span>
              </div>
            </div>

            {/* Card 2: Ticket Médio */}
            <div className="bg-white/95 backdrop-blur-xl border border-[#E2D8CA] rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-amber-200/30 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#8C6D46]">
                  Ticket Médio / Atendimento
                </span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#966b1a] shadow-2xs">
                  <Receipt size={20} weight="bold" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl sm:text-3xl font-black text-[#3D3028] tracking-tight">
                  {formatBrl(metrics.averageTicket)}
                </h3>
                <div className="flex items-center space-x-1.5 mt-1 text-xs text-[#8C6D46] font-bold">
                  <Receipt size={14} weight="bold" className="text-[#8C6D46]" />
                  <span>Média por sessão agendada</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#E2D8CA]/60 flex items-center justify-between text-[11px] text-[#8C7A6B] font-semibold">
                <span>Procedimentos totais:</span>
                <strong className="text-[#3D3028]">{metrics.totalProceduresCount} serviços</strong>
              </div>
            </div>

            {/* Card 3: Clientes Atendidos */}
            <div className="bg-white/95 backdrop-blur-xl border border-[#E2D8CA] rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-amber-200/30 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#8C6D46]">
                  Clientes Atendidos
                </span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#966b1a] shadow-2xs">
                  <Users size={20} weight="bold" />
                </div>
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-2xl sm:text-3xl font-black text-[#3D3028] tracking-tight">
                  {metrics.uniqueClientsCount}
                </h3>
                <div className="flex items-center justify-center space-x-1.5 mt-1 text-xs text-[#8C6D46] font-bold">
                  <Users size={14} weight="bold" className="text-[#8C6D46]" />
                  <span>De {clients.length} clientes na base</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#E2D8CA]/60 flex items-center justify-between text-[11px] text-[#8C7A6B] font-semibold">
                <span>Taxa de Recorrência:</span>
                <strong className="text-[#966b1a] font-black">{metrics.recurrenceRate}%</strong>
              </div>
            </div>

            {/* Card 4: Demanda Regional */}
            <div className="bg-white/95 backdrop-blur-xl border border-[#E2D8CA] rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-amber-200/30 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#8C6D46]">
                  Regiões de Atendimento
                </span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#966b1a] shadow-2xs">
                  <MapPin size={20} weight="bold" />
                </div>
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-2xl sm:text-3xl font-black text-[#3D3028] tracking-tight">
                  {regionalDemand.length}
                </h3>
                <div className="flex items-center justify-center space-x-1.5 mt-1 text-xs text-[#8C6D46] font-bold">
                  <MapPin size={14} weight="bold" className="text-[#8C6D46]" />
                  <span>Bairros &amp; Cidades atendidos</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#E2D8CA]/60 flex items-center justify-between text-[11px] text-[#8C7A6B] font-semibold">
                <span>Região Principal:</span>
                <strong className="text-[#3D3028] truncate max-w-[120px]">{regionalDemand[0]?.regionName.split(',')[0] || 'Geral'}</strong>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* 3. FINANCIAL CHARTS & CATEGORY DISTRIBUTION               */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Left: Professional Revenue Timeline Chart (Linhas / Spline) */}
            <div className="lg:col-span-2 bg-white/95 backdrop-blur-xl border border-[#E2D8CA] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#966b1a]">
                      <ChartLineUp size={18} weight="bold" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#3D3028]">Evolução do Faturamento</h3>
                      <p className="text-[11px] text-[#8C7A6B] font-semibold">
                        {timelineGranularity === 'day' && 'Distribuição diária da receita no período'}
                        {timelineGranularity === 'month' && 'Visão mensal comparativa do faturamento'}
                        {timelineGranularity === 'year' && 'Histórico anual consolidado de faturamento'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Granularity Selector: Dia / Mês / Ano */}
                    <div className="bg-[#FAF6F0] p-0.5 rounded-xl border border-[#E2D8CA] flex items-center">
                      <button
                        type="button"
                        onClick={() => setTimelineGranularity('day')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          timelineGranularity === 'day'
                            ? 'bg-[#c5922a] text-amber-50 shadow-2xs'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Dia
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimelineGranularity('month')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          timelineGranularity === 'month'
                            ? 'bg-[#c5922a] text-amber-50 shadow-2xs'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Mês
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimelineGranularity('year')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          timelineGranularity === 'year'
                            ? 'bg-[#c5922a] text-amber-50 shadow-2xs'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Ano
                      </button>
                    </div>

                    <span className="text-xs font-black text-[#966b1a] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      Total: {formatBrl(timelineChartData.totalRevenue)}
                    </span>
                  </div>
                </div>

                {timelineChartData.list.length === 0 ? (
                  <div className="py-16 text-center text-stone-400">
                    <CalendarCheck size={36} weight="duotone" className="mx-auto text-stone-300 mb-2" />
                    <p className="text-xs font-bold text-[#6A5A4D]">Nenhum faturamento registrado para o período.</p>
                  </div>
                ) : (
                  <div className="relative pt-2 pb-1">
                    {/* SVG Professional Smooth Line Chart */}
                    <svg
                      viewBox="0 0 650 195"
                      className="w-full h-48 sm:h-52 overflow-visible select-none"
                    >
                      <defs>
                        {/* Gradient for smooth area fill */}
                        <linearGradient id="revAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#c5922a" stopOpacity="0.32" />
                          <stop offset="60%" stopColor="#e8be6b" stopOpacity="0.10" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Gradient for line stroke */}
                        <linearGradient id="revLineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#a3741c" />
                          <stop offset="50%" stopColor="#d4a34b" />
                          <stop offset="100%" stopColor="#c5922a" />
                        </linearGradient>

                        {/* Subtle glow filter */}
                        <filter id="revLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#c5922a" floodOpacity="0.25" />
                        </filter>
                      </defs>

                      {/* 1. Horizontal Reference Grid Lines & Values */}
                      {lineChartPoints.yLevels.map((lvl, idx) => (
                        <g key={idx}>
                          <line
                            x1="52"
                            y1={lvl.y}
                            x2="630"
                            y2={lvl.y}
                            stroke="#E2D8CA"
                            strokeDasharray={idx === 2 ? undefined : "3 3"}
                            strokeWidth={idx === 2 ? "1.2" : "0.9"}
                            opacity={idx === 2 ? "0.9" : "0.7"}
                          />
                          <text
                            x="46"
                            y={lvl.y + 3.5}
                            textAnchor="end"
                            fontSize="9"
                            fontWeight="800"
                            fill="#8C7A6B"
                          >
                            {lvl.val >= 1000 ? `R$ ${(lvl.val / 1000).toFixed(lvl.val % 1000 === 0 ? 0 : 1)}k` : formatBrl(lvl.val)}
                          </text>
                        </g>
                      ))}

                      {/* 2. Area Shading under the line */}
                      {lineChartPoints.areaPath && (
                        <path
                          d={lineChartPoints.areaPath}
                          fill="url(#revAreaGradient)"
                          className="transition-all duration-500 ease-out"
                        />
                      )}

                      {/* 3. Smooth Line Stroke */}
                      {lineChartPoints.linePath && (
                        <path
                          d={lineChartPoints.linePath}
                          fill="none"
                          stroke="url(#revLineGradient)"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#revLineGlow)"
                          className="transition-all duration-500 ease-out"
                        />
                      )}

                      {/* 4. Interactive Vertical Hover Guide Line */}
                      {activeTimelineHover !== null && lineChartPoints.points[activeTimelineHover] && (
                        <line
                          x1={lineChartPoints.points[activeTimelineHover].x}
                          y1="22"
                          x2={lineChartPoints.points[activeTimelineHover].x}
                          y2={lineChartPoints.baseY}
                          stroke="#c5922a"
                          strokeDasharray="3 3"
                          strokeWidth="1.5"
                          opacity="0.75"
                        />
                      )}

                      {/* 5. Data Points with Hover & Pulse Effects */}
                      {lineChartPoints.points.map((p) => {
                        const isHovered = activeTimelineHover === p.index;
                        return (
                          <g key={p.key} className="cursor-pointer">
                            {/* Outer Pulse ring when active */}
                            {isHovered && (
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="10"
                                fill="rgba(197, 146, 42, 0.25)"
                                className="animate-ping"
                              />
                            )}

                            {/* Center Point Circle */}
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={isHovered ? "6" : "3.5"}
                              fill="#ffffff"
                              stroke="#c5922a"
                              strokeWidth={isHovered ? "3" : "2"}
                              className="transition-all duration-200 shadow-sm"
                            />

                            {/* X-axis Label */}
                            <text
                              x={p.x}
                              y="178"
                              textAnchor="middle"
                              fontSize="9.5"
                              fontWeight={isHovered ? "900" : "700"}
                              fill={isHovered ? "#3D3028" : "#8C7A6B"}
                              className="transition-colors"
                            >
                              {p.label}
                            </text>

                            {/* Invisible wider hit area for easy hover on mobile and desktop */}
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="20"
                              fill="transparent"
                              onMouseEnter={() => setActiveTimelineHover(p.index)}
                              onMouseLeave={() => setActiveTimelineHover(null)}
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Floating Tooltip positioned dynamically above active point */}
                    {activeTimelineHover !== null && lineChartPoints.points[activeTimelineHover] && (
                      <div
                        className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 bg-stone-900/95 backdrop-blur-md text-white text-xs py-2 px-3 rounded-2xl shadow-xl border border-stone-700 whitespace-nowrap animate-fade-in flex flex-col items-center"
                        style={{
                          left: `${(lineChartPoints.points[activeTimelineHover].x / 650) * 100}%`,
                          top: `${(lineChartPoints.points[activeTimelineHover].y / 195) * 100}%`
                        }}
                      >
                        <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider mb-0.5">
                          {lineChartPoints.points[activeTimelineHover].tooltipTitle}
                        </span>
                        <span className="text-sm font-black text-white">
                          {formatBrl(lineChartPoints.points[activeTimelineHover].revenue)}
                        </span>
                        <span className="text-[10px] text-stone-300 font-medium">
                          {lineChartPoints.points[activeTimelineHover].count} {lineChartPoints.points[activeTimelineHover].count === 1 ? 'atendimento' : 'atendimentos'}
                        </span>
                        {/* Downward pointing triangle arrow */}
                        <div className="w-2 h-2 bg-stone-900 rotate-45 border-r border-b border-stone-700 -mb-1 mt-1" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[#E2D8CA]/60 flex flex-wrap items-center justify-between text-xs text-[#8C7A6B] gap-2">
                <span>
                  {timelineGranularity === 'day' ? 'Média Diária' : timelineGranularity === 'month' ? 'Média Mensal' : 'Média Anual'}:{' '}
                  <strong className="text-[#3D3028]">
                    {timelineChartData.list.length > 0 ? formatBrl(timelineChartData.totalRevenue / timelineChartData.list.length) : formatBrl(0)}
                  </strong>
                </span>
                <span>Pico no Período: <strong className="text-[#966b1a]">{formatBrl(timelineChartData.maxRev)}</strong></span>
              </div>
            </div>

            {/* Right: Revenue by Category */}
            <div className="bg-white/95 backdrop-blur-xl border border-[#E2D8CA] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#966b1a]">
                    <ChartPieSlice size={18} weight="bold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#3D3028]">Receita por Categoria</h3>
                    <p className="text-[11px] text-[#8C7A6B] font-semibold">Participação por tipo de tratamento</p>
                  </div>
                </div>

                {categoryData.length === 0 ? (
                  <div className="py-16 text-center text-stone-400">
                    <p className="text-xs font-bold text-[#6A5A4D]">Sem dados de categoria no período.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 pt-1">
                    {categoryData.map((cat, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#3D3028]">{cat.category}</span>
                          <span className="text-[#966b1a]">{formatBrl(cat.revenue)} ({cat.percentage}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#FAF6F0] border border-[#E2D8CA] overflow-hidden">
                          <div
                            style={{ width: `${cat.percentage}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-[#c5922a] to-[#d4a34b]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[#E2D8CA]/60 text-center text-[11px] text-[#8C7A6B] font-semibold">
                Categorias identificadas automaticamente dos agendamentos
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* 4. PRINCIPAIS CLIENTES DO PERÍODO                         */}
          {/* ========================================================= */}
          <div className="bg-white/95 backdrop-blur-xl border border-[#E2D8CA] rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#966b1a]">
                  <Star size={18} weight="fill" />
                </div>
                <h3 className="text-sm font-black text-[#3D3028]">Principais Clientes do Período</h3>
              </div>

              {onNavigateToClients && (
                <button
                  type="button"
                  onClick={onNavigateToClients}
                  className="text-xs font-bold text-[#966b1a] hover:text-[#7d5610] flex items-center space-x-1 cursor-pointer"
                >
                  <span>Ver todas as clientes</span>
                  <ArrowSquareOut size={13} weight="bold" />
                </button>
              )}
            </div>

            {topClients.length === 0 ? (
              <div className="py-6 text-center text-stone-400">
                <p className="text-xs font-bold text-[#6A5A4D]">Nenhuma cliente com atendimentos no período.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topClients.map((client, idx) => (
                  <div
                    key={idx}
                    onClick={() => client.clientId && onNavigateToClientDetail && onNavigateToClientDetail(client.clientId)}
                    className="p-3 sm:p-3.5 rounded-2xl bg-[#FAF6F0]/80 hover:bg-[#FAF6F0] border border-[#E2D8CA] transition-all flex items-center justify-between gap-3 shadow-2xs cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#E2D8CA] flex items-center justify-center text-[#966b1a] font-black text-xs shrink-0 overflow-hidden shadow-2xs">
                        {client.clientAvatar ? (
                          <img src={client.clientAvatar} alt={client.clientName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{(client.clientName || 'C')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-[#3D3028] group-hover:text-[#966b1a] transition-colors truncate">
                          {client.clientName}
                        </h4>
                        <p className="text-[10px] text-[#8C7A6B] font-medium truncate mt-0.5">
                          {client.neighborhood ? client.neighborhood.split(',')[0] : (client.phone || 'Cliente VIP')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-[#3D3028] block">{formatBrl(client.totalSpent)}</span>
                      <span className="text-[10px] font-bold text-[#966b1a]">{client.appointmentsCount} sessões</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 5. SERVIÇOS MAIS SOLICITADOS & DEMANDA REGIONAL (PIZZA 3D) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* 1. Top Serviços Mais Solicitados com GRÁFICO DE PIZZA 3D */}
            <div className="bg-white/95 backdrop-blur-xl border border-[#E2D8CA] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#966b1a]">
                      <Trophy size={18} weight="bold" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#3D3028]">Serviços Mais Solicitados</h3>
                      <p className="text-[11px] text-[#8C7A6B] font-semibold">Distribuição de procedimentos em Gráfico de Pizza 3D</p>
                    </div>
                  </div>

                  {/* Toggle Mode: 3D Pizza vs Lista */}
                  <div className="bg-[#FAF6F0] p-0.5 rounded-xl border border-[#E2D8CA] flex items-center">
                    <button
                      type="button"
                      onClick={() => setServicesViewMode('3d')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center space-x-1 ${
                        servicesViewMode === '3d'
                          ? 'bg-[#c5922a] text-amber-50 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                      title="Visão Gráfico de Pizza 3D"
                    >
                      <ChartPieSlice size={13} weight="bold" />
                      <span>Pizza 3D</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setServicesViewMode('list')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center space-x-1 ${
                        servicesViewMode === 'list'
                          ? 'bg-[#c5922a] text-amber-50 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                      title="Visão em Lista Detalhada"
                    >
                      <ListBullets size={13} weight="bold" />
                      <span>Lista</span>
                    </button>
                  </div>
                </div>

                {topServices.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <Sparkle size={32} weight="duotone" className="mx-auto text-stone-300 mb-2" />
                    <p className="text-xs font-bold text-[#6A5A4D]">Nenhum procedimento agendado no período.</p>
                  </div>
                ) : servicesViewMode === '3d' ? (
                  /* ========================================================= */
                  /* GRÁFICO DE PIZZA 3D - SERVIÇOS MAIS SOLICITADOS           */
                  /* ========================================================= */
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-1">
                    
                    {/* SVG 3D Pie Chart Viewport */}
                    <div className="relative w-full max-w-[280px] h-[210px] flex items-center justify-center">
                      <svg
                        viewBox="0 0 300 230"
                        className="w-full h-full overflow-visible select-none drop-shadow-[0_15px_25px_rgba(0,0,0,0.12)]"
                      >
                        <defs>
                          {/* Radial & Linear Gradients for metallic 3D sheen */}
                          {servicesPie3DData.slices.map((s) => (
                            <React.Fragment key={s.index}>
                              <linearGradient id={`srvTopGrad-${s.index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={s.color.light} />
                                <stop offset="50%" stopColor={s.color.top} />
                                <stop offset="100%" stopColor={s.color.side} />
                              </linearGradient>
                              <linearGradient id={`srvSideGrad-${s.index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={s.color.side} />
                                <stop offset="100%" stopColor="#1e1814" stopOpacity="0.8" />
                              </linearGradient>
                            </React.Fragment>
                          ))}
                          
                          {/* 3D Base Drop Shadow */}
                          <radialGradient id="srvPieShadow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(61,48,40,0.35)" />
                            <stop offset="60%" stopColor="rgba(61,48,40,0.15)" />
                            <stop offset="100%" stopColor="rgba(61,48,40,0)" />
                          </radialGradient>
                        </defs>

                        {/* Base Ground Shadow */}
                        <ellipse cx="150" cy="148" rx="112" ry="52" fill="url(#srvPieShadow)" />

                        {/* 1. Render Side Depth Walls (Lower 3D Cylinder Extrusions) */}
                        {servicesPie3DData.slices.map((s) => {
                          const isHovered = activeServiceHover === s.index;
                          const transform = isHovered ? `translate(${s.liftX}px, ${s.liftY - 6}px)` : 'translate(0px, 0px)';

                          return (
                            <g
                              key={`srv-side-${s.index}`}
                              style={{ transform, transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                              onMouseEnter={() => setActiveServiceHover(s.index)}
                              onMouseLeave={() => setActiveServiceHover(null)}
                              className="cursor-pointer"
                            >
                              <path
                                d={s.sidePath}
                                fill={`url(#srvSideGrad-${s.index})`}
                                stroke={s.color.side}
                                strokeWidth="0.8"
                                opacity={activeServiceHover !== null && !isHovered ? 0.6 : 1}
                              />
                            </g>
                          );
                        })}

                        {/* 2. Render Top Surface Slices */}
                        {servicesPie3DData.slices.map((s) => {
                          const isHovered = activeServiceHover === s.index;
                          const transform = isHovered ? `translate(${s.liftX}px, ${s.liftY - 6}px)` : 'translate(0px, 0px)';

                          return (
                            <g
                              key={`srv-top-${s.index}`}
                              style={{ transform, transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                              onMouseEnter={() => setActiveServiceHover(s.index)}
                              onMouseLeave={() => setActiveServiceHover(null)}
                              className="cursor-pointer"
                            >
                              <path
                                d={s.topPath}
                                fill={`url(#srvTopGrad-${s.index})`}
                                stroke="#ffffff"
                                strokeWidth={isHovered ? '2.5' : '1.5'}
                                opacity={activeServiceHover !== null && !isHovered ? 0.55 : 1}
                                className="transition-opacity"
                              />

                              {/* Center percentage label if slice is large enough */}
                              {s.service.percentage >= 15 && (
                                <text
                                  x={150 + Math.cos(s.midAngle) * 62}
                                  y={110 + Math.sin(s.midAngle) * 36}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fill="#ffffff"
                                  fontSize="10"
                                  fontWeight="900"
                                  className="pointer-events-none drop-shadow-md"
                                >
                                  {s.service.percentage}%
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>

                      {/* Tooltip on Active Slice */}
                      {activeServiceHover !== null && servicesPie3DData.slices[activeServiceHover] && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-stone-900/95 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-xl z-30 pointer-events-none whitespace-nowrap animate-fade-in border border-stone-700 flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: servicesPie3DData.slices[activeServiceHover].color.top }}
                          />
                          <span>
                            {servicesPie3DData.slices[activeServiceHover].service.name}:{' '}
                            <strong>{servicesPie3DData.slices[activeServiceHover].service.count} sessões</strong> (
                            {servicesPie3DData.slices[activeServiceHover].service.percentage}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Interactive 3D Legend Breakdown */}
                    <div className="flex-1 space-y-2 w-full min-w-0">
                      {topServices.slice(0, 5).map((srv, idx) => {
                        const isHovered = activeServiceHover === idx;
                        return (
                          <div
                            key={srv.name}
                            onMouseEnter={() => setActiveServiceHover(idx)}
                            onMouseLeave={() => setActiveServiceHover(null)}
                            className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                              isHovered
                                ? 'bg-white border-[#c5922a] shadow-sm scale-[1.02]'
                                : 'bg-[#FAF6F0]/70 border-[#E2D8CA] hover:bg-[#FAF6F0]'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <span
                                className="w-3.5 h-3.5 rounded-lg shrink-0 shadow-2xs"
                                style={{ backgroundColor: srv.color.top }}
                              />
                              <span className="font-bold text-[#3D3028] truncate">
                                {srv.name}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-right shrink-0">
                              <span className="font-extrabold text-[#966b1a]">
                                {srv.percentage}%
                              </span>
                              <span className="text-[10px] text-[#8C7A6B] font-semibold">
                                ({srv.count} sessões)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                ) : (
                  /* ========================================================= */
                  /* VISÃO EM LISTA DETALHADA                                  */
                  /* ========================================================= */
                  <div className="space-y-3">
                    {topServices.slice(0, 5).map((srv) => (
                      <div
                        key={srv.name}
                        className="p-3.5 rounded-2xl bg-[#FAF6F0]/70 hover:bg-[#FAF6F0] border border-[#E2D8CA] transition-all flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${srv.color.bg} ${srv.color.text} border ${srv.color.border}`}>
                            #{srv.rank}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-[#3D3028] truncate">{srv.name}</h4>
                            <div className="flex items-center space-x-2 text-[10px] text-[#8C7A6B] font-semibold mt-0.5">
                              <span>{srv.category}</span>
                              <span>•</span>
                              <span>Preço Médio: {formatBrl(srv.avgPrice)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-[#3D3028] block">{srv.count} sessões</span>
                          <span className="text-[10px] font-bold text-[#966b1a]">{formatBrl(srv.totalRevenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3.5 mt-3.5 border-t border-[#E2D8CA]/60 flex items-center justify-between text-[11px] text-[#8C7A6B] font-semibold">
                <span>Procedimentos Únicos Agendados:</span>
                <strong className="text-[#3D3028]">{topServices.length} tipos de serviços</strong>
              </div>
            </div>

            {/* 2. Demanda Regional / Bairros com GRÁFICO DE PIZZA 3D */}
            <div className="bg-white/95 backdrop-blur-xl border border-[#E2D8CA] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#966b1a]">
                      <MapPin size={18} weight="bold" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#3D3028]">Serviços por Região / Bairro</h3>
                      <p className="text-[11px] text-[#8C7A6B] font-semibold">Distribuição geográfica em Gráfico de Pizza 3D</p>
                    </div>
                  </div>

                  {/* Toggle Mode: 3D Pizza vs Lista */}
                  <div className="bg-[#FAF6F0] p-0.5 rounded-xl border border-[#E2D8CA] flex items-center">
                    <button
                      type="button"
                      onClick={() => setRegionViewMode('3d')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center space-x-1 ${
                        regionViewMode === '3d'
                          ? 'bg-[#c5922a] text-amber-50 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                      title="Visão Gráfico de Pizza 3D"
                    >
                      <ChartPieSlice size={13} weight="bold" />
                      <span>Pizza 3D</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegionViewMode('list')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center space-x-1 ${
                        regionViewMode === 'list'
                          ? 'bg-[#c5922a] text-amber-50 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                      title="Visão em Lista Detalhada"
                    >
                      <ListBullets size={13} weight="bold" />
                      <span>Lista</span>
                    </button>
                  </div>
                </div>

                {regionalDemand.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <MapPin size={32} weight="duotone" className="mx-auto text-stone-300 mb-2" />
                    <p className="text-xs font-bold text-[#6A5A4D]">Nenhum registro de localização no período.</p>
                  </div>
                ) : regionViewMode === '3d' ? (
                  /* ========================================================= */
                  /* GRÁFICO DE PIZZA 3D COM PERSPECTIVA E PROFUNDIDADE        */
                  /* ========================================================= */
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-1">
                    
                    {/* SVG 3D Pie Chart Viewport */}
                    <div className="relative w-full max-w-[280px] h-[210px] flex items-center justify-center">
                      <svg
                        viewBox="0 0 300 230"
                        className="w-full h-full overflow-visible select-none drop-shadow-[0_15px_25px_rgba(0,0,0,0.12)]"
                      >
                        <defs>
                          {/* Radial & Linear Gradients for metallic 3D sheen */}
                          {regionalPie3DData.slices.map((s) => (
                            <React.Fragment key={s.index}>
                              <linearGradient id={`regTopGrad-${s.index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={s.color.light} />
                                <stop offset="50%" stopColor={s.color.top} />
                                <stop offset="100%" stopColor={s.color.side} />
                              </linearGradient>
                              <linearGradient id={`regSideGrad-${s.index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={s.color.side} />
                                <stop offset="100%" stopColor="#1e1814" stopOpacity="0.8" />
                              </linearGradient>
                            </React.Fragment>
                          ))}
                          
                          {/* 3D Base Drop Shadow */}
                          <radialGradient id="regPieShadow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(61,48,40,0.35)" />
                            <stop offset="60%" stopColor="rgba(61,48,40,0.15)" />
                            <stop offset="100%" stopColor="rgba(61,48,40,0)" />
                          </radialGradient>
                        </defs>

                        {/* Base Ground Shadow */}
                        <ellipse cx="150" cy="148" rx="112" ry="52" fill="url(#regPieShadow)" />

                        {/* 1. Render Side Depth Walls (Lower 3D Cylinder Extrusions) */}
                        {regionalPie3DData.slices.map((s) => {
                          const isHovered = activeRegionHover === s.index;
                          const transform = isHovered ? `translate(${s.liftX}px, ${s.liftY - 6}px)` : 'translate(0px, 0px)';

                          return (
                            <g
                              key={`reg-side-${s.index}`}
                              style={{ transform, transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                              onMouseEnter={() => setActiveRegionHover(s.index)}
                              onMouseLeave={() => setActiveRegionHover(null)}
                              className="cursor-pointer"
                            >
                              <path
                                d={s.sidePath}
                                fill={`url(#regSideGrad-${s.index})`}
                                stroke={s.color.side}
                                strokeWidth="0.8"
                                opacity={activeRegionHover !== null && !isHovered ? 0.6 : 1}
                              />
                            </g>
                          );
                        })}

                        {/* 2. Render Top Surface Slices */}
                        {regionalPie3DData.slices.map((s) => {
                          const isHovered = activeRegionHover === s.index;
                          const transform = isHovered ? `translate(${s.liftX}px, ${s.liftY - 6}px)` : 'translate(0px, 0px)';

                          return (
                            <g
                              key={`reg-top-${s.index}`}
                              style={{ transform, transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                              onMouseEnter={() => setActiveRegionHover(s.index)}
                              onMouseLeave={() => setActiveRegionHover(null)}
                              className="cursor-pointer"
                            >
                              <path
                                d={s.topPath}
                                fill={`url(#regTopGrad-${s.index})`}
                                stroke="#ffffff"
                                strokeWidth={isHovered ? '2.5' : '1.5'}
                                opacity={activeRegionHover !== null && !isHovered ? 0.55 : 1}
                                className="transition-opacity"
                              />

                              {/* Center percentage label if slice is large enough */}
                              {s.region.percentage >= 15 && (
                                <text
                                  x={150 + Math.cos(s.midAngle) * 62}
                                  y={110 + Math.sin(s.midAngle) * 36}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fill="#ffffff"
                                  fontSize="10"
                                  fontWeight="900"
                                  className="pointer-events-none drop-shadow-md"
                                >
                                  {s.region.percentage}%
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>

                      {/* Tooltip on Active Slice */}
                      {activeRegionHover !== null && regionalPie3DData.slices[activeRegionHover] && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-stone-900/95 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-xl z-30 pointer-events-none whitespace-nowrap animate-fade-in border border-stone-700 flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: regionalPie3DData.slices[activeRegionHover].color.top }}
                          />
                          <span>
                            {regionalPie3DData.slices[activeRegionHover].region.regionName.split(',')[0]}:{' '}
                            <strong>{regionalPie3DData.slices[activeRegionHover].region.appointmentsCount} apts</strong> (
                            {regionalPie3DData.slices[activeRegionHover].region.percentage}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Interactive 3D Legend Breakdown */}
                    <div className="flex-1 space-y-2 w-full min-w-0">
                      {regionalDemand.map((reg, idx) => {
                        const isHovered = activeRegionHover === idx;
                        return (
                          <div
                            key={reg.regionName}
                            onMouseEnter={() => setActiveRegionHover(idx)}
                            onMouseLeave={() => setActiveRegionHover(null)}
                            className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                              isHovered
                                ? 'bg-white border-[#c5922a] shadow-sm scale-[1.02]'
                                : 'bg-[#FAF6F0]/70 border-[#E2D8CA] hover:bg-[#FAF6F0]'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <span
                                className="w-3.5 h-3.5 rounded-lg shrink-0 shadow-2xs"
                                style={{ backgroundColor: reg.color.top }}
                              />
                              <span className="font-bold text-[#3D3028] truncate">
                                {reg.regionName.split(',')[0]}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-right shrink-0">
                              <span className="font-extrabold text-[#966b1a]">
                                {reg.percentage}%
                              </span>
                              <span className="text-[10px] text-[#8C7A6B] font-semibold">
                                ({reg.appointmentsCount} sessões)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                ) : (
                  /* ========================================================= */
                  /* VISÃO EM LISTA DETALHADA                                  */
                  /* ========================================================= */
                  <div className="space-y-3">
                    {regionalDemand.map((reg) => (
                      <div
                        key={reg.regionName}
                        className="p-3.5 rounded-2xl bg-[#FAF6F0]/70 hover:bg-[#FAF6F0] border border-[#E2D8CA] transition-all flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${reg.color.bg} ${reg.color.text} border ${reg.color.border}`}>
                            #{reg.rank}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-[#3D3028] truncate">{reg.regionName}</h4>
                            <div className="flex items-center space-x-2 text-[10px] text-[#8C7A6B] font-semibold mt-0.5">
                              <span>{reg.uniqueClients} clientes</span>
                              <span>•</span>
                              <span>Ticket Médio: {formatBrl(reg.avgTicket)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-[#3D3028] block">{reg.appointmentsCount} atendimentos</span>
                          <span className="text-[10px] font-bold text-[#966b1a]">{formatBrl(reg.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3.5 mt-3.5 border-t border-[#E2D8CA]/60 flex items-center justify-between text-[11px] text-[#8C7A6B] font-semibold">
                <span>Total de Atendimentos Regionais:</span>
                <strong className="text-[#3D3028]">{metrics.totalAptsCount} sessões</strong>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
