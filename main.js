// AOS initialization
AOS.init({
  duration: 1000,
  once: true
});

document.getElementById("contactForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const message = document.getElementById("formMessage");
  message.classList.remove("hidden");
  this.reset();
});

// Responsive animated grid background
const gridCanvas = document.getElementById("gridCanvas");
if (gridCanvas) {
  const gridCtx = gridCanvas.getContext("2d");
  function resizeGridCanvas() {
    gridCanvas.width = window.innerWidth;
    gridCanvas.height = window.innerHeight;
  }
  resizeGridCanvas();
  window.addEventListener('resize', resizeGridCanvas);
  let gridOffset = 0;
  function drawGrid() {
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    gridCtx.strokeStyle = "rgba(0, 229, 255, 0.08)";
    gridCtx.lineWidth = 1;
    const size = 50;
    for (let x = 0; x < gridCanvas.width + size; x += size) {
      gridCtx.beginPath();
      gridCtx.moveTo(x + gridOffset % size, 0);
      gridCtx.lineTo(x + gridOffset % size, gridCanvas.height);
      gridCtx.stroke();
    }
    for (let y = 0; y < gridCanvas.height + size; y += size) {
      gridCtx.beginPath();
      gridCtx.moveTo(0, y + gridOffset % size);
      gridCtx.lineTo(gridCanvas.width, y + gridOffset % size);
      gridCtx.stroke();
    }
    gridOffset += 0.2;
    requestAnimationFrame(drawGrid);
  }
  drawGrid();
}

