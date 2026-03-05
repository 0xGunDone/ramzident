"use client";

import Image from "next/image";

interface YandexClinicMapProps {
  title: string;
  address: string;
  center: [number, number];
  pin: [number, number];
  zoom: number;
}

export default function YandexClinicMap({
  title,
  address,
  center,
  zoom,
}: YandexClinicMapProps) {
  const iframeSrc = `https://yandex.ru/map-widget/v1/?ll=${center[1]}%2C${center[0]}&z=${zoom}`;

  return (
    <div className="relative min-h-[360px] w-full overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] shadow-[var(--shadow-soft)] lg:min-h-[520px]">
      <iframe
        title={`${title} на карте Яндекс`}
        src={iframeSrc}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-white/92 shadow-[0_14px_40px_rgba(16,46,53,0.22)]" />
          <div className="absolute left-1/2 top-[72%] h-4 w-4 -translate-x-1/2 rotate-45 rounded-[0.4rem] bg-white/92 shadow-[6px_6px_18px_rgba(16,46,53,0.1)]" />
          <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top_left,rgba(201,176,113,0.22),rgba(201,176,113,0.06)),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,239,227,0.96))] ring-1 ring-[rgba(185,152,88,0.16)]">
            <Image
              src="/media/brand/map-pin-icon.png"
              alt=""
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
        </div>
      </div>

      <div className="absolute left-5 top-5 z-10 max-w-[18rem] rounded-[1.4rem] border border-white/35 bg-white/88 px-4 py-3 text-sm shadow-[var(--shadow-soft)] backdrop-blur-md">
        <p className="font-semibold text-[var(--ink-strong)]">{title}</p>
        <p className="mt-1 leading-6 text-[var(--muted)]">{address}</p>
      </div>
    </div>
  );
}
