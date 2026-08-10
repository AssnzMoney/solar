"use client";

import styles from "./page.module.css";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { 
  Sun, 
  LayoutDashboard, 
  Activity, 
  Settings, 
  Bell, 
  Zap, 
  Cpu, 
  AlertTriangle,
  CheckCircle2,
  Search,
  AlertCircle,
  Leaf
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useState, useEffect, useRef } from "react";
import { createClient } from '@/utils/supabase/client';

const PIE_COLORS = ['#24b47e', '#3b82f6', '#a855f7'];

export default function Dashboard() {
  const [inverters, setInverters] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({ temp: '--', description: 'Carregando...', isDay: 1 });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasViewedNotifications, setHasViewedNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchApiData() {
      try {
        const response = await fetch('/api/inverters');
        const data = await response.json();
        if (data.inverters) setInverters(data.inverters);
        if (data.chartData) setChartData(data.chartData);
        
        // Puxa os logs da IA (Nova Rota que vamos criar)
        const logsRes = await fetch('/api/ai/logs');
        const logsData = await logsRes.json();
        if (logsData.logs) setAiLogs(logsData.logs);
      } catch (error) {
        console.error("Erro ao buscar dados da iSolarCloud:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchApiData();
    // Atualização em tempo real (polling a cada 3 segundos)
    const interval = setInterval(fetchApiData, 3000);

    // Buscar Clima Atual (Recife - padrão, pode ajustar a latitude e longitude depois se quiser)
    async function fetchWeather() {
      try {
        const lat = -8.0539;
        const lon = -34.8811;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        
        if (data.current_weather) {
            const wmoCodes: Record<number, string> = {
                0: 'Céu Limpo', 1: 'Maior. Limpo', 2: 'Parc. Nublado', 3: 'Nublado',
                45: 'Nevoeiro', 48: 'Nevoeiro', 51: 'Chuvisco', 53: 'Chuvisco', 55: 'Chuvisco',
                61: 'Chuva Leve', 63: 'Chuva Mod.', 65: 'Chuva Forte',
                71: 'Neve', 73: 'Neve', 75: 'Neve', 95: 'Trovoada', 96: 'Trovoada', 99: 'Trovoada'
            };
            const desc = wmoCodes[data.current_weather.weathercode as number] || 'Variável';
            setWeather({
                temp: Math.round(data.current_weather.temperature).toString(),
                description: desc,
                isDay: data.current_weather.is_day
            });
        }
      } catch (e) {
          console.error("Erro clima", e);
      }
    }
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 900000); // 15 mins

    return () => {
      clearInterval(interval);
      clearInterval(weatherInterval);
    };
  }, []);

  // --- Cálculos Dinâmicos ---
  const totalPower = inverters.reduce((acc, inv) => acc + (parseFloat(inv.power) || 0), 0).toFixed(1);
  const activeInverters = inverters.filter(inv => inv.status === 'online').length;
  const totalInverters = inverters.length;
  const offlineInverters = inverters.filter(inv => inv.status === 'offline').length;
  const warningInverters = inverters.filter(inv => inv.status === 'warning').length;
  const aiActionsToday = aiLogs.length;

  const fleetStatusData = [
    { name: 'Online', value: activeInverters, color: '#24b47e' },
    { name: 'Atenção', value: warningInverters, color: '#fbbf24' },
    { name: 'Offline', value: offlineInverters, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const isGenerating = parseFloat(totalPower) > 0;

  const dynamicEfficiencyData = isGenerating
    ? inverters.map(inv => ({
        name: inv.plant || 'Desconhecida',
        value: parseFloat(inv.power) || 0
      })).filter(inv => inv.value > 0)
    : inverters.length > 0 
      ? inverters.map(inv => ({
          name: inv.plant || 'Desconhecida',
          value: 1
        }))
      : [];

  return (
    <div className={styles.container}>
      <Sidebar />

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titleWrapper}>
            <h1 className={styles.pageTitle}>Bem-vindo, Renato</h1>
            <Sun className={styles.animatedSun} size={28} />
          </div>
        </header>

        <div className={styles.heroCard}>
          <div className={styles.heroBg}></div>
          <div className={styles.heroOverlay}></div>
          
          <div className={styles.heroContent}>
            <div className={styles.heroTop}>
              <div className={styles.heroWeather}>
                <Sun size={18} color={weather.isDay ? "#f59e0b" : "#9ca3af"} />
                <span>{weather.description}, {weather.temp}°C</span>
              </div>
              <div className={styles.heroStatus}>
                <span className={styles.liveIndicatorHero}>SYNC</span>
              </div>
            </div>

            <div className={styles.heroMain}>
              <span className={styles.heroLabel}>
                Potência Instantânea Total <div className={styles.infoIcon}>i</div>
              </span>
              <h2 className={styles.heroValue}>
                <Zap size={32} color="#24b47e" />
                {totalPower} <span style={{fontSize: '1.5rem', marginLeft: '4px', opacity: 0.8}}>kW</span>
              </h2>
            </div>

            <div className={styles.heroBottom}>
              <div className={styles.heroBottomItem}>
                <span className={styles.heroBottomLabel}>Hoje (kWh)</span>
                <span className={styles.heroBottomValue}>--</span>
              </div>
              <div className={styles.heroBottomItem}>
                <span className={styles.heroBottomLabel}>Este Mês (kWh)</span>
                <span className={styles.heroBottomValue}>--</span>
              </div>
              <div className={styles.heroBottomItem}>
                <span className={styles.heroBottomLabel}>Total (MWh)</span>
                <span className={styles.heroBottomValue}>--</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.dashboardGrid}>
          {/* Cards Principais */}
          <div className={styles.overviewCards}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                Usinas Ativas
                <Activity size={18} className={styles.cardIconBlue} />
              </div>
              <div className={styles.cardValue}>{activeInverters}<span className={styles.unit}>/{totalInverters}</span></div>
              <div className={offlineInverters > 0 ? styles.cardTrendWarning : styles.cardTrend}>
                {offlineInverters > 0 ? `${offlineInverters} Usina(s) Offline` : 'Todas as usinas operando'}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                Ações da IA (Hoje)
                <Cpu size={18} className={styles.cardIconPurple} />
              </div>
              <div className={styles.cardValue}>{aiActionsToday}</div>
              <div className={styles.cardTrend}>Últimos registros sincronizados</div>
            </div>
          </div>

          <div className={styles.mainColumns}>
            <div className={styles.leftCol}>
              {/* Gráfico */}
              <div className={`${styles.card} ${styles.chartSection}`}>
                <h2 className={styles.sectionTitle}>Geração de Energia (Hoje)</h2>
                <div className={styles.chartWrapper}>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#24b47e" stopOpacity={0.4}>
                              <animate attributeName="stop-opacity" values="0.2; 0.6; 0.2" dur="3s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="95%" stopColor="#24b47e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="timestamp" 
                          type="number"
                          scale="time"
                          domain={['dataMin', 'dataMax']}
                          tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          stroke="#a1a1aa" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tickMargin={10} 
                        />
                        <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val} kW`} width={60} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ color: '#24b47e', fontWeight: 'bold' }}
                          labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                          formatter={(value) => [`${value} kW`, 'Potência Gerada']}
                          labelFormatter={(label) => label ? new Date(Number(label)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="power" 
                          name="Potência Gerada"
                          stroke="#24b47e" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorPower)" 
                          isAnimationActive={true}
                          animationDuration={2500}
                          animationEasing="ease-in-out"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#71717a' }}>
                      Aguardando dados...
                    </div>
                  )}
                </div>
              </div>

              {/* Tabela de Inversores */}
              <div className={`${styles.card} ${styles.invertersSection}`}>
                <h2 className={styles.sectionTitle}>Status dos Canais em Tempo Real</h2>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Usina / ID</th>
                      <th>Status</th>
                      <th>Potência</th>
                      <th>Tensão (V)</th>
                      <th>Frequência (Hz)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem', color: '#71717a'}}>Conectando à Sungrow (iSolarCloud)...</td></tr>
                    ) : (
                      inverters.map(inv => (
                        <tr key={inv.id}>
                          <td>
                            {inv.id.startsWith('SZ-') ? (
                              <a 
                                href={`https://app.solarz.com.br/pages/shareable/usina/${inv.id.replace('SZ-', '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={styles.invLink}
                                title="Abrir página pública da usina na SolarZ"
                              >
                                <div className={styles.invName}>{inv.plant}</div>
                              </a>
                            ) : (
                              <Link 
                                href={`/usina/${inv.id}`}
                                className={styles.invLink}
                                title="Ver detalhes da usina"
                              >
                                <div className={styles.invName}>{inv.plant}</div>
                              </Link>
                            )}
                            <div className={styles.invId} title={inv.id}>
                              {inv.id.length > 16 ? inv.id.substring(0, 14) + '...' : inv.id}
                            </div>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[inv.status]}`}>
                              {inv.status === 'online' && 'Online'}
                              {inv.status === 'warning' && 'Atenção'}
                              {inv.status === 'offline' && 'Offline'}
                            </span>
                          </td>
                          <td className={styles.dataCell}>{inv.power ? `${inv.power} kW` : '-- kW'}</td>
                          <td className={styles.dataCell}>{inv.voltage ? `${inv.voltage} V` : '-- V'}</td>
                          <td className={styles.dataCell}>{inv.frequency ? `${inv.frequency} Hz` : '-- Hz'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div> {/* Fecha leftCol */}

            {/* Coluna da Direita */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>

              {/* Gráfico de Distribuição */}
              <div className={styles.card} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.sectionTitleWrapper}>
                  <h2 className={styles.sectionTitle}>Distribuição por Usina</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px', width: '100%', marginTop: '1rem', position: 'relative' }}>
                  {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#71717a' }}>
                      <div className={styles.spinner} style={{ marginBottom: '10px' }}></div>
                      Carregando usinas...
                    </div>
                  ) : dynamicEfficiencyData.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
                            <Pie
                              data={dynamicEfficiencyData}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={85}
                              paddingAngle={4}
                              dataKey="value"
                              stroke="none"
                              isAnimationActive={false}
                            >
                              {dynamicEfficiencyData.map((entry, index) => {
                                const color = isGenerating ? PIE_COLORS[index % PIE_COLORS.length] : '#3f3f46';
                                return (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={color}
                                    style={{ filter: isGenerating ? `drop-shadow(0px 4px 12px ${color}90)` : 'none', transition: 'all 0.3s ease' }}
                                  />
                                );
                              })}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
                              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                              formatter={(value, name, props) => [isGenerating ? `${value} kW` : '0 kW (Aguardando)', name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Centro do Gráfico */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                          pointerEvents: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: isGenerating ? '#fff' : '#71717a', lineHeight: '1' }}>
                            {isGenerating ? `${totalPower}` : '0.0'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                            kW Total
                          </div>
                        </div>
                      </div>

                      {/* Legenda Estilizada */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.2rem', marginTop: '1.5rem', padding: '0 1rem', paddingBottom: '1rem' }}>
                        {dynamicEfficiencyData.map((entry, index) => {
                          const color = isGenerating ? PIE_COLORS[index % PIE_COLORS.length] : '#3f3f46';
                          return (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ 
                                width: '12px', height: '12px', borderRadius: '50%', 
                                backgroundColor: color,
                                boxShadow: isGenerating ? `0 0 10px ${color}` : 'none'
                              }}></div>
                              <span style={{ color: '#e4e4e7', fontSize: '0.9rem', fontWeight: 600 }}>{entry.name}</span>
                              <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
                                {isGenerating ? `${entry.value} kW` : '0 kW'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#71717a' }}>
                      Sem usinas cadastradas
                    </div>
                  )}
                </div>
              </div>

              {/* Gráfico de Status da Frota */}
              <div className={styles.card} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.sectionTitleWrapper}>
                  <h2 className={styles.sectionTitle}>Status da Frota</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px', width: '100%', marginTop: '1rem', position: 'relative' }}>
                  {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#71717a' }}>
                      <div className={styles.spinner} style={{ marginBottom: '10px' }}></div>
                      Carregando status...
                    </div>
                  ) : fleetStatusData.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
                            <Pie
                              data={fleetStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={85}
                              paddingAngle={4}
                              dataKey="value"
                              stroke="none"
                              isAnimationActive={false}
                            >
                              {fleetStatusData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.color}
                                  style={{ filter: `drop-shadow(0px 4px 12px ${entry.color}90)`, transition: 'all 0.3s ease' }}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
                              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                              formatter={(value, name, props) => [`${value} Usina(s)`, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Centro do Gráfico */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                          pointerEvents: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', lineHeight: '1' }}>
                            {totalInverters}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                            Total
                          </div>
                        </div>
                      </div>

                      {/* Legenda Estilizada */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.2rem', marginTop: '1.5rem', padding: '0 1rem', paddingBottom: '1rem' }}>
                        {fleetStatusData.map((entry, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ 
                              width: '12px', height: '12px', borderRadius: '50%', 
                              backgroundColor: entry.color,
                              boxShadow: `0 0 10px ${entry.color}`
                            }}></div>
                            <span style={{ color: '#e4e4e7', fontSize: '0.9rem', fontWeight: 600 }}>{entry.name}</span>
                            <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
                              {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#71717a' }}>
                      Sem usinas cadastradas
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
