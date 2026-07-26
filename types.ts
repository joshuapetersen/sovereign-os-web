
export interface Position {
  x: number;
  y: number;
}

export interface ProjectGoal {
  id: string;
  title: string;
  impact: 'High' | 'Critical' | 'Strategic';
  description: string;
  difficulty: number;
  potentialROI: string;
  tags: string[];
  imageUrl?: string;
  hdVisualUrl?: string;
}

export interface VisionAnalysis {
  entities: DetectedEntity[];
}

export enum DashboardTab {
  OVERVIEW = 'OVERVIEW',
  BRAINSTORM = 'BRAINSTORM',
  LIVE_COMMS = 'LIVE_COMMS',
  INTEL = 'INTEL',
  REPOSITORY = 'REPOSITORY',
  COMM_HUB = 'COMM_HUB'
}

export type HUDModality = 'TACTICAL' | 'DIAGNOSTIC' | 'NEURAL' | 'DRIVING' | 'CINEMATIC' | 'HAZARD' | 'LOW_LIGHT';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface DetectedEntity {
  id: string;
  type: 'HUMAN' | 'VEHICLE' | 'IOT' | 'HAZARD' | 'PLACE';
  label: string;
  status: string;
  pos: { x: number, y: number }; 
  interactionUrl?: string;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  type: 'RCS' | 'IM' | 'SYSTEM';
  status: 'DELIVERED' | 'READ' | 'PENDING';
}

export interface Contact {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'DND';
  avatar?: string;
  lastLocation?: string;
  trustScore: number;
}

export interface IncomingCall {
  caller: Contact;
  active: boolean;
  startTime?: number;
}

export interface SystemAction {
  action: string;
  value?: string | number;
  response: string;
  grounding?: GroundingSource[];
}

export interface DeviceNode {
  id: string;
  name: string;
  type: 'WATCH' | 'DRONE' | 'SMART_NODE';
  connected: boolean;
}
