import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, RotateCcw, Check, FlipHorizontal, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VehicleCameraCaptureProps {
  categoryId: string;
  categoryLabel: string;
  categoryDesc: string;
  onCapture: (file: File, preview: string) => void;
  onClose: () => void;
}

// SVG overlay guides for each photo angle
const OVERLAY_GUIDES: Record<string, { svg: React.ReactNode; tip: string; aspectHint: string }> = {
  front: {
    tip: "Stand centered, 8–10 ft back · Full vehicle in frame",
    aspectHint: "landscape",
    svg: (
      <svg viewBox="0 0 400 260" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Car front silhouette */}
        <path d="M80 200 L90 150 L120 110 L140 90 L260 90 L280 110 L310 150 L320 200 Z" stroke="white" strokeWidth="2" strokeDasharray="8 4" fill="none" opacity="0.6" />
        {/* Headlights */}
        <ellipse cx="110" cy="160" rx="20" ry="15" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
        <ellipse cx="290" cy="160" rx="20" ry="15" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
        {/* Windshield */}
        <path d="M145 95 L155 60 L245 60 L255 95" stroke="white" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.4" />
        {/* Wheels */}
        <ellipse cx="120" cy="210" rx="22" ry="12" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
        <ellipse cx="280" cy="210" rx="22" ry="12" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
        {/* License plate area */}
        <rect x="170" y="175" width="60" height="20" rx="3" stroke="white" strokeWidth="1" strokeDasharray="3 2" opacity="0.3" />
      </svg>
    ),
  },
  rear: {
    tip: "Stand centered · License plate must be readable",
    aspectHint: "landscape",
    svg: (
      <svg viewBox="0 0 400 260" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M80 200 L90 150 L110 120 L130 100 L270 100 L290 120 L310 150 L320 200 Z" stroke="white" strokeWidth="2" strokeDasharray="8 4" fill="none" opacity="0.6" />
        {/* Tail lights */}
        <rect x="85" y="145" width="30" height="40" rx="5" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
        <rect x="285" y="145" width="30" height="40" rx="5" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
        {/* Rear window */}
        <path d="M140 105 L155 70 L245 70 L260 105" stroke="white" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.4" />
        {/* License plate - highlighted */}
        <rect x="160" y="170" width="80" height="25" rx="3" stroke="white" strokeWidth="2" strokeDasharray="0" opacity="0.7" />
        <text x="200" y="187" textAnchor="middle" fill="white" fontSize="9" opacity="0.6">LICENSE PLATE</text>
      </svg>
    ),
  },
  "driver-side": {
    tip: "Stand 6–8 ft away · Full side, ground to roof",
    aspectHint: "landscape",
    svg: (
      <svg viewBox="0 0 400 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Side profile silhouette */}
        <path d="M40 160 L50 130 L80 110 L120 90 L160 60 L250 55 L290 60 L330 90 L350 130 L360 160 Z" stroke="white" strokeWidth="2" strokeDasharray="8 4" fill="none" opacity="0.6" />
        {/* Windows */}
        <path d="M160 65 L170 50 L250 47 L280 55 L280 85 L160 85 Z" stroke="white" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.35" />
        {/* Wheels */}
        <circle cx="110" cy="165" r="22" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
        <circle cx="310" cy="165" r="22" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
        {/* Door line */}
        <line x1="220" y1="60" x2="220" y2="155" stroke="white" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
      </svg>
    ),
  },
  "passenger-side": {
    tip: "Stand 6–8 ft away · Full side, ground to roof",
    aspectHint: "landscape",
    svg: (
      <svg viewBox="0 0 400 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Side profile (mirrored) */}
        <path d="M360 160 L350 130 L320 110 L280 90 L240 60 L150 55 L110 60 L70 90 L50 130 L40 160 Z" stroke="white" strokeWidth="2" strokeDasharray="8 4" fill="none" opacity="0.6" />
        {/* Windows */}
        <path d="M240 65 L230 50 L150 47 L120 55 L120 85 L240 85 Z" stroke="white" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.35" />
        {/* Wheels */}
        <circle cx="290" cy="165" r="22" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
        <circle cx="90" cy="165" r="22" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
      </svg>
    ),
  },
  dashboard: {
    tip: "Show odometer reading clearly · Ignition on",
    aspectHint: "landscape",
    svg: (
      <svg viewBox="0 0 400 260" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Dashboard outline */}
        <rect x="50" y="60" width="300" height="140" rx="15" stroke="white" strokeWidth="2" strokeDasharray="8 4" opacity="0.5" />
        {/* Gauges */}
        <circle cx="140" cy="130" r="40" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.35" />
        <circle cx="260" cy="130" r="40" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.35" />
        {/* Odometer highlight */}
        <rect x="165" y="150" width="70" height="22" rx="4" stroke="white" strokeWidth="2" opacity="0.7" />
        <text x="200" y="165" textAnchor="middle" fill="white" fontSize="8" opacity="0.6">ODOMETER</text>
        {/* Steering wheel hint */}
        <circle cx="200" cy="230" r="35" stroke="white" strokeWidth="1" strokeDasharray="6 4" opacity="0.2" />
      </svg>
    ),
  },
  interior: {
    tip: "Capture front seats, console, and steering wheel",
    aspectHint: "landscape",
    svg: (
      <svg viewBox="0 0 400 300" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Seat outlines */}
        <rect x="60" y="100" width="120" height="160" rx="20" stroke="white" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.35" />
        <rect x="220" y="100" width="120" height="160" rx="20" stroke="white" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.35" />
        {/* Console */}
        <rect x="180" y="120" width="40" height="120" rx="8" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3" />
        {/* Steering wheel */}
        <circle cx="120" cy="70" r="35" stroke="white" strokeWidth="2" strokeDasharray="6 3" opacity="0.4" />
        {/* Labels */}
        <text x="120" y="185" textAnchor="middle" fill="white" fontSize="9" opacity="0.4">DRIVER</text>
        <text x="280" y="185" textAnchor="middle" fill="white" fontSize="9" opacity="0.4">PASSENGER</text>
      </svg>
    ),
  },
  damage: {
    tip: "Get close — 1–2 ft · Focus on scratches, dents, or wear",
    aspectHint: "square",
    svg: (
      <svg viewBox="0 0 300 300" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Zoom circle */}
        <circle cx="150" cy="150" r="100" stroke="white" strokeWidth="2" strokeDasharray="8 4" opacity="0.5" />
        {/* Crosshair */}
        <line x1="150" y1="80" x2="150" y2="120" stroke="white" strokeWidth="1.5" opacity="0.4" />
        <line x1="150" y1="180" x2="150" y2="220" stroke="white" strokeWidth="1.5" opacity="0.4" />
        <line x1="80" y1="150" x2="120" y2="150" stroke="white" strokeWidth="1.5" opacity="0.4" />
        <line x1="180" y1="150" x2="220" y2="150" stroke="white" strokeWidth="1.5" opacity="0.4" />
        {/* Magnifier icon */}
        <ZoomIn x={130} y={130} width={40} height={40} stroke="white" strokeWidth="1.5" opacity="0.3" />
      </svg>
    ),
  },
};

