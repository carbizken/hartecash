import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";

const DealerContactCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.3 }}
    className="bg-card rounded-xl p-5 shadow-lg"
  >
    <h3 className="font-bold text-card-foreground mb-3">Need Help?</h3>
    <div className="space-y-2.5 text-sm">
      <p className="text-sm font-semibold text-card-foreground mb-1">Harte Infiniti</p>
      <a href="tel:+18668517390" className="flex items-center gap-2.5 text-muted-foreground hover:text-accent transition-colors">
        <Phone className="w-4 h-4 text-primary flex-shrink-0" />
        <span>(866) 851-7390</span>
      </a>
      <a href="mailto:kenc@hartecars.com" className="flex items-center gap-2.5 text-muted-foreground hover:text-accent transition-colors">
        <Mail className="w-4 h-4 text-primary flex-shrink-0" />
        <span>kenc@hartecars.com</span>
      </a>
      <a
        href="https://maps.google.com/?q=150+Weston+Street,+Hartford,+CT+06120"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-2.5 text-muted-foreground hover:text-accent transition-colors"
      >
        <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <span>150 Weston Street, Hartford, CT 06120</span>
      </a>
      <div className="flex items-start gap-2.5 text-muted-foreground">
        <Clock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p>Mon–Thu: 9 AM – 7 PM</p>
          <p>Fri–Sat: 9 AM – 6 PM</p>
          <p>Sun: Closed</p>
        </div>
      </div>
    </div>
  </motion.div>
);

export default DealerContactCard;
