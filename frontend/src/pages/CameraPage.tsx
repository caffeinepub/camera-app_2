import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useCamera } from '../camera/useCamera';
import { useCameraMode } from '../hooks/useCameraMode';
import { useCameraSettings } from '../hooks/useCameraSettings';
import { useZoomControl } from '../hooks/useZoomControl';
import { useCountdownTimer } from '../hooks/useCountdownTimer';
import { useManualControls } from '../hooks/useManualControls';
import { useTorchControl } from '../hooks/useTorchControl';
import { useVideoResolution } from '../hooks/useVideoResolution';
import { useBlurStrength } from '../hooks/useBlurStrength';
import { useAIBlur } from '../hooks/useAIBlur';
import { useCinematicMode } from '../hooks/useCinematicMode';
import { useAnamorphicOverlay } from '../hooks/useAnamorphicOverlay';
import { useCineColorProfile } from '../hooks/useCineColorProfile';
import { useNoiseReduction } from '../hooks/useNoiseReduction';
import { useSavePhoto, useSaveVideo } from '../hooks/useQueries';
import { toast } from 'sonner';
import {
  Camera,
  Video,
  FlipHorizontal,
  Grid,
  Timer,
  Zap,
  ZapOff,
  Settings2,
  Sparkles,
} from 'lucide-react';
import ModeSelector from '../components/ModeSelector';
import GridOverlay from '../components/GridOverlay';
import CountdownOverlay from '../components/CountdownOverlay';
import ZoomSlider from '../components/ZoomSlider';
import ManualControlsPanel from '../components/ManualControlsPanel';
import VideoResolutionSelector from '../components/VideoResolutionSelector';
import ProModeControls from '../components/ProModeControls';
import AnamorphicOverlay from '../components/AnamorphicOverlay';
import FocalLengthIndicator from '../components/FocalLengthIndicator';
import BlurStrengthToggle from '../components/BlurStrengthToggle';
import CinemaControlsPanel from '../components/CinemaControlsPanel';
import NoiseReductionToggle from '../components/NoiseReductionToggle';

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

  const { level: blurLevel, multiplier: blurMultiplier, setLevel: setBlurLevel } = useBlurStrength();
  const { isActive: isAnamorphic } = useAnamorphicOverlay();
  const { cssFilter, profile: colorProfile, setProfile: setColorProfile } = useCineColorProfile();
  const { resolution, setResolution } = useVideoResolution();

  const isLowLightMode = mode === 'Night' || mode === 'Portrait';
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
    format: 'image/jpeg',
  });

  const getVideoTrack = useCallback((): MediaStreamTrack | null => {
    if (videoRef.current?.srcObject instanceof MediaStream) {
      return videoRef.current.srcObject.getVideoTracks()[0] ?? null;
    }
    return null;
  }, [videoRef]);

  const { zoom, setZoom, maxZoom, applyZoom, onPinchStart, onPinchMove, onPinchEnd } = useZoomControl(1);

  // useCountdownTimer returns: { isActive, remainingSeconds, start, cancel }
  const countdown = useCountdownTimer();

  const { exposure, whiteBalance, setExposure, setWhiteBalance } = useManualControls();

  const torchControl = useTorchControl(settings.torchMode);

  const isCinematic = mode === 'Cinematic';
  const isVideoMode = mode === 'Video';
  const isPortraitMode = mode === 'Portrait';
  const isProMode = mode === 'Pro';
  const isVideoOrCinematic = isVideoMode || isCinematic;
  const showBlurStrength = isPortraitMode || isCinematic;

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
  const [showManualControls, setShowManualControls] = useState(false);
  const [showCinemaControls, setShowCinemaControls] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  const savePhotoMutation = useSavePhoto();
  const saveVideoMutation = useSaveVideo();

  // Initialize track capabilities when camera becomes active
  useEffect(() => {
    if (!isActive || !videoRef.current) return;
    const stream = videoRef.current.srcObject as MediaStream | null;
    if (!stream) return;
    const tracks = stream.getVideoTracks();
    const track = tracks[0] ?? null;
    applyZoom(track);
    torchControl.initTorch(track);
    setExposure(settings.exposure, track, videoRef.current);
    if (settings.torchMode !== 'off') {
      torchControl.setTorchMode(settings.torchMode, track);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Restart camera when resolution changes in Video mode
  useEffect(() => {
    if (isVideoOrCinematic && isActive) {
      stopCamera().then(() => startCamera());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolution.label]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
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
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const doCapture = useCallback(async () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 450);
    try {
      const file = await capturePhoto();
      if (!file) {
        toast.error('Failed to capture photo');
        return;
      }

      // Apply noise reduction if enabled (Night / Portrait modes)
      let finalFile = file;
      if (noiseReduction.isEnabled && canvasRef.current) {
        try {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
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
              canvas.toBlob(resolve, 'image/jpeg', 0.95)
            );
            if (blob) {
              finalFile = new File([blob], file.name, { type: 'image/jpeg' });
            }
          }
        } catch {
          // fallback to original file
        }
      }

      const arrayBuffer = await finalFile.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
      const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const timestamp = BigInt(Date.now());
      await savePhotoMutation.mutateAsync({ id, timestamp, imageData });
      toast.success('Photo saved!', { description: 'View it in your gallery', duration: 2000 });
    } catch {
      toast.error('Failed to save photo');
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
      toast.error('Camera not ready');
      return;
    }
    recordedChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4';
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
      toast.error('Recording not supported on this device');
    }
  }, [videoRef]);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    const durationSeconds = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
    mr.onstop = async () => {
      const mimeType = mr.mimeType || 'video/webm';
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
          toast.success('Video saved!', { description: 'View it in your gallery', duration: 2000 });
        } catch {
          toast.error('Failed to save video');
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
    const next = currentFacingMode === 'user' ? 'environment' : 'user';
    const success = await switchCamera(next);
    if (success) {
      saveFacingMode(next);
      torchControl.setTorchMode('off', null);
    }
  }, [currentFacingMode, switchCamera, saveFacingMode, torchControl]);

  const handleGridCycle = useCallback(() => {
    const modes = ['off', 'rule-of-thirds', 'square'] as const;
    const idx = modes.indexOf(settings.gridMode as typeof modes[number]);
    const next = modes[(idx + 1) % modes.length];
    saveGridMode(next);
  }, [settings.gridMode, saveGridMode]);

  const handleTimerCycle = useCallback(() => {
    const timers = [0, 3, 10] as const;
    const idx = timers.indexOf(settings.timerDuration as typeof timers[number]);
    const next = timers[(idx + 1) % timers.length];
    saveTimerDuration(next);
  }, [settings.timerDuration, saveTimerDuration]);

  const handleTorchCycle = useCallback(() => {
    const track = getVideoTrack();
    const next = torchControl.torchMode === 'off' ? 'on' : 'off';
    torchControl.setTorchMode(next, track);
    saveTorchMode(next);
  }, [torchControl, getVideoTrack, saveTorchMode]);

  const handleExposureChange = useCallback(
    (ev: number) => {
      setExposure(ev, getVideoTrack(), videoRef.current ?? null);
      saveExposure(ev);
    },
    [setExposure, getVideoTrack, videoRef, saveExposure]
  );

  const handleWhiteBalanceChange = useCallback(
    (kelvin: number) => {
      setWhiteBalance(kelvin, getVideoTrack());
      saveWhiteBalance(kelvin);
    },
    [setWhiteBalance, getVideoTrack, saveWhiteBalance]
  );

  // Compute video CSS filter combining exposure and color profile
  const videoFilter = [
    exposure !== 0 ? `brightness(${1 + exposure * 0.25})` : '',
    isVideoOrCinematic ? cssFilter : '',
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  // Not supported
  if (isSupported === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <h2 className="font-display text-xl font-semibold">Camera Not Supported</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Your browser doesn't support camera access. Try Chrome or Safari on a modern device.
        </p>
      </div>
    );
  }

  // Error state
  if (cameraError && !cameraLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
        <div>
          <h2 className="font-display text-xl font-semibold mb-2">Camera Error</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            {cameraError.type === 'permission'
              ? 'Camera permission was denied. Please allow camera access in your browser settings and try again.'
              : cameraError.message}
          </p>
        </div>
        <button
          onClick={retry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber text-background font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Idle / not started
  if (!isActive && !cameraLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
        <div>
          <h2 className="font-display text-xl font-semibold mb-2">Ready to Shoot</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Tap the button below to start your camera and begin capturing moments.
          </p>
        </div>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-amber text-background font-semibold transition-all hover:opacity-90 active:scale-95"
        >
          Start Camera
        </button>
      </div>
    );
  }

  const isRearCamera = currentFacingMode === 'environment';
  const showTorchButton = isRearCamera && torchControl.isSupported;

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      {/* Live video preview */}
      <div
        className="relative flex-1 overflow-hidden"
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
            transform: currentFacingMode === 'user' ? 'scaleX(-1)' : 'none',
            filter: videoFilter,
          }}
        />

        {/* Grid overlay */}
        <GridOverlay mode={settings.gridMode} />

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Anamorphic overlay */}
        <AnamorphicOverlay isActive={isAnamorphic && isVideoOrCinematic} />

        {/* Focal length indicator */}
        {isVideoOrCinematic && <FocalLengthIndicator zoom={zoom} />}

        {/* AI Denoise active badge */}
        {noiseReduction.isEnabled && isActive && (
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              background: 'rgba(20,15,5,0.80)',
              border: '1px solid rgba(245,158,11,0.5)',
              boxShadow: '0 0 16px rgba(245,158,11,0.4)',
            }}
          >
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">
              AI Denoise · {noiseReduction.strength}
            </span>
          </div>
        )}

        {/* Cinematic badge */}
        {isCinematic && isActive && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              background: 'rgba(10,20,50,0.80)',
              border: '1px solid rgba(96,165,250,0.5)',
              boxShadow: '0 0 16px rgba(59,130,246,0.5)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-300 text-xs font-bold tracking-widest uppercase">AI Cinematic</span>
          </div>
        )}

        {/* AI Blur badge */}
        {isPortraitMode && isActive && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              background: 'rgba(10,20,50,0.80)',
              border: '1px solid rgba(96,165,250,0.5)',
              boxShadow: '0 0 16px rgba(59,130,246,0.5)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-300 text-xs font-bold tracking-widest uppercase">AI Blur</span>
          </div>
        )}

        {/* Flash overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-20 pointer-events-none animate-flash" />
        )}

        {/* Countdown overlay */}
        {countdown.isActive && (
          <CountdownOverlay
            remainingSeconds={countdown.remainingSeconds}
            onCancel={countdown.cancel}
          />
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm z-20">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-xs font-mono">{formatRecordingTime(recordingSeconds)}</span>
          </div>
        )}

        {/* Manual Controls Panel */}
        {showManualControls && (isProMode || isPortraitMode) && (
          <ManualControlsPanel
            exposure={exposure}
            whiteBalance={whiteBalance}
            exposureSupported={true}
            whiteBalanceSupported={true}
            onExposureChange={handleExposureChange}
            onWhiteBalanceChange={handleWhiteBalanceChange}
          />
        )}

        {/* Cinema Controls Panel */}
        {showCinemaControls && isCinematic && (
          <CinemaControlsPanel
            exposure={exposure}
            onExposureChange={handleExposureChange}
            colorProfile={colorProfile}
            onColorProfileChange={setColorProfile}
          />
        )}

        {/* Pro Mode Controls */}
        {isProMode && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm">
            <ProModeControls videoTrack={getVideoTrack()} />
          </div>
        )}

        {/* Zoom Slider */}
        {isActive && maxZoom > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 z-10">
            <ZoomSlider zoom={zoom} maxZoom={maxZoom} onChange={setZoom} />
          </div>
        )}
      </div>

      {/* Mode Selector */}
      <div className="bg-black/80 backdrop-blur-sm pt-2">
        <ModeSelector mode={mode} onModeChange={setMode} />
      </div>

      {/* Controls Bar */}
      <div className="bg-black/90 backdrop-blur-sm px-4 py-3 flex flex-col gap-3">
        {/* Video resolution selector */}
        {isVideoOrCinematic && (
          <VideoResolutionSelector
            activeResolution={resolution}
            onResolutionChange={setResolution}
          />
        )}

        {/* Noise Reduction Toggle - shown in Night, Portrait, and when manually enabled */}
        {(isLowLightMode || noiseReduction.isEnabled) && (
          <NoiseReductionToggle
            strength={noiseReduction.strength}
            onStrengthChange={noiseReduction.setStrength}
          />
        )}

        {/* Blur Strength Toggle - shown in Portrait/Cinematic */}
        {showBlurStrength && (
          <BlurStrengthToggle level={blurLevel} onSelect={setBlurLevel} />
        )}

        {/* Main Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGridCycle}
              className={`p-2 rounded-full transition-colors ${
                settings.gridMode !== 'off'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>

            <button
              onClick={handleTimerCycle}
              className={`relative p-2 rounded-full transition-colors ${
                settings.timerDuration > 0
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Timer className="w-5 h-5" />
              {settings.timerDuration > 0 && (
                <span className="absolute top-0 right-0 text-[9px] font-bold text-amber-400">
                  {settings.timerDuration}
                </span>
              )}
            </button>

            {showTorchButton && (
              <button
                onClick={handleTorchCycle}
                className={`p-2 rounded-full transition-colors ${
                  torchControl.torchMode === 'on'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {torchControl.torchMode === 'on' ? (
                  <Zap className="w-5 h-5" />
                ) : (
                  <ZapOff className="w-5 h-5" />
                )}
              </button>
            )}

            {/* AI Denoise quick toggle */}
            <button
              onClick={noiseReduction.toggle}
              className={`p-2 rounded-full transition-colors ${
                noiseReduction.isEnabled
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Toggle AI Denoise"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>

          {/* Capture / Record Button */}
          {isVideoOrCinematic ? (
            <button
              onClick={handleRecordToggle}
              disabled={!isActive || cameraLoading}
              className={`relative w-16 h-16 rounded-full border-4 transition-all duration-150 active:scale-95 disabled:opacity-50 ${
                isRecording
                  ? 'border-red-500 bg-red-500/20'
                  : 'border-red-400 bg-transparent'
              }`}
            >
              {isRecording ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-5 h-5 rounded-sm bg-red-500" />
                </span>
              ) : (
                <Video className="w-6 h-6 text-red-400 mx-auto" />
              )}
            </button>
          ) : (
            <button
              onClick={handleCapture}
              disabled={!isActive || cameraLoading}
              className="relative w-16 h-16 rounded-full border-4 border-white bg-white/10 hover:bg-white/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              <Camera className="w-6 h-6 text-white mx-auto" />
            </button>
          )}

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {(isProMode || isPortraitMode) && (
              <button
                onClick={() => setShowManualControls((v) => !v)}
                className={`p-2 rounded-full transition-colors ${
                  showManualControls
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Settings2 className="w-5 h-5" />
              </button>
            )}

            {isCinematic && (
              <button
                onClick={() => setShowCinemaControls((v) => !v)}
                className={`p-2 rounded-full transition-colors ${
                  showCinemaControls
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Settings2 className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={handleSwitchCamera}
              className="p-2 rounded-full text-white/60 hover:text-white transition-colors"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
