import {websiteModules,type WebsiteModuleId} from "./website-industry-scope";
type Coverage={status:"partial"|"configuration_required"|"not_implemented";available:string;missing:string};
const c=(available:string,missing:string,status:Coverage["status"]="partial"):Coverage=>({status,available,missing});
const n=(missing:string)=>c("No working standalone feature in this package",missing,"not_implemented");
const matrix:Record<WebsiteModuleId,Coverage>={
 cms:c("Versioned basic page content and local editorial publishing","Complete page/section, menu, media, scheduling and CMS operations"),
 seo:c("Canonical, sitemap, robots, redirects, social metadata","Verified domain, reciprocal hreflang, factual content and indexing review"),
 media:c("Reviewed WebP hero images embedded in generated pages","Full asset library, video, crop, rights history and real image production"),
 accounts:c("Optional invitation, login, profile, suspension and recovery","Public registration, account deletion, roles and real email acceptance"),
 forms:c("Local contact inbox, review and deletion","Configurable forms, spam mitigation, assignment and retention"),
 analytics:c("Optional daily aggregate page request counts","Consent-aware visitor/conversion analytics and reporting"),
 localization:c("Single-language design and localized template labels","Translated page variants, language switch and reciprocal alternates"),
 notifications:c("Private review queue and optional owner-approved transactional emails","Actual delivery, automatic sends, retry and preference controls"),
 catalog:c("Visible items, stock and manual product editing","Search/filter, variants, product imagery and detail pages"),
 inventory:c("Single stock count, reservation, cancellation and expiry","Warehouse inventory, stock adjustment history and alerts"),
 checkout:c("Unpaid cart plus optional owner-only Stripe sandbox","Real checkout, shipping, tax, customer payment and reconciliation"),
 orders:c("Unpaid request lifecycle and stock changes","Customer-owned order access, paid settlement, receipts and returns"),
 booking:c("Slots, capacity, cancellation and manual rescheduling","Customer self-service, staff schedules, payment and automated confirmation"),
 crm:n("Contact pipeline, tasks, segmentation and consent management"),
 memberships:n("Verified paid entitlement, plan changes, billing and revocation"),
 courses:n("Lessons, enrollment, progress and assessments"),
 listings:n("Structured listings, search, filters and inquiry routing"),
 jobs:n("Vacancies, applicant records, access and secure attachments"),
 events:n("Ticketing, check-in, event records and refund lifecycle"),
 documents:n("Private files, authorization, malware scanning and retention"),
 support:n("Ticket records, replies, assignment and customer access"),
 quotes:n("Versioned estimates, acceptance and conversion"),
 delivery:n("Shipping options, carrier records and tracking"),
 reviews:n("Genuine reviews, moderation and publication"),
 locations:n("Verified branch records, hours and local metadata"),
 billing:c("Optional owner-only sandbox checkout, signed events and read-only reconciliation","Live payment, invoices, refunds and subscription entitlement"),
 accessibility:c("Responsive layouts and semantic markup","Actual keyboard, contrast and assistive technology acceptance"),
 security:c("Separate owner/member sessions, CSRF, limits and password rotation","Independent security audit, full roles, privacy controls and production review"),
 hosting:c("Runnable Node/SQLite source, no Crelavo account required","Customer supplies compatible hosting, persistent disk and HTTPS","configuration_required"),
 backup:c("Local SQLite integrity, backup and non-overwriting restore","Customer-side encrypted backups, reconciliation and tested recovery policy")
};
export function websiteDeliveryCoverage(ids:readonly WebsiteModuleId[]){
 return ids.map(id=>({id,title:websiteModules[id].title,...matrix[id],acceptance:websiteModules[id].acceptance}));
}
