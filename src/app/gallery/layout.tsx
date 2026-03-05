import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gallery | ACADEMY OF SPORTS AND FINE ARTS",
    description: "A visual journey of ASFA athletes' achievements, dedication, and success across national and state levels.",
};

export default function GalleryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
