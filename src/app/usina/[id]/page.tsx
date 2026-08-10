"use client";
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowLeft, Zap, Sun, Clock, Calendar, Activity, Battery } from 'lucide-react';
import Link from 'next/link';

export default function UsinaDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [inverter, setInverter] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/usina/${id}`);
        if (!res.ok) throw new Error('Falha ao buscar dados');
        const data = await res.json();
        setInverter(data.inverter);
        setHistory(data.history || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchData();
      const interval = setInterval(fetchData, 60000); // 1 min update
      return () => clearInterval(interval);
    }
  }, [id]);

  const chartData = useMemo(() => {
    if (!history.length) return [];
    return history.map(h => ({
      time: new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      power: parseFloat(h.power)
    }));
  }, [history]);

  if (loading) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner}></div>
            <p>Carregando dados da usina...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!inverter) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          <div className={styles.errorWrapper}>
            <h2>Usina não encontrada</h2>
            <Link href="/" className={styles.backBtn}><ArrowLeft size={16}/> Voltar para o Dashboard</Link>
          </div>
        </main>
      </div>
    );
  }

  const isOnline = inverter.status === 'online';

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={() => router.push('/')}>
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{inverter.plant_name || 'Usina Solar'}</h1>
              <span className={styles.pageSubtitle}>ID: {inverter.id} • {inverter.plant_name?.includes('Growatt') ? 'Growatt' : inverter.plant_name?.includes('iSolar') ? 'iSolarCloud' : 'Inversor'}</span>
            </div>
          </div>
          <div className={`${styles.statusBadge} ${isOnline ? styles.online : styles.offline}`}>
            <span className={styles.statusDot}></span>
            {isOnline ? 'Operando Normal' : 'Sem Comunicação'}
          </div>
        </header>

        {/* Dashboard Ultra-Premium Grid */}
        <div className={styles.dashboardGrid}>
          
          {/* Main Hero Metric */}
          <div className={`${styles.card} ${styles.heroCard}`}>
            <div className={styles.heroBg}></div>
            <div className={styles.heroContent}>
              <div className={styles.heroHeader}>
                <div className={styles.heroTitle}><Zap size={18}/> Potência Instantânea</div>
                {isOnline && <div className={styles.liveTag}>LIVE</div>}
              </div>
              <div className={styles.heroValue}>
                {inverter.power} <span className={styles.heroUnit}>kW</span>
              </div>
              
              <div className={styles.heroStats}>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Geração Hoje</span>
                  <span className={styles.statValue}>--- <small>kWh</small></span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Geração Mês</span>
                  <span className={styles.statValue}>--- <small>kWh</small></span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Geração Total</span>
                  <span className={styles.statValue}>--- <small>MWh</small></span>
                </div>
              </div>
            </div>
          </div>

          {/* Secundary Metrics Grid */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <Activity size={18} className={styles.iconBlue} />
                <span>Tensão da Rede (V)</span>
              </div>
              <div className={styles.metricValue}>
                {inverter.voltage || '0'} <span className={styles.metricUnit}>V</span>
              </div>
            </div>
            
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <Activity size={18} className={styles.iconPurple} />
                <span>Frequência da Rede (Hz)</span>
              </div>
              <div className={styles.metricValue}>
                {inverter.frequency || '0'} <span className={styles.metricUnit}>Hz</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <Clock size={18} className={styles.iconOrange} />
                <span>Última Sincronização</span>
              </div>
              <div className={styles.metricValueSm}>
                {inverter.updated_at ? new Date(inverter.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h2 className={styles.chartTitle}>Curva de Geração de Energia (Hoje)</h2>
              <span className={styles.chartSubtitle}>Acompanhamento em tempo real da produção fotovoltaica</span>
            </div>
            
            <div className={styles.chartWrapper}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#24b47e" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#24b47e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#71717a" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value} kW`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(18, 18, 18, 0.9)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        backdropFilter: 'blur(8px)',
                        color: '#fff'
                      }}
                      itemStyle={{ color: '#24b47e', fontWeight: 600 }}
                      formatter={(value: any) => [`${value} kW`, 'Potência']}
                      labelStyle={{ color: '#a1a1aa', marginBottom: '0.5rem' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="power" 
                      stroke="#24b47e" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPower)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noData}>Aguardando dados de geração para hoje...</div>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
