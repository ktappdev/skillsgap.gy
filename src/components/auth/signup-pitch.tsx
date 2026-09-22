import Image from "next/image";

const signupBenefits = [
  "Explore real energy roles",
  "See where your skills fit",
  "Find training for the gaps",
];

export function SignupPitch() {
  return (
    <aside className="relative isolate order-2 min-h-[30rem] overflow-hidden rounded-lg bg-foreground text-white lg:order-1" aria-labelledby="signup-pitch-title">
      <Image
        src="/images/offshore-overhead.webp"
        alt=""
        fill
        sizes="(max-width: 1023px) 100vw, 50vw"
        preload
        className="-z-20 object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-black/65" aria-hidden="true" />
      <div className="relative flex min-h-[30rem] flex-col justify-end p-6 sm:p-8">
        <p className="text-sm font-semibold text-white/85">Your route into energy work</p>
        <h2 id="signup-pitch-title" className="mt-4 max-w-md text-3xl font-normal leading-tight sm:text-4xl">Turn experience into opportunity.</h2>
        <p className="mt-5 max-w-md text-base leading-7 text-white/85">SkillsGap.gy helps you build the skills needed for Guyana’s oil, gas, and energy sector.</p>
        <ul className="mt-7 space-y-3 text-sm font-semibold" role="list">
          {signupBenefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-sm text-foreground" aria-hidden="true">✓</span>
              {benefit}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-white/65">AI-generated offshore illustration</p>
      </div>
    </aside>
  );
}
