import type { Metadata } from "next";
import Link from "next/link";

import { PublicContentHeader } from "@/components/shareable/public-content-header";
import { PublicSiteFooter } from "@/components/shareable/public-site-footer";

type FaqQuestion = {
  question: string;
  answer: string;
  link?: { href: string; label: string };
};

type FaqGroup = {
  title: string;
  questions: readonly FaqQuestion[];
};

export const metadata: Metadata = {
  title: "Questions and answers",
  description: "Answers about CV analysis, skills matching, training pathways, privacy, and local-content careers in Guyana.",
};

const faqGroups: readonly FaqGroup[] = [
  {
    title: "Getting started",
    questions: [
      {
        question: "What does SkillsGap.gy do?",
        answer: "SkillsGap.gy helps you connect the experience you already have to realistic opportunities in Guyana’s local-content economy. It shows which skills may transfer, what you still need, and what training could help close the gap.",
      },
      {
        question: "Who is SkillsGap.gy for?",
        answer: "It is for Guyanese workers, career changers, and people exploring a route into the oil-and-gas value chain. You do not need to know the exact job title before you begin.",
      },
      {
        question: "Do I need to upload a CV?",
        answer: "No. You can explore public positions, training, or build a career route from your interests and CSEC/CXC starting point. Uploading a CV gives the applicant pathway more information to work with.",
      },
    ],
  },
  {
    title: "Your CV and matches",
    questions: [
      {
        question: "What happens after I upload my CV?",
        answer: "First, your PDF is uploaded privately. We then read it for skills and work history. When reading is complete, you review and confirm the suggestions before they affect your matches.",
      },
      {
        question: "How long does CV reading take?",
        answer: "It depends on the document and current processing time. The dashboard updates automatically while your CV is being read, and it tells you when there is something you need to do.",
      },
      {
        question: "Does the system decide whether I am qualified?",
        answer: "No. CV reading produces suggestions supported by evidence. You confirm what belongs on your profile, and the matching rules compare your confirmed skills with the published role requirements.",
      },
      {
        question: "Are the matches a promise of employment?",
        answer: "No. A match is a guide to where your confirmed experience may fit and which requirements may still need attention. Employers make their own hiring decisions, and vacancies can change.",
      },
    ],
  },
  {
    title: "Privacy and trust",
    questions: [
      {
        question: "Who can see my CV?",
        answer: "Your uploaded CV and extracted profile stay private to your applicant account. An employer only receives candidate information when you choose to share your profile for a role.",
      },
      {
        question: "Can I correct what the CV reader found?",
        answer: "Yes. You can confirm, dismiss, correct, add, or remove skills and update work-history details. Only the information you confirm is used for your applicant pathway.",
      },
      {
        question: "How current are the training and vacancy details?",
        answer: "Training dates, fees, entry requirements, medical checks, offshore safety rules, and vacancies can change. Always confirm current details directly with the provider or employer before spending money or making a move.",
      },
    ],
  },
  {
    title: "Training and employers",
    questions: [
      {
        question: "How does SkillsGap.gy recommend training?",
        answer: "The platform connects missing role requirements to training pathways in the catalogue. The goal is to help you choose the next useful step instead of sending you to a long list of unrelated courses.",
      },
      {
        question: "Can training providers add their programs?",
        answer: "Yes. Training providers can manage their profile and programs, including the skills or qualifications each program supports. New providers can prepare their listing while verification is pending; only verified providers appear in public recommendations.",
        link: { href: "/signup/provider", label: "Create a training provider account" },
      },
      {
        question: "Can companies use SkillsGap.gy?",
        answer: "Yes. A company owner creates a personal employer account and requests a company workspace. After administrator approval, the owner can publish roles, review applicants who have consented to share, and invite recruiters through private links. Recruiters join using a company account and an owner invitation.",
        link: { href: "/signup/company", label: "Create a company account" },
      },
      {
        question: "What should I do if I am not sure which route fits me?",
        answer: "Start with the career route explorer. You can describe your interests and starting point, review a possible direction, and save the plan privately before deciding what to do next.",
      },
    ],
  },
] as const;

export default function FaqPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <PublicContentHeader active="faq" />

        <section className="mt-12 max-w-3xl" aria-labelledby="faq-title">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Questions and answers</p>
          <h1 id="faq-title" className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            A clearer way to understand the pathway.
          </h1>
          <p className="mt-6 text-base leading-7 text-muted sm:text-lg">
            Learn what happens after a CV upload, how matching works, and what SkillsGap.gy can and cannot promise.
          </p>
        </section>

        <div className="mt-12 space-y-10">
          {faqGroups.map((group) => (
            <section key={group.title} aria-labelledby={`faq-${group.title.toLowerCase().replaceAll(" ", "-")}`}>
              <h2 id={`faq-${group.title.toLowerCase().replaceAll(" ", "-")}`} className="text-2xl font-semibold tracking-tight text-foreground">
                {group.title}
              </h2>
              <div className="mt-4 divide-y divide-border border-y border-border">
                {group.questions.map((item) => (
                  <details key={item.question} className="group">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-base font-semibold text-foreground marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                      <span>{item.question}</span>
                      <span className="shrink-0 text-xl font-normal text-accent transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                    </summary>
                    <p className="max-w-3xl pb-5 pr-10 text-sm leading-7 text-muted">{item.answer}</p>
                    {item.link ? <Link href={item.link.href} className="-mt-3 mb-5 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">{item.link.label} <span aria-hidden="true">→</span></Link> : null}
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 border border-accent bg-surface-muted p-5 sm:p-6" aria-labelledby="faq-next-step">
          <h2 id="faq-next-step" className="text-xl font-semibold tracking-tight text-foreground">Ready to take the next step?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Start with the route that fits you. You can browse without an account, then sign up when you are ready to build a private pathway.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/i-want-to-become" className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong">
              Build a career route
            </Link>
            <Link href="/opportunities" className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface">
              Browse positions
            </Link>
          </div>
        </section>

        <PublicSiteFooter />
      </div>
    </main>
  );
}
