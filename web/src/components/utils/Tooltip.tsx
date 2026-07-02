// Tooltip.tsx — fixed NUI-compatible positioning
// Replaces FloatingPortal + floating-ui (broken in FiveM NUI due to clientX/Y = 0)
// with a simple manual mouse tracker rendered directly in the viewport.

import React, { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store';
import SlotTooltip from '../inventory/SlotTooltip';

const TIP_W = 290;
const TIP_MARGIN = 16;
const EDGE_PAD = 8;

const Tooltip: React.FC = () => {
  const hoverData = useAppSelector((state) => state.tooltip);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Use e.clientX / e.clientY — in FiveM NUI these are the raw cursor coords
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const tipH = tipRef.current ? tipRef.current.offsetHeight : 240;

      // Prefer placing the tooltip to the right of the cursor
      let x = e.clientX + TIP_MARGIN;
      if (x + TIP_W + EDGE_PAD > vw) {
        // flip left
        x = e.clientX - TIP_W - TIP_MARGIN;
      }
      x = Math.max(EDGE_PAD, Math.min(x, vw - TIP_W - EDGE_PAD));

      // Prefer aligning top with cursor, clamped so it doesn't go off-screen
      let y = e.clientY - 8;
      y = Math.max(EDGE_PAD, Math.min(y, vh - tipH - EDGE_PAD));

      setPos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!hoverData.open || !hoverData.item || !hoverData.inventoryType) return null;

  return (
    <SlotTooltip
      ref={tipRef}
      style={{
        position: 'fixed',
        left: pos ? pos.x : -9999,
        top: pos ? pos.y : -9999,
        zIndex: 200,
        pointerEvents: 'none',
      }}
      item={hoverData.item}
      inventoryType={hoverData.inventoryType}
    />
  );
};

export default Tooltip;
