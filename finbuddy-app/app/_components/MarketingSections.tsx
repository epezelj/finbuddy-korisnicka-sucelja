import Link from "next/link";
import {
  Receipt,
  PieChart,
  Target,
  UserPlus,
  Plus,
  Eye,
} from "lucide-react";

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-white to-[#F9FAFB] py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-[#111827] mb-6 text-5xl font-extrabold leading-tight">
              Understand where your money goes — without stress.
            </h1>
            <p className="text-[#6B7280] mb-8 max-w-2xl mx-auto lg:mx-0">
              Track expenses, visualize spending, and stay in control of your
              budget with a simple, intuitive finance app.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/signup"
                className="bg-[#2563EB] text-white px-8 py-3 rounded-lg hover:bg-[#1d4ed8] transition-colors text-center font-semibold"
              >
                Get Started Free
              </Link>
              <a
                href="/blog"
                className="border-2 border-[#2563EB] text-[#2563EB] px-8 py-3 rounded-lg hover:bg-[#2563EB] hover:text-white transition-colors text-center font-semibold"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1645226880663-81561dcab0ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5hbmNlJTIwYXBwJTIwbW9iaWxlfGVufDF8fHx8MTc2NTczNTAyNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Finance app interface"
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Features() {
  const features = [
    {
      icon: Receipt,
      title: "Track Every Expense",
      description:
        "Log cash and digital expenses in seconds — no complicated spreadsheets.",
      color: "#2563EB",
    },
    {
      icon: PieChart,
      title: "Visual Reports & Insights",
      description: "See clear charts that show where your money actually goes.",
      color: "#22C55E",
    },
    {
      icon: Target,
      title: "Simple Budget Control",
      description:
        "Know how much you have left at any moment and avoid overspending.",
      color: "#2563EB",
    },
  ];

  return (
    <section id="features" className="bg-[#F3F4F6] py-16 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[#111827] text-center mb-12 text-3xl font-extrabold">
          Everything you need to manage your finances
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="text-center rounded-xl p-6 bg-white shadow-sm"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F9FAFB] mb-6">
                  <Icon className="w-8 h-8" style={{ color: feature.color }} />
                </div>

                <h3 className="text-[#111827] mb-4 font-semibold text-lg">
                  {feature.title}
                </h3>

                <p className="text-[#6B7280]">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function PersonaSection() {
  const personas = [
    {
      title: "Students",
      description: "Keep track of daily spending like food, coffee, and transport.",
      image:
        "https://images.unsplash.com/photo-1714115314647-1efb3d78bb11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHN0dWRlbnQlMjBjb2ZmZWV8ZW58MXx8fHwxNzY1NzM1MDI2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      accent: "#2563EB",
    },
    {
      title: "Professionals",
      description: "Analyze subscriptions, online shopping, and monthly trends.",
      image:
        "https://images.unsplash.com/photo-1617012811506-344ff32b7055?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b3JraW5nJTIwbGFwdG9wfGVufDF8fHx8MTc2NTczNTAyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      accent: "#22C55E",
    },
    {
      title: "Families",
      description: "Manage household expenses clearly and stress-free.",
      image:
        "https://images.unsplash.com/photo-1758687126877-b37052a20a4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBob21lJTIwdG9nZXRoZXJ8ZW58MXx8fHwxNzY1NzM1MDI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      accent: "#2563EB",
    },
  ];

  return (
    <section className="bg-white py-16 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[#111827] text-center mb-16 text-3xl font-extrabold">
          Built for real life, not financial experts.
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {personas.map((persona, index) => (
            <div
              key={index}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={persona.image}
                  alt={persona.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <h3 className="mb-3 text-xl font-bold" style={{ color: persona.accent }}>
                  {persona.title}
                </h3>
                <p className="text-[#6B7280]">{persona.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { icon: UserPlus, title: "Sign Up", step: "01" },
    { icon: Plus, title: "Add expenses and income", step: "02" },
    { icon: Eye, title: "See insights instantly", step: "03" },
  ];

  return (
    <section id="how-it-works" className="bg-[#F3F4F6] py-16 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[#111827] text-center mb-16 text-3xl font-extrabold">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative text-center">
                <div className="text-[#2563EB] opacity-20 mb-4 text-6xl font-extrabold">
                  {step.step}
                </div>

                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2563EB] mb-6">
                  <Icon className="w-10 h-10 text-white" />
                </div>

                <h3 className="text-[#111827] text-lg font-semibold">{step.title}</h3>

                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-24 left-1/2 w-full h-0.5 bg-[#2563EB] opacity-20" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] py-20 shadow-2xl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-white mb-8 text-3xl font-extrabold">
          Start making smarter money decisions today.
        </h2>

        <Link
          href="/signup"
          className="inline-block bg-white text-[#2563EB] px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
}