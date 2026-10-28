import React, { useEffect, useRef, useState } from "react";

interface Hero3DCanvasProps {
  className?: string;
}

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export default function Hero3DCanvas({ className = "" }: Hero3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const smokeCanvasRef = useRef<HTMLCanvasElement>(null);

  // 3D Tilt State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Mouse Parallax 3D Tilt Handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalize -1 to 1
      const normX = (e.clientX - centerX) / (rect.width / 2);
      const normY = (e.clientY - centerY) / (rect.height / 2);

      // Smooth tilt angles (X tilt: -8 to +8 deg, Y tilt: -10 to +10 deg)
      targetX = -normY * 8;
      targetY = normX * 10;
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const updateTilt = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      setTilt({ x: currentX, y: currentY });
      animId = requestAnimationFrame(updateTilt);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    animId = requestAnimationFrame(updateTilt);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Factory Chimney Smoke Animation Loop
  useEffect(() => {
    const canvas = smokeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: SmokeParticle[] = [];

    // Chimney emitter coordinates on 727x472 canvas
    const emitters = [
      { x: 140, y: 88 }, // Left smokestack
      { x: 180, y: 85 }, // Middle smokestack
      { x: 220, y: 78 }, // Right smokestack
    ];

    let spawnTimer = 0;

    const render = () => {
      animId = requestAnimationFrame(render);

      if (canvas.width !== 727 || canvas.height !== 472) {
        canvas.width = 727;
        canvas.height = 472;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      spawnTimer++;
      if (spawnTimer % 6 === 0) {
        emitters.forEach((emitter) => {
          particles.push({
            x: emitter.x + (Math.random() * 4 - 2),
            y: emitter.y,
            vx: 0.18 + Math.random() * 0.35,
            vy: -0.7 - Math.random() * 0.45,
            size: 4 + Math.random() * 3,
            maxSize: 18 + Math.random() * 8,
            alpha: 0.45 + Math.random() * 0.18,
            life: 0,
            maxLife: 60 + Math.random() * 25,
          });
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        const currentSize = p.size + (p.maxSize - p.size) * progress;
        const currentAlpha = p.alpha * (1 - progress);

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
        grad.addColorStop(0, `rgba(255, 255, 255, ${currentAlpha})`);
        grad.addColorStop(0.6, `rgba(240, 244, 250, ${currentAlpha * 0.5})`);
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-[620px] aspect-[727/472] flex items-center justify-center select-none perspective-[1200px] ${className}`}
    >
      {/* 3D Tilted Diorama Canvas Layer */}
      <div
        className="relative w-full h-full transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Soft Ambient Shadow & Glow on Dark Hero Background */}
        <div className="absolute inset-4 rounded-[42px] bg-gradient-to-tr from-[#FF7A00]/20 via-[#0EA5E9]/15 to-transparent blur-2xl -z-10 opacity-70" />

        {/* Base 3D Factory & Warehouse Isometric Scene */}
        <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-[#F4EFEA]">
          <img
            src="/images/factory-logistics-3d.png"
            alt="3D Manufacturing and Logistics Diorama"
            className="w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
          />

          {/* Interactive Dynamic Glass Sheen */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay transition-opacity duration-300"
            style={{
              background: `linear-gradient(${120 + tilt.y * 3}deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 65%)`,
            }}
          />

          {/* Canvas Layer: Animated Chimney Smoke Puffs */}
          <canvas
            ref={smokeCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Animated Courtyard Intralogistics: Forklift Pulse Indicator */}
          <div
            className="absolute left-[39%] top-[57%] w-[12%] h-[18%] pointer-events-none z-10 flex items-center justify-center"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7A00] opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF7A00]/80 shadow-md" />
            </span>
          </div>

          {/* Animated Truck Headlight Beams */}
          <div
            className="absolute left-[54%] top-[78%] w-[16%] h-[14%] pointer-events-none z-10"
            style={{
              background:
                "radial-gradient(ellipse 100% 70% at 90% 70%, rgba(254, 240, 138, 0.45) 0%, rgba(254, 240, 138, 0.15) 50%, rgba(255, 255, 255, 0) 100%)",
              transform: "rotate(-18deg)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
