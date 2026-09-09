const palette = [
  "bg-neutral-800",
  "bg-neutral-700",
  "bg-stone-700",
  "bg-slate-700",
  "bg-zinc-700",
];

function colorFor(seed: string) {
  const idx = seed.charCodeAt(0) % palette.length;
  return palette[idx];
}

export default function Avatar({
  initials,
  size = 36,
}: {
  initials: string;
  size?: number;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full text-white ${colorFor(
        initials
      )}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
      }}
    >
      <span className="font-medium">{initials}</span>
    </div>
  );
}
