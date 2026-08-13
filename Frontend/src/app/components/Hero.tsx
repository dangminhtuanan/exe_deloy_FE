interface HeroProps { imageUrl: string; }

export function Hero({ imageUrl: _imageUrl }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#edf5ff_0%,#f7faff_72%,#fff_100%)]">
      <div className="pointer-events-none absolute -left-10 top-16 h-36 w-36 rounded-full border border-white/90 bg-white/40 shadow-[inset_-12px_-12px_30px_rgba(122,171,255,.18),0_18px_45px_rgba(89,143,224,.16)] md:h-52 md:w-52" />
      <div className="pointer-events-none absolute -right-12 top-5 h-32 w-32 rounded-full border border-white/90 bg-white/40 shadow-[inset_-12px_-12px_30px_rgba(122,171,255,.2),0_18px_45px_rgba(89,143,224,.18)] md:h-48 md:w-48" />
      <div className="pointer-events-none absolute left-[18%] top-8 h-10 w-10 rounded-full border border-white bg-white/50 shadow-[inset_-5px_-5px_12px_rgba(122,171,255,.25)] md:h-14 md:w-14" />
      <div className="pointer-events-none absolute right-[25%] top-12 h-7 w-7 rounded-full border border-white bg-white/50 shadow-[inset_-4px_-4px_10px_rgba(122,171,255,.25)] md:h-10 md:w-10" />
      <div className="relative mx-auto flex min-h-[330px] w-full max-w-[1600px] flex-col items-center justify-center px-4 pb-20 pt-12 text-center md:min-h-[430px] md:pb-24 md:pt-16">
        <h1 className="cloud-word select-none text-[clamp(4.7rem,17vw,12.5rem)] font-black leading-[.78] tracking-[-0.075em] text-white" aria-label="OUTFIO">
          {"OUTFIO".split("").map((letter, index) => (
            <span key={`${letter}-${index}`} style={{ "--cloud-index": index } as React.CSSProperties} aria-hidden="true">
              {letter}
            </span>
          ))}
        </h1>
        <div className="relative z-10 mt-7 md:mt-10">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 md:text-2xl">Elevate Your Style. Define You.</h2>
          <p className="mt-1.5 text-xs text-slate-500 md:text-sm">Khám phá những xu hướng thời trang mới nhất</p>
        </div>
      </div>
    </section>
  );
}
