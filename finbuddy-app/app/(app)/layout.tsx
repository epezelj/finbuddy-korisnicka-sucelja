import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Navigation } from "../_components/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </header>
      <div className="h-14" />
      <NuqsAdapter>{children}</NuqsAdapter>
    </>
  );
}
