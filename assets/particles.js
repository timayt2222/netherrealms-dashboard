(function(){
  const c = document.getElementById("particles");
  if(!c) return;
  const ctx = c.getContext("2d");

  function resize(){ c.width = innerWidth; c.height = innerHeight; }
  resize(); addEventListener("resize", resize);

  const parts = Array.from({length: 70}, () => ({
    x: Math.random()*c.width,
    y: Math.random()*c.height,
    r: Math.random()*2 + 0.8,
    vx: (Math.random()-.5)*0.35,
    vy: (Math.random()-.5)*0.35
  }));

  (function draw(){
    ctx.clearRect(0,0,c.width,c.height);
    for(const p of parts){
      p.x += p.vx; p.y += p.vy;
      if(p.x < 0 || p.x > c.width) p.vx *= -1;
      if(p.y < 0 || p.y > c.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = "rgba(120,200,255,.35)";
      ctx.fill();
    }
    requestAnimationFrame(draw);
  })();
})();
