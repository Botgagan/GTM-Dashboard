const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

// 1. Add upload state
const stateOld = `const [isSyncing, setIsSyncing] = useState(false);`;
const stateNew = `const [isSyncing, setIsSyncing] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);`;
content = content.replace(stateOld, stateNew);

// 2. Add uploadToCloudinary function
const handleSyncOld = `    const handleSync = async () => {`;
const uploadFunc = `    const uploadToCloudinary = async (file: File) => {
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

`;
content = content.replace(handleSyncOld, uploadFunc + handleSyncOld);

// 3. Replace the Images & Logo UI
const imagesBlockOld = `                    {/* Images & Logo */}
                    <div className="bg-white border rounded-lg p-5 shadow-sm space-y-6">
                        <div>
                            <h3 className="font-semibold text-sm mb-2">Sub community Images *</h3>
                            <Input placeholder="Image URL..." value={images[0] || ''} onChange={e => setImages([e.target.value])} className="mb-2" />
                            <div className="w-32 h-24 bg-slate-100 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground hover:bg-slate-200 transition-colors cursor-pointer overflow-hidden">
                                {images[0] ? <img src={images[0]} alt="Community" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6" />}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-2">Sub community logo *</h3>
                            <p className="text-xs text-muted-foreground mb-4">This image will be used as an identity in your Sub community app</p>
                            <Input placeholder="Logo URL..." value={logo} onChange={e => setLogo(e.target.value)} className="mb-2" />
                            <div className="w-24 h-24 bg-slate-100 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground hover:bg-slate-200 transition-colors cursor-pointer overflow-hidden">
                                {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6" />}
                            </div>
                        </div>
                    </div>`;

const imagesBlockNew = `                    {/* Images & Logo */}
                    <div className="bg-white border rounded-lg p-5 shadow-sm space-y-6 flex gap-8">
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
                    </div>`;

content = content.replace(imagesBlockOld, imagesBlockNew);
content = content.replace(imagesBlockOld.replace(/\n/g, '\r\n'), imagesBlockNew.replace(/\n/g, '\r\n'));

fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("Cloudinary image upload implemented.");
