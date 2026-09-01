const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

// 1. Add state
const stateOld = `const [amenities, setAmenities] = useState<string[]>(originalPayload.amenities || ['']);`;
const stateNew = `const [amenities, setAmenities] = useState<string[]>(originalPayload.amenities || ['']);\n    const [payments, setPayments] = useState<string[]>(originalPayload.payments || ['']);`;
content = content.replace(stateOld, stateNew);

// 2. Add to payload save
const payloadOld = `amenities: amenities.filter(Boolean)`;
const payloadNew = `amenities: amenities.filter(Boolean),\n                payments: payments.filter(Boolean)`;
content = content.replace(payloadOld, payloadNew);

// 3. Add to UI
const uiOld = `                        {/* Amenities */}
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
                        </div>`;
                        
const uiNew = uiOld + `

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
                        </div>`;
content = content.replace(uiOld, uiNew);
content = content.replace(uiOld.replace(/\n/g, '\r\n'), uiNew.replace(/\n/g, '\r\n'));

fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("Payments added to EditableOrgForm.");
