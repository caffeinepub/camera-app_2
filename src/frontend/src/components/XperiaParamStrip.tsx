import React from "react";

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
  evValue: number;
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

function formatAF(value: number): string {
  return value.toFixed(2);
}

function formatEV(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}`;
}

const PARAMS: ProParam[] = ["ISO", "S", "WB", "AF", "EV"];

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
  evValue,
}: XperiaParamStripProps) {
  const getLabel = (param: ProParam): string => {
    switch (param) {
      case "ISO":
        return "ISO";
      case "S":
        return "S";
      case "WB":
        return "WB";
      case "AF":
        return "AF";
      case "EV":
        return "EV";
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
        return formatAF(afValue);
      case "EV":
        return formatEV(evValue);
    }
  };

  return (
    <div className="w-full flex" style={{ background: "rgba(0,0,0,0.82)" }}>
      {PARAMS.map((param) => {
        const isActive = param === activeParam;
        return (
          <button
            key={param}
            type="button"
            data-ocid="camera.param.tab"
            onClick={() => onParamSelect(param)}
            className="flex-1 relative flex flex-col items-center justify-center py-2 px-1 select-none active:opacity-70 transition-opacity"
            style={{ minWidth: 0 }}
          >
            {/* Active indicator bar */}
            {isActive && (
              <span
                className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full"
                style={{ background: "#f59e0b" }}
              />
            )}

            {/* Label */}
            <span
              className="text-[10px] font-bold tracking-widest uppercase leading-none mb-1"
              style={{ color: isActive ? "#f59e0b" : "rgba(255,255,255,0.55)" }}
            >
              {getLabel(param)}
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
