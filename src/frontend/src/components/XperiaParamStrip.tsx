import React, { useCallback, useRef } from "react";

export type ProParam = "ISO" | "S" | "WB" | "AF" | "EV";

interface XperiaParamStripProps {
  activeParam: ProParam;
  onParamSelect: (param: ProParam) => void;
  isoValue: number;
  isoAuto: boolean;
  shutterValue: string;
  shutterAuto: boolean;
  wbValue: number;
  wbAuto: boolean;
  afValue: number;
  afAuto: boolean;
  evValue: number;
  evAuto: boolean;
  onParamAutoChange: (param: ProParam, auto: boolean) => void;
}

function formatISO(value: number, auto: boolean): string {
  return auto ? `A ${value}` : `${value}`;
}

function formatShutter(value: string, auto: boolean): string {
  return auto ? `A ${value}` : value;
}

function formatWB(value: number, auto: boolean): string {
  return auto ? `A ${value}K` : `${value}K`;
}

function formatAF(value: number, auto: boolean): string {
  return auto ? "A" : value.toFixed(2);
}

function formatEV(value: number, auto: boolean): string {
  if (auto) return "A 0.0";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}`;
}

const PARAMS: ProParam[] = ["ISO", "S", "WB", "AF", "EV"];

const DOUBLE_TAP_MS = 300;

export default function XperiaParamStrip({
  activeParam,
  onParamSelect,
  isoValue,
  isoAuto,
  shutterValue,
  shutterAuto,
  wbValue,
  wbAuto,
  afValue,
  afAuto,
  evValue,
  evAuto,
  onParamAutoChange,
}: XperiaParamStripProps) {
  // Track last tap time per param for double-tap detection
  const lastTapRef = useRef<Partial<Record<ProParam, number>>>({});

  const handleTap = useCallback(
    (param: ProParam) => {
      const now = Date.now();
      const last = lastTapRef.current[param] ?? 0;
      const isDoubleTap = now - last < DOUBLE_TAP_MS;
      lastTapRef.current[param] = isDoubleTap ? 0 : now;

      if (isDoubleTap) {
        // Double tap → switch to auto
        onParamAutoChange(param, true);
        onParamSelect(param);
      } else {
        // Single tap → select and switch to manual
        onParamSelect(param);
        onParamAutoChange(param, false);
      }
    },
    [onParamSelect, onParamAutoChange],
  );

  const getAutoState = (param: ProParam): boolean => {
    switch (param) {
      case "ISO":
        return isoAuto;
      case "S":
        return shutterAuto;
      case "WB":
        return wbAuto;
      case "AF":
        return afAuto;
      case "EV":
        return evAuto;
    }
  };

  const getValue = (param: ProParam): string => {
    switch (param) {
      case "ISO":
        return formatISO(isoValue, isoAuto);
      case "S":
        return formatShutter(shutterValue, shutterAuto);
      case "WB":
        return formatWB(wbValue, wbAuto);
      case "AF":
        return formatAF(afValue, afAuto);
      case "EV":
        return formatEV(evValue, evAuto);
    }
  };

  return (
    <div className="w-full flex" style={{ background: "rgba(0,0,0,0.82)" }}>
      {PARAMS.map((param) => {
        const isActive = param === activeParam;
        const isAuto = getAutoState(param);

        return (
          <button
            key={param}
            type="button"
            data-ocid={`camera.param.${param.toLowerCase()}.tab`}
            onClick={() => handleTap(param)}
            className="flex-1 relative flex flex-col items-center justify-center py-2 px-1 select-none active:opacity-70 transition-opacity"
            style={{ minWidth: 0 }}
            aria-label={`${param} ${isAuto ? "auto" : "manual"} — tap for manual, double-tap for auto`}
          >
            {/* Active indicator bar */}
            {isActive && (
              <span
                className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full"
                style={{ background: "#f59e0b" }}
              />
            )}

            {/* Auto indicator dot */}
            {isAuto && (
              <span
                className="absolute top-1 right-2 w-1 h-1 rounded-full"
                style={{ background: "#22c55e" }}
              />
            )}

            {/* Label */}
            <span
              className="text-[10px] font-bold tracking-widest uppercase leading-none mb-1"
              style={{ color: isActive ? "#f59e0b" : "rgba(255,255,255,0.55)" }}
            >
              {param}
            </span>

            {/* Value */}
            <span
              className="text-[11px] font-mono font-semibold leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
              style={{ color: isActive ? "#f59e0b" : "rgba(255,255,255,0.9)" }}
            >
              {getValue(param)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