document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('pcb');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 700, H = 420;
  canvas.width = W;
  canvas.height = H;

  const BG = '#071507';
  const BOARD = '#0d2b0d';
  const TRACE = '#1a5c1a';
  const TRACE2 = '#0f3d0f';
  const PAD = '#c8a800';
  const PAD2 = '#b8960a';
  const SILK = '#e8f0e8';
  const SILKD = 'rgba(232,240,232,0.45)';
  const COMP_BG = '#0a1a0a';

  function rect(x, y, w, h, r=2, fill=BOARD, stroke=null, sw=1) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke(); }
  }

  function pad(x, y, r=5, fill=PAD) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fillStyle = fill; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r*0.45, 0, Math.PI*2);
    ctx.fillStyle = '#071507'; ctx.fill();
  }

  function spad(x, y, w=10, h=10, fill=PAD) {
    ctx.fillStyle = fill;
    ctx.fillRect(x - w/2, y - h/2, w, h);
  }

  const traces = [
    {pts:[[40,60],[40,360],[660,360],[660,60],[40,60]], w:3, col:TRACE},
    {pts:[[40,60],[660,60]], w:2, col:TRACE2},
    {pts:[[100,60],[100,200],[580,200],[580,60]], w:2, col:TRACE2},
    {pts:[[160,200],[160,300],[540,300],[540,200]], w:1.5, col:TRACE},
    {pts:[[220,300],[220,360]], w:1.5, col:TRACE},
    {pts:[[480,300],[480,360]], w:1.5, col:TRACE},
    {pts:[[100,200],[100,300]], w:1.5, col:TRACE},
    {pts:[[580,200],[580,300]], w:1.5, col:TRACE},
    {pts:[[280,60],[280,140],[420,140],[420,60]], w:2, col:TRACE},
    {pts:[[350,140],[350,200]], w:1.5, col:TRACE2},
    {pts:[[160,300],[480,300]], w:1.5, col:TRACE},
    {pts:[[220,60],[220,140]], w:1.5, col:TRACE2},
    {pts:[[480,60],[480,140]], w:1.5, col:TRACE2},
    {pts:[[100,130],[580,130]], w:1, col:TRACE2},
    {pts:[[160,130],[160,200]], w:1, col:TRACE2},
    {pts:[[540,130],[540,200]], w:1, col:TRACE2},
    {pts:[[350,300],[350,360]], w:1.5, col:TRACE2},
    {pts:[[100,260],[580,260]], w:1, col:TRACE2},
  ];

  const pulses = [
    {traceIdx:0,  t:0.0, speed:0.003, col:'#aaff00', len:0.12},
    {traceIdx:2,  t:0.3, speed:0.004, col:'#00ffcc', len:0.10},
    {traceIdx:3,  t:0.6, speed:0.005, col:'#aaff00', len:0.08},
    {traceIdx:8,  t:0.1, speed:0.006, col:'#00ffcc', len:0.10},
    {traceIdx:10, t:0.5, speed:0.004, col:'#aaff00', len:0.09},
    {traceIdx:13, t:0.2, speed:0.005, col:'#00ffcc', len:0.08},
    {traceIdx:16, t:0.7, speed:0.006, col:'#aaff00', len:0.09},
    {traceIdx:4,  t:0.4, speed:0.005, col:'#00ffcc', len:0.10},
  ];

  function traceLengths(pts) {
    let segs = [], total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      let dx = pts[i+1][0] - pts[i][0], dy = pts[i+1][1] - pts[i][1];
      let l = Math.sqrt(dx*dx + dy*dy);
      segs.push(l); total += l;
    }
    return { segs, total };
  }

  function pointOnTrace(pts, segs, total, frac) {
    let target = frac * total, acc = 0;
    for (let i = 0; i < segs.length; i++) {
      if (acc + segs[i] >= target) {
        let f = (target - acc) / segs[i];
        return [pts[i][0] + (pts[i+1][0]-pts[i][0])*f, pts[i][1] + (pts[i+1][1]-pts[i][1])*f];
      }
      acc += segs[i];
    }
    return pts[pts.length - 1];
  }

  const traceData = traces.map(tr => ({ ...tr, ...traceLengths(tr.pts) }));

  function drawBoard() {
    rect(0, 0, W, H, 12, BG);
    rect(20, 20, W-40, H-40, 8, BOARD, '#1a4a1a', 1.5);

    ctx.strokeStyle = 'rgba(0,80,0,0.18)';
    ctx.lineWidth = 0.5;
    for (let x = 40; x < W-20; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, H-20); ctx.stroke();
    }
    for (let y = 40; y < H-20; y += 20) {
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(W-20, y); ctx.stroke();
    }

    traces.forEach(tr => {
      ctx.beginPath();
      ctx.moveTo(tr.pts[0][0], tr.pts[0][1]);
      tr.pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.strokeStyle = tr.col;
      ctx.lineWidth = tr.w;
      ctx.lineJoin = 'round';
      ctx.stroke();
    });

    [[40,60],[660,60],[40,360],[660,360]].forEach(([x,y]) => pad(x, y, 8, PAD));

    ctx.beginPath();
    ctx.roundRect(270, 90, 160, 100, 4);
    ctx.fillStyle = '#111f11'; ctx.fill();
    ctx.strokeStyle = '#2a6a2a'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = SILK; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
    ctx.fillText('SYNCCLOCK', 350, 142);
    ctx.font = '9px monospace'; ctx.fillStyle = SILKD;
    ctx.fillText('JXI2', 350, 157);
    ctx.fillText('GPS TIMING', 350, 170);

    for (let i = 0; i < 5; i++) {
      spad(280+i*20, 90, 8, 6, PAD);
      spad(280+i*20, 190, 8, 6, PAD);
    }
    for (let i = 0; i < 3; i++) {
      spad(270, 100+i*25, 6, 8, PAD);
      spad(430, 100+i*25, 6, 8, PAD);
    }

    rect(100, 215, 80, 60, 3, COMP_BG, '#1e5c1e', 1);
    ctx.fillStyle = SILK; ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('OCXO', 140, 242);
    ctx.fillStyle = SILKD; ctx.font = '7px monospace';
    ctx.fillText('10MHz', 140, 255);
    for (let i = 0; i < 3; i++) {
      spad(110+i*20, 215, 7, 5, PAD2);
      spad(110+i*20, 275, 7, 5, PAD2);
    }

    rect(500, 215, 80, 60, 3, COMP_BG, '#1e5c1e', 1);
    ctx.fillStyle = SILK; ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('GPS RX', 540, 242);
    ctx.fillStyle = SILKD; ctx.font = '7px monospace';
    ctx.fillText('L1/L2', 540, 255);
    for (let i = 0; i < 3; i++) {
      spad(510+i*20, 215, 7, 5, PAD2);
      spad(510+i*20, 275, 7, 5, PAD2);
    }

    const smallChips = [
      [85,  95, 60, 40, 'FPGA'],
      [555, 95, 60, 40, 'IC'],
      [85,  310, 50, 30, 'PWR'],
      [555, 310, 50, 30, 'CAP'],
      [190, 310, 60, 30, 'LED'],
      [420, 310, 60, 30, 'RES'],
    ];
    smallChips.forEach(([x, y, w, h, lbl]) => {
      rect(x, y, w, h, 2, COMP_BG, '#1e5c1e', 0.8);
      ctx.fillStyle = SILK; ctx.font = '8px monospace'; ctx.textAlign = 'center';
      ctx.fillText(lbl, x+w/2, y+h/2+3);
    });

    for (let i = 0; i < 8; i++) pad(60+i*80, 360, 4, PAD);
    for (let i = 0; i < 8; i++) pad(60+i*80, 60, 4, PAD);

    rect(30,  155, 12, 110, 2, PAD, '#1a4a00');
    rect(658, 155, 12, 110, 2, PAD, '#1a4a00');

    ctx.fillStyle = 'rgba(0,180,60,0.06)';
    ctx.beginPath(); ctx.arc(350, 210, 140, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = 'rgba(170,255,0,0.06)';
    ctx.lineWidth = 0.5;
    for (let r = 30; r < 200; r += 25) {
      ctx.beginPath(); ctx.arc(350, 210, r, 0, Math.PI*2); ctx.stroke();
    }
  }

  function drawPulse(p) {
    const tr = traceData[p.traceIdx];
    const { pts, segs, total } = tr;
    const t0 = ((p.t % 1) + 1) % 1;
    const t1 = ((p.t + p.len) % 1 + 1) % 1;
    const steps = 24;

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      let frac = i / steps;
      let tf;
      if (t0 <= t1) {
        tf = t0 + frac * (t1 - t0);
      } else {
        let range = (1 - t0) + t1;
        tf = (t0 + frac * range) % 1;
      }
      const pt = pointOnTrace(pts, segs, total, tf);
      i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1]);
    }
    ctx.strokeStyle = p.col;
    ctx.lineWidth = tr.w + 1.5;
    ctx.globalAlpha = 0.9;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;

    const headPt = pointOnTrace(pts, segs, total, t1);
    ctx.beginPath();
    ctx.arc(headPt[0], headPt[1], tr.w + 1, 0, Math.PI*2);
    ctx.fillStyle = p.col;
    ctx.fill();
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawBoard();
    pulses.forEach(p => {
      p.t = (p.t + p.speed) % 1;
      drawPulse(p);
    });
    requestAnimationFrame(animate);
  }

  animate();
});
