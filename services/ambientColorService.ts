// Service to extract dominant environmental colors from camera frames
// dynamically adapting HUD module shadow-glow and accents to physical lighting.

export interface AmbientColorState {
  r: number;
  g: number;
  b: number;
  hex: string;
  glowShadowCss: string;
  glowBorderCss: string;
  glowTextCss: string;
  dominantThemeName: string;
}

export const DEFAULT_CYBER_GLOW: AmbientColorState = {
  r: 14,
  g: 165,
  b: 233,
  hex: '#0ea5e9',
  glowShadowCss: '0 10px 35px rgba(14, 165, 233, 0.35)',
  glowBorderCss: 'rgba(14, 165, 233, 0.45)',
  glowTextCss: 'rgb(56, 189, 248)',
  dominantThemeName: 'CYBER_CYAN'
};

class AmbientColorEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private currentRgb = { r: 14, g: 165, b: 233 };

  constructor() {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 32; // Low res for fast performance pixel averaging
      this.canvas.height = 32;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }
  }

  /**
   * Samples current video frame and extracts smoothed dominant ambient RGB
   */
  public extractAmbientColor(video: HTMLVideoElement | null, isCamActive: boolean): AmbientColorState {
    if (!video || !isCamActive || video.readyState < 2 || !this.ctx || !this.canvas) {
      return DEFAULT_CYBER_GLOW;
    }

    try {
      // Draw scaled video frame onto 32x32 canvas
      this.ctx.drawImage(video, 0, 0, 32, 32);
      const imgData = this.ctx.getImageData(0, 0, 32, 32).data;

      let sumR = 0, sumG = 0, sumB = 0;
      let count = 0;

      // Sample pixels with step 4
      for (let i = 0; i < imgData.length; i += 16) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        
        // Skip extreme dark or overexposed white noise pixels to get rich environmental tones
        const brightness = (r + g + b) / 3;
        if (brightness > 20 && brightness < 240) {
          sumR += r;
          sumG += g;
          sumB += b;
          count++;
        }
      }

      if (count > 0) {
        let rawR = Math.round(sumR / count);
        let rawG = Math.round(sumG / count);
        let rawB = Math.round(sumB / count);

        // Boost saturation slightly for vivid XR atmospheric glow
        const max = Math.max(rawR, rawG, rawB);
        if (max > 0) {
          const boost = 1.25;
          rawR = Math.min(255, Math.round(rawR * boost));
          rawG = Math.min(255, Math.round(rawG * boost));
          rawB = Math.min(255, Math.round(rawB * boost));
        }

        // LERP smooth transition to avoid sudden visual flickering
        const lerpFactor = 0.08;
        this.currentRgb.r += (rawR - this.currentRgb.r) * lerpFactor;
        this.currentRgb.g += (rawG - this.currentRgb.g) * lerpFactor;
        this.currentRgb.b += (rawB - this.currentRgb.b) * lerpFactor;
      }
    } catch (e) {
      // Fallback on cross-origin or canvas read error
    }

    const finalR = Math.round(this.currentRgb.r);
    const finalG = Math.round(this.currentRgb.g);
    const finalB = Math.round(this.currentRgb.b);

    const hex = `#${((1 << 24) + (finalR << 16) + (finalG << 8) + finalB).toString(16).slice(1)}`;

    // Identify theme name
    let themeName = 'AMBIENT_MATCHED';
    if (finalR > finalG + 30 && finalR > finalB + 30) themeName = 'WARM_AMBER';
    else if (finalG > finalR + 20 && finalG > finalB + 20) themeName = 'NEON_EMERALD';
    else if (finalB > finalR + 20 && finalB > finalG + 20) themeName = 'DEEP_COBALT';
    else if (finalR > 180 && finalB > 180) themeName = 'VIOLET_LUX';

    return {
      r: finalR,
      g: finalG,
      b: finalB,
      hex,
      glowShadowCss: `0 12px 45px rgba(${finalR}, ${finalG}, ${finalB}, 0.38), 0 0 20px rgba(${finalR}, ${finalG}, ${finalB}, 0.2)`,
      glowBorderCss: `rgba(${finalR}, ${finalG}, ${finalB}, 0.55)`,
      glowTextCss: `rgb(${finalR}, ${finalG}, ${finalB})`,
      dominantThemeName: themeName
    };
  }
}

export const ambientColorEngine = new AmbientColorEngine();
