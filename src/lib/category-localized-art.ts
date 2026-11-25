// Only verified HTTP 200 assets; never substitute a different category's illustration.
type ImageLocale="en"|"tr"|"de"|"fr"|"zh";
const images:Record<string,{src:string;alt:Record<ImageLocale,string>}>={
 admin_project:{src:"/showcase/production-dashboard.png",alt:{en:"Illustrative manufacturing dashboard with production metrics on a monitor in a factory",tr:"Fabrikadaki bir monitörde üretim ölçümlerini gösteren örnek yönetim paneli",de:"Illustratives Fertigungsdashboard mit Produktionskennzahlen auf einem Monitor in einer Fabrik",fr:"Tableau de bord industriel illustratif affichant des indicateurs de production sur un écran en usine",zh:"工厂显示器上呈现生产指标的管理仪表板示意图"}},
 studio:{src:"/showcase/ai-production-studio.webp",alt:{en:"Concept illustration of a cinematic production studio with a video editing workstation",tr:"Video düzenleme çalışma istasyonu bulunan sinematik yapım stüdyosu konsepti",de:"Konzeptillustration eines Filmproduktionsstudios mit Videoschnitt-Arbeitsplatz",fr:"Illustration conceptuelle d’un studio de production cinématographique avec poste de montage vidéo",zh:"配有视频剪辑工作站的影视制作工作室概念图"}}
};
export function localizedCategoryArt(id:string,locale:ImageLocale){const image=images[id];return image?{src:image.src,alt:image.alt[locale]}:undefined}
