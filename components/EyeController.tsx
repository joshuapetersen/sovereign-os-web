
import React, { useEffect, useRef } from 'react';
import { gazePersistence } from '../services/gazePersistenceService';

interface EyeControllerProps {
  videoElement: HTMLVideoElement | null;
  isCamActive: boolean;
  focusedModule?: string;
  onDwellClick?: () => void;
  onGazeIntentUpdate?: (event: { 
    targetModuleId: string | null; 
    dwellMs: number; 
    probability: number; 
    isPreloadWarranted: boolean; 
    isIntentLocked: boolean 
  }) => void;
}

const EyeController: React.FC<EyeControllerProps> = ({ 
  videoElement, 
  isCamActive, 
  focusedModule,
  onDwellClick,
  onGazeIntentUpdate 
}) => {
  const meshRef = useRef<any>(null);
  const requestRef = useRef<number>();
  const cursorRef = useRef<HTMLElement | null>(null);
  const errorCountRef = useRef<number>(0);
  
  // Smoothing State
  const currentX = useRef(window.innerWidth / 2);
  const currentY = useRef(window.innerHeight / 2);
  const targetX = useRef(window.innerWidth / 2);
  const targetY = useRef(window.innerHeight / 2);

  // Dwell & Intent Tracking State
  const dwellTimer = useRef<number | null>(null);
  const dwellStartTimestamp = useRef<number | null>(null);
  const currentHoveredModuleId = useRef<string | null>(null);
  const lastHoveredElement = useRef<Element | null>(null);
  const DWELL_TIME_MS = 1200; // Optimized zero-latency dwell trigger threshold

  useEffect(() => {
    cursorRef.current = document.getElementById('gaze-cursor');
  }, []);

  const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
  };

  useEffect(() => {
    if (!isCamActive || !videoElement) return;

    let faceMesh: any = null;
    let isActive = true;

    const onResults = (results: any) => {
      if (!isActive) return;
      const cursor = cursorRef.current;
      if (!cursor) return;

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        // Successful tracking - reset error count
        errorCountRef.current = 0;

        const landmarks = results.multiFaceLandmarks[0];
        const nose = landmarks[4];
        
        const rawX = (1 - nose.x) * window.innerWidth; 
        const rawY = nose.y * window.innerHeight;

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const sensitivity = 2.0; 
        
        targetX.current = centerX + (rawX - centerX) * sensitivity;
        targetY.current = centerY + (rawY - centerY) * sensitivity;
        
        targetX.current = Math.max(0, Math.min(window.innerWidth, targetX.current));
        targetY.current = Math.max(0, Math.min(window.innerHeight, targetY.current));

        currentX.current = lerp(currentX.current, targetX.current, 0.18);
        currentY.current = lerp(currentY.current, targetY.current, 0.18);

        cursor.style.transform = `translate(${currentX.current}px, ${currentY.current}px)`;
        cursor.style.opacity = '1';

        // --- PREDICTIVE INTENT & DWELL ENGINE ---
        try {
            const elem = document.elementFromPoint(currentX.current, currentY.current);
            const isInteractable = elem?.closest('[data-hud-interact="true"]') || 
                                   elem?.tagName === 'BUTTON' || 
                                   elem?.tagName === 'INPUT';

            // Find parent HUD module ID if hovering over a module component
            const moduleContainer = elem?.closest('[data-module-id]') || elem?.closest('.hud-module');
            const targetModId = moduleContainer?.getAttribute('data-module-id') || moduleContainer?.id || null;

            if (isInteractable || targetModId) {
                if (lastHoveredElement.current !== elem) {
                    lastHoveredElement.current = elem;
                    currentHoveredModuleId.current = targetModId;
                    dwellStartTimestamp.current = Date.now();

                    if (dwellTimer.current) clearTimeout(dwellTimer.current);
                    cursor.classList.add('dwelling');
                    
                    dwellTimer.current = window.setTimeout(() => {
                        const elapsed = dwellStartTimestamp.current ? Date.now() - dwellStartTimestamp.current : DWELL_TIME_MS;
                        if (targetModId) {
                          gazePersistence.recordDwell(targetModId, elapsed, focusedModule);
                          gazePersistence.recordPreloadSuccess(targetModId);
                        }

                        if (elem && isActive) {
                            if (elem instanceof HTMLElement) elem.click();
                            else elem.dispatchEvent(new MouseEvent('click', { bubbles: true, view: window }));
                            onDwellClick?.();
                        }
                        if (cursor) cursor.classList.remove('dwelling');
                        dwellTimer.current = null;
                    }, DWELL_TIME_MS);
                } else if (targetModId && dwellStartTimestamp.current) {
                    // Continuous intent prediction calculation during hover
                    const currentDwellMs = Date.now() - dwellStartTimestamp.current;
                    const prediction = gazePersistence.predictIntentProbability(
                      targetModId, 
                      currentDwellMs, 
                      focusedModule
                    );

                    onGazeIntentUpdate?.({
                      targetModuleId: targetModId,
                      dwellMs: currentDwellMs,
                      probability: prediction.probability,
                      isPreloadWarranted: prediction.isPreloadWarranted,
                      isIntentLocked: prediction.isIntentLocked
                    });
                }
            } else {
                if (dwellTimer.current) {
                    clearTimeout(dwellTimer.current);
                    dwellTimer.current = null;
                }
                if (cursor) cursor.classList.remove('dwelling');
                if (currentHoveredModuleId.current) {
                  onGazeIntentUpdate?.({
                    targetModuleId: null,
                    dwellMs: 0,
                    probability: 0,
                    isPreloadWarranted: false,
                    isIntentLocked: false
                  });
                }
                lastHoveredElement.current = null;
                currentHoveredModuleId.current = null;
                dwellStartTimestamp.current = null;
            }
        } catch (err) {
            // Ignore DOM/Hit test errors
        }

      } else {
        if (cursor) cursor.style.opacity = '0';
        if (dwellTimer.current) clearTimeout(dwellTimer.current);
      }
    };

    const initFaceMesh = async () => {
        if (!(window as any).FaceMesh) {
            if (isActive) setTimeout(initFaceMesh, 500);
            return;
        }

        try {
            faceMesh = new (window as any).FaceMesh({
                // EXPANDED ROUTER LOGIC: Handles face_detection assets explicitly
                locateFile: (file: string) => {
                    if (file.indexOf('hands') > -1) {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
                    }
                    if (file.indexOf('face_mesh') > -1 || file.indexOf('face_detection') > -1) {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
                    }
                    // Fallback to face_mesh
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
                }
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            faceMesh.onResults(onResults);
            meshRef.current = faceMesh;

            const processFrame = async () => {
                if (!isActive) return;
                
                // CIRCUIT BREAKER
                if (errorCountRef.current > 50) {
                    console.warn("[EyeController] Circuit Breaker Tripped: Too many errors. Stopping Gaze Tracking.");
                    return; 
                }

                if (videoElement && 
                    videoElement.readyState >= 2 && 
                    videoElement.videoWidth > 0 && 
                    videoElement.videoHeight > 0 &&
                    faceMesh) {
                   try {
                       await faceMesh.send({ image: videoElement });
                   } catch (e) {
                       errorCountRef.current += 1;
                       // Reduce log noise
                       if (errorCountRef.current === 1) console.warn("[EyeController] Frame Send Error (Retrying...):", e);
                   }
                }
                
                if (isActive) requestRef.current = requestAnimationFrame(processFrame);
            };
            processFrame();
        } catch (e) {
            console.error("[EyeController] Init Failed", e);
        }
    };

    // Immediate start for EyeController (Primary Input)
    initFaceMesh();

    return () => {
      isActive = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (meshRef.current) meshRef.current.close();
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
    };
  }, [isCamActive, videoElement, onDwellClick]);

  return null;
};

export default EyeController;
