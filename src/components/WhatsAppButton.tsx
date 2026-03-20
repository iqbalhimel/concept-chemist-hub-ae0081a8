import { MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const WhatsAppButton = () => {
  const { t } = useLanguage();
  const { get } = useSiteSettings();

  const enabled = get("whatsapp", "enabled", "true");
  const number = get("whatsapp", "number", "+8801733579100").replace(/[^0-9]/g, "");

  if (enabled === "false") return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={`https://wa.me/${number}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.whatsapp.tooltip}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200"
          >
            {/* 🔥 animation removed */}
            <MessageCircle size={28} fill="white" strokeWidth={0} className="relative z-10" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="left" className="font-medium">
          {t.whatsapp.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default WhatsAppButton;