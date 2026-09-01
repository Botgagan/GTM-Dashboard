import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash, Image as ImageIcon, RefreshCw, Link as LinkIcon, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const API_BASE = 'http://localhost:3000/api';

export function EditableOrgForm({ scrape, onRefresh, onClose }: { scrape: any, onRefresh: () => void, onClose: () => void }) {
    const originalPayload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;
    
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    
    // Form State
    const [googleLink, setGoogleLink] = useState(originalPayload.googleBusinessLink || '');
    const [orgName, setOrgName] = useState(originalPayload.primaryOrganizer || '');
    const [phone, setPhone] = useState(originalPayload.contactInfo?.phones?.[0] || '');
    const [email, setEmail] = useState(originalPayload.contactInfo?.emails?.[0] || '');
    const [website, setWebsite] = useState(originalPayload.contactInfo?.website || '');
    const [details, setDetails] = useState(originalPayload.mappedEventData?.description || '');
    
    const [logo, setLogo] = useState(originalPayload.logo || '');
    const [images, setImages] = useState<string[]>(originalPayload.images || []);
    
    const [accessibility, setAccessibility] = useState<string[]>(originalPayload.accessibility || ['']);
    const [offerings, setOfferings] = useState<string[]>(originalPayload.offerings || ['']);
    const [amenities, setAmenities] = useState<string[]>(originalPayload.amenities || ['']);
    const [payments, setPayments] = useState<string[]>(originalPayload.payments || ['']);

    const handleArrayChange = (setter: any, arr: string[], index: number, val: string) => {
        const newArr = [...arr];
        newArr[index] = val;
        setter(newArr);
    };

    const addArrayItem = (setter: any, arr: string[]) => setter([...arr, '']);
    const removeArrayItem = (setter: any, arr: string[], index: number) => {
        const newArr = arr.filter((_, i) => i !== index);
        if (newArr.length === 0) newArr.push('');
        setter(newArr);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedPayload = {
                ...originalPayload,
                primaryOrganizer: orgName,
                contactInfo: {
                    ...originalPayload.contactInfo,
                    phones: phone ? [phone] : [],
                    emails: email ? [email] : [],
                    website
                },
                mappedEventData: {
                    ...originalPayload.mappedEventData,
                    description: details
                },
                googleBusinessLink: googleLink,
                logo,
                images,
                accessibility: accessibility.filter(Boolean),
                offerings: offerings.filter(Boolean),
                amenities: amenities.filter(Boolean),
                payments: payments.filter(Boolean)
            };

            const res = await fetch(`${API_BASE}/pending-scrapes/${scrape.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload: updatedPayload })
            });

            if (res.ok) {
                onRefresh();
                onClose();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const uploadToCloudinary = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'hindevent_scraper_uploads');
        
        try {
            const response = await fetch('https://api.cloudinary.com/v1_1/dyqdob5ab/image/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error("Error uploading to Cloudinary:", error);
            return null;
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingLogo(true);
        const url = await uploadToCloudinary(file);
        if (url) setLogo(url);
        setIsUploadingLogo(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingImage(true);
        const url = await uploadToCloudinary(file);
        if (url) setImages([url]);
        setIsUploadingImage(false);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch(`${API_BASE}/sync-google-business`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgName: orgName, googleBusinessLink: googleLink })
            });
            if (!res.ok) {
                alert("Failed to sync. Is the backend running?");
                return;
            }
            const data = await res.json();
            if (data.error) {
                alert("Error from server: " + data.error);
                return;
            }
            if (data.orgName) setOrgName(data.orgName);
            if (data.phone) setPhone(data.phone);
            if (data.email) setEmail(data.email);
            if (data.websiteUrl) setWebsite(data.websiteUrl);
            if (data.description) setDetails(data.description);
            if (data.googleBusinessLink) setGoogleLink(data.googleBusinessLink);
            if (data.logo) setLogo(data.logo);
            if (data.images && data.images.length > 0) setImages(data.images);
            alert("Auto-fill complete!");
        } catch (e) {
            console.error(e);
            alert("Auto-fill failed. Check console.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 bg-transparent shadow-none" >
                <div className="bg-white rounded-lg flex flex-col w-full h-full border">
                <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-white z-10 flex flex-row items-center justify-between rounded-t-lg">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600"/> Edit Organization Profile
                    </DialogTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="h-8">Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="h-8">
                            {isSaving ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : null}
                            Save Details
                        </Button>
                    </div>
                </DialogHeader>
                
                <div className="p-6 space-y-8 bg-slate-50/50 rounded-b-lg">
                    
                    {/* Google Business Section */}
                    <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold text-sm">Auto fill details using Google Business profile</h3>
                                <p className="text-sm text-muted-foreground mt-1">Paste your Google Business Profile link to auto fill the Sub community's profile</p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">G</div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <div className="relative flex-1">
                                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    className="pl-9 h-10" 
                                    placeholder="Google Business Profile link" 
                                    value={googleLink}
                                    onChange={e => setGoogleLink(e.target.value)}
                                />
                            </div>
                            <Button variant="secondary" className="h-10 px-4 whitespace-nowrap" onClick={handleSync} disabled={isSyncing || !googleLink}>
                                {isSyncing ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : null}
                                Auto-fill
                            </Button>
                        </div>
                    </div>

                    {/* About The Community */}
                    <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
                        <h3 className="font-semibold text-sm mb-4">About The Community</h3>
                        <Input placeholder="Sub community name *" value={orgName} onChange={e => setOrgName(e.target.value)} />
                        <Input placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
                        <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <Input placeholder="Website" value={website} onChange={e => setWebsite(e.target.value)} />
                    </div>

                    {/* Details */}
                    <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
                        <h3 className="font-semibold text-sm mb-4">Details</h3>
                        <textarea 
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Details"
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                        />
                    </div>

                    {/* Images & Logo */}
                    <div className="bg-white border rounded-lg p-5 shadow-sm flex flex-col gap-6">
                        <div>
                            <h3 className="font-semibold text-sm mb-2">Sub community Images *</h3>
                            <p className="text-xs text-muted-foreground mb-4 max-w-[250px]">Cover image for the community profile</p>
                            <label className="w-48 h-32 bg-slate-100 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground hover:bg-slate-200 transition-colors cursor-pointer overflow-hidden relative group">
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                                {isUploadingImage ? (
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                ) : images[0] ? (
                                    <>
                                        <img src={images[0]} alt="Community" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs font-medium">Change</div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2"><ImageIcon className="w-6 h-6" /><span className="text-xs font-medium">Upload Image</span></div>
                                )}
                            </label>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-2">Sub community logo *</h3>
                            <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">This image will be used as an identity in your Sub community app</p>
                            <label className="w-32 h-32 bg-slate-100 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground hover:bg-slate-200 transition-colors cursor-pointer overflow-hidden relative group">
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                                {isUploadingLogo ? (
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                ) : logo ? (
                                    <>
                                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs font-medium">Change</div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2"><ImageIcon className="w-6 h-6" /><span className="text-xs font-medium">Upload</span></div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="bg-white border rounded-lg p-5 shadow-sm space-y-6">
                        <h3 className="font-semibold text-lg border-b pb-2">Sub Community Features</h3>
                        
                        {/* Accessibility */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Accessibility</h4>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200" onClick={() => addArrayItem(setAccessibility, accessibility)}>
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                            {accessibility.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input placeholder="Accessibility details" value={item} onChange={e => handleArrayChange(setAccessibility, accessibility, i, e.target.value)} />
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 shrink-0" onClick={() => removeArrayItem(setAccessibility, accessibility, i)}>
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Offerings */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Offerings</h4>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200" onClick={() => addArrayItem(setOfferings, offerings)}>
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                            {offerings.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input placeholder="Offerings details" value={item} onChange={e => handleArrayChange(setOfferings, offerings, i, e.target.value)} />
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 shrink-0" onClick={() => removeArrayItem(setOfferings, offerings, i)}>
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Amenities */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Amenities</h4>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200" onClick={() => addArrayItem(setAmenities, amenities)}>
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                            {amenities.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input placeholder="Amenities details" value={item} onChange={e => handleArrayChange(setAmenities, amenities, i, e.target.value)} />
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 shrink-0" onClick={() => removeArrayItem(setAmenities, amenities, i)}>
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Payments */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Payments</h4>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200" onClick={() => addArrayItem(setPayments, payments)}>
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                            {payments.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input placeholder="Payment details" value={item} onChange={e => handleArrayChange(setPayments, payments, i, e.target.value)} />
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 shrink-0" onClick={() => removeArrayItem(setPayments, payments, i)}>
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
