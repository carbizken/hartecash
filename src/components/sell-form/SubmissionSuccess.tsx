import { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, Smartphone } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import type { VehicleInfo } from "./types";

interface Props {
  uploadUrl: string;
  vehicleInfo: VehicleInfo | null;
  nextStep: string;
}

const SubmissionSuccess = ({ uploadUrl, vehicleInfo, nextStep }: Props) => {
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#10b981", "#0056a0", "#e63946"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#10b981", "#0056a0", "#e63946"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  if (nextStep === "visit") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center py-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        </motion.div>
        <h3 className="text-2xl font-bold text-card-foreground mb-2">You're All Set!</h3>
        {vehicleInfo && (
          <p className="text-base font-semibold text-card-foreground mb-2">
            {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
          </p>
        )}
        <p className="text-muted-foreground">
          We'll contact you shortly to schedule your in-person visit.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center py-4">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="text-5xl mb-3">📸</motion.div>
      <h3 className="text-xl font-bold text-card-foreground mb-1">
        Scan to Upload Photos
      </h3>
      {vehicleInfo && (
        <p className="text-sm font-semibold text-card-foreground mb-1">
          {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
        </p>
      )}
      <p className="text-muted-foreground text-sm mb-5">
        Scan this QR code with your phone to take and upload vehicle photos.
      </p>

      <div className="bg-white p-4 rounded-xl inline-block shadow-lg mb-5">
        <QRCodeSVG value={uploadUrl} size={200} level="H" />
      </div>

      <div className="flex items-center gap-4 bg-muted/50 rounded-xl p-6 text-left">
        <Smartphone className="w-12 h-12 text-accent shrink-0" />
        <div>
          <p className="text-base font-semibold text-card-foreground">Using your phone?</p>
          <a
            href={uploadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base text-accent underline font-medium"
          >
            Tap here to upload photos directly →
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default SubmissionSuccess;
