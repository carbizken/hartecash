import { cn } from "@/lib/utils";

const DEPTH_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9];

export interface BrakeDepths {
  leftFront: number | null;
  rightFront: number | null;
  leftRear: number | null;
  rightRear: number | null;
}

function getBrakeStatus(depth: number) {
  if (depth <= 3) return { key: "replace", label: "Replace", color: "#EF4444" };
  if (depth <= 5) return { key: "fair", label: "Fair", color: "#F59E0B" };
  return { key: "good", label: "Good", color: "#22C55E" };
}

function BrakeRotor({ color, side }: { color: string; side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <svg viewBox="0 0 160 160" className="h-20 w-20 shrink-0">
      <circle cx="80" cy="80" r="58" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2" />
      <circle cx="80" cy="80" r="34" fill="hsl(var(--muted-foreground) / 0.3)" stroke="hsl(var(--foreground))" strokeWidth="4" />
      <circle cx="80" cy="80" r="12" fill="hsl(var(--foreground))" />
      <path
        d={isLeft ? "M90 22 Q124 22 132 52 L132 67 Q112 60 98 64 Z" : "M70 22 Q36 22 28 52 L28 67 Q48 60 62 64 Z"}
        fill={color}
        stroke="hsl(var(--foreground))"
        strokeWidth="3"
      />
    </svg>
  );
}

function ArrowReadout({ depth, side, status }: { depth: number; side: "left" | "right"; status: ReturnType<typeof getBrakeStatus> }) {
  const isLeft = side === "left";
  const mmValue = Math.max(1, Math.round((depth / 32) * 25.4));
  return (
    <div className="flex items-center justify-center gap-2">
      {isLeft && (
        <svg width="24" height="16" className="shrink-0">
          <line x1="22" y1="8" x2="4" y2="8" stroke={status.color} strokeWidth="3" />
          <polygon points="4,2 0,8 4,14" fill={status.color} />
        </svg>
      )}
      <div className="text-center">
        <div className="text-xl font-bold" style={{ color: status.color }}>{mmValue} mm</div>
        <div className="text-xs" style={{ color: status.color }}>{depth}/32</div>
        <div className="text-[10px] text-muted-foreground uppercase font-semibold">{status.label}</div>
      </div>
      {!isLeft && (
        <svg width="24" height="16" className="shrink-0">
          <line x1="2" y1="8" x2="20" y2="8" stroke={status.color} strokeWidth="3" />
          <polygon points="20,2 24,8 20,14" fill={status.color} />
        </svg>
      )}
    </div>
  );
}

function BrakeCorner({
  label,
  depth,
  side,
  onChange,
  readOnly,
}: {
  label: string;
  depth: number | null;
  side: "left" | "right";
  onChange?: (depth: number) => void;
  readOnly?: boolean;
}) {
  const isLeft = side === "left";
  const status = depth != null ? getBrakeStatus(depth) : null;
  const rotorColor = status?.color ?? "hsl(var(--muted-foreground) / 0.3)";

  return (
    <div className={cn("flex flex-col gap-1.5", isLeft ? "items-start" : "items-end")}>
      <div className="text-xs font-semibold text-card-foreground">{label}</div>
      <div className={cn("flex items-center gap-3", isLeft ? "flex-row" : "flex-row-reverse")}>
        <BrakeRotor color={rotorColor} side={side} />
        <div className="flex flex-col gap-1.5 items-center">
          {!readOnly && onChange ? (
            <select
              value={depth ?? ""}
              onChange={(e) => onChange(Number(e.target.value))}
              className="border border-input bg-background rounded-md px-2 py-1 text-sm w-20"
            >
              <option value="" disabled>--</option>
              {DEPTH_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}/32</option>
              ))}
            </select>
          ) : depth != null ? (
            <div className="text-sm font-bold" style={{ color: status?.color }}>{depth}/32</div>
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
          {depth != null && status && (
            <ArrowReadout depth={depth} side={side} status={status} />
          )}
        </div>
      </div>
    </div>
  );
}

interface BrakePadDepthWidgetProps {
  depths: BrakeDepths;
  onChange?: (id: keyof BrakeDepths, depth: number) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export default function BrakePadDepthWidget({ depths, onChange, readOnly = false, compact = false }: BrakePadDepthWidgetProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-gradient-to-b from-muted/40 to-background", compact ? "p-3" : "p-4 md:p-6")}>
      {/* Legend */}
      <div className={cn("flex flex-wrap items-center justify-between gap-2 mb-4", compact && "mb-3")}>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Brake Layout</div>
          {!compact && (
            <div className="mt-0.5 text-[11px] text-muted-foreground">Rear axle top · Front axle bottom</div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="rounded-full border border-red-200 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 text-[10px] font-semibold text-red-600">2–3 Replace</span>
          <span className="rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold text-amber-600">4–5 Fair</span>
          <span className="rounded-full border border-green-200 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 text-[10px] font-semibold text-green-600">6–9 Good</span>
        </div>
      </div>

      {/* Grid layout */}
      <div className="relative">
        <div className={cn(
          "grid gap-6",
          compact
            ? "grid-cols-2 grid-rows-2"
            : "grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:grid-rows-2"
        )}>
          {/* Rear Left */}
          <div className={cn(!compact && "md:col-start-1 md:row-start-1")}>
            <BrakeCorner label="Left Rear" depth={depths.leftRear} side="left" onChange={onChange ? (d) => onChange("leftRear", d) : undefined} readOnly={readOnly} />
          </div>
          {/* Rear Right */}
          <div className={cn(!compact && "md:col-start-3 md:row-start-1")}>
            <BrakeCorner label="Right Rear" depth={depths.rightRear} side="right" onChange={onChange ? (d) => onChange("rightRear", d) : undefined} readOnly={readOnly} />
          </div>
          {/* Front Left */}
          <div className={cn(!compact && "md:col-start-1 md:row-start-2")}>
            <BrakeCorner label="Left Front" depth={depths.leftFront} side="left" onChange={onChange ? (d) => onChange("leftFront", d) : undefined} readOnly={readOnly} />
          </div>
          {/* Front Right */}
          <div className={cn(!compact && "md:col-start-3 md:row-start-2")}>
            <BrakeCorner label="Right Front" depth={depths.rightFront} side="right" onChange={onChange ? (d) => onChange("rightFront", d) : undefined} readOnly={readOnly} />
          </div>

          {/* Axle labels (desktop only, non-compact) */}
          {!compact && (
            <>
              <div className="hidden md:flex md:col-start-2 md:row-start-1 items-center justify-center">
                <div className="rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
                  Rear Axle
                </div>
              </div>
              <div className="hidden md:flex md:col-start-2 md:row-start-2 items-center justify-center">
                <div className="rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
                  Front Axle
                </div>
              </div>
            </>
          )}
        </div>

        {/* Crosshair lines (desktop, non-compact) */}
        {!compact && (
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border" />
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-border" />
          </div>
        )}
      </div>
    </div>
  );
}
