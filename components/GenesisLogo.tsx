
import React from 'react';

interface GenesisLogoProps {
  emotionState?: 'NEUTRAL' | 'ENGAGED' | 'PROCESSING' | 'CRITICAL';
  className?: string;
  style?: React.CSSProperties;
}

const GenesisLogo: React.FC<GenesisLogoProps> = ({ 
  emotionState = 'NEUTRAL', 
  className = "",
  style = {}
}) => {
  const isEngaged = emotionState === 'ENGAGED';
  const isProcessing = emotionState === 'PROCESSING';
  const isCritical = emotionState === 'CRITICAL';

  // THE SMOOTH G PATH
  // Constructed using Arcs (A) and Quadratic Bezier curves (Q) for perfect flow.
  const smoothG = `
    M 90 35 
    Q 90 10 50 10 
    Q 10 10 10 50 
    Q 10 90 50 90 
    Q 90 90 90 50 
    L 55 50
  `;

  // Color Tuning
  let primaryColor = "#22d3ee"; // Cyan-400 (Default)
  let glowColor = "rgba(34, 211, 238, 0.4)";

  if (isCritical) {
    primaryColor = "#f43f5e"; // Rose-500
    glowColor = "rgba(244, 63, 94, 0.6)";
  } else if (isEngaged) {
    primaryColor = "#ffffff";
    glowColor = "rgba(255, 255, 255, 0.9)";
  }

  // Rotation Speed Control
  const animationDuration = isProcessing ? '1s' : isEngaged ? '4s' : '12s';
  const animationTiming = isProcessing ? 'linear' : 'ease-in-out';

  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        perspective: '1200px', // Enhanced perspective for deep wireframe look
        width: '100px',
        height: '100px',
        ...style 
      }}
    >
      {/* 
         THE WIREFRAME ROTOR
         Uses preserve-3d to maintain the Z-depth of the stack
      */}
      <div 
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          animation: `spinY ${animationDuration} ${animationTiming} infinite`
        }}
      >
        <style>
          {`
            @keyframes spinY {
              0% { transform: rotateY(0deg); }
              100% { transform: rotateY(360deg); }
            }
          `}
        </style>

        {/* 
            WIRE MESH STACK 
            We stack 5 layers widely spaced (Z: -20 to 20) to create a hollow,
            holographic wireframe cage effect.
        */}
        {[20, 10, 0, -10, -20].map((z, i) => (
            <div key={z} className="absolute inset-0" style={{ transform: `translateZ(${z}px)` }}>
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    <path 
                        d={smoothG}
                        fill="none"
                        stroke={primaryColor}
                        strokeWidth="3" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ 
                            opacity: isEngaged ? 0.9 : 0.7 - (Math.abs(z) * 0.015), // Fade edges slightly
                            filter: `drop-shadow(0 0 4px ${glowColor})`
                        }}
                    />
                </svg>
            </div>
        ))}

        {/* CORE SINGULARITY (The Pivot Point) */}
        {/* Visible anchor point for the rotation axis */}
        <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
            style={{ 
                backgroundColor: primaryColor,
                transform: 'translateZ(0px)',
                boxShadow: `0 0 15px 2px ${glowColor}`,
                opacity: isEngaged || isProcessing ? 1 : 0.6
            }}
        ></div>
        
        {/* VERTICAL AXIS HINT */}
        {/* Adds a subtle 'pole' to emphasize the wireframe structure */}
        <div 
            className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gradient-to-b from-transparent via-current to-transparent opacity-20"
            style={{ color: primaryColor, transform: 'translateZ(0px)' }}
        ></div>

      </div>
    </div>
  );
};

export default GenesisLogo;
