import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** "Back to the landing page" for the standalone login and register pages. */
export function HomeButton() {
  return (
    <div className="mb-4 w-full max-w-lg">
      <Button asChild variant="ghost" size="sm" className="-ml-2.5 text-ink-soft">
        <Link href="/">
          <ArrowLeft className="size-4" /> Bosh sahifa
        </Link>
      </Button>
    </div>
  );
}
