"""
TWRMCVE: EPISODIC MEMORY & PROVENANCE STORE v1.0
===============================================
Stores bounded experiential session narratives, provenance metadata,
and handles conflict resolution for user beliefs in SQLite.
"""

import os
import sys
import time
import json
import sqlite3
from typing import Dict, Any, List, Optional, Tuple

TWRMCVE_DB_PATH = r"C:\genesis_oxide_v4\sovereign_twrmcve_memory.db"

class EpisodicMemoryStore:
    """Stores episodic conversation turns and session narratives."""
    
    def __init__(self, db_path: str = TWRMCVE_DB_PATH):
        self.db_path = db_path
        self._init_db()
        
    def _init_db(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS episodes (
                    session_id TEXT,
                    turn_idx INTEGER,
                    role TEXT,
                    content TEXT,
                    speech_act TEXT,
                    timestamp REAL,
                    PRIMARY KEY (session_id, turn_idx)
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS beliefs_provenance (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    confidence REAL,
                    session_id TEXT,
                    updated_at REAL,
                    source TEXT
                )
            """)
            conn.commit()

    def record_turn(self, session_id: str, turn_idx: int, role: str, content: str, speech_act: str = "ASSERTIVE"):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO episodes (session_id, turn_idx, role, content, speech_act, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
                (session_id, turn_idx, role, content, speech_act, time.time())
            )
            conn.commit()

    def get_recent_episodes(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            cur = conn.cursor()
            cur.execute(
                "SELECT turn_idx, role, content, speech_act, timestamp FROM episodes WHERE session_id = ? ORDER BY turn_idx DESC LIMIT ?",
                (session_id, limit)
            )
            rows = cur.fetchall()
            return [
                {"turn_idx": r[0], "role": r[1], "content": r[2], "speech_act": r[3], "timestamp": r[4]}
                for r in reversed(rows)
            ]

class ProvenanceTracker:
    """Tracks source, timestamp, and confidence provenance for remembered facts."""
    
    def __init__(self, db_path: str = TWRMCVE_DB_PATH):
        self.db_path = db_path

    def save_fact(self, key: str, value: Any, session_id: str, source: str = "USER_STATEMENT", confidence: float = 1.0) -> Tuple[bool, str]:
        val_str = json.dumps(value) if not isinstance(value, str) else value
        
        with sqlite3.connect(self.db_path) as conn:
            cur = conn.cursor()
            cur.execute("SELECT value, confidence, updated_at FROM beliefs_provenance WHERE key = ?", (key,))
            existing = cur.fetchone()
            
            conflict_msg = "Fact saved."
            if existing:
                old_val = existing[0]
                if old_val != val_str:
                    conflict_msg = f"Reconciled contradiction for '{key}': replacing '{old_val}' with '{val_str}'."
            
            conn.execute(
                "INSERT OR REPLACE INTO beliefs_provenance (key, value, confidence, session_id, updated_at, source) VALUES (?, ?, ?, ?, ?, ?)",
                (key, val_str, confidence, session_id, time.time(), source)
            )
            conn.commit()
            return True, conflict_msg

    def get_fact(self, key: str) -> Optional[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            cur = conn.cursor()
            cur.execute("SELECT value, confidence, session_id, updated_at, source FROM beliefs_provenance WHERE key = ?", (key,))
            row = cur.fetchone()
            if row:
                return {
                    "key": key,
                    "value": row[0],
                    "confidence": row[1],
                    "session_id": row[2],
                    "updated_at": row[3],
                    "source": row[4]
                }
        return None

if __name__ == "__main__":
    mem = EpisodicMemoryStore()
    mem.record_turn("session_001", 1, "user", "My name is Joshua.", "ASSERTIVE")
    
    prov = ProvenanceTracker()
    ok, msg = prov.save_fact("user_name", "Joshua", "session_001")
    print("Provenance Save Result:", msg)
    print("Fetched Fact:", prov.get_fact("user_name"))
