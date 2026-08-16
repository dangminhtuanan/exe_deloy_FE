import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router";

interface HeroProps { imageUrl: string; }

export function Hero({ imageUrl: _imageUrl }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#edf5ff_0%,#f7faff_72%,#fff_100%)]">
      <div className="pointer-events-none absolute -left-10 top-16 h-36 w-36 rounded-full border border-white/90 bg-white/40 shadow-[inset_-12px_-12px_30px_rgba(122,171,255,.18),0_18px_45px_rgba(89,143,224,.16)] md:h-52 md:w-52" />
      <div className="pointer-events-none absolute -right-12 top-5 h-32 w-32 rounded-full border border-white/90 bg-white/40 shadow-[inset_-12px_-12px_30px_rgba(122,171,255,.2),0_18px_45px_rgba(89,143,224,.18)] md:h-48 md:w-48" />
      <div className="pointer-events-none absolute left-[18%] top-8 h-10 w-10 rounded-full border border-white bg-white/50 shadow-[inset_-5px_-5px_12px_rgba(122,171,255,.25)] md:h-14 md:w-14" />
      <div className="pointer-events-none absolute right-[25%] top-12 h-7 w-7 rounded-full border border-white bg-white/50 shadow-[inset_-4px_-4px_10px_rgba(122,171,255,.25)] md:h-10 md:w-10" />
      <div className="relative mx-auto flex min-h-[390px] w-full max-w-[1600px] flex-col items-center justify-center px-4 pb-20 pt-12 text-center md:min-h-[500px] md:pb-24 md:pt-16">
        <h1 className="cloud-word select-none text-[clamp(4rem,14vw,10rem)] font-black leading-[.78] tracking-[-0.075em] text-white" aria-label="OUTFIO">
          {"OUTFIO".split("").map((letter, index) => (
            <span key={`${letter}-${index}`} style={{ "--cloud-index": index } as React.CSSProperties} aria-hidden="true">
              {letter}
            </span>
          ))}
        </h1>
        <div className="relative z-10 mt-7 flex max-w-4xl flex-col items-center md:mt-9">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#2563eb] shadow-sm backdrop-blur md:text-sm">
            <Sparkles className="h-4 w-4" />
            Công nghệ AI thời trang
          </div>
          <h2 className="text-3xl font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-4xl md:text-5xl">
            Phối đồ thông minh cùng <span className="text-[#3977ed]">OUTFIO AI</span>
          </h2>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-slate-600 md:text-lg md:leading-7">
            Thử trang phục trên chính ảnh của bạn và nhận gợi ý phối đồ phù hợp chỉ trong vài giây.
          </p>
          <Link
            to="/use-ai"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#3977ed] px-6 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(57,119,237,.3)] transition-all hover:-translate-y-0.5 hover:bg-[#2563eb] hover:shadow-[0_14px_34px_rgba(57,119,237,.38)] md:h-14 md:px-8 md:text-base"
          >
            <Sparkles className="h-5 w-5" />
            Thử phối đồ với AI
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
