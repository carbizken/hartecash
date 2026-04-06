import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { Facebook, Instagram, Youtube, MapPin, ExternalLink } from "lucide-react";

interface DealerLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string | null;
  show_in_footer: boolean;
}

const SiteFooter = () => {
  const { config } = useSiteConfig();
  const dealerName = config.dealership_name || "Our Dealership";
  const [locations, setLocations] = useState<DealerLocation[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from("dealership_locations" as any)
        .select("id, name, city, state, address, show_in_footer")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setLocations(data as unknown as DealerLocation[]);
    };
    fetchLocations();
  }, []);

  const footerLocations = locations.filter(l => l.show_in_footer);

  return (
    <footer className="bg-card border-t border-border py-12 lg:py-16 px-5 text-card-foreground relative overflow-hidden">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-3 lg:gap-12 text-center lg:text-left">
        <div>
          <h3 className="text-xl font-bold mb-4 tracking-wide">{dealerName.toUpperCase()}</h3>
          {config.address && (
            <p className="text-sm text-muted-foreground mb-2 flex items-start gap-1.5 justify-center lg:justify-start">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/50" />
              {config.address}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            © {new Date().getFullYear()} {dealerName}. All rights reserved.
          </p>
          
          {/* Social icons inline with brand */}
          {(config.facebook_url || config.instagram_url || config.youtube_url || config.tiktok_url) && (
            <div className="flex gap-2 mt-4 lg:justify-start justify-center">
              {config.facebook_url && (
                <a href={config.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all duration-200">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {config.instagram_url && (
                <a href={config.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all duration-200">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {config.youtube_url && (
                <a href={config.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-9 h-9 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all duration-200">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {config.tiktok_url && (
                <a href={config.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-9 h-9 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all duration-200 text-xs font-bold">
                  TT
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 lg:mt-0">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">Contact</h4>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            {config.phone && <p className="font-medium text-card-foreground">{config.phone}</p>}
            {config.email && <p>{config.email}</p>}
            {config.website_url && (
              <a href={config.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                {config.website_url.replace(/^https?:\/\//, "")}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {footerLocations.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border/50">
              <h5 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Our Locations</h5>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                {footerLocations.map((loc) => (
                  <div key={loc.id}>
                    {loc.address ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.name} ${loc.address} ${loc.city} ${loc.state}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block hover:text-primary transition-colors"
                      >
                        <p className="font-medium text-card-foreground group-hover:text-primary">{loc.name} — {loc.city}, {loc.state}</p>
                        <p className="text-xs text-muted-foreground/70 group-hover:text-primary/70">{loc.address} ↗</p>
                      </a>
                    ) : (
                      <p className="font-medium text-card-foreground">{loc.name} — {loc.city}, {loc.state}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 lg:mt-0">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">Quick Links</h4>
          <div className="flex flex-col gap-1.5">
            {[
              { to: "/my-submission", label: "View My Offer" },
              { to: "/schedule", label: "Schedule a Visit" },
              { to: "/privacy", label: "Privacy Policy" },
              { to: "/terms", label: "Terms of Service" },
              { to: "/disclosure", label: "Offer Disclosure" },
              { to: "/referral", label: "Referral Program 💰" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground hover:text-primary py-0.5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link to="/admin/login" className="text-[10px] text-muted-foreground/20 hover:text-muted-foreground/50 transition-opacity mt-4" aria-label="Staff portal">•</Link>
            <Link to="/sitemap" className="text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-opacity">.</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
