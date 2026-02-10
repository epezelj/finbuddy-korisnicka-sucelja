import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Navigation } from "../_components/navigation";
import {Footer} from "../_components/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </header>

      <div className="h-14" />

      {/*footer down */}
      <div className="flex-1">
        <NuqsAdapter>{children}</NuqsAdapter>
      </div>

      <Footer />
    </div>
  );
}
