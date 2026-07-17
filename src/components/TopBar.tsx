import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function TopBar({
  title,
  back = true,
  right,
}: {
  title: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3">
        {back ? (
          <button
            onClick={() => router.history.back()}
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-secondary" aria-label="Home">
            🌱
          </Link>
        )}
        <h1 className="truncate text-center text-lg font-semibold">{title}</h1>
        <div className="min-w-10 flex justify-end">{right}</div>
      </div>
    </div>
  );
}
