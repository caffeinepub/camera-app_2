import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import BottomNavigation from "./components/BottomNavigation";
import CameraPage from "./pages/CameraPage";
import GalleryPage from "./pages/GalleryPage";

export type TabType = "camera" | "gallery";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("camera");

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      <main className="flex-1 overflow-hidden relative min-h-0">
        {/* Keep both pages mounted to preserve gallery state */}
        <div
          className={`h-full ${activeTab === "camera" ? "block" : "hidden"}`}
        >
          <CameraPage />
        </div>
        <div
          className={`h-full ${activeTab === "gallery" ? "block" : "hidden"}`}
        >
          <GalleryPage />
        </div>
      </main>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.18 0.006 260)",
            border: "1px solid oklch(0.28 0.008 260)",
            color: "oklch(0.95 0.01 90)",
          },
        }}
      />
    </div>
  );
}
