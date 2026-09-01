const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

const logoBlock = `                        <div>
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
                        </div>`;

const imageBlock = `                        <div>
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
                        </div>`;

const fullBlockOld = logoBlock + '\n' + imageBlock;
const fullBlockNew = imageBlock + '\n' + logoBlock;

content = content.replace(fullBlockOld, fullBlockNew);
content = content.replace(fullBlockOld.replace(/\n/g, '\r\n'), fullBlockNew.replace(/\n/g, '\r\n'));

fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("Blocks swapped.");
