import ghostCar from "@/assets/ghost-loader.png";

const UploadSkeleton = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="relative mx-auto mb-4 w-[320px] h-[200px]">
        <img
          src={ghostCar}
          alt=""
          className="w-full h-full object-contain"
          style={{
            filter: "brightness(1.05)",
            animation: "car-bounce 1.2s ease-in-out infinite",
          }}
        />
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 200">
          <style>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes car-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
            @keyframes road-scroll { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -40; } }
          `}</style>
          <g style={{ transformOrigin: "105px 132px", animation: "spin 0.8s linear infinite" }}>
            <line x1="105" y1="120" x2="105" y2="144" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.35" />
            <line x1="93" y1="132" x2="117" y2="132" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.35" />
            <line x1="96" y1="124" x2="114" y2="140" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.35" />
            <line x1="96" y1="140" x2="114" y2="124" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.35" />
          </g>
          <g style={{ transformOrigin: "218px 132px", animation: "spin 0.8s linear infinite" }}>
            <line x1="218" y1="120" x2="218" y2="144" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.35" />
            <line x1="206" y1="132" x2="230" y2="132" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.35" />
            <line x1="209" y1="124" x2="227" y2="140" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.35" />
            <line x1="209" y1="140" x2="227" y2="124" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.35" />
          </g>
        </svg>
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading photos...</p>
    </div>
  </div>
);

export default UploadSkeleton;
