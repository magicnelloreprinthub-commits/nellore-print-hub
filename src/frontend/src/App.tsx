import { Toaster } from "@/components/ui/sonner";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useActor } from "./hooks/useActor";
import { LanguageProvider } from "./lib/i18n";
import { routeTree } from "./routeTree";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Silently increments visit count for logged-in customers on each page load.
// Also fires the open-login-modal event for first-time (not yet logged in) visitors.
function VisitorTracker() {
  const { actor, isFetching } = useActor();

  useEffect(() => {
    if (!actor || isFetching) return;

    const raw = localStorage.getItem("nph_customer");

    // First-time visitor: open login modal automatically
    if (!raw) {
      window.dispatchEvent(new Event("open-login-modal"));
      return;
    }

    try {
      const customer = JSON.parse(raw) as { name: string; mobile: string };
      if (!customer?.name || !customer?.mobile) return;

      // Fire-and-forget: update visit count in background
      actor
        .registerOrLoginCustomer(customer.name, customer.mobile)
        .then((updated) => {
          // Refresh stored data with latest visit count
          const serialized = JSON.stringify({
            id: String(updated.id),
            name: updated.name,
            mobile: updated.mobile,
            visitCount: String(updated.visitCount),
            firstVisit: String(updated.firstVisit),
            lastVisit: String(updated.lastVisit),
          });
          localStorage.setItem("nph_customer", serialized);
        })
        .catch(() => {
          // Silent failure — don't disrupt UX
        });
    } catch {
      // Silent failure
    }
  }, [actor, isFetching]);

  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <VisitorTracker />
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </LanguageProvider>
  );
}
