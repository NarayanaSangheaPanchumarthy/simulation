import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Play, 
  RefreshCw, 
  ShieldAlert, 
  Globe, 
  TrendingUp, 
  Zap, 
  ChevronRight,
  Plus,
  Trash2,
  BrainCircuit,
  Activity,
  Search,
  FileText,
  AlertTriangle,
  User,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Scenario, ScenarioVariable, SimulationResult, AgentRole } from './types';
import { getGeminiModel, AGENT_SYSTEM_PROMPTS, AGENT_MODELS, ThinkingLevel } from './lib/gemini';
import ReactMarkdown from 'react-markdown';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group",
      active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    )}
  >
    <Icon size={20} className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")} />
    <span className="font-medium">{label}</span>
  </button>
);

const AgentStatus = ({ role, status }: { role: AgentRole, status: 'idle' | 'working' | 'done' | 'error' }) => {
  const colors = {
    SEED: 'text-purple-400',
    ECONOMICS: 'text-emerald-400',
    CLIMATE: 'text-cyan-400',
    TECH: 'text-amber-400',
    GEOPOLITICS: 'text-rose-400',
    SKEPTIC: 'text-indigo-400',
    REPORT: 'text-white',
    ADVISOR: 'text-blue-400'
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
      <div className={cn(
        "w-2 h-2 rounded-full",
        status === 'working' ? "bg-blue-500 animate-pulse" : 
        status === 'done' ? "bg-emerald-500" : 
        status === 'error' ? "bg-rose-500" : "bg-slate-600"
      )} />
      <span className={cn("text-xs font-bold uppercase tracking-wider", colors[role])}>{role}</span>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'canvas'>('chat');
  const [scenario, setScenario] = useState<Scenario>({
    id: '1',
    title: 'Global Energy Transition 2030',
    description: 'Simulating the impact of rapid decarbonization on global markets and geopolitical stability.',
    variables: [
      { id: 'v1', name: 'Carbon Tax Rate', value: 45, min: 0, max: 200, unit: '$/ton' },
      { id: 'v2', name: 'Renewable Adoption', value: 30, min: 0, max: 100, unit: '%' },
      { id: 'v3', name: 'Grid Stability', value: 85, min: 0, max: 100, unit: '%' },
    ],
    results: [],
    status: 'IDLE'
  });

  const [chatInput, setChatInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [logs, setLogs] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' }[]>([]);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogs(prev => [...prev, { message, type }]);
  };

  const runSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setScenario(prev => ({ ...prev, status: 'PARSING', results: [] }));
    addLog("Initializing Seed Agent for scenario parsing...", "info");

    try {
      const ai = getGeminiModel();
      
      // 1. Seed Agent
      const seedResponse = await ai.models.generateContent({
        model: AGENT_MODELS.SEED,
        contents: `Analyze this scenario: ${scenario.description}. Current variables: ${JSON.stringify(scenario.variables)}`,
        config: { systemInstruction: AGENT_SYSTEM_PROMPTS.SEED }
      });
      
      const seedResult: SimulationResult = {
        agentId: 'seed-1',
        role: 'SEED',
        content: seedResponse.text || "Parsing failed",
        timestamp: Date.now()
      };
      
      setScenario(prev => ({ ...prev, status: 'SIMULATING', results: [seedResult] }));
      addLog("Scenario parsed. Deploying specialized agent pool...", "success");

      // 2. Specialized Agents (Parallel)
      const roles: AgentRole[] = ['ECONOMICS', 'CLIMATE', 'TECH', 'GEOPOLITICS'];
      const agentPromises = roles.map(async (role) => {
        addLog(`Agent [${role}] starting analysis...`, "info");
        const response = await ai.models.generateContent({
          model: AGENT_MODELS[role],
          contents: `Scenario: ${scenario.description}. Variables: ${JSON.stringify(scenario.variables)}. Context: ${seedResult.content}`,
          config: { systemInstruction: AGENT_SYSTEM_PROMPTS[role] }
        });
        return {
          agentId: `${role.toLowerCase()}-1`,
          role,
          content: response.text || "Analysis failed",
          timestamp: Date.now(),
          dataPoints: Array.from({ length: 6 }, (_, i) => ({ 
            label: `Year ${2025 + i}`, 
            value: Math.floor(Math.random() * 100) 
          }))
        } as SimulationResult;
      });

      const specializedResults = await Promise.all(agentPromises);
      setScenario(prev => ({ ...prev, results: [...prev.results, ...specializedResults] }));
      addLog("Specialized analysis complete. Activating Skeptic Agent with High Thinking...", "warning");

      // 3. Skeptic Agent (High Thinking + Search)
      const skepticResponse = await ai.models.generateContent({
        model: AGENT_MODELS.SKEPTIC,
        contents: `Critique these findings: ${JSON.stringify(specializedResults.map(r => r.content))}`,
        config: { 
          systemInstruction: AGENT_SYSTEM_PROMPTS.SKEPTIC,
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      const skepticResult: SimulationResult = {
        agentId: 'skeptic-1',
        role: 'SKEPTIC',
        content: skepticResponse.text || "Critique failed",
        timestamp: Date.now()
      };
      setScenario(prev => ({ ...prev, status: 'SYNTHESIZING', results: [...prev.results, skepticResult] }));
      addLog("Skeptic analysis complete. Synthesizing final report with High Thinking...", "info");

      // 4. Report Agent (High Thinking)
      const reportResponse = await ai.models.generateContent({
        model: AGENT_MODELS.REPORT,
        contents: `Synthesize all results: ${JSON.stringify([...specializedResults, skepticResult].map(r => r.content))}`,
        config: { 
          systemInstruction: AGENT_SYSTEM_PROMPTS.REPORT,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      const reportResult: SimulationResult = {
        agentId: 'report-1',
        role: 'REPORT',
        content: reportResponse.text || "Synthesis failed",
        timestamp: Date.now()
      };
      
      setScenario(prev => ({ ...prev, status: 'COMPLETED', results: [...prev.results, reportResult] }));
      addLog("Simulation completed successfully.", "success");
      setActiveTab('dashboard');

    } catch (error) {
      console.error(error);
      addLog("Simulation failed: " + (error instanceof Error ? error.message : "Unknown error"), "error");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAdvisorChat = async () => {
    if (!chatInput || isSimulating) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    setIsSimulating(true);

    try {
      const ai = getGeminiModel();
      const chat = ai.chats.create({
        model: AGENT_MODELS.ADVISOR,
        config: { 
          systemInstruction: AGENT_SYSTEM_PROMPTS.ADVISOR,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        },
        history: chatHistory
      });

      const response = await chat.sendMessage({ 
        message: `Context: ${JSON.stringify(scenario.results.map(r => r.content))}. User Question: ${userMessage}` 
      });

      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: response.text || "I'm sorry, I couldn't process that." }] }]);
    } catch (error) {
      console.error(error);
      addLog("Advisor chat failed: " + (error instanceof Error ? error.message : "Unknown error"), "error");
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, scenario.results, chatHistory]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <BrainCircuit className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white leading-none">AetherSim</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-bold">Scenario Engine</span>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem 
            icon={MessageSquare} 
            label="Simulation Chat" 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
          />
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Insight Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Activity} 
            label="Scenario Canvas" 
            active={activeTab === 'canvas'} 
            onClick={() => setActiveTab('canvas')} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agent Pool</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">8 ACTIVE</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['SEED', 'ECON', 'CLIM', 'TECH', 'GEO', 'SKEP', 'ADVI'].map(a => (
                <div key={a} className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-600">
                  {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              {scenario.title}
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest",
                scenario.status === 'COMPLETED' ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
              )}>
                {scenario.status}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{scenario.description}</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={runSimulation}
              disabled={isSimulating}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-200",
                isSimulating 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-95"
              )}
            >
              {isSimulating ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
              {isSimulating ? "Simulating..." : "Run Simulation"}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                {/* Simulation Logs */}
                <div className="space-y-4">
                  {logs.map((log, i) => (
                    <div key={i} className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl border",
                      log.type === 'info' ? "bg-slate-900/50 border-slate-800" :
                      log.type === 'success' ? "bg-emerald-500/5 border-emerald-500/20" :
                      log.type === 'warning' ? "bg-amber-500/5 border-amber-500/20" :
                      "bg-rose-500/5 border-rose-500/20"
                    )}>
                      <div className={cn(
                        "mt-1 p-1.5 rounded-lg",
                        log.type === 'info' ? "bg-slate-800 text-slate-400" :
                        log.type === 'success' ? "bg-emerald-500/20 text-emerald-400" :
                        log.type === 'warning' ? "bg-amber-500/20 text-amber-400" :
                        "bg-rose-500/20 text-rose-400"
                      )}>
                        {log.type === 'info' ? <Search size={14} /> : 
                         log.type === 'success' ? <Zap size={14} /> : 
                         log.type === 'warning' ? <AlertTriangle size={14} /> : 
                         <ShieldAlert size={14} />}
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{log.message}</p>
                    </div>
                  ))}
                </div>

                {/* Multi-turn Chat History */}
                {chatHistory.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-4 p-6 rounded-3xl border",
                      msg.role === 'user' ? "bg-slate-800/30 border-slate-700 ml-12" : "bg-blue-600/5 border-blue-500/20 mr-12"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      msg.role === 'user' ? "bg-slate-700 text-slate-300" : "bg-blue-600 text-white"
                    )}>
                      {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                    </div>
                  </motion.div>
                ))}

                {/* Agent Responses */}
                {scenario.results.map((res, i) => (
                  <motion.div 
                    key={res.agentId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <AgentStatus role={res.role} status="done" />
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(res.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{res.content}</ReactMarkdown>
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-12 gap-6"
              >
                {/* Summary Card */}
                <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <TrendingUp className="text-blue-500" />
                      Simulation Forecast
                    </h3>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-slate-400">7-YEAR PROJECTION</span>
                    </div>
                  </div>
                  
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={scenario.results.find(r => r.role === 'ECONOMICS')?.dataPoints || []}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="label" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Stability Index</h4>
                    <div className="flex items-end gap-4">
                      <span className="text-6xl font-black text-white">84</span>
                      <span className="text-emerald-500 font-bold mb-2 flex items-center gap-1">
                        <TrendingUp size={16} /> +12%
                      </span>
                    </div>
                    <div className="mt-6 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[84%]" />
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Risk Vectors</h4>
                    <div className="space-y-4">
                      {[
                        { name: 'Geopolitical Tension', value: 65, color: 'bg-rose-500' },
                        { name: 'Economic Volatility', value: 30, color: 'bg-amber-500' },
                        { name: 'Resource Scarcity', value: 45, color: 'bg-cyan-500' },
                      ].map(risk => (
                        <div key={risk.name} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-300">{risk.name}</span>
                            <span className="text-slate-500">{risk.value}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${risk.value}%` }}
                              className={cn("h-full", risk.color)} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Synthesis Report */}
                {scenario.results.find(r => r.role === 'REPORT') && (
                  <div className="col-span-12 bg-blue-600/10 border border-blue-500/20 rounded-3xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-blue-600 rounded-2xl text-white">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Executive Synthesis</h3>
                        <p className="text-sm text-blue-400">Final report generated by Synthesis Agent</p>
                      </div>
                    </div>
                    <div className="prose prose-invert prose-blue max-w-none">
                      <ReactMarkdown>{scenario.results.find(r => r.role === 'REPORT')?.content || ''}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'canvas' && (
              <motion.div 
                key="canvas"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-5xl mx-auto"
              >
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <BrainCircuit size={300} />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                      <div>
                        <h3 className="text-3xl font-black text-white tracking-tight">Scenario Variables</h3>
                        <p className="text-slate-400 mt-2">Adjust parameters to influence the simulation outcome.</p>
                      </div>
                      <button className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-colors">
                        <Plus size={24} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {scenario.variables.map((v, i) => (
                        <div key={v.id} className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 group hover:border-blue-500/50 transition-all duration-300">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                {i === 0 ? <Globe size={24} /> : i === 1 ? <Zap size={24} /> : <Activity size={24} />}
                              </div>
                              <div>
                                <h4 className="font-bold text-white">{v.name}</h4>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{v.unit}</span>
                              </div>
                            </div>
                            <span className="text-2xl font-black text-white">{v.value}</span>
                          </div>
                          
                          <input 
                            type="range" 
                            min={v.min} 
                            max={v.max} 
                            value={v.value}
                            onChange={(e) => {
                              const newVal = parseInt(e.target.value);
                              setScenario(prev => ({
                                ...prev,
                                variables: prev.variables.map(varItem => 
                                  varItem.id === v.id ? { ...varItem, value: newVal } : varItem
                                )
                              }));
                            }}
                            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                          />
                          
                          <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <span>MIN: {v.min}</span>
                            <span>MAX: {v.max}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 p-8 bg-blue-600/5 border border-blue-500/20 rounded-3xl">
                      <div className="flex items-center gap-4 text-blue-400 mb-4">
                        <AlertTriangle size={20} />
                        <span className="text-sm font-bold uppercase tracking-widest">Simulation Impact</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Adjusting these variables will trigger a re-analysis by the specialized agent pool. 
                        The Skeptic agent will specifically look for inconsistencies in extreme value ranges.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat Input Bar (Floating) */}
        {activeTab === 'chat' && (
          <div className="p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
            <div className="max-w-4xl mx-auto relative">
              <input 
                type="text" 
                placeholder={scenario.status === 'COMPLETED' ? "Ask the Advisor about the results..." : "Describe a new scenario or refine the current one..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatInput) {
                    if (scenario.status === 'COMPLETED') {
                      handleAdvisorChat();
                    } else {
                      setScenario(prev => ({ ...prev, description: chatInput }));
                      setChatInput('');
                      runSimulation();
                    }
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 pr-16 text-white focus:outline-none focus:border-blue-500 transition-all shadow-2xl"
              />
              <button 
                onClick={() => {
                  if (chatInput) {
                    if (scenario.status === 'COMPLETED') {
                      handleAdvisorChat();
                    } else {
                      setScenario(prev => ({ ...prev, description: chatInput }));
                      setChatInput('');
                      runSimulation();
                    }
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
