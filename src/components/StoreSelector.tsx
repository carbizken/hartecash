import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface LocationCard {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string | null;
  oem_logo_urls: string[];
  corporate_logo_url: string | null;
}

/**
 * For multi-location corporate dealerships, shows a store picker gate
 * on the landing page. Once a store is selected, appends ?store=ID
 * which locks the lead to that store throughout the entire flow.
 *
 * If ?store is already present (e.g. from an embed), this renders nothing.
 * If the dealership has only 1 location, this renders nothing.
 */
const StoreSelector = ({ children }: { children: React.ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tenant } = useTenant();
  const { config } = useSiteConfig();
  const [locations, setLocations] = useState<LocationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string | null>(
    searchParams.get("store")
  );

  const dealershipId = tenant.dealership_id;

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from("dealership_locations" as any)
        .select("id, name, city, state, address, oem_logo_urls, corporate_logo_url, show_in_inspection")
        .eq("dealership_id", dealershipId)
        .eq("is_active", true)
        .eq("temporarily_offline", false)
        .order("sort_order");

      // Only show locations that accept inspections
      const locs = ((data as any[]) || []).filter((l: any) => l.show_in_inspection !== false) as LocationCard[];
      setLocations(locs);
      setLoading(false);
    };
    fetchLocations();
  }, [dealershipId]);

  // If store already selected or only 1 location, pass through
  if (loading) return <>{children}</>;
  if (selectedStore || locations.length <= 1) return <>{children}</>;

  const handleSelect = (locationId: string) => {
    setSelectedStore(locationId);
    setSearchParams((prev) => {
      prev.set("store", locationId);
      return prev;
    });
  };

  const dealerName = config.dealership_name || "Our Dealership";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-3xl mx-auto"
      >
        {/* Corporate logo if available */}
        {config.logo_url && (
          <img
            src={config.logo_url}
            alt={dealerName}
            className="h-16 md:h-20 w-auto mx-auto mb-6 object-contain"
          />
        )}

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Choose Your Store
        </h2>
        <p className="text-muted-foreground mb-8 text-sm md:text-base">
          Select the {dealerName} location you'd like to work with
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {locations.map((loc) => (
            <motion.button
              key={loc.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(loc.id)}
              className="group relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all duration-200 text-center"
            >
              {/* OEM logos row */}
              {loc.oem_logo_urls && loc.oem_logo_urls.length > 0 ? (
                <div className="flex items-center justify-center gap-2 h-12">
                  {loc.oem_logo_urls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Brand ${i + 1}`}
                      className="h-10 w-auto object-contain"
                    />
                  ))}
                </div>
              ) : (
                <div className="h-12 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-primary/60" />
                </div>
              )}

              <div>
                <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                  {loc.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {loc.address ? loc.address : `${loc.city}, ${loc.state}`}
                </p>
              </div>

              <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Select this store →
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default StoreSelector;
