import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VisionMission } from "@/components/VisionMission";
import Link from "next/link";
import { ArrowRight, History, Heart, Users, Target } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us | ACADEMY OF SPORTS AND FINE ARTS",
    description: "Learn about ASFA's mission to empower underprivileged, tribal, and rural athletes in India through inclusive sports training and social integration.",
};

export default function AboutPage() {
    return (
        <main className="min-h-screen">
            <Navbar />

            {/* Header */}
            <section className="pt-28 pb-12 md:pt-40 md:pb-20 bg-gray-950 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 opacity-30" />
                <div className="container mx-auto px-6 relative z-10">
                    <h1 className="text-5xl md:text-8xl font-black mb-8 italic uppercase tracking-tighter text-white leading-none">
                        About Our <span className="text-primary italic">Academy</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed italic font-medium">
                        Empowering underprivileged and differently-abled athletes across India since 2017.
                    </p>
                </div>
            </section>

            {/* Intro Section */}
            <section className="py-8 md:py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-12 md:gap-24 items-center">
                        <div className="lg:w-1/2" data-aos="fade-right">
                            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-6 block">Our Legacy</span>
                            <h2 className="text-4xl md:text-6xl font-black mb-10 italic uppercase tracking-tighter text-gray-950 leading-tight">The Academy of Sports <br /> <span className="text-primary italic">& Fine Arts</span></h2>
                            <p className="text-gray-500 text-xl leading-relaxed mb-8 font-medium italic">
                                Academy of Sports and Fine Arts (ASFA) was started to overcome the lack of opportunities and awareness among sports talent in India, especially among poor and tribal youth.
                            </p>
                            <p className="text-gray-500 text-xl leading-relaxed mb-12 font-medium italic">
                                We believe that sports is a fundamental right for all. Our academy doesn't just focus on coaching; we focus on social integration and economic development.
                            </p>
                            <div className="grid grid-cols-2 gap-10">
                                <div className="p-5 md:p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 text-center">
                                    <div className="text-4xl md:text-6xl font-black text-primary mb-2 italic tracking-tighter">2017</div>
                                    <div className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Year Founded</div>
                                </div>
                                <div className="p-5 md:p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 text-center">
                                    <div className="text-4xl md:text-6xl font-black text-primary mb-2 italic tracking-tighter">80+</div>
                                    <div className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Jobs Secured</div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/2 grid grid-cols-2 gap-8" data-aos="fade-left">
                            <div className="space-y-8">
                                <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
                                    <img src="/memories-1.png" className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Academy activity" />
                                </div>
                                <div className="bg-primary p-6 md:p-10 rounded-[3rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
                                    <Heart className="mb-4 md:mb-6 text-white animate-pulse" size={40} />
                                    <h4 className="font-black text-lg md:text-2xl mb-2 uppercase tracking-tight italic leading-tight">100% Free Coaching</h4>
                                    <p className="text-xs md:text-sm font-bold opacity-80 italic">Direct training for rural youth.</p>
                                </div>
                            </div>
                            <div className="space-y-8 pt-16">
                                <div className="bg-gray-950 p-6 md:p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
                                    <Users className="mb-4 md:mb-6 text-primary" size={40} />
                                    <h4 className="font-black text-lg md:text-2xl mb-2 uppercase tracking-tight italic leading-tight">Inclusive Focus</h4>
                                    <p className="text-xs md:text-sm font-bold opacity-80 italic">Specialized Para-training.</p>
                                </div>
                                <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
                                    <img src="/memories-2.png" className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Athlete medals" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <VisionMission />

            {/* Navigation Sections */}
            <section className="py-8 md:py-24 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { href: "/about", icon: Users, title: "Founder Profile", desc: "Learn about Nenavath Vinod and his dedication to Indian sports." },
                            { href: "/about", icon: Target, title: "Vision & Mission", desc: "Deep dive into our core values and the impact we create." },
                            { href: "/about", icon: History, title: "Board Members", desc: "Meet the team driving ASFA toward an Olympic future." }
                        ].map((item, i) => (
                            <Link key={i} href={item.href} className="group bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-gray-200/50 hover:shadow-primary/5 transition-all border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                                <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-primary mb-10 group-hover:scale-110 transition-transform shadow-inner">
                                    <item.icon size={32} />
                                </div>
                                <h3 className="text-3xl font-black mb-4 italic uppercase tracking-tighter text-gray-950">{item.title}</h3>
                                <p className="text-gray-500 mb-10 font-medium italic">{item.desc}</p>
                                <span className="text-primary font-black uppercase tracking-widest text-xs flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                                    View Details <ArrowRight size={18} />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
