import { Camera, Images } from "lucide-react";
import type { TabType } from "../App";

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; Icon: React.ElementType }[] = [
  { id: "camera", label: "Camera", Icon: Camera },
  { id: "gallery", label: "Gallery", Icon: Images },
];

export default function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  return (
    <nav className="glass border-t border-border shrink-0">
      <div className="flex items-stretch">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4
                transition-all duration-200 relative outline-none
                ${isActive ? "text-amber" : "text-muted-foreground hover:text-foreground"}
              `}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-amber"
                  style={{ boxShadow: "0 0 8px oklch(0.78 0.16 75 / 0.9)" }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2 : 1.6}
                className={`transition-transform duration-200 ${isActive ? "scale-110" : "scale-100"}`}
              />
              <span
                className={`text-xs tracking-wide ${isActive ? "font-semibold" : "font-normal"}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
