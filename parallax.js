window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;
  document.querySelectorAll(".parallax").forEach(el => {
    const speed = parseFloat(el.getAttribute("data-speed")) || 0;
    el.style.transform = `translateY(${scrollY * speed}px)`;
  });
});
