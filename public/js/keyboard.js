// The on-screen keyboard. On iOS Safari the keyboard does not shrink the layout viewport, only the visual one,
// so a box sized with `dvh` stays as tall as before and its lower part (the message composer) ends up under the
// keys. visualViewport tells how much of the bottom is covered; that amount goes into --kb-inset, which the
// chat boxes subtract from their height (layout.css / pages.css). Where the browser resizes the layout itself
// (Android Chrome) the amount is 0 and nothing changes. Pinch-zoom is never touched.
export function watchKeyboard() {
  const vv = window.visualViewport;
  if (!vv) return;
  const root = document.documentElement;
  let frame = 0;
  function update() {
    frame = 0;
    // Pinch-zoomed in, the visual viewport is smaller without any keyboard: only count a covered bottom edge.
    const covered = vv.scale > 1.01 ? 0 : Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    const open = covered > 120;
    root.style.setProperty('--kb-inset', open ? `${covered}px` : '0px');
    root.classList.toggle('keyboard-open', open);
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  vv.addEventListener('resize', schedule);
  vv.addEventListener('scroll', schedule);
  // A focused field is kept in sight once the keyboard has finished moving.
  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement) || !t.matches('input, textarea, select, [contenteditable="true"]')) return;
    setTimeout(() => {
      if (document.activeElement === t) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }, 350);
  });
  update();
}
