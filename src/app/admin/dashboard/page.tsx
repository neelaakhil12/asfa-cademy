"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    LogOut, Upload, Trash2, Image as ImageIcon, Video, Trophy, Users,
    Plus, X, CheckCircle2, AlertCircle, ChevronDown, Loader2,
    FileText, User, Pencil, Save, Settings, Phone, Mail, MapPin, Instagram, RefreshCw
} from "lucide-react";

const galleryCategories = [
    { id: "national", label: "National Medalists" },
    { id: "deaf-national", label: "National Medalists (Deaf)" },
    { id: "state", label: "State Medalists" },
    { id: "district", label: "District Medalists (Orphans)" },
    { id: "memories", label: "Memories" },
    { id: "videos", label: "Videos" },
];

interface Update {
    id: string; title: string; date: string; category: string;
    description: string; details?: string; coachQuote?: string; icon: string;
}
interface Athlete { id: string; name: string; role: string; achievement: string; image: string; }
interface TeamMember { id: string; name: string; role: string; image: string; }
interface ContactInfo { id?: string; email: string; phone: string; address: string; instagram: string; }

type Tab = "gallery" | "updates" | "athletes" | "team" | "settings";

const MsgBox = ({ msg }: { msg: { type: "success" | "error"; text: string } | null }) => {
    if (!msg) return null;
    return (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{msg.text}
        </div>
    );
};

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm";
const labelCls = "text-xs font-bold uppercase tracking-widest text-gray-500";

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("gallery");

    // Settings / Contact
    const [contactInfo, setContactInfo] = useState<ContactInfo>({ email: "", phone: "", address: "", instagram: "" });
    const [settingsMsg, setSettingsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [syncSaving, setSyncSaving] = useState(false);
    const [syncLogs, setSyncLogs] = useState<string[]>([]);

    // Gallery
    const [selectedCategory, setSelectedCategory] = useState("national");
    const [uploads, setUploads] = useState<Record<string, string[]>>({});
    const [uploading, setUploading] = useState(false);
    const [galleryMsg, setGalleryMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Updates
    const [updates, setUpdates] = useState<Update[]>([]);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);
    const [updatesMsg, setUpdatesMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const emptyUpdate = { title: "", date: "", category: "Achievement", description: "", details: "", coachQuote: "", icon: "Trophy" };
    const [updateForm, setUpdateForm] = useState(emptyUpdate);

    // Athletes
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [showAthleteForm, setShowAthleteForm] = useState(false);
    const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
    const [athleteMsg, setAthleteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const emptyAthlete = { name: "", role: "Para Athlete", achievement: "", image: "" };
    const [athleteForm, setAthleteForm] = useState(emptyAthlete);
    const athleteFileRef = useRef<HTMLInputElement>(null);
    const [athleteUploading, setAthleteUploading] = useState(false);

    // Team
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [showTeamForm, setShowTeamForm] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [teamMsg, setTeamMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const emptyMember = { name: "", role: "", image: "" };
    const [memberForm, setMemberForm] = useState(emptyMember);
    const teamFileRef = useRef<HTMLInputElement>(null);
    const [teamUploading, setTeamUploading] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const resG = await fetch("/api/admin/gallery");
                if (resG.status === 401) { router.push("/admin"); return; }
                const uploadsData = await resG.json();
                setUploads(uploadsData);
            } catch (e) { console.error("Gallery fetch failed", e); }

            try {
                const resU = await fetch("/api/admin/updates");
                const updatesData = await resU.json();
                if (Array.isArray(updatesData)) setUpdates(updatesData);
                else throw new Error("Invalid updates data");
            } catch (e: any) { setUpdatesMsg({ type: "error", text: "Failed to load updates: " + (e.message || "Network error") }); }

            try {
                const resA = await fetch("/api/admin/athletes");
                const athletesData = await resA.json();
                if (Array.isArray(athletesData)) setAthletes(athletesData);
                else throw new Error("Invalid athletes data");
            } catch (e: any) { setAthleteMsg({ type: "error", text: "Failed to load athletes: " + (e.message || "Network error") }); }

            try {
                const resT = await fetch("/api/admin/team");
                const teamData = await resT.json();
                if (Array.isArray(teamData)) setTeam(teamData);
                else throw new Error("Invalid team data");
            } catch (e: any) { setTeamMsg({ type: "error", text: "Failed to load team: " + (e.message || "Network error") }); }

            try {
                const resC = await fetch("/api/admin/settings/contact");
                const contactData = await resC.json();
                if (contactData && contactData.email) setContactInfo(contactData);
            } catch (e) { console.error("Contact fetch failed", e); }
        };
        fetchAll();
    }, [router]);

    const handleLogout = async () => { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin"); };

    const uploadFile = async (file: File, category: string): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file); formData.append("category", category);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        return (await res.json()).path;
    };

    // --- Gallery ---
    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files; if (!files?.length) return;
        setUploading(true); setGalleryMsg(null);
        try {
            for (const file of Array.from(files)) {
                const p = await uploadFile(file, selectedCategory);
                setUploads(prev => ({ ...prev, [selectedCategory]: [...(prev[selectedCategory] || []), p] }));
            }
            setGalleryMsg({ type: "success", text: `${files.length} file(s) uploaded!` });
        } catch { setGalleryMsg({ type: "error", text: "Upload failed." }); }
        finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
    };

    const handleDeleteFile = async (filePath: string) => {
        if (!confirm("Delete this file?")) return;
        setGalleryMsg(null);
        try {
            const res = await fetch("/api/admin/gallery", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filePath })
            });
            if (res.ok) {
                setUploads(prev => ({ ...prev, [selectedCategory]: (prev[selectedCategory] || []).filter(f => f !== filePath) }));
                setGalleryMsg({ type: "success", text: "File deleted permanently!" });
            } else {
                const err = await res.json();
                setGalleryMsg({ type: "error", text: err.error || "Delete failed." });
            }
        } catch {
            setGalleryMsg({ type: "error", text: "Network error. Delete failed." });
        }
    };

    // --- Updates ---
    const startEditUpdate = (u: Update) => {
        setEditingUpdate(u);
        setUpdateForm({
            title: u.title,
            date: u.date,
            category: u.category,
            description: u.description,
            details: u.details || "",
            coachQuote: u.coachQuote || "",
            icon: u.icon
        });
        setShowUpdateForm(true);
    };
    const cancelUpdateForm = () => { setShowUpdateForm(false); setEditingUpdate(null); setUpdateForm(emptyUpdate); };

    const handleSaveUpdate = async (e: React.FormEvent) => {
        e.preventDefault(); setUpdatesMsg(null);
        const method = editingUpdate ? "PUT" : "POST";
        const body = editingUpdate ? { ...updateForm, id: editingUpdate.id } : updateForm;
        const res = await fetch("/api/admin/updates", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) {
            const saved = await res.json();
            if (editingUpdate) setUpdates(prev => prev.map(u => u.id === saved.id ? saved : u));
            else setUpdates(prev => [saved, ...prev]);
            cancelUpdateForm();
            setUpdatesMsg({ type: "success", text: editingUpdate ? "Update saved!" : "Update posted!" });
        } else {
            const err = await res.json();
            setUpdatesMsg({ type: "error", text: err.error || "Failed to save." });
        }
    };

    const handleDeleteUpdate = async (id: string) => {
        if (!confirm("Delete this update?")) return;
        setUpdatesMsg(null);
        try {
            const res = await fetch("/api/admin/updates", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                setUpdates(prev => prev.filter(u => u.id !== id));
                setUpdatesMsg({ type: "success", text: "Update deleted permanently!" });
            } else {
                const err = await res.json();
                setUpdatesMsg({ type: "error", text: err.error || "Delete failed." });
            }
        } catch {
            setUpdatesMsg({ type: "error", text: "Network error. Delete failed." });
        }
    };

    // --- Athletes ---
    const startEditAthlete = (a: Athlete) => { setEditingAthlete(a); setAthleteForm({ ...a }); setShowAthleteForm(true); };
    const cancelAthleteForm = () => { setShowAthleteForm(false); setEditingAthlete(null); setAthleteForm(emptyAthlete); };

    const handleAthletePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setAthleteUploading(true);
        try { const p = await uploadFile(file, "athletes"); setAthleteForm(prev => ({ ...prev, image: p })); }
        catch { setAthleteMsg({ type: "error", text: "Photo upload failed." }); }
        finally { setAthleteUploading(false); }
    };

    const handleSaveAthlete = async (e: React.FormEvent) => {
        e.preventDefault(); setAthleteMsg(null);
        const method = editingAthlete ? "PUT" : "POST";
        const body = editingAthlete ? { ...athleteForm, id: editingAthlete.id } : athleteForm;
        const res = await fetch("/api/admin/athletes", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) {
            const saved = await res.json();
            if (editingAthlete) setAthletes(prev => prev.map(a => a.id === saved.id ? saved : a));
            else setAthletes(prev => [...prev, saved]);
            cancelAthleteForm();
            setAthleteMsg({ type: "success", text: editingAthlete ? "Athlete updated!" : "Athlete added!" });
        } else {
            const err = await res.json();
            setAthleteMsg({ type: "error", text: err.error || "Failed to save." });
        }
    };

    const handleDeleteAthlete = async (id: string) => {
        if (!confirm("Remove this athlete?")) return;
        setAthleteMsg(null);
        try {
            const res = await fetch("/api/admin/athletes", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                setAthletes(prev => prev.filter(a => a.id !== id));
                setAthleteMsg({ type: "success", text: "Athlete removed permanently!" });
            } else {
                const err = await res.json();
                setAthleteMsg({ type: "error", text: err.error || "Delete failed." });
            }
        } catch {
            setAthleteMsg({ type: "error", text: "Network error. Delete failed." });
        }
    };

    // --- Team ---
    const startEditMember = (m: TeamMember) => { setEditingMember(m); setMemberForm({ ...m }); setShowTeamForm(true); };
    const cancelMemberForm = () => { setShowTeamForm(false); setEditingMember(null); setMemberForm(emptyMember); };

    const handleTeamPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setTeamUploading(true);
        try { const p = await uploadFile(file, "team"); setMemberForm(prev => ({ ...prev, image: p })); }
        catch { setTeamMsg({ type: "error", text: "Photo upload failed." }); }
        finally { setTeamUploading(false); }
    };

    const handleSaveMember = async (e: React.FormEvent) => {
        e.preventDefault(); setTeamMsg(null);
        const method = editingMember ? "PUT" : "POST";
        const body = editingMember ? { ...memberForm, id: editingMember.id } : memberForm;
        const res = await fetch("/api/admin/team", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) {
            const saved = await res.json();
            if (editingMember) setTeam(prev => prev.map(m => m.id === saved.id ? saved : m));
            else setTeam(prev => [...prev, saved]);
            cancelMemberForm();
            setTeamMsg({ type: "success", text: editingMember ? "Member updated!" : "Member added!" });
        } else {
            const err = await res.json();
            setTeamMsg({ type: "error", text: err.error || "Failed to save." });
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm("Remove this team member?")) return;
        setTeamMsg(null);
        try {
            const res = await fetch("/api/admin/team", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                setTeam(prev => prev.filter(m => m.id !== id));
                setTeamMsg({ type: "success", text: "Member removed permanently!" });
            } else {
                const err = await res.json();
                setTeamMsg({ type: "error", text: err.error || "Delete failed." });
            }
        } catch {
            setTeamMsg({ type: "error", text: "Network error. Delete failed." });
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault(); setSettingsMsg(null); setSettingsSaving(true);
        try {
            const res = await fetch("/api/admin/settings/contact", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contactInfo) });
            if (res.ok) {
                const updated = await res.json();
                setContactInfo(updated);
                setSettingsMsg({ type: "success", text: "Contact details updated!" });
            } else {
                const errData = await res.json().catch(() => ({}));
                const errMsg = errData?.error || `Server error (${res.status})`;
                setSettingsMsg({ type: "error", text: errMsg });
            }
        } catch (err: any) {
            setSettingsMsg({ type: "error", text: err?.message || "Network error – could not reach server." });
        }
        finally { setSettingsSaving(false); }
    };

    const handleSyncData = async () => {
        if (!confirm("This will overwrite existing data in Supabase with local JSON data. Sync now?")) return;
        setSyncSaving(true); setSyncLogs([]);
        try {
            const res = await fetch("/api/admin/sync", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setSyncLogs(data.logs || ["Sync successful! Refresh to see changes."]);
                alert("Data sync completed successfully!");
            } else {
                setSyncLogs(data.logs || ["Sync failed."]);
                alert("Data sync failed: " + data.error);
            }
        } catch (e: any) {
            setSyncLogs([`Error: ${e.message}`]);
            alert("Network error during sync.");
        } finally { setSyncSaving(false); }
    };

    const isVideo = (p: string) => /\.(mp4|mov|webm|avi)$/i.test(p);

    const tabs = [
        { id: "gallery" as Tab, label: "Gallery", icon: ImageIcon },
        { id: "updates" as Tab, label: "Event Updates", icon: FileText },
        { id: "athletes" as Tab, label: "Sponsor Athletes", icon: Trophy },
        { id: "team" as Tab, label: "Team", icon: Users },
        { id: "settings" as Tab, label: "Settings", icon: Settings },
    ];

    return (
        <main className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-white text-sm">A</div>
                    <div>
                        <h1 className="font-black uppercase tracking-tight text-white text-lg leading-none">ASFA Admin</h1>
                        <p className="text-gray-500 text-xs">Content Management Panel</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors">
                    <LogOut size={16} /> Logout
                </button>
            </header>

            {/* Tabs */}
            <div className="border-b border-gray-800 bg-gray-900 px-6 overflow-x-auto">
                <div className="flex gap-1 max-w-5xl mx-auto min-w-max">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
                            <tab.icon size={16} />{tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10">

                {/* ===== GALLERY ===== */}
                {activeTab === "gallery" && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">Gallery Manager</h2>
                            <p className="text-gray-500 text-sm">Upload images and videos to any gallery category.</p>
                        </div>
                        <div className="bg-gray-900 rounded-[2rem] p-8 border border-gray-800 space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={labelCls}>Category</label>
                                    <div className="relative">
                                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className={inputCls + " appearance-none pr-10"}>
                                            {galleryCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelCls}>Upload Files</label>
                                    <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleGalleryUpload} className="hidden" />
                                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                                        {uploading ? <><Loader2 size={16} className="animate-spin" />Uploading...</> : <><Upload size={16} />Choose & Upload</>}
                                    </button>
                                </div>
                            </div>
                            <MsgBox msg={galleryMsg} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
                            {galleryCategories.find(c => c.id === selectedCategory)?.label}
                            <span className="ml-2 text-primary">({(uploads[selectedCategory] || []).length} files)</span>
                        </h3>
                        {(uploads[selectedCategory] || []).length === 0 ? (
                            <div className="text-center py-16 text-gray-700 border-2 border-dashed border-gray-800 rounded-[2rem]">
                                <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="font-bold">No files uploaded yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {(uploads[selectedCategory] || []).map(file => (
                                    <div key={file} className="group relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 aspect-square">
                                        {isVideo(file) ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center">
                                                <Video size={32} className="text-primary mb-2" />
                                                <p className="text-xs text-gray-400 px-2 truncate w-full text-center">{file.split("/").pop()}</p>
                                            </div>
                                        ) : (
                                            <Image
                                                src={file}
                                                alt=""
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                                className="w-full h-full object-cover object-top"
                                            />
                                        )}
                                        <button onClick={() => handleDeleteFile(file)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ===== UPDATES ===== */}
                {activeTab === "updates" && (
                    <div className="space-y-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">Event Updates</h2>
                                <p className="text-gray-500 text-sm">Post updates visible on the homepage.</p>
                            </div>
                            <button onClick={() => { cancelUpdateForm(); setShowUpdateForm(f => !f); }}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all">
                                {showUpdateForm && !editingUpdate ? <><X size={16} />Cancel</> : <><Plus size={16} />New Update</>}
                            </button>
                        </div>
                        <MsgBox msg={updatesMsg} />
                        {showUpdateForm && (
                            <form onSubmit={handleSaveUpdate} className="bg-gray-900 rounded-[2rem] p-8 border border-gray-800 space-y-4">
                                <h3 className="text-lg font-black uppercase tracking-tighter text-primary">
                                    {editingUpdate ? "Edit Update" : "New Update"}
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className={labelCls}>Title *</label>
                                        <input value={updateForm.title} onChange={e => setUpdateForm(p => ({ ...p, title: e.target.value }))} required className={inputCls} placeholder="Championship Victory" /></div>
                                    <div className="space-y-1"><label className={labelCls}>Date *</label>
                                        <input value={updateForm.date} onChange={e => setUpdateForm(p => ({ ...p, date: e.target.value }))} required className={inputCls} placeholder="March 2024" /></div>
                                </div>
                                <div className="space-y-1"><label className={labelCls}>Short Description *</label>
                                    <textarea value={updateForm.description} onChange={e => setUpdateForm(p => ({ ...p, description: e.target.value }))} required rows={3} className={inputCls + " resize-none"} placeholder="Brief summary..." /></div>
                                <div className="space-y-1"><label className={labelCls}>Full Details <span className="text-gray-600 normal-case">(expanded view)</span></label>
                                    <textarea value={updateForm.details} onChange={e => setUpdateForm(p => ({ ...p, details: e.target.value }))} rows={4} className={inputCls + " resize-none"} placeholder="Full story, medals won..." /></div>
                                <div className="space-y-1"><label className={labelCls}>Coach Quote <span className="text-gray-600 normal-case">(optional)</span></label>
                                    <input value={updateForm.coachQuote} onChange={e => setUpdateForm(p => ({ ...p, coachQuote: e.target.value }))} className={inputCls} placeholder="A quote from the coach..." /></div>
                                <div className="flex gap-3">
                                    <button type="submit" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all">
                                        <Save size={14} />{editingUpdate ? "Save Changes" : "Post Update"}
                                    </button>
                                    <button type="button" onClick={cancelUpdateForm} className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-all text-sm">Cancel</button>
                                </div>
                            </form>
                        )}
                        <div className="space-y-4">
                            {updates.length === 0 ? (
                                <div className="text-center py-16 text-gray-700 border-2 border-dashed border-gray-800 rounded-[2rem]">
                                    <FileText size={40} className="mx-auto mb-3 opacity-30" /><p className="font-bold">No updates yet</p>
                                </div>
                            ) : updates.map(u => (
                                <div key={u.id} className="group bg-gray-900 rounded-2xl p-6 border border-gray-800 flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 min-w-0">
                                        <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center shrink-0"><Trophy size={20} /></div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{u.category}</span>
                                                <span className="text-gray-500 text-xs">{u.date}</span>
                                            </div>
                                            <h4 className="font-black italic uppercase tracking-tight text-white">{u.title}</h4>
                                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{u.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                        <button onClick={() => startEditUpdate(u)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Pencil size={15} /></button>
                                        <button onClick={() => handleDeleteUpdate(u.id)} className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={15} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== ATHLETES ===== */}
                {activeTab === "athletes" && (
                    <div className="space-y-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">Sponsor Athletes</h2>
                                <p className="text-gray-500 text-sm">Manage athletes on the Sponsor an Athlete page.</p>
                            </div>
                            <button onClick={() => { cancelAthleteForm(); setShowAthleteForm(f => !f); }}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all">
                                {showAthleteForm && !editingAthlete ? <><X size={16} />Cancel</> : <><Plus size={16} />Add Athlete</>}
                            </button>
                        </div>
                        <MsgBox msg={athleteMsg} />
                        {showAthleteForm && (
                            <form onSubmit={handleSaveAthlete} className="bg-gray-900 rounded-[2rem] p-8 border border-gray-800 space-y-4">
                                <h3 className="text-lg font-black uppercase tracking-tighter text-primary">
                                    {editingAthlete ? "Edit Athlete" : "New Athlete"}
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className={labelCls}>Name *</label>
                                        <input value={athleteForm.name} onChange={e => setAthleteForm(p => ({ ...p, name: e.target.value }))} required className={inputCls} placeholder="Full name" /></div>
                                    <div className="space-y-1"><label className={labelCls}>Role</label>
                                        <input value={athleteForm.role} onChange={e => setAthleteForm(p => ({ ...p, role: e.target.value }))} className={inputCls} placeholder="e.g. Para Athlete" /></div>
                                </div>
                                <div className="space-y-1"><label className={labelCls}>Achievement *</label>
                                    <input value={athleteForm.achievement} onChange={e => setAthleteForm(p => ({ ...p, achievement: e.target.value }))} required className={inputCls} placeholder="e.g. National Medalist" /></div>
                                <div className="space-y-2">
                                    <label className={labelCls}>Photo {!editingAthlete && "*"}</label>
                                    <input ref={athleteFileRef} type="file" accept="image/*" onChange={handleAthletePhotoUpload} className="hidden" />
                                    <div className="flex items-center gap-4">
                                        <button type="button" onClick={() => athleteFileRef.current?.click()} disabled={athleteUploading}
                                            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                            {athleteUploading ? <><Loader2 size={14} className="animate-spin" />Uploading...</> : <><Upload size={14} />Upload Photo</>}
                                        </button>
                                        {(athleteForm.image) && (
                                            <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                                                <CheckCircle2 size={16} />
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-700">
                                                    <Image src={athleteForm.image} alt="" fill className="object-cover" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button type="submit" disabled={!editingAthlete && !athleteForm.image}
                                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50">
                                        <Save size={14} />{editingAthlete ? "Save Changes" : "Add Athlete"}
                                    </button>
                                    <button type="button" onClick={cancelAthleteForm} className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-all text-sm">Cancel</button>
                                </div>
                            </form>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {athletes.map(a => (
                                <div key={a.id} className="group relative bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 shrink-0 relative">
                                        {a.image ? <Image src={a.image} alt={a.name} fill className="object-cover object-top" /> : <User size={24} className="m-auto text-gray-600 mt-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black italic uppercase tracking-tight text-white text-sm leading-none mb-1 truncate">{a.name}</p>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{a.role}</p>
                                        <p className="text-gray-500 text-xs mt-1 truncate">{a.achievement}</p>
                                    </div>
                                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => startEditAthlete(a)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Pencil size={14} /></button>
                                        <button onClick={() => handleDeleteAthlete(a.id)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== TEAM ===== */}
                {activeTab === "team" && (
                    <div className="space-y-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">Team Manager</h2>
                                <p className="text-gray-500 text-sm">Manage team members shown on the About → Team page.</p>
                            </div>
                            <button onClick={() => { cancelMemberForm(); setShowTeamForm(f => !f); }}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all">
                                {showTeamForm && !editingMember ? <><X size={16} />Cancel</> : <><Plus size={16} />Add Member</>}
                            </button>
                        </div>
                        <MsgBox msg={teamMsg} />
                        {showTeamForm && (
                            <form onSubmit={handleSaveMember} className="bg-gray-900 rounded-[2rem] p-8 border border-gray-800 space-y-4">
                                <h3 className="text-lg font-black uppercase tracking-tighter text-primary">
                                    {editingMember ? "Edit Member" : "New Team Member"}
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className={labelCls}>Name *</label>
                                        <input value={memberForm.name} onChange={e => setMemberForm(p => ({ ...p, name: e.target.value }))} required className={inputCls} placeholder="Full name" /></div>
                                    <div className="space-y-1"><label className={labelCls}>Role *</label>
                                        <input value={memberForm.role} onChange={e => setMemberForm(p => ({ ...p, role: e.target.value }))} required className={inputCls} placeholder="e.g. Secretary" /></div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelCls}>Photo {!editingMember && "*"}</label>
                                    <input ref={teamFileRef} type="file" accept="image/*" onChange={handleTeamPhotoUpload} className="hidden" />
                                    <div className="flex items-center gap-4">
                                        <button type="button" onClick={() => teamFileRef.current?.click()} disabled={teamUploading}
                                            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                            {teamUploading ? <><Loader2 size={14} className="animate-spin" />Uploading...</> : <><Upload size={14} />Upload Photo</>}
                                        </button>
                                        {memberForm.image && (
                                            <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                                                <CheckCircle2 size={16} />
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-700">
                                                    <Image src={memberForm.image} alt="" fill className="object-cover" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button type="submit" disabled={!editingMember && !memberForm.image}
                                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50">
                                        <Save size={14} />{editingMember ? "Save Changes" : "Add Member"}
                                    </button>
                                    <button type="button" onClick={cancelMemberForm} className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-all text-sm">Cancel</button>
                                </div>
                            </form>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {team.map(m => (
                                <div key={m.id} className="group relative bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 shrink-0 relative">
                                        {m.image ? <Image src={m.image} alt={m.name} fill className="object-cover object-top" /> : <User size={24} className="m-auto text-gray-600 mt-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black italic uppercase tracking-tight text-white text-sm leading-none mb-1 truncate">{m.name}</p>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest truncate">{m.role}</p>
                                    </div>
                                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => startEditMember(m)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Pencil size={14} /></button>
                                        <button onClick={() => handleDeleteMember(m.id)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== SETTINGS ===== */}
                {activeTab === "settings" && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">General Settings</h2>
                            <p className="text-gray-500 text-sm">Update contact information and social media links appearing across the site.</p>
                        </div>

                        <div className="bg-gray-900 rounded-[2rem] p-8 border border-gray-800">
                            <form onSubmit={handleSaveSettings} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Direct Contact</h3>

                                        <div className="space-y-2">
                                            <label className={labelCls}><Mail size={12} className="inline mr-2" />Email Address</label>
                                            <input value={contactInfo.email} onChange={e => setContactInfo(p => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="academysports@gmail.com" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className={labelCls}><Phone size={12} className="inline mr-2" />Phone Numbers</label>
                                            <input value={contactInfo.phone} onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+91 XXXX XXXX" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Location & Social</h3>

                                        <div className="space-y-2">
                                            <label className={labelCls}><MapPin size={12} className="inline mr-2" />Address</label>
                                            <textarea value={contactInfo.address} onChange={e => setContactInfo(p => ({ ...p, address: e.target.value }))} rows={2} className={inputCls + " resize-none"} placeholder="Full Address" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className={labelCls}><Instagram size={12} className="inline mr-2" />Instagram URL</label>
                                            <input value={contactInfo.instagram} onChange={e => setContactInfo(p => ({ ...p, instagram: e.target.value }))} className={inputCls} placeholder="https://instagram.com/..." />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                                    <MsgBox msg={settingsMsg} />
                                    <button type="submit" disabled={settingsSaving}
                                        className="h-fit flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 ml-auto">
                                        {settingsSaving ? <><Loader2 size={16} className="animate-spin" />Saving...</> : <><Save size={16} />Save All Settings</>}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10">
                            <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                                <AlertCircle size={14} /> Important Notice
                            </h4>
                            <p className="text-gray-400 text-xs leading-relaxed italic">
                                Changing these details will update them instantly on the Contact page and in the website footer.
                                Make sure to double-check the phone numbers and email address for accuracy.
                            </p>
                        </div>

                        <div className="mt-12 pt-12 border-t border-gray-800">
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">Data Synchronization</h2>
                            <p className="text-gray-500 text-sm mb-6">Import data from local JSON files and public images to Supabase.</p>

                            <div className="bg-gray-900/50 rounded-[2rem] p-8 border border-dashed border-gray-700">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-1">
                                        <p className="text-white font-bold mb-2">Sync Initial Website Data</p>
                                        <p className="text-gray-500 text-xs leading-relaxed">
                                            This will read <strong>athletes.json</strong>, <strong>team.json</strong>, and <strong>updates.json</strong> and push them to Supabase.
                                            It also uploads images from the <strong>public/</strong> folder to Supabase Storage.
                                        </p>
                                    </div>
                                    <button onClick={handleSyncData} disabled={syncSaving}
                                        className="whitespace-nowrap flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50">
                                        {syncSaving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                        {syncSaving ? "Syncing..." : "Sync All Data"}
                                    </button>
                                </div>

                                {syncLogs.length > 0 && (
                                    <div className="mt-6 p-4 bg-black rounded-xl border border-gray-800 h-48 overflow-y-auto font-mono text-[10px] text-gray-400">
                                        {syncLogs.map((log, i) => <div key={i}>{log}</div>)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
