"use client";
import { useMemo, useState } from "react";
import { CATEGORIES, GROUPS, formatPack, getCategory, type Category } from "@/lib/crelavo/categoryCatalog";
export type ProductionSelection = { categoryId: string; type: string; packId: string; features: string[]; extras: Record<string, string> };
type Props = { onConfirm: (selection: ProductionSelection) => void; initialCategoryId?: string; initialSelection?: ProductionSelection; compact?: boolean };
export function AssistantPreProduction({ onConfirm, initialCategoryId, initialSelection, compact = false }: Props) {
  const [categoryId, setCategoryId] = useState(initialCategoryId || initialSelection?.categoryId || "");
  const initial = getCategory(categoryId);
  const saved = initialSelection?.categoryId === categoryId ? initialSelection : undefined;
  const [packId, setPackId] = useState(saved?.packId || (initial?.packs.length === 1 ? initial.packs[0].id : ""));
  const [features, setFeatures] = useState<string[]>(saved?.features || []);
  const [extras, setExtras] = useState<Record<string,string>>({...initial?.intake.defaults,...saved?.extras});
  const [error, setError] = useState("");
  const category = useMemo(()=>getCategory(categoryId),[categoryId]);
  function pick(next: Category) { setCategoryId(next.id); setPackId(next.packs.length===1?next.packs[0].id:""); setFeatures([]); setExtras({...next.intake.defaults}); setError(""); }
  function confirm() {
    if(!category || !category.packs.some(pack=>pack.id===packId)) { setError("Select a package first."); return; }
    const missing=category.extras.find(field=>field.required&&!extras[field.id]?.trim());
    if(missing) { setError("Select "+missing.label.toLowerCase()+" first."); return; }
    onConfirm({categoryId:category.id,type:category.type,packId,features:features.filter(id=>category.features.some(f=>f.id===id)),extras});
  }
  return <div className="aw-production-options" data-category={category?.id || "general"}>
    {!category ? <><h2>Choose production category</h2>{GROUPS.map(group=><details key={group.id}><summary>{group.label}</summary>{CATEGORIES.filter(c=>c.group===group.id).map(c=><button type="button" key={c.id} onClick={()=>pick(c)}>{c.label}</button>)}</details>)}</> : <>
      <p className="aw-options-kicker">{category.label} / Production setup</p>
      <p>{category.intake.greeting}</p>
      {!compact ? <button type="button" onClick={()=>setCategoryId("")}>Change category</button> : <small>Category is selected from the workspace menu.</small>}
      <details open><summary>Package</summary><div className="aw-options-list">{category.packs.map(pack=><button type="button" key={pack.id} aria-pressed={packId===pack.id} onClick={()=>setPackId(pack.id)}><strong>{pack.label}</strong><span>{formatPack(pack)}</span></button>)}</div></details>
      <details open><summary>{category.label} features</summary><div className="aw-options-list">{category.features.map(feature=><label className="aw-feature-choice" key={feature.id}><input type="checkbox" checked={features.includes(feature.id)} onChange={e=>setFeatures(current=>e.target.checked?[...current,feature.id]:current.filter(id=>id!==feature.id))}/><span>{feature.label}</span></label>)}</div></details>
      <details open><summary>Production options</summary><div className="aw-options-list">{category.extras.map(field=><label className="aw-option-field" key={field.id}><span>{field.label}{field.required?" *":""}</span>{field.kind==="select"?<select value={extras[field.id] || ""} onChange={e=>setExtras(current=>({...current,[field.id]:e.target.value}))}><option value="">Select option</option>{field.options?.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select>:<input value={extras[field.id] || ""} placeholder={field.placeholder} onChange={e=>setExtras(current=>({...current,[field.id]:e.target.value}))}/>}</label>)}</div></details>
      {category.id==="video_clipping"?<p role="status">Source-video clipping needs a connected analysis and extraction worker. Automatic exciting-moment selection is not available in this workspace yet. Saving options does not start extraction.</p>:null}
      <p>Features describe the production brief. Available execution depends on the connected production tools. Saving never starts paid production.</p>
      {error?<p role="alert">{error}</p>:null}
      <button type="button" className="aw-options-save" onClick={confirm}>Save production options</button>
    </>}
  </div>;
}
