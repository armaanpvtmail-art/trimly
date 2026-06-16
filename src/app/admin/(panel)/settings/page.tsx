import type { Metadata } from "next";
import { getWebsiteSettings } from "@/server/queries/admin-data";
import { SettingsForm, type SettingsState } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings · Admin", robots: { index: false } };

export default async function AdminSettingsPage() {
  const s = await getWebsiteSettings();

  const initial: SettingsState = {
    siteName: s.siteName ?? "Trimly",
    tagline: s.tagline ?? "",
    supportEmail: s.supportEmail ?? "",
    contactPhone: s.contactPhone ?? "",
    contactAddress: s.contactAddress ?? "",
    seoTitle: s.seoTitle ?? "",
    seoDescription: s.seoDescription ?? "",
    seoKeywords: s.seoKeywords ?? "",
    maintenanceMode: s.maintenanceMode,
    maintenanceMessage: s.maintenanceMessage ?? "",
    planName: s.planName ?? "Premium Monthly",
    planPriceInr: Number(s.planPriceInr),
    planDurationDays: s.planDurationDays,
    cashfreeEnv: (s.cashfreeEnv as "PRODUCTION" | "SANDBOX") ?? "PRODUCTION",
    cashfreeAppId: s.cashfreeAppId ?? "",
    privacyPolicy: s.privacyPolicy ?? "",
    termsOfService: s.termsOfService ?? "",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Website settings</h1>
        <p className="text-muted-foreground">
          Branding, plan, SEO, payments, maintenance and legal content.
        </p>
      </div>
      <SettingsForm initial={initial} />
    </div>
  );
}
