import type { Metadata } from "next";
import Link from "next/link";

import { CareerExplorer } from "@/components/i-want-to-become/career-explorer";

export const metadata: Metadata = {
  title: "I want to become",
  description: "Explore a practical career route from your CSEC/CXC starting point—no account or CV needed.",
};

export default function IWantToBecomePage() {
  return <main className="min-h-screen bg-background"><div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8"><header className="flex items-center justify-between gap-4"><Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-foreground"><span className="grid size-9 place-items-center bg-accent text-sm font-black text-white">SG</span><span>skillsgap<span className="text-accent">.gy</span></span></Link><Link href="/login" className="text-sm font-semibold text-foreground underline-offset-4 hover:text-accent hover:underline">Sign in</Link></header><section className="py-12 sm:py-16"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">For school leavers and future talent</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">You do not need a CV to start building your future.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted">Choose a direction, add the CSEC/CXC results you have, and see the practical steps that can move you closer.</p></section><CareerExplorer /><p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-6 text-muted">Career and training information is curated for this SkillsGap.gy demonstration. Confirm current entry requirements directly with a guidance counsellor, provider, or employer.</p></div></main>;
}
