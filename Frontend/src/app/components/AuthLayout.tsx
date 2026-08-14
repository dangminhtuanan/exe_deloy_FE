import type { ReactNode } from "react";
import { Link } from "react-router";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen bg-white">
        <section className="relative isolate hidden w-1/2 overflow-hidden bg-[linear-gradient(180deg,#edf5ff_0%,#f7faff_72%,#fff_100%)] lg:block">
          <div className="pointer-events-none absolute -left-20 top-[12%] h-52 w-52 rounded-full border border-white/90 bg-white/40 shadow-[inset_-12px_-12px_30px_rgba(122,171,255,.18),0_18px_45px_rgba(89,143,224,.16)]" />
          <div className="pointer-events-none absolute -right-16 top-[5%] h-48 w-48 rounded-full border border-white/90 bg-white/40 shadow-[inset_-12px_-12px_30px_rgba(122,171,255,.2),0_18px_45px_rgba(89,143,224,.18)]" />
          <div className="pointer-events-none absolute left-[18%] top-[8%] h-14 w-14 rounded-full border border-white bg-white/50 shadow-[inset_-5px_-5px_12px_rgba(122,171,255,.25)]" />
          <div className="pointer-events-none absolute right-[22%] top-[16%] h-10 w-10 rounded-full border border-white bg-white/50 shadow-[inset_-4px_-4px_10px_rgba(122,171,255,.25)]" />

          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <h2 className="cloud-word select-none text-[clamp(6rem,11vw,11rem)] font-black leading-[.78] tracking-[-0.075em] text-white" aria-label="OUTFIO">
              {"OUTFIO".split("").map((letter, index) => (
                <span key={`${letter}-${index}`} style={{ "--cloud-index": index } as React.CSSProperties} aria-hidden="true">{letter}</span>
              ))}
            </h2>
            <div className="relative z-10 mt-10 max-w-xl">
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 xl:text-3xl">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 xl:text-base">{description}</p>
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 inline-flex flex-col leading-none">
              <span className="text-3xl font-black tracking-[-0.06em] text-slate-950">OUTFIO</span>
              <span className="mt-1 text-[8px] uppercase tracking-[0.3em] text-slate-400">Fashion Store</span>
            </Link>
            {children}
          </div>
        </section>
    </main>
  );
}
