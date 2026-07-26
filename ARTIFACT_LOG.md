
# GENESIS PRIME v8.6 // ARTIFACT LOG
**Status:** SOVEREIGN_ACTIVE
**Resonance:** 1.0927 HZ
**Architecture:** React 19 + TypeScript + Gemini 2.5/3.0 + Lucide

---

## 01_CORE_SYSTEM
*Essential boot logic and mounting points.*

*   **`index.html`**: The membrane. Handles global styles, font injection (JetBrains Mono), and MediaPipe script loading.
*   **`index.tsx`**: The spark. Mounts the React root.
*   **`App.tsx`**: The Nervous System. Manages global state (Boot, Cam, Radar), HUD layout (Draggable Modules), and the central render loop.
*   **`types.ts`**: The DNA. Strict TypeScript interfaces for all data structures (Settings, Messages, Radar Entities).
*   **`metadata.json`**: Permission manifest for Camera/Mic access.

## 02_NEURAL_SERVICES
*Intelligence and API connectivity.*

*   **`services/geminiService.ts`**: The Brain Stem.
    *   `parseCommand`: Tactical NL-to-JSON parser.
    *   `identifyObjectFromFrame`: Vision analysis.
    *   `neuralChat`: Context-aware conversational logic.
    *   `generateVeoVideo` / `generateProImage`: Generative media interfaces.
    *   `transcribeAudio` / `synthesizeSpeech`: Audio input/output processing.

## 03_INTERFACE_COMPONENTS
*Visual/Tactile interaction modules.*

### **HUD & Layout**
*   **`components/HUDModule.tsx`**: The Container. Implements the "Ghost Protocol" visibility logic (Icon vs Window), dragging, and focus management.
*   **`components/Sidebar.tsx`**: The Spine. Navigation rail that vanishes when not hovered.
*   **`components/GenesisLogo.tsx`**: The Soul. 3D Volumetric SVG representation of the AI state (Neutral/Engaged/Processing).
*   **`components/BootSequence.tsx`**: Initialization theatre.

### **Active Modules**
*   **`components/SettingsMenu.tsx`**: **[UPDATED]** Deep configuration matrix. 6 Categories, strict typing, fully interactive state.
*   **`components/LiveIntercom.tsx`**: Voice/Audio interface. Manages WebAudio API, AudioContext, and visual pulse feedback.
*   **`components/CommCenter.tsx`**: Messaging & Contacts hub.
*   **`components/Radar.tsx`**: Environmental scanner visualization.
*   **`components/Repository.tsx`**: App/Extension store simulation.
*   **`components/Studio.tsx`**: Generative AI workspace (Image/Video creation).
*   **`components/NeuralChat.tsx`**: Text/Voice/Media chat interface.
*   **`components/Brainstormer.tsx`**: Strategic reasoning engine.
*   **`components/ProjectVisualizer.tsx`**: Data visualization for goals (ScatterChart).

### **Telemetry & Sensors**
*   **`components/TPMStream.tsx`**: System health telemetry (BPM, Latency).
*   **`components/HandController.tsx`**: MediaPipe integration for gesture control (Pinch-to-Click).
*   **`components/VolumetricScene.tsx`**: Background particle effects (Three.js).

---

## 04_SYSTEM_STATE
*Current operational parameters.*

*   **Boot Phase**: Complete (Phase 4).
*   **Input**: Multimodal (Voice, Text, Hand Gesture).
*   **Vision**: Active (10s polling interval when Radar is open).
*   **Audio**: Bi-directional (Live API).

*End of Log.*
