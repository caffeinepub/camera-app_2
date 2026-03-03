import {
  FlipHorizontal,
  Grid,
  Info,
  Settings2,
  Sparkles,
  Timer,
  Zap,
  ZapOff,
} from "lucide-react";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useCamera } from "../camera/useCamera";
import AnamorphicOverlay from "../components/AnamorphicOverlay";
import CinemaControlsPanel from "../components/CinemaControlsPanel";
import CountdownOverlay from "../components/CountdownOverlay";
import FocalLengthIndicator from "../components/FocalLengthIndicator";
import GridOverlay from "../components/GridOverlay";
import ManualControlsPanel from "../components/ManualControlsPanel";
import ModeSelector from "../components/ModeSelector";
import NoiseReductionToggle from "../components/NoiseReductionToggle";
import XperiaBottomRow from "../components/XperiaBottomRow";
import XperiaParamStrip from "../components/XperiaParamStrip";
import type { ProParam } from "../components/XperiaParamStrip";
import XperiaRulerScrubber from "../components/XperiaRulerScrubber";
import { useAIBlur } from "../hooks/useAIBlur";
import { useAnamorphicOverlay } from "../hooks/useAnamorphicOverlay";
import { useBlurStrength } from "../hooks/useBlurStrength";
import { useCameraMode } from "../hooks/useCameraMode";
import { useCameraSettings } from "../hooks/useCameraSettings";
import { useCineColorProfile } from "../hooks/useCineColorProfile";
import { useCinematicMode } from "../hooks/useCinematicMode";
import { useCountdownTimer } from "../hooks/useCountdownTimer";
import { useManualControls } from "../hooks/useManualControls";
import { useNoiseReduction } from "../hooks/useNoiseReduction";
import { useSavePhoto, useSaveVideo } from "../hooks/useQueries";
import { useTorchControl } from "../hooks/useTorchControl";
import { useVideoResolution } from "../hooks/useVideoResolution";
import { useZoomControl } from "../hooks/useZoomControl";

// ─── Pro param value arrays ───────────────────────────────────────────────────
const ISO_VALUES = [50, 100, 200, 400, 800, 1600, 3200, 6400];
const SHUTTER_VALUES = [
  "1/4000s",
  "1/2000s",
  "1/1000s",
  "1/500s",
  "1/250s",
  "1/125s",
  "1/60s",
  "1/30s",
  "1/15s",
  "1/8s",
  "1/4s",
  "1/2s",
  '1"',
  '2"',
  '4"',
  '8"',
  '15"',
  '30"',
];

