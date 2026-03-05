import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Us | ACADEMY OF SPORTS AND FINE ARTS",
    description: "Get in touch with ASFA Academy. Whether you're an athlete, sponsor, or volunteer, we'd love to hear from you.",
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
