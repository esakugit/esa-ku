import Link from "next/link";

const items = [
  { href: "/", label: "Home" },
  { href: "/timetable", label: "Timetable" },
  { href: "/resources", label: "Resources" },
  { href: "/clubs", label: "Clubs" },
  { href: "/profile", label: "Profile" },
];

/**
 * Five-tab primary navigation (spec §10, fig. 2). Screens beyond Home and
 * Profile are stubbed in later build stages — this ships the shell first so
 * the app's shape is in place before every screen is fully wired up.
 */
export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-xl justify-between px-6 py-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-accent"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
