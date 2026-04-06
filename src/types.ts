export type AgentRole = 'SEED' | 'ECONOMICS' | 'CLIMATE' | 'TECH' | 'GEOPOLITICS' | 'SKEPTIC' | 'REPORT';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  icon: string;
}

export interface ScenarioVariable {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  unit: string;
}

export interface SimulationResult {
  agentId: string;
  role: AgentRole;
  content: string;
  timestamp: number;
  dataPoints?: { label: string; value: number }[];
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  variables: ScenarioVariable[];
  results: SimulationResult[];
  status: 'IDLE' | 'PARSING' | 'SIMULATING' | 'SYNTHESIZING' | 'COMPLETED';
}
