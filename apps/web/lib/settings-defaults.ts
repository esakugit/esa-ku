export interface HeroSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroEyebrow: string;
  heroImageUrl: string;
  heroBadgeText: string;
  announcementNotice: string;
}

export interface FooterSettings {
  email: string;
  phone1: string;
  phone2: string;
  paybillNumber: string;
  accountNumber: string;
  paybillName: string;
  officeLocation: string;
  postalAddress: string;
  academicYear: string;
}

export interface ExComMember {
  name: string;
  role: string;
  department: string;
  photoBlobUrl: string;
}

export interface PatronSettings {
  name: string;
  title: string;
  department: string;
  message: string;
  photoBlobUrl: string;
}

export interface GovernanceSettings {
  academicYear: string;
  patron: PatronSettings;
  members: ExComMember[];
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  date: string;
  imageUrl: string;
  caption: string;
}

export const DEFAULT_HERO: HeroSettings = {
  heroTitle: "Advancing Engineering Excellence, Innovation & Technical Leadership",
  heroSubtitle:
    "The official academic and professional society representing Kenyatta University engineering students across all accredited engineering departments and disciplines in the School of Engineering and Architecture.",
  heroEyebrow: "Kenyatta University · School of Engineering & Architecture",
  heroImageUrl: "/hero-event.svg",
  heroBadgeText: "Official ESA Student Society",
  announcementNotice: "",
};

export const DEFAULT_FOOTER: FooterSettings = {
  email: "esa.kenyattauniv@gmail.com",
  phone1: "+254 113 790 205",
  phone2: "+254 700 850 287",
  paybillNumber: "625625",
  accountNumber: "01521260661100",
  paybillName: "ESA Kenyatta University",
  officeLocation: "School of Engineering & Architecture, Main Campus, Thika Road",
  postalAddress: "P.O. Box 43844-00100 Nairobi, Kenya",
  academicYear: "2025/2026",
};

export const DEFAULT_GOVERNANCE: GovernanceSettings = {
  academicYear: "2025/2026 Academic Year",
  patron: {
    name: "Dr. Eng. Shadrack Mambo",
    title: "Staff Patron & Senior Lecturer",
    department: "School of Engineering & Architecture",
    message:
      "Empowering Kenyatta University engineering students through technical rigor, innovation, and ethical leadership.",
    photoBlobUrl: "",
  },
  members: [
    {
      name: "Brian Otieno",
      role: "President / Chairperson",
      department: "Civil Engineering",
      photoBlobUrl: "",
    },
    {
      name: "Faith Chebet",
      role: "Vice Chairperson",
      department: "Electrical & Electronic Engineering",
      photoBlobUrl: "",
    },
    {
      name: "Kelvin Mwangi",
      role: "Secretary General",
      department: "Mechanical Engineering",
      photoBlobUrl: "",
    },
    {
      name: "Sharon Njeri",
      role: "Treasurer",
      department: "Aerospace & Mechatronics",
      photoBlobUrl: "",
    },
    {
      name: "Emmanuel Kiprono",
      role: "Organizing Secretary",
      department: "Agricultural & Biosystems",
      photoBlobUrl: "",
    },
    {
      name: "David Kimani",
      role: "Academic & Tech Director",
      department: "Biomedical & Computing",
      photoBlobUrl: "",
    },
  ],
};

export const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: "1",
    title: "Annual Engineering Summit & Expo",
    category: "Flagship Summit",
    date: "November 2025",
    imageUrl: "/hero-event.svg",
    caption:
      "Students and industry delegates gathered at the Bishop Square complex for keynote technical addresses and student innovation exhibitions.",
  },
  {
    id: "2",
    title: "Robotics & Micro-controller Hackathon",
    category: "Technical Competition",
    date: "October 2025",
    imageUrl: "/hero-event.svg",
    caption:
      "Multi-departmental prototyping teams competing in autonomous robotics and sensor programming at the ELB Laboratories.",
  },
  {
    id: "3",
    title: "Kenya Power Substation & Grid Tour",
    category: "Industrial Immersion",
    date: "September 2025",
    imageUrl: "/hero-event.svg",
    caption:
      "Electrical and Mechanical cohorts on a guided high-voltage substation tour observing national grid distribution systems.",
  },
];
