"use client";

import styles from "./page.module.css";
import Sidebar from "@/components/Sidebar";
import { 
  Sun, 
  LayoutDashboard, 
  Activity, 
  Settings, 
  Bell, 
  Zap, 
  Cpu, 
  MessageCircle, 
  AlertTriangle,
  CheckCircle2
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
import { useState, useEffect } from "react";

const PIE_COLORS = ['#24b47e', '#3b82f6', '#a855f7'];

export default function Dashboard() {
  const [inverters, setInverters] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    return () => clearInterval(interval);
  }, []);

  // --- Cálculos Dinâmicos ---
  const totalPower = inverters.reduce((acc, inv) => acc + (parseFloat(inv.power) || 0), 0).toFixed(1);
  const activeInverters = inverters.filter(inv => inv.status === 'online').length;
  const totalInverters = inverters.length;
  const offlineInverters = inverters.filter(inv => inv.status === 'offline').length;
  const aiActionsToday = aiLogs.length;

  const dynamicEfficiencyData = inverters.length > 0 
    ? inverters.map(inv => ({
        name: inv.plant || 'Desconhecida',
        value: parseFloat(inv.power) || 0
      })).filter(inv => inv.value > 0)
    : [];

  return (
    <div className={styles.container}>
      <Sidebar />

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Visão Geral das Usinas</h1>
          <div className={styles.headerActions}>
            <button className={styles.iconButton}>
              <MessageCircle size={20} />
            </button>
            <button className={styles.iconButton}>
              <Bell size={20} />
            </button>
            <div className={styles.userAvatar}>JD</div>
          </div>
        </header>

        <div className={styles.heroCard}>
          <div className={styles.heroBg}></div>
          <div className={styles.heroOverlay}></div>
          
          <div className={styles.heroContent}>
            <div className={styles.heroTop}>
              <div className={styles.heroWeather}>
                <Sun size={18} color="#f59e0b" />
                <span>Dia Limpo, 26°C</span>
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
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#24b47e" stopOpacity={0.4}>
                              <animate attributeName="stop-opacity" values="0.2; 0.6; 0.2" dur="3s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="95%" stopColor="#24b47e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="time" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                        <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val} kW`} width={60} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ color: '#24b47e', fontWeight: 'bold' }}
                          labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                          formatter={(value) => [`${value} kW`, 'Potência Gerada']}
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
                            <div className={styles.invName}>{inv.plant}</div>
                            <div className={styles.invId}>{inv.id}</div>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[inv.status]}`}>
                              {inv.status === 'online' && 'Online'}
                              {inv.status === 'warning' && 'Atenção'}
                              {inv.status === 'offline' && 'Offline'}
                            </span>
                          </td>
                          <td className={styles.dataCell}>{inv.power}</td>
                          <td className={styles.dataCell}>{inv.voltage}</td>
                          <td className={styles.dataCell}>{inv.frequency}</td>
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
              {/* Feed da IA */}
              <div className={`${styles.card} ${styles.aiLogSection}`}>
                <div className={styles.sectionTitleWrapper}>
                  <h2 className={styles.sectionTitle}>Log de Atividades IA</h2>
                  <div className={styles.liveIndicator}>LIVE</div>
                </div>
                <div className={styles.logList}>
                  {aiLogs.length === 0 ? (
                    <div style={{color: '#71717a', fontSize: '0.9rem'}}>Nenhum evento registrado pela IA.</div>
                  ) : (
                    aiLogs.map((log, i) => (
                      <div key={i} className={styles.logItem}>
                        <div className={`${styles.logIcon} ${styles[log.type]}`}>
                          {log.type === 'alert' && <AlertTriangle size={16} />}
                          {log.type === 'action' && <Cpu size={16} />}
                          {log.type === 'success' && <CheckCircle2 size={16} />}
                          {log.type === 'info' && <MessageCircle size={16} />}
                        </div>
                        <div className={styles.logContent}>
                          <p className={styles.logMsg}>{log.message}</p>
                          <span className={styles.logTime}>{new Date(log.created_at).toLocaleTimeString('pt-BR')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Gráfico de Distribuição */}
              <div className={styles.card} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.sectionTitleWrapper}>
                  <h2 className={styles.sectionTitle}>Distribuição por Usina</h2>
                </div>
                <div style={{ flex: 1, minHeight: '220px', width: '100%', marginTop: '1rem' }}>
                  {dynamicEfficiencyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dynamicEfficiencyData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                          animationBegin={300}
                          animationDuration={2000}
                          animationEasing="ease-out"
                        >
                          {dynamicEfficiencyData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                          itemStyle={{ color: '#e4e4e7' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#71717a' }}>
                      Sem geração no momento
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
