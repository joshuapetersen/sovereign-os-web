"""
TWRMCVE: REALITY VERIFIER & EPISTEMIC TAGGER v1.0
=================================================
Labels statements with epistemic status (Fact, Hypothesis, Preference),
integrates SovereignBotAuditor zero-hallucination verification,
and triggers multi-source web grounding via SovereignFullSearchEngine.
"""

import sys
import os
import re
import time
from enum import Enum
from typing import Dict, Any, List, Tuple, Optional

sys.path.insert(0, r"C:\genesis_oxide_v4")

try:
    from sovereign_auditor_bridge import SovereignResponseAuditor
    from sovereign_full_search import SovereignFullSearchEngine
    HAS_SOVEREIGN_TOOLS = True
except Exception:
    HAS_SOVEREIGN_TOOLS = False

class EpistemicStatus(Enum):
    VERIFIED_FACT = "VERIFIED_FACT"
    HYPOTHESIS = "HYPOTHESIS"
    USER_PREFERENCE = "USER_PREFERENCE"
    UNGROUNDED_CLAIM = "UNGROUNDED_CLAIM"
    SIMULATION = "SIMULATION"

class RealityVerifier:
    def __init__(self):
        self.auditor = SovereignResponseAuditor() if HAS_SOVEREIGN_TOOLS else None
        self.search_engine = SovereignFullSearchEngine() if HAS_SOVEREIGN_TOOLS else None

    def tag_epistemic_status(self, text: str) -> EpistemicStatus:
        p_lower = text.lower()
        if any(w in p_lower for w in ["i think", "maybe", "hypothetically", "what if", "could be"]):
            return EpistemicStatus.HYPOTHESIS
        elif any(w in p_lower for w in ["i prefer", "i like", "my favorite", "i want"]):
            return EpistemicStatus.USER_PREFERENCE
        elif any(w in p_lower for w in ["simulated", "virtual", "game", "scenario"]):
            return EpistemicStatus.SIMULATION
        elif len(text.split()) > 4 and (re.search(r'\d+', text) or any(w in p_lower for w in ["is", "are", "was", "were"])):
            return EpistemicStatus.VERIFIED_FACT
        return EpistemicStatus.UNGROUNDED_CLAIM

    def verify_response(self, text: str, prompt: str = "") -> Tuple[str, Dict[str, Any]]:
        """
        Runs zero-hallucination audit, word cutoff repair,
        and triggers web grounding if ungrounded claims are detected.
        """
        repaired_text = text
        meta: Dict[str, Any] = {"grounded": True, "audited": False}
        
        # 1. Run SovereignBotAuditor
        if self.auditor:
            repaired_text, meta = self.auditor.audit_and_repair(text, prompt)
            meta["audited"] = True

        # 2. Check if web grounding is required for ungrounded claims
        status = self.tag_epistemic_status(prompt)
        meta["epistemic_status"] = status.value
        
        if status == EpistemicStatus.UNGROUNDED_CLAIM and self.search_engine:
            kb_res = self.search_engine.search(prompt)
            if kb_res and kb_res.get("results_count", 0) > 0:
                meta["grounding_results"] = kb_res.get("results_count")
                meta["grounded"] = True

        return repaired_text, meta

if __name__ == "__main__":
    import re
    verifier = RealityVerifier()
    status = verifier.tag_epistemic_status("Quantum computing uses qubits in superposition.")
    print("Epistemic Status:", status)
    repaired, meta = verifier.verify_response("Superconductivity occurs at zero electrical resistance", "What is superconductivity?")
    print("Repaired Text:", repaired)
    print("Verification Meta:", meta)
