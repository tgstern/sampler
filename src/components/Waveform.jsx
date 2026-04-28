import { useEffect, useRef } from 'react';

export function Waveform({ buffer, start, end, reverse, onRangeChange }) {
  const canvasRef = useRef(null);
  const dragging = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);

    ctx.clearRect(0, 0, width, height);

    // LCD background
    ctx.fillStyle = '#2e3a22';
    ctx.fillRect(0, 0, width, height);

    // out-of-range dimmed zones
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, start * width, height);
    ctx.fillRect(end * width, 0, width - end * width, height);

    // center line
    ctx.strokeStyle = 'rgba(100,140,40,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // waveform — green phosphor
    ctx.strokeStyle = '#a8c838';
    ctx.shadowColor = '#80a020';
    ctx.shadowBlur = 2;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      let min = 1, max = -1;
      for (let j = 0; j < step; j++) {
        const srcIdx = reverse
          ? Math.max(0, data.length - 1 - (i * step + j))
          : (i * step + j);
        const v = data[srcIdx] || 0;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = ((1 - max) / 2) * height;
      const y2 = ((1 - min) / 2) * height;
      if (i === 0) ctx.moveTo(i, y1);
      else ctx.lineTo(i, y1);
      ctx.lineTo(i, y2);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // start/end handles
    const drawHandle = (x, color, shadowColor) => {
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 4;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.fillRect(x - 4, 0, 8, 8);
    };
    drawHandle(start * width, '#e07818', '#e07818');
    drawHandle(end * width,   '#e07818', '#e07818');
  }, [buffer, start, end, reverse]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  const onMouseDown = (e) => {
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    const startDist = Math.abs(pos - start);
    const endDist = Math.abs(pos - end);
    dragging.current = startDist < endDist ? 'start' : 'end';
  };

  const onMouseMove = (e) => {
    if (!dragging.current) return;
    const pos = getPos(e, canvasRef.current);
    if (dragging.current === 'start') {
      onRangeChange(Math.min(pos, end - 0.01), end);
    } else {
      onRangeChange(start, Math.max(pos, start + 0.01));
    }
  };

  const onMouseUp = () => { dragging.current = null; };

  return (
    <div className="waveform-screen">
      <canvas
        ref={canvasRef}
        className="waveform"
        width={600}
        height={80}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
    </div>
  );
}
