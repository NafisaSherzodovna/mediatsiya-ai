/**
 * Page background: clean paper with one soft teal light from the top. Calm on purpose: the hero's scales of
 * justice carry the symbolism, the background only gives warmth.
 */
export function PageBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-[30vh] left-1/2 h-[70vh] w-[110vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(15_118_110/0.10),transparent)]" />
      <div className="absolute right-[-15vw] bottom-[-25vh] h-[60vh] w-[60vw] rounded-[50%] bg-[radial-gradient(closest-side,rgb(46_79_163/0.06),transparent)]" />
    </div>
  );
}
