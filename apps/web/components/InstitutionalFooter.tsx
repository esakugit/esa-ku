import Link from "next/link";
import Image from "next/image";

export function InstitutionalFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-900 text-neutral-300">
      {/* Upper Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Institutional Branding */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/logo.png"
                alt="ESA-KU Crest"
                width={48}
                height={28}
                className="brightness-125"
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
            <div className="mt-4 text-xs text-neutral-400 space-y-1.5">
              <p className="font-semibold text-neutral-300">School of Engineering & Architecture</p>
              <p>Kenyatta University Main Campus · Thika Road</p>
              <p>P.O. Box 43844-00100 Nairobi, Kenya</p>
              <p className="pt-1.5 text-neutral-400">
                <span className="text-neutral-500 font-semibold">Email:</span>{" "}
                <a href="mailto:esa.kenyattauniv@gmail.com" className="text-neutral-300 hover:text-white transition-colors underline">
                  esa.kenyattauniv@gmail.com
                </a>
              </p>
              <p className="text-neutral-400">
                <span className="text-neutral-500 font-semibold">Contacts:</span>{" "}
                <a href="tel:+254113790205" className="hover:text-white transition-colors">
                  +254 113 790 205
                </a>{" "}
                ·{" "}
                <a href="tel:+254700850287" className="hover:text-white transition-colors">
                  +254 700 850 287
                </a>
              </p>
            </div>
          </div>

          {/* Academic Gateway */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Resources
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/resources?type=past_paper" className="hover:text-white transition-colors">
                  Past Examination Papers
                </Link>
              </li>
              <li>
                <Link href="/resources?type=notes" className="hover:text-white transition-colors">
                  Curated Lecture Notes
                </Link>
              </li>
              <li>
                <Link href="/timetable" className="hover:text-white transition-colors">
                  Departmental Timetables
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  Upcoming Events & Summits
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Chapters & Clubs */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Chapters & Clubs
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/clubs/ieee-ku" className="hover:text-white transition-colors">
                  IEEE-KU Student Branch
                </Link>
              </li>
              <li>
                <Link href="/clubs/ku-robotics" className="hover:text-white transition-colors">
                  KU Robotics & AI Club
                </Link>
              </li>
              <li>
                <Link href="/clubs/ku-sae" className="hover:text-white transition-colors">
                  SAE Collegiate Club
                </Link>
              </li>
              <li>
                <Link href="/clubs/wie-ku" className="hover:text-white transition-colors">
                  Women in Engineering (WIE)
                </Link>
              </li>
              <li>
                <Link href="/clubs" className="text-accent hover:underline font-semibold transition-colors">
                  View All Clubs & Societies →
                </Link>
              </li>
            </ul>
          </div>

          {/* Society & Governance */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Membership & Society
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Membership Card & Status
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  Sustainability Dinner 2.0
                </Link>
              </li>
              <li>
                <Link href="/notifications" className="hover:text-white transition-colors">
                  Official Notices & Circulars
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="hover:text-white transition-colors">
                  Join Association
                </Link>
              </li>
              <li>
                <a
                  href="https://www.ku.ac.ke"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Kenyatta University</span>
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
            Dedicated to technical excellence, ethics, and innovation.
          </p>
        </div>
      </div>
    </footer>
  );
}
