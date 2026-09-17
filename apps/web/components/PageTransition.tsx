"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Wraps {children} in app/layout.tsx to give route changes a brief
 * fade/slide instead of an abrupt swap. Purely cosmetic — see the
 * .page-enter / .page-exit rules in globals.css for the actual transition.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit">("enter");
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setTransitionStage("exit");
      const timer = setTimeout(() => {
        prevPathname.current = pathname;
        setDisplayChildren(children);
        setTransitionStage("enter");
      }, 180);
      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div className={transitionStage === "enter" ? "page-enter" : "page-exit"} style={{ minHeight: "100%" }}>
      {displayChildren}
    </div>
  );
}
