"""
TWRMCVE: PRAGMATIC INTENT & SPEECH ACT PARSER v1.0
=================================================
Parses natural utterances into structured pragmatic speech acts,
extracts illocutionary forces, presuppositions, implicatures,
and tracks dialogue grounding and topic drift.
"""

import re
import time
from enum import Enum
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field

class IllocutionaryForce(Enum):
    ASSERTIVE = "ASSERTIVE"       # Stating facts, beliefs, claims
    DIRECTIVE = "DIRECTIVE"       # Commands, requests, questions
    COMMISSIVE = "COMMISSIVE"     # Promises, commitments, offers
    EXPRESSIVE = "EXPRESSIVE"     # Greetings, thanks, emotional states
    DECLARATION = "DECLARATION"   # Changing state (e.g. "I name this X")
    QUERY = "QUERY"               # Information requests

@dataclass
class SpeechAct:
    raw_text: str
    force: IllocutionaryForce
    proposition: str
    presuppositions: List[str] = field(default_factory=list)
    implicatures: List[str] = field(default_factory=list)
    confidence: float = 1.0
    timestamp: float = field(default_factory=time.time)

class SpeechActParser:
    """Parses raw prompt into pragmatic SpeechAct representation."""
    
    def parse(self, text: str) -> SpeechAct:
        p_clean = text.strip()
        p_lower = p_clean.lower()
        
        # 1. Determine Illocutionary Force
        if p_lower.startswith(("search", "find", "wiki", "look up", "lookup", "calculate", "solve", "run", "do")):
            force = IllocutionaryForce.DIRECTIVE
        elif p_lower.startswith(("what", "who", "where", "when", "why", "how", "is there", "can you", "are you")):
            force = IllocutionaryForce.QUERY
        elif any(w in p_lower for w in ["i will", "i promise", "let's", "we will", "i plan to"]):
            force = IllocutionaryForce.COMMISSIVE
        elif any(w in p_lower for w in ["hello", "heloo", "hi", "hey", "thanks", "thank you", "great", "nice"]):
            force = IllocutionaryForce.EXPRESSIVE
        elif p_lower.startswith(("i set", "i declare", "let it be")):
            force = IllocutionaryForce.DECLARATION
        else:
            force = IllocutionaryForce.ASSERTIVE

        # 2. Extract Presuppositions
        presuppositions = []
        if "again" in p_lower:
            presuppositions.append("Action or event occurred previously.")
        if "still" in p_lower:
            presuppositions.append("State was previously active and expected to continue.")
        if re.search(r'\b(why|how come)\b', p_lower):
            presuppositions.append("The underlying event is taken to be true.")

        # 3. Infer Implicatures
        implicatures = []
        if "can you" in p_lower or "are you able to" in p_lower:
            implicatures.append("User is requesting action rather than merely querying capability.")
        if "fast" in p_lower or "quick" in p_lower:
            implicatures.append("User prioritizes low latency delivery.")

        return SpeechAct(
            raw_text=p_clean,
            force=force,
            proposition=p_clean,
            presuppositions=presuppositions,
            implicatures=implicatures,
            confidence=0.95
        )

class TopicDriftMonitor:
    """Monitors dialogue topic vectors to detect context drift."""
    
    def __init__(self, threshold: float = 0.35):
        self.threshold = threshold
        self.primary_objective: Optional[str] = None
        self.topic_history: List[str] = []

    def set_objective(self, objective: str):
        self.primary_objective = objective
        self.topic_history.append(objective)

    def calculate_drift(self, current_turn: str) -> float:
        if not self.primary_objective:
            return 0.0
        
        words_obj = set(re.findall(r'\w{4,}', self.primary_objective.lower()))
        words_turn = set(re.findall(r'\w{4,}', current_turn.lower()))
        
        if not words_obj or not words_turn:
            return 0.0
            
        intersection = words_obj.intersection(words_turn)
        overlap = len(intersection) / len(words_obj)
        drift = 1.0 - overlap
        return round(drift, 4)

class GroundingChecker:
    """Checks mutual belief and grounding criterion before advancing dialogue state."""
    
    def check_grounding(self, speech_act: SpeechAct, current_state: Dict[str, Any]) -> Tuple[bool, str]:
        if speech_act.presuppositions:
            for p in speech_act.presuppositions:
                # Flag ungrounded presuppositions for clarification
                if "previously" in p and not current_state.get("has_history", False):
                    return False, f"Ungrounded presupposition: '{p}'"
        return True, "Grounding criteria satisfied."

if __name__ == "__main__":
    parser = SpeechActParser()
    act = parser.parse("can you search for quantum computing fast?")
    print("Parsed Speech Act:", act)
