"use client";

import { useEffect, useRef, useState } from "react";

interface YandexClinicMapProps {
  title: string;
  address: string;
  center: [number, number];
  pin: [number, number];
  zoom: number;
  apiKey?: string;
}

declare global {
  interface Window {
    ymaps?: {
      ready: (callback: () => void) => void;
      Map: new (
        container: HTMLElement,
        state: {
          center: [number, number];
          zoom: number;
          controls?: string[];
        },
        options?: Record<string, unknown>
      ) => {
        setCenter: (
          center: [number, number],
          zoom?: number,
          options?: Record<string, unknown>
        ) => void;
        destroy: () => void;
        geoObjects: {
          add: (geoObject: unknown) => void;
        };
        behaviors: {
          disable: (name: string) => void;
        };
      };
      Placemark: new (
        coordinates: [number, number],
        properties?: Record<string, unknown>,
        options?: Record<string, unknown>
      ) => {
        geometry: {
          setCoordinates: (coordinates: [number, number]) => void;
        };
        properties: {
          set: (name: string, value: unknown) => void;
        };
      };
    };
  }
}

const SCRIPT_ID = "yandex-maps-api-v21";

function loadYandexMapsScript(apiKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.ymaps) {
      resolve();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Yandex Maps")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Yandex Maps"));
    document.head.appendChild(script);
  });
}

export default function YandexClinicMap({
  title,
  address,
  center,
  pin,
  zoom,
  apiKey = "",
}: YandexClinicMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<InstanceType<NonNullable<typeof window.ymaps>["Map"]> | null>(
    null
  );
  const placemarkRef = useRef<
    InstanceType<NonNullable<typeof window.ymaps>["Placemark"]> | null
  >(null);
  const [mapReady, setMapReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const hasApiKey = apiKey.trim().length > 0;
  const iframeSrc = `https://yandex.ru/map-widget/v1/?ll=${center[1]}%2C${center[0]}&z=${zoom}&pt=${pin[1]}%2C${pin[0]}%2Cpm2rdm`;

  useEffect(() => {
    setScriptFailed(false);
  }, [apiKey]);

  useEffect(() => {
    if (!hasApiKey || !containerRef.current) {
      return;
    }

    let cancelled = false;

    loadYandexMapsScript(apiKey)
      .then(() => {
        if (cancelled || !window.ymaps || !containerRef.current) {
          return;
        }

        window.ymaps.ready(() => {
          if (cancelled || !window.ymaps || !containerRef.current) {
            return;
          }

          if (!mapRef.current) {
            const map = new window.ymaps.Map(
              containerRef.current,
              {
                center: [center[0], center[1]],
                zoom,
                controls: ["zoomControl", "geolocationControl"],
              },
              {
                suppressMapOpenBlock: true,
              }
            );

            map.behaviors.disable("scrollZoom");

            const placemark = new window.ymaps.Placemark(
              [pin[0], pin[1]],
              {
                balloonContentHeader: title,
                balloonContentBody: address,
                iconCaption: title,
              },
              {
                preset: "islands#redDotIcon",
              }
            );

            map.geoObjects.add(placemark);
            mapRef.current = map;
            placemarkRef.current = placemark;
            setMapReady(true);
            return;
          }

          mapRef.current.setCenter([center[0], center[1]], zoom, { duration: 250 });
          if (placemarkRef.current) {
            placemarkRef.current.geometry.setCoordinates([pin[0], pin[1]]);
            placemarkRef.current.properties.set("balloonContentHeader", title);
            placemarkRef.current.properties.set("balloonContentBody", address);
            placemarkRef.current.properties.set("iconCaption", title);
          }
          setMapReady(true);
        });
      })
      .catch(() => {
        setMapReady(false);
        setScriptFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [address, apiKey, center, hasApiKey, pin, title, zoom]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
        placemarkRef.current = null;
      }
    };
  }, []);

  if (!hasApiKey || scriptFailed) {
    return (
      <div className="relative min-h-[360px] w-full overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] shadow-[var(--shadow-soft)] lg:min-h-[520px]">
        <iframe
          title={`${title} на карте Яндекс`}
          src={iframeSrc}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-[360px] w-full overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] shadow-[var(--shadow-soft)] lg:min-h-[520px]">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        aria-label={`${title} на карте Яндекс`}
      />

      <div className="absolute left-5 top-5 z-10 max-w-[18rem] rounded-[1.4rem] border border-white/35 bg-white/88 px-4 py-3 text-sm shadow-[var(--shadow-soft)] backdrop-blur-md">
        <p className="font-semibold text-[var(--ink-strong)]">{title}</p>
        <p className="mt-1 leading-6 text-[var(--muted)]">{address}</p>
      </div>

      {!mapReady ? (
        <div className="absolute bottom-5 left-5 z-10 rounded-full border border-white/40 bg-white/88 px-4 py-2 text-xs font-semibold text-[var(--ink)] shadow-[var(--shadow-soft)] backdrop-blur-md">
          Загружаем карту...
        </div>
      ) : null}
    </div>
  );
}