export default function CameraPage() {
  const { mode, setMode } = useCameraMode();
  const {
    settings,
    saveFacingMode,
    saveGridMode,
    saveTimerDuration,
    saveTorchMode,
    saveExposure,
    saveWhiteBalance,
  } = useCameraSettings();

  const { multiplier: blurMultiplier } = useBlurStrength();
  const { isActive: isAnamorphic } = useAnamorphicOverlay();
  const {
    cssFilter,
    profile: colorProfile,
    setProfile: setColorProfile,
  } = useCineColorProfile();
  const { resolution } = useVideoResolution();

  const isLowLightMode = mode === "Night" || mode === "Portrait";
  const noiseReduction = useNoiseReduction(isLowLightMode);

  const {
    isActive,
    isSupported,
    error: cameraError,
    isLoading: cameraLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    retry,
    videoRef,
    canvasRef,
    currentFacingMode,
  } = useCamera({
    facingMode: settings.facingMode,
    quality: 0.95,
    format: "image/jpeg",
  });

  const getVideoTrack = useCallback((): MediaStreamTrack | null => {
    if (videoRef.current?.srcObject instanceof MediaStream) {
      return videoRef.current.srcObject.getVideoTracks()[0] ?? null;
    }
    return null;
  }, [videoRef]);

  const { zoom, setZoom, applyZoom, onPinchStart, onPinchMove, onPinchEnd } =
    useZoomControl(1);

  const countdown = useCountdownTimer();

  const { exposure, whiteBalance, setExposure, setWhiteBalance } =
    useManualControls();

  const torchControl = useTorchControl(settings.torchMode);

  const isCinematic = mode === "Cinematic";
  const isVideoMode = mode === "Video";
  const isPortraitMode = mode === "Portrait";
  const isProMode = mode === "Pro";
  const isVideoOrCinematic = isVideoMode || isCinematic;

  // AI Blur compositing (Portrait mode)
  useAIBlur({
    enabled: isPortraitMode && isActive,
    videoRef,
    blurMultiplier,
  });

  // Cinematic mode compositing
  useCinematicMode({
    enabled: isCinematic && isActive,
    videoRef,
    blurMultiplier,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showCinemaControls, setShowCinemaControls] = useState(false);
  const [showManualControls, setShowManualControls] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Xperia Pro UI state
  const [activeParam, setActiveParam] = useState<ProParam>("S");
  const [isAIAutoMode, setIsAIAutoMode] = useState(true);
  const [lastPhotoUrl, setLastPhotoUrl] = useState<string | null>(null);

  // Per-param auto state — all auto by default
  const [isoAuto, setIsoAuto] = useState(true);
  const [shutterAuto, setShutterAuto] = useState(true);
  const [wbAuto, setWbAuto] = useState(true);
  const [afAuto, setAfAuto] = useState(true);
  const [evAuto, setEvAuto] = useState(true);

  // Pro param values (numeric index or raw value for scrubber)
  const [isoIndex, setIsoIndex] = useState(3); // ISO 400
  const [shutterIndex, setShutterIndex] = useState(6); // 1/60s
  const [wbValue, setWbValue] = useState(5200);
  const [afValue, setAfValue] = useState(0.94);
  const [evValue, setEvValue] = useState(0.0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  const savePhotoMutation = useSavePhoto();
  const saveVideoMutation = useSaveVideo();

  // Initialize track capabilities when camera becomes active
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only when isActive changes
  useEffect(() => {
    if (!isActive || !videoRef.current) return;
    const stream = videoRef.current.srcObject as MediaStream | null;
    if (!stream) return;
    const tracks = stream.getVideoTracks();
    const track = tracks[0] ?? null;
    applyZoom(track);
    torchControl.initTorch(track);
    setExposure(settings.exposure, track, videoRef.current);
    if (settings.torchMode !== "off") {
      torchControl.setTorchMode(settings.torchMode, track);
    }
  }, [isActive]);

  // Restart camera when resolution changes in Video mode
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only when resolution changes
  useEffect(() => {
    if (isVideoOrCinematic && isActive) {
      stopCamera().then(() => startCamera());
    }
  }, [resolution.label]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(
          Math.floor((Date.now() - recordingStartTimeRef.current) / 1000),
        );
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const formatRecordingTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const doCapture = useCallback(async () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 450);
    try {
      const file = await capturePhoto();
      if (!file) {
        toast.error("Failed to capture photo");
        return;
      }

      // Apply noise reduction if enabled
      let finalFile = file;
      if (noiseReduction.isEnabled && canvasRef.current) {
        try {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            await new Promise<void>((resolve) => {
              img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                noiseReduction.processCanvas(canvas);
                resolve();
              };
              img.src = objectUrl;
            });
            URL.revokeObjectURL(objectUrl);
            const blob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob(resolve, "image/jpeg", 0.95),
            );
            if (blob) {
              finalFile = new File([blob], file.name, { type: "image/jpeg" });
            }
          }
        } catch {
          // fallback to original file
        }
      }

      // Update thumbnail
      const thumbUrl = URL.createObjectURL(finalFile);
      setLastPhotoUrl(thumbUrl);

      const arrayBuffer = await finalFile.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
      const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const timestamp = BigInt(Date.now());
      await savePhotoMutation.mutateAsync({ id, timestamp, imageData });
      toast.success("Photo saved!", {
        description: "View it in your gallery",
        duration: 2000,
      });
    } catch {
      toast.error("Failed to save photo");
    }
  }, [capturePhoto, noiseReduction, canvasRef, savePhotoMutation]);

  const handleCapture = useCallback(() => {
    if (!isActive) return;
    if (countdown.isActive) {
      countdown.cancel();
      return;
    }
    if (settings.timerDuration > 0) {
      countdown.start(settings.timerDuration, doCapture);
    } else {
      doCapture();
    }
  }, [isActive, countdown, settings.timerDuration, doCapture]);

  const startRecording = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (!stream) {
      toast.error("Camera not ready");
      return;
    }
    recordedChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";
    try {
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.start(100);
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch {
      toast.error("Recording not supported on this device");
    }
  }, [videoRef]);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    const durationSeconds = Math.floor(
      (Date.now() - recordingStartTimeRef.current) / 1000,
    );
    mr.onstop = async () => {
      const mimeType = mr.mimeType || "video/webm";
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        const id = `video_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const timestamp = BigInt(Date.now());
        try {
          await saveVideoMutation.mutateAsync({
            id,
            timestamp,
            durationSeconds: BigInt(durationSeconds),
            dataUrl,
          });
          toast.success("Video saved!", {
            description: "View it in your gallery",
            duration: 2000,
          });
        } catch {
          toast.error("Failed to save video");
        }
      };
      reader.readAsDataURL(blob);
    };
    mr.stop();
    setIsRecording(false);
    setRecordingSeconds(0);
    mediaRecorderRef.current = null;
  }, [saveVideoMutation]);

  const handleRecordToggle = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const handleSwitchCamera = useCallback(async () => {
    const next = currentFacingMode === "user" ? "environment" : "user";
    const success = await switchCamera(next);
    if (success) {
      saveFacingMode(next);
      torchControl.setTorchMode("off", null);
    }
  }, [currentFacingMode, switchCamera, saveFacingMode, torchControl]);

  const handleGridCycle = useCallback(() => {
    const modes = ["off", "rule-of-thirds", "square"] as const;
    const idx = modes.indexOf(settings.gridMode as (typeof modes)[number]);
    const next = modes[(idx + 1) % modes.length];
    saveGridMode(next);
  }, [settings.gridMode, saveGridMode]);

  const handleTimerCycle = useCallback(() => {
    const timers = [0, 3, 10] as const;
    const idx = timers.indexOf(
      settings.timerDuration as (typeof timers)[number],
    );
    const next = timers[(idx + 1) % timers.length];
    saveTimerDuration(next);
  }, [settings.timerDuration, saveTimerDuration]);

  const handleTorchCycle = useCallback(() => {
    const track = getVideoTrack();
    const next = torchControl.torchMode === "off" ? "on" : "off";
    torchControl.setTorchMode(next, track);
    saveTorchMode(next);
  }, [torchControl, getVideoTrack, saveTorchMode]);

  const handleExposureChange = useCallback(
    (ev: number) => {
      setExposure(ev, getVideoTrack(), videoRef.current ?? null);
      saveExposure(ev);
    },
    [setExposure, getVideoTrack, videoRef, saveExposure],
  );

  const handleWhiteBalanceChange = useCallback(
    (kelvin: number) => {
      setWhiteBalance(kelvin, getVideoTrack());
      saveWhiteBalance(kelvin);
    },
    [setWhiteBalance, getVideoTrack, saveWhiteBalance],
  );

  // Handle per-param auto toggle
  const handleParamAutoChange = useCallback(
    (param: ProParam, auto: boolean) => {
      switch (param) {
        case "ISO":
          setIsoAuto(auto);
          break;
        case "S":
          setShutterAuto(auto);
          break;
        case "WB":
          setWbAuto(auto);
          if (auto) handleWhiteBalanceChange(5200); // reset to neutral auto
          break;
        case "AF":
          setAfAuto(auto);
          break;
        case "EV":
          setEvAuto(auto);
          if (auto) handleExposureChange(0); // reset EV to 0 when auto
          break;
      }
    },
    [handleWhiteBalanceChange, handleExposureChange],
  );

  // Handle scrubber changes per param
  const handleParamChange = useCallback(
    (value: number) => {
      switch (activeParam) {
        case "ISO":
          setIsoIndex(Math.round(value));
          break;
        case "S":
          setShutterIndex(Math.round(value));
          break;
        case "WB":
          setWbValue(value);
          handleWhiteBalanceChange(value);
          break;
        case "AF":
          setAfValue(value);
          break;
        case "EV": {
          const rounded = Math.round(value * 10) / 10;
          setEvValue(rounded);
          handleExposureChange(rounded);
          break;
        }
      }
    },
    [activeParam, handleWhiteBalanceChange, handleExposureChange],
  );

  // Get current scrubber numeric value for selected param
  const getScrubberValue = (): number => {
    switch (activeParam) {
      case "ISO":
        return isoIndex;
      case "S":
        return shutterIndex;
      case "WB":
        return wbValue;
      case "AF":
        return afValue;
      case "EV":
        return evValue;
    }
  };

  // Get display value for scrubber
  const getScrubberDisplayValue = (): string => {
    switch (activeParam) {
      case "ISO":
        return String(ISO_VALUES[isoIndex] ?? 400);
      case "S":
        return SHUTTER_VALUES[shutterIndex] ?? "1/60s";
      case "WB":
        return `${wbValue}K`;
      case "AF":
        return afValue.toFixed(2);
      case "EV": {
        const sign = evValue >= 0 ? "+" : "";
        return `${sign}${evValue.toFixed(1)}`;
      }
    }
  };

  // Compute video CSS filter combining exposure and color profile
  const videoFilter =
    [
      exposure !== 0 ? `brightness(${1 + exposure * 0.25})` : "",
      isVideoOrCinematic ? cssFilter : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const isRearCamera = currentFacingMode === "environment";
  const showTorchButton = isRearCamera && torchControl.isSupported;

  // Zoom cycle handler
  const handleZoomCycle = useCallback(() => {
    const zoomLevels = [1, 2, 5];
    const current = zoom;
    const next = zoomLevels.find((z) => z > current) ?? zoomLevels[0];
    setZoom(next);
    const track = getVideoTrack();
    if (track) applyZoom(track);
  }, [zoom, setZoom, getVideoTrack, applyZoom]);

  // Not supported
  if (isSupported === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center bg-black">
        <h2 className="text-xl font-semibold text-white">
          Camera Not Supported
        </h2>
        <p className="text-white/50 text-sm max-w-xs">
          Your browser doesn't support camera access. Try Chrome or Safari on a
          modern device.
        </p>
      </div>
    );
  }

  // Error state
  if (cameraError && !cameraLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center bg-black">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Camera Error
          </h2>
          <p className="text-white/50 text-sm max-w-xs">
            {cameraError.type === "permission"
              ? "Camera permission was denied. Please allow camera access in your browser settings."
              : cameraError.message}
          </p>
        </div>
        <button
          type="button"
          onClick={retry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-black font-semibold text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Idle / not started
  if (!isActive && !cameraLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center bg-black">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Ready to Shoot
          </h2>
          <p className="text-white/50 text-sm max-w-xs">
            Tap the button below to start your camera.
          </p>
        </div>
        <button
          type="button"
          onClick={startCamera}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 text-black font-semibold"
        >
          Start Camera
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      {/* ── Full screen video ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        onTouchStart={onPinchStart}
        onTouchMove={onPinchMove}
        onTouchEnd={onPinchEnd}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          style={{
            transform: currentFacingMode === "user" ? "scaleX(-1)" : "none",
            filter: videoFilter,
          }}
        />

        {/* Grid overlay */}
        <GridOverlay mode={settings.gridMode} />

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Anamorphic overlay */}
        <AnamorphicOverlay isActive={isAnamorphic && isVideoOrCinematic} />

        {/* Focal length indicator */}
        {isVideoOrCinematic && <FocalLengthIndicator zoom={zoom} />}

        {/* Flash overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-flash" />
        )}

        {/* Countdown overlay */}
        {countdown.isActive && (
          <CountdownOverlay
            remainingSeconds={countdown.remainingSeconds}
            onCancel={countdown.cancel}
          />
        )}
      </div>

      {/* ── Top floating controls ─────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4 pb-2">
        {/* Left: Flash/Torch */}
        {showTorchButton ? (
          <button
            type="button"
            data-ocid="camera.torch.toggle"
            onClick={handleTorchCycle}
            className="p-2 transition-all active:scale-90"
            aria-label="Toggle torch"
          >
            {torchControl.torchMode === "on" ? (
              <Zap className="w-6 h-6" style={{ color: "#f59e0b" }} />
            ) : (
              <ZapOff className="w-6 h-6 text-white" />
            )}
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}

        {/* Center: Timer */}
        <button
          type="button"
          data-ocid="camera.timer.toggle"
          onClick={handleTimerCycle}
          className="relative p-2 transition-all active:scale-90"
          aria-label="Cycle timer"
        >
          <Timer
            className="w-6 h-6"
            style={{
              color:
                settings.timerDuration > 0
                  ? "#f59e0b"
                  : "rgba(255,255,255,0.85)",
            }}
          />
          {settings.timerDuration > 0 && (
            <span
              className="absolute top-1 right-1 text-[8px] font-bold"
              style={{ color: "#f59e0b" }}
            >
              {settings.timerDuration}
            </span>
          )}
        </button>

        {/* Right: Settings / Controls */}
        <button
          type="button"
          data-ocid="camera.settings.open_modal_button"
          onClick={() => setShowSettings((v) => !v)}
          className="p-2 transition-all active:scale-90"
          aria-label="Settings"
        >
          <Settings2
            className="w-6 h-6"
            style={{
              color: showSettings ? "#f59e0b" : "rgba(255,255,255,0.85)",
            }}
          />
        </button>
      </div>

      {/* ── Top-right extras ─────────────────────────────────────────── */}
      {/* Green status dot */}
      <div
        className="absolute top-5 right-3 z-20 w-2 h-2 rounded-full"
        style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
      />

      {/* (i) info button — overlaid on viewfinder top right */}
      <button
        type="button"
        data-ocid="camera.info.button"
        className="absolute top-14 right-4 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90"
        style={{ border: "1.5px solid rgba(255,255,255,0.7)" }}
        aria-label="Info"
      >
        <Info className="w-3.5 h-3.5 text-white" />
      </button>

      {/* ── Badges (AI, recording, etc.) ─────────────────────────────── */}
      {isRecording && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm z-20">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-xs font-mono">
            {formatRecordingTime(recordingSeconds)}
          </span>
        </div>
      )}

      {noiseReduction.isEnabled && isActive && (
        <div
          className="absolute z-20 flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{
            top: isRecording ? 56 : 56,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(20,15,5,0.80)",
            border: "1px solid rgba(245,158,11,0.5)",
          }}
        >
          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
          <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">
            AI Denoise · {noiseReduction.strength}
          </span>
        </div>
      )}

      {isCinematic && isActive && (
        <div
          className="absolute top-[88px] left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{
            background: "rgba(10,20,50,0.80)",
            border: "1px solid rgba(96,165,250,0.5)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-300 text-xs font-bold tracking-widest uppercase">
            AI Cinematic
          </span>
        </div>
      )}

      {isPortraitMode && isActive && (
        <div
          className="absolute top-[88px] left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{
            background: "rgba(10,20,50,0.80)",
            border: "1px solid rgba(96,165,250,0.5)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-300 text-xs font-bold tracking-widest uppercase">
            AI Blur
          </span>
        </div>
      )}

      {/* ── Zoom pill + lens dots ─────────────────────────────────────── */}
      <div
        className="absolute z-20 flex items-center gap-2"
        style={{ bottom: 220, left: "50%", transform: "translateX(-50%)" }}
      >
        <button
          type="button"
          data-ocid="camera.zoom.toggle"
          onClick={handleZoomCycle}
          className="px-3 py-1 rounded-full font-bold text-white text-sm transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.18)" }}
          aria-label={`Zoom ${Math.round(zoom)}X`}
        >
          {zoom >= 10
            ? `${zoom}X`
            : `${Number.isInteger(zoom) ? zoom : zoom.toFixed(1)}X`}
        </button>
        <span className="text-white/50 text-base tracking-widest">• •</span>
      </div>

      {/* ── Settings panel (overlaid) ─────────────────────────────────── */}
      {showSettings && (
        <div
          className="absolute left-0 right-0 z-20 p-4 flex flex-col gap-3"
          style={{
            bottom: 220,
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Grid toggle */}
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">
              Grid
            </span>
            <button
              type="button"
              data-ocid="camera.grid.toggle"
              onClick={handleGridCycle}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                settings.gridMode !== "off"
                  ? "border-amber-500 text-amber-400 bg-amber-500/10"
                  : "border-white/20 text-white/60"
              }`}
            >
              {settings.gridMode === "off"
                ? "Off"
                : settings.gridMode === "rule-of-thirds"
                  ? "⅓ Grid"
                  : "Square"}
            </button>
          </div>

          {/* Flip camera */}
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">
              Camera
            </span>
            <button
              type="button"
              data-ocid="camera.flip.button"
              onClick={handleSwitchCamera}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-white/20 text-white/60 transition-all"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              {currentFacingMode === "user" ? "Front" : "Rear"}
            </button>
          </div>

          {/* AI Denoise */}
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">
              AI Denoise
            </span>
            <button
              type="button"
              data-ocid="camera.denoise.toggle"
              onClick={noiseReduction.toggle}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                noiseReduction.isEnabled
                  ? "border-amber-500 text-amber-400 bg-amber-500/10"
                  : "border-white/20 text-white/60"
              }`}
            >
              {noiseReduction.isEnabled
                ? `ON · ${noiseReduction.strength}`
                : "Off"}
            </button>
          </div>

          {/* Manual controls (Pro/Portrait) */}
          {(isProMode || isPortraitMode) && (
            <button
              type="button"
              data-ocid="camera.manual.toggle"
              onClick={() => setShowManualControls((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-all self-start ${
                showManualControls
                  ? "border-amber-500 text-amber-400 bg-amber-500/10"
                  : "border-white/20 text-white/60"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Manual Controls
            </button>
          )}

          {/* Cinema controls */}
          {isCinematic && (
            <button
              type="button"
              data-ocid="camera.cinema.toggle"
              onClick={() => setShowCinemaControls((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-all self-start ${
                showCinemaControls
                  ? "border-blue-400 text-blue-400 bg-blue-500/10"
                  : "border-white/20 text-white/60"
              }`}
            >
              Cinema Controls
            </button>
          )}
        </div>
      )}

      {/* ── Manual Controls Panel ─────────────────────────────────────── */}
      {showManualControls && (isProMode || isPortraitMode) && (
        <div className="absolute left-0 right-0 z-20" style={{ bottom: 220 }}>
          <ManualControlsPanel
            exposure={exposure}
            whiteBalance={whiteBalance}
            exposureSupported={true}
            whiteBalanceSupported={true}
            onExposureChange={handleExposureChange}
            onWhiteBalanceChange={handleWhiteBalanceChange}
          />
        </div>
      )}

      {/* ── Cinema Controls Panel ─────────────────────────────────────── */}
      {showCinemaControls && isCinematic && (
        <div className="absolute left-0 right-0 z-20" style={{ bottom: 220 }}>
          <CinemaControlsPanel
            exposure={exposure}
            onExposureChange={handleExposureChange}
            colorProfile={colorProfile}
            onColorProfileChange={setColorProfile}
          />
        </div>
      )}

      {/* ── Noise reduction toggle (low light) ────────────────────────── */}
      {isLowLightMode && isActive && (
        <div
          className="absolute left-0 right-0 z-20 px-4"
          style={{ bottom: 225 }}
        >
          <NoiseReductionToggle
            strength={noiseReduction.strength}
            onStrengthChange={noiseReduction.setStrength}
          />
        </div>
      )}

      {/* ── Bottom overlay area ───────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col bg-black">
        {/* Mode Selector */}
        <div className="pt-1.5 pb-0.5">
          <ModeSelector mode={mode} onModeChange={setMode} />
        </div>

        {/* Pro Parameter Strip — always visible */}
        <XperiaParamStrip
          activeParam={activeParam}
          onParamSelect={setActiveParam}
          isoValue={ISO_VALUES[isoIndex] ?? 400}
          isoAuto={isoAuto}
          shutterValue={SHUTTER_VALUES[shutterIndex] ?? "1/60s"}
          shutterAuto={shutterAuto}
          wbValue={wbValue}
          wbAuto={wbAuto}
          afValue={afValue}
          afAuto={afAuto}
          evValue={evValue}
          evAuto={evAuto}
          onParamAutoChange={handleParamAutoChange}
        />

        {/* Ruler Scrubber */}
        <XperiaRulerScrubber
          param={activeParam}
          value={getScrubberValue()}
          onChange={handleParamChange}
          displayValue={getScrubberDisplayValue()}
        />

        {/* Bottom action row */}
        <XperiaBottomRow
          isVideoMode={isVideoOrCinematic}
          isRecording={isRecording}
          onCapture={handleCapture}
          onRecordToggle={handleRecordToggle}
          onSwitchCamera={handleSwitchCamera}
          lastPhotoUrl={lastPhotoUrl}
          onOpenGallery={() => {
            // Navigation to gallery handled by parent BottomNavigation
          }}
          isAIAutoMode={isAIAutoMode}
          onToggleAIAuto={() => setIsAIAutoMode((v) => !v)}
          disabled={!isActive || cameraLoading}
        />
      </div>
    </div>
  );
}
