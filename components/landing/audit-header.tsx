import Image from "next/image";

export function AuditHeader() {
  return (
    <header className="fixed inset-x-3 top-2.5 z-50 sm:inset-x-4 lg:inset-x-8 lg:top-[18px]">
      <div className="mx-auto flex h-[60px] max-w-[1240px] items-center rounded-[16px] border border-white/8 bg-[#08090c]/65 px-2.5 shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur-[18px] backdrop-saturate-[1.3] lg:h-[68px] lg:rounded-[18px] lg:px-3">
        <a
          href="#audit-top"
          className="flex min-h-11 items-center rounded-[12px] px-1.5"
          aria-label="Arcanium Digital"
        >
          <span className="grid size-10 place-items-center overflow-hidden rounded-[12px] bg-[#131419] p-1.5 ring-1 ring-white/10">
            <Image
              src="/images/brand/logo-ad.png"
              alt="Arcanium Digital"
              width={40}
              height={40}
              sizes="40px"
              priority
              className="h-full w-full scale-[1.5] object-contain mix-blend-screen"
            />
          </span>
        </a>
      </div>
    </header>
  );
}
