
import React, { useEffect, useRef } from 'react';

interface HandControllerProps {
  videoElement: HTMLVideoElement | null;
  isCamActive: boolean;
  onGesture?: (gesture: 'SWIPE_LEFT' | 'SWIPE_RIGHT' | 'PINCH') => void;
  onHandMove?: (pos: { x: number; y: number } | null) => void;
}

const HandController: React.FC<HandControllerProps> = ({ videoElement, isCamActive, onGesture, onHandMove }) => {
  const handsRef = useRef<any>(null);
  const requestRef = useRef<number>();
  const cursorRef = useRef<HTMLElement | null>(null);
  const errorCountRef = useRef<number>(0);
  
  const lastX = useRef<number>(0);
  const lastY = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const gestureCooldown = useRef<number>(0);
  const lastHoveredElement = useRef<Element | null>(null);

  useEffect(() => {
    cursorRef.current = document.getElementById('hand-cursor');
  }, []);

  useEffect(() => {
    if (!isCamActive || !videoElement) return;
    
    let hands: any = null;
    let isActive = true;
    let initTimer: any = null;

    const onResults = (results: any) => {
      if (!isActive) return;
      const cursor = cursorRef.current;
      if (!cursor) return;

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        errorCountRef.current = 0; // Reset error count on success

        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];

        const x = indexTip.x * window.innerWidth;
        const y = indexTip.y * window.innerHeight;
        const now = Date.now();

        onHandMove?.({ x, y });

        cursor.style.transform = `translate(${x}px, ${y}px)`;
        cursor.style.opacity = '1';

        const elem = document.elementFromPoint(x, y);
        if (elem && elem !== lastHoveredElement.current) {
            if (lastHoveredElement.current) {
                lastHoveredElement.current.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
            }
            elem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            elem.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            lastHoveredElement.current = elem;
        } else if (!elem && lastHoveredElement.current) {
            lastHoveredElement.current.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
            lastHoveredElement.current = null;
        }

        const dt = now - lastTime.current;
        if (dt > 50) { 
            const dx = x - lastX.current;
            const velocityX = dx / dt; 

            if (gestureCooldown.current <= now) {
                if (velocityX < -2.5 && lastX.current > window.innerWidth * 0.7) {
                    onGesture?.('SWIPE_LEFT');
                    gestureCooldown.current = now + 1500; 
                    if(cursor) {
                        cursor.style.backgroundColor = '#f43f5e'; 
                        setTimeout(() => { if(cursor) cursor.style.backgroundColor = ''; }, 200);
                    }
                }
            }
            lastX.current = x;
            lastY.current = y;
            lastTime.current = now;
        }

        const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
        const isPinched = distance < 0.05;

        if (isPinched) {
          cursor.classList.add('pinched');
          if (elem && gestureCooldown.current <= now) {
             if (elem instanceof HTMLElement) {
                 elem.click();
             } else {
                 elem.dispatchEvent(new MouseEvent('click', { bubbles: true, view: window }));
             }
             gestureCooldown.current = now + 500; 
          }
        } else {
          cursor.classList.remove('pinched');
        }

      } else {
        onHandMove?.(null);
        if (cursor) cursor.style.opacity = '0';
      }
    };

    const initHands = async () => {
        if (!(window as any).Hands) {
            if (isActive) setTimeout(initHands, 500);
            return;
        }

        try {
            hands = new (window as any).Hands({
                // EXPANDED ROUTER LOGIC
                locateFile: (file: string) => {
                    if (file.indexOf('face_mesh') > -1 || file.indexOf('face_detection') > -1) {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
                    }
                    // Default to hands
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
                }
            });

            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6
            });

            hands.onResults(onResults);
            handsRef.current = hands;

            const processFrame = async () => {
                if (!isActive) return;
                
                // CIRCUIT BREAKER
                if (errorCountRef.current > 50) {
                     console.warn("[HandController] Circuit Breaker Tripped. Stopping.");
                     return;
                }

                if (videoElement && 
                    videoElement.readyState >= 2 && 
                    videoElement.videoWidth > 0 && 
                    videoElement.videoHeight > 0 && 
                    hands) {
                   try {
                       await hands.send({ image: videoElement });
                   } catch (e) {
                       errorCountRef.current += 1;
                   }
                }
                if (isActive) requestRef.current = requestAnimationFrame(processFrame);
            };
            processFrame();
        } catch (e) {
            console.error("[HandController] Init Failed", e);
        }
    };

    // DELAYED START: Wait 2.5s to let FaceMesh finish initializing (prevents WASM race condition)
    initTimer = setTimeout(() => {
        if (isActive) initHands();
    }, 2500);

    return () => {
      isActive = false;
      if (initTimer) clearTimeout(initTimer);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (handsRef.current) handsRef.current.close();
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
    };
  }, [isCamActive, videoElement, onGesture]);

  return null;
};

export default HandController;
