import Link from "next/link";
import Image from "next/image";
import { db } from "@esa/db";
import { DEFAULT_FOOTER } from "@/lib/settings-defaults";

export async function InstitutionalFooter() {
  let footer = DEFAULT_FOOTER;
  try {
    const row = await db.query.platformSettings.findFirst({
      where: (s, { eq }) => eq(s.key, "footer"),
    });
    if (row) {
      footer = { ...DEFAULT_FOOTER, ...JSON.parse(row.value) };
    }
  } catch {
    // Graceful fallback to DEFAULT_FOOTER if DB query fails
  }

  return (
    <footer className="border-t border-neutral-200 bg-neutral-900 text-neutral-300">
      {/* Upper Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Institutional Branding & Executive Contacts */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/logo.png"
                alt="ESA-KU Crest"
                width={48}
                height={28}
                className="brightness-125 object-contain"
              />
              <div>
                <span className="block text-base font-bold text-white tracking-tight">
                  ESA Kenyatta University
                </span>
                <span className="block text-xs text-neutral-400 font-medium">
                  Engineering Students Association
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-neutral-400 max-w-sm">
              The premier academic and professional society representing all engineering students
              across the School of Engineering and Architecture at Kenyatta University.
            </p>

            {/* Dynamic Contacts Managed via Admin Console */}
            <div className="mt-4 text-xs text-neutral-400 space-y-1.5">
              <p className="font-semibold text-neutral-300">
                {footer.officeLocation || "School of Engineering & Architecture, Main Campus, Thika Road"}
              </p>
              <p>{footer.postalAddress || "P.O. Box 43844-00100 Nairobi, Kenya"}</p>
              
              <p className="pt-1.5 text-neutral-400">
                <span className="text-neutral-500 font-semibold">Official Email:</span>{" "}
                <a
                  href={`mailto:${footer.email || "esa.kenyattauniv@gmail.com"}`}
                  className="text-neutral-300 hover:text-white transition-colors underline"
                >
                  {footer.email || "esa.kenyattauniv@gmail.com"}
                </a>
              </p>

              <div className="text-neutral-400 space-y-0.5 pt-0.5">
                <p>
                  <span className="text-neutral-500 font-semibold">M-Pesa Paybill:</span>{" "}
                  <span className="font-mono font-bold text-accent-muted">
                    {footer.paybillNumber || "625625"}
                  </span>
                </p>
                <p>
                  <span className="text-neutral-500 font-semibold">Account No:</span>{" "}
                  <span className="font-mono font-bold text-neutral-200">
                    {footer.accountNumber || "01521260661100"}
                  </span>{" "}
                  <span className="text-neutral-500 text-[11px]">({footer.paybillName || "ESA Kenyatta University"})</span>
                </p>
              </div>

              {(footer.phone1 || footer.phone2) && (
                <p className="text-neutral-400">
                  <span className="text-neutral-500 font-semibold">Helpline:</span>{" "}
                  {footer.phone1 && (
                    <a href={`tel:${footer.phone1.replace(/\s+/g, "")}`} className="hover:text-white transition-colors">
                      {footer.phone1}
                    </a>
                  )}
                  {footer.phone1 && footer.phone2 && <span> · </span>}
                  {footer.phone2 && (
                    <a href={`tel:${footer.phone2.replace(/\s+/g, "")}`} className="hover:text-white transition-colors">
                      {footer.phone2}
                    </a>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Academic */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Academic
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/resources?type=past_paper" className="hover:text-white transition-colors">
                  Past Examination Papers
                </Link>
              </li>
              <li>
                <Link href="/resources?type=notes" className="hover:text-white transition-colors">
                  Lecture Notes
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition-colors">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/timetable" className="hover:text-white transition-colors">
                  Timetable
                </Link>
              </li>
            </ul>
          </div>

          {/* Activities & Chapters */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Activities & Chapters
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/clubs" className="hover:text-white transition-colors">
                  Clubs
                </Link>
              </li>
              <li>
                <Link href="/notifications" className="hover:text-white transition-colors">
                  Notices
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Portal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Account & Portal
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Membership Badge
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="hover:text-white transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <a
                  href="https://www.ku.ac.ke"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Kenyatta University Portal</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Lower Bar */}
      <div className="border-t border-neutral-800 bg-neutral-950 py-5 text-center text-xs text-neutral-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} Engineering Students Association (ESA) · Kenyatta University.
          </p>
          <p className="text-neutral-500">
            Dedicated to technical excellence, ethics, and innovation across engineering cohorts.
          </p>
        </div>
      </div>
    </footer>
  );
}
