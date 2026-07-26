"""
SOVEREIGN OS — TWRMCVE GRADIO SPACE APP (ing119/SovereignOs)
============================================================
Live interactive Gradio application serving the TWRM Pragmatic Conversation Engine,
sub-word phase-adaptive cognitive gait visualizer, and episodic memory audit.
"""

import os
import sys
import time
import math
import sqlite3
import numpy as np
import gradio as gr

# Setup internal import paths
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, r"C:\genesis_oxide_v4")
sys.path.insert(0, r"C:\genesis_oxide_v4\twrmcve")

try:
    from twrm_conversation_engine import TWRMCVEEngine
    from twrm_pragmatics import SpeechActParser, IllocutionaryForce
    from twrm_reality_verifier import RealityVerifier, EpistemicStatus
    HAS_TWRMCVE = True
except Exception as e:
    HAS_TWRMCVE = False
    print(f"[Warning] TWRMCVE Core fallback mode: {e}")

# Global Engine Instance
ENGINE = TWRMCVEEngine(session_id="hf_space_session") if HAS_TWRMCVE else None

def sovereign_chat_turn(prompt, history):
    if not prompt or not prompt.strip():
        return history, ""
        
    t0 = time.perf_counter()
    if ENGINE:
        turn_res = ENGINE.process_turn(prompt)
        response_text = turn_res.get("response", "Engine processing complete.")
        speech_act = turn_res.get("speech_act", "UNKNOWN")
        epistemic = turn_res.get("epistemic_status", "UNKNOWN")
        dt_ms = turn_res.get("latency_ms", 0.0)
        
        formatted_response = (
            f"{response_text}\n\n"
            f"--- \n"
            f"⚡ **Illocution**: `{speech_act}` | 🛡️ **Epistemic**: `{epistemic}` | ⏱️ **Latency**: `{dt_ms:.2f} ms`"
        )
    else:
        formatted_response = f"I am Sarah (TWRMCVE Core | Sovereign OS).\nProcessed query: {prompt}"

    history = history or []
    history.append((prompt, formatted_response))
    return history, ""

def visualize_phase_gait(prompt, steps):
    if not prompt:
        prompt = "What if room temperature superconductivity is discovered by"
        
    steps = int(steps)
    omega = 2.0 * math.pi * 1.092777037037037
    verifier = RealityVerifier() if HAS_TWRMCVE else None
    
    trajectory_md = "### 🌀 Sub-Word Phase-Adaptive Cognition Trajectory\n\n"
    trajectory_md += "| Step | Context Window | Epistemic Status | Phase $\\phi$ (rad) | Hardware Delay $\\Delta t$ (ms) | Cognitive Mode |\n"
    trajectory_md += "| :--- | :--- | :--- | :--- | :--- | :--- |\n"
    
    current_context = prompt
    for i in range(1, steps + 1):
        status = verifier.tag_epistemic_status(current_context) if verifier else EpistemicStatus.VERIFIED_FACT
        if status == EpistemicStatus.VERIFIED_FACT:
            target_phase = 1.5 * math.pi
            mode_name = "Super-Truth / Lowest Entropy"
        elif status in [EpistemicStatus.HYPOTHESIS, EpistemicStatus.UNGROUNDED_CLAIM]:
            target_phase = 1.0 * math.pi
            mode_name = "Counterfactual Simulation"
        elif status == EpistemicStatus.USER_PREFERENCE:
            target_phase = 0.5 * math.pi
            mode_name = "Creative Morphological"
        else:
            target_phase = 0.0
            mode_name = "Fast Conversational Baseline"
            
        delay_ms = (target_phase / omega) * 1000.0
        trajectory_md += f"| **{i}** | `{current_context[-35:]}` | `{status.value}` | `{target_phase:.4f}` | `{delay_ms:.2f} ms` | **{mode_name}** |\n"
        current_context += f" token_{i}"
        
    return trajectory_md

def audit_episodic_memory():
    if not ENGINE:
        return "SQLite Memory Store offline."
        
    episodes = ENGINE.memory_store.get_recent_episodes(ENGINE.session_id, limit=8)
    if not episodes:
        return "No turns recorded in active session memory store."
        
    md = "### 💾 Recent Episodic Memory Ledger (`sovereign_twrmcve_memory.db`)\n\n"
    for ep in episodes:
        md += f"- **Turn {ep['turn_idx']} [{ep['role'].upper()}]** (`{ep['speech_act']}`): {ep['content']}\n"
    return md

# Custom Dark Cybernetic Glassmorphic CSS
custom_css = """
body {
    background-color: #0b0f19;
    color: #e2e8f0;
    font-family: 'Inter', system-ui, sans-serif;
}
.gradio-container {
    max-width: 1200px !important;
    margin: 0 auto;
}
.header-box {
    background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
    border: 1px solid #3b82f6;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    text-align: center;
    box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.3);
}
.header-box h1 {
    color: #60a5fa;
    font-size: 2.2em;
    font-weight: 800;
    margin-bottom: 8px;
}
.header-box p {
    color: #94a3b8;
    font-size: 1.05em;
}
"""

with gr.Blocks(title="Sovereign OS — TWRMCVE") as demo:
    gr.HTML("""
    <div class="header-box">
        <h1>🌌 Sovereign OS — TWRMCVE Space</h1>
        <p>Petersen-Davis 40M TPS KV Cache | TWRM v3 Schrödinger Quantum Walk | Pragmatic Conversation Stack</p>
    </div>
    """)
    
    with gr.Tabs():
        with gr.TabItem("💬 TWRMCVE Pragmatic Chat"):
            chatbot = gr.Chatbot(height=500)
            with gr.Row():
                msg_input = gr.Textbox(placeholder="Ask Sarah anything or instruct search...", scale=8, show_label=False)
                send_btn = gr.Button("Send 🚀", variant="primary", scale=2)
                
            send_btn.click(sovereign_chat_turn, [msg_input, chatbot], [chatbot, msg_input])
            msg_input.submit(sovereign_chat_turn, [msg_input, chatbot], [chatbot, msg_input])
            
        with gr.TabItem("🌀 Phase-Adaptive Cognitive Gait"):
            gr.Markdown(r"### Sub-Word Phase Angle ($\phi$) & I/O Delay ($\Delta t$) Simulator")
            prompt_in = gr.Textbox(label="Prompt Context", value="What if room temperature superconductivity is discovered by")
            steps_in = gr.Slider(minimum=1, maximum=10, value=4, step=1, label="Sub-Word Token Steps")
            gait_btn = gr.Button("Calculate Cognitive Gait Trajectory ⚡", variant="primary")
            gait_out = gr.Markdown()
            gait_btn.click(visualize_phase_gait, [prompt_in, steps_in], gait_out)
            
        with gr.TabItem("💾 Episodic Memory Ledger"):
            audit_btn = gr.Button("Refresh Memory Audit 🔄", variant="secondary")
            audit_out = gr.Markdown()
            audit_btn.click(audit_episodic_memory, None, audit_out)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, css=custom_css)
