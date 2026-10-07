import { cn } from "@/lib/utils";

/**
 * Símbolo do Ascend: um pico com ombro (a subida) e o cume marcado em âmbar.
 * Lido como um "A" estilizado. Desenhado num grid de 32 para ficar nítido em 16px.
 */
export function AscendMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      {/* Pico de trás, menor: a próxima subida */}
      <path d="M17.5 28 L24.25 16 L31 28 Z" fill="currentColor" opacity="0.4" />
      {/* Pico principal em forma de A, com o vazado do A */}
      <path d="M1.5 28 L13 7.5 L24.5 28 Z M13 18.5 L9.6 28 L16.4 28 Z" fill="currentColor" fillRule="evenodd" />
      {/* Cume */}
      <circle cx="13" cy="3.2" r="2.4" fill="var(--summit)" />
    </svg>
  );
}

export function AscendLogo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <AscendMark className={cn("size-7", markClassName)} />
      <span className="font-[family-name:var(--font-sora)] text-[1.35rem] leading-none font-semibold tracking-[-0.03em]">
        Ascend
      </span>
    </span>
  );
}

/** Um nível do relevo: círculo deformado por harmônicos, com o centro derivando a cada nível. */
function contourPath(level: number, seed: number) {
  const r = 26 + level * 22;
  const cx = level * 7 * Math.cos(seed) - level * 2;
  const cy = -level * 6 * Math.sin(seed + 0.7);
  const points: string[] = [];
  const steps = 72;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const wobble =
      1 +
      0.16 * Math.sin(3 * a + level * 0.55 + seed) +
      0.09 * Math.sin(5 * a - level * 0.35) +
      0.05 * Math.sin(8 * a + seed * 2 + level * 0.2);
    const x = cx + Math.cos(a) * r * wobble * 1.18;
    const y = cy + Math.sin(a) * r * wobble * 0.86;
    points.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M${points.join(" L")}Z`;
}

/**
 * Curvas de nível (textura da marca): níveis orgânicos aninhados, como num mapa topográfico.
 * Puramente decorativa; herda a cor de `currentColor`.
 */
export function ContourLines({ className, levels = 10, seed = 0.8 }: { className?: string; levels?: number; seed?: number }) {
  return (
    <svg viewBox="-260 -260 520 520" className={cn("pointer-events-none", className)} aria-hidden fill="none">
      <g stroke="currentColor" strokeWidth="1.1" vectorEffect="non-scaling-stroke">
        {Array.from({ length: levels }, (_, i) => (
          <path key={i} d={contourPath(i, seed)} vectorEffect="non-scaling-stroke" opacity={1 - i * 0.05} />
        ))}
      </g>
    </svg>
  );
}