const VehicleCameraCapture = ({
  categoryId,
  categoryLabel,
  categoryDesc,
  onCapture,
  onClose,
}: VehicleCameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [showGuide, setShowGuide] = useState(true);

  const guide = OVERLAY_GUIDES[categoryId] || OVERLAY_GUIDES["front"];

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    try {
      stream?.getTracks().forEach((t) => t.stop());
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError("");
    } catch {
      setError("Unable to access camera. Please allow camera permissions or use the file upload option instead.");
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCaptured(dataUrl);
  };

  const handleConfirm = () => {
    if (!captured) return;
    const byteString = atob(captured.split(",")[1]);
    const mimeString = captured.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], `${categoryId}_${Date.now()}.jpg`, { type: "image/jpeg" });
    onCapture(file, captured);
  };

  const handleRetake = () => setCaptured(null);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
        <div className="text-center text-white max-w-sm">
          <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm mb-4">{error}</p>
          <Button variant="outline" onClick={onClose} className="text-white border-white/30">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-10">
        <button onClick={onClose} className="text-white p-1">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <span className="text-white text-sm font-semibold block">{categoryLabel}</span>
          <span className="text-white/60 text-[11px]">{categoryDesc}</span>
        </div>
        <button onClick={toggleCamera} className="text-white p-1">
          <FlipHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Camera / Preview */}
      <div className="flex-1 relative overflow-hidden">
        {captured ? (
          <img src={captured} alt="Captured" className="w-full h-full object-contain" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Guide overlay */}
        {!captured && showGuide && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="relative z-10 animate-pulse"
              style={{
                width: guide.aspectHint === "square" ? "70vw" : "88vw",
                maxWidth: guide.aspectHint === "square" ? "300px" : "500px",
                aspectRatio: guide.aspectHint === "square" ? "1" : guide.aspectHint === "landscape" ? "16/10" : "10/16",
              }}
            >
              {guide.svg}
            </div>
          </div>
        )}
      </div>

      {/* Tips bar */}
      <div className="bg-black/80 px-4 py-2 flex items-center justify-between">
        <p className="text-white/70 text-xs flex-1">{guide.tip}</p>
        {!captured && (
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-white/50 text-[10px] font-medium ml-3 whitespace-nowrap"
          >
            {showGuide ? "Hide guide" : "Show guide"}
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-black/80 px-6 py-5 flex items-center justify-center gap-8 pb-safe">
        {captured ? (
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={handleRetake}
              className="bg-transparent border-white/30 text-white hover:bg-white/10 gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Retake
            </Button>
            <Button
              size="lg"
              onClick={handleConfirm}
              className="bg-success hover:bg-success/90 text-white gap-2 px-8"
            >
              <Check className="w-5 h-5" />
              Use Photo
            </Button>
          </>
        ) : (
          <button
            onClick={handleCapture}
            className="w-[72px] h-[72px] rounded-full bg-white/90 border-[5px] border-white/30 hover:bg-white transition-colors flex items-center justify-center shadow-lg"
            aria-label="Take photo"
          >
            <div className="w-[56px] h-[56px] rounded-full border-2 border-black/10" />
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default VehicleCameraCapture;
