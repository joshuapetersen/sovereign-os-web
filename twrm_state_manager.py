"""
TWRMCVE: DYNAMIC STATE & CONTEXT MANAGER v1.0
============================================
Manages BDI (Beliefs, Desires, Intentions) mental state graphs,
attentional focus stacks, salience weights, and temporal/spatial reference frames.
"""

import time
import re
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, field

@dataclass
class FocusSpace:
    topic: str
    salience: float = 1.0
    created_at: float = field(default_factory=time.time)
    entities: Set[str] = field(default_factory=set)

class MentalStateModel:
    """Tracks User & System Beliefs, Desires, and Intentions (BDI Model)."""
    
    def __init__(self):
        self.beliefs: Dict[str, Any] = {}      # Fact/preference key-values
        self.desires: List[str] = []           # Active user goals
        self.intentions: List[str] = []        # Committed engine plans
        self.user_profile: Dict[str, Any] = {} # Persona / interaction style preferences

    def update_belief(self, key: str, value: Any, confidence: float = 1.0):
        self.beliefs[key] = {
            "value": value,
            "confidence": confidence,
            "updated_at": time.time()
        }

    def add_desire(self, goal: str):
        if goal not in self.desires:
            self.desires.append(goal)

    def commit_intention(self, plan: str):
        if plan not in self.intentions:
            self.intentions.append(plan)

    def complete_intention(self, plan: str):
        if plan in self.intentions:
            self.intentions.remove(plan)

class AttentionalStateStack:
    """Manages focus spaces and shifts attention across conversation topics."""
    
    def __init__(self, max_depth: int = 5):
        self.max_depth = max_depth
        self.stack: List[FocusSpace] = []

    def push_focus(self, topic: str, entities: Set[str] = None):
        space = FocusSpace(topic=topic, salience=1.0, entities=entities or set())
        # Decay existing focus spaces
        for s in self.stack:
            s.salience *= 0.75
        self.stack.insert(0, space)
        if len(self.stack) > self.max_depth:
            self.stack.pop()

    def get_current_focus(self) -> Optional[FocusSpace]:
        return self.stack[0] if self.stack else None

    def get_active_entities(self) -> Set[str]:
        entities = set()
        for s in self.stack:
            if s.salience > 0.3:
                entities.update(s.entities)
        return entities

class ReferenceFrameResolver:
    """Resolves temporal anchors (now, yesterday, before) and spatial references."""
    
    def resolve_temporal(self, text: str) -> Dict[str, Any]:
        p_lower = text.lower()
        now = time.time()
        
        anchors = {"ref_time": now}
        if "yesterday" in p_lower:
            anchors["relative_days"] = -1
        elif "today" in p_lower or "now" in p_lower:
            anchors["relative_days"] = 0
        elif "tomorrow" in p_lower:
            anchors["relative_days"] = 1
        elif "before" in p_lower or "previously" in p_lower:
            anchors["temporal_direction"] = "PAST"
        elif "after" in p_lower or "later" in p_lower:
            anchors["temporal_direction"] = "FUTURE"
            
        return anchors

if __name__ == "__main__":
    bdi = MentalStateModel()
    bdi.update_belief("user_name", "Joshua")
    bdi.add_desire("Build TWRMCVE Pragmatic Conversation Engine")
    
    stack = AttentionalStateStack()
    stack.push_focus("TWRMCVE Architecture", {"SpeechAct", "BDI_Model", "FTS5"})
    
    print("Mental State Beliefs:", bdi.beliefs)
    print("Active Focus Entities:", stack.get_active_entities())
