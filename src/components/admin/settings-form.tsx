"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateWebsiteSettings } from "@/server/actions/admin";

export interface SettingsState {
  siteName: string;
  tagline: string;
  supportEmail: string;
  contactPhone: string;
  contactAddress: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  planName: string;
  planPriceInr: number;
  planDurationDays: number;
  cashfreeEnv: "PRODUCTION" | "SANDBOX";
  cashfreeAppId: string;
  privacyPolicy: string;
  termsOfService: string;
}

export function SettingsForm({ initial }: { initial: SettingsState }) {
  const router = useRouter();
  const [state, setState] = React.useState<SettingsState>(initial);
  const [pending, start] = React.useTransition();

  function set<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function save() {
    start(async () => {
      const res = await updateWebsiteSettings({
        ...state,
        planPriceInr: Number(state.planPriceInr),
        planDurationDays: Number(state.planDurationDays),
      });
      if (res.ok) {
        toast.success(res.message || "Saved");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to save");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Brand & contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Site name">
                <Input value={state.siteName} onChange={(e) => set("siteName", e.target.value)} />
              </Field>
              <Field label="Tagline">
                <Input value={state.tagline} onChange={(e) => set("tagline", e.target.value)} />
              </Field>
              <Field label="Support email">
                <Input value={state.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
              </Field>
              <Field label="Contact phone">
                <Input value={state.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
              </Field>
              <Field label="Contact address" className="sm:col-span-2">
                <Input value={state.contactAddress} onChange={(e) => set("contactAddress", e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan">
          <Card>
            <CardHeader>
              <CardTitle>Subscription plan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field label="Plan name">
                <Input value={state.planName} onChange={(e) => set("planName", e.target.value)} />
              </Field>
              <Field label="Price (₹)">
                <Input
                  type="number"
                  value={state.planPriceInr}
                  onChange={(e) => set("planPriceInr", Number(e.target.value))}
                />
              </Field>
              <Field label="Duration (days)">
                <Input
                  type="number"
                  value={state.planDurationDays}
                  onChange={(e) => set("planDurationDays", Number(e.target.value))}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Meta title">
                <Input value={state.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
              </Field>
              <Field label="Meta description">
                <Textarea value={state.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
              </Field>
              <Field label="Keywords (comma separated)">
                <Input value={state.seoKeywords} onChange={(e) => set("seoKeywords", e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Cashfree</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Environment">
                <Select
                  value={state.cashfreeEnv}
                  onValueChange={(v) => set("cashfreeEnv", v as SettingsState["cashfreeEnv"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCTION">Production</SelectItem>
                    <SelectItem value="SANDBOX">Sandbox</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cashfree App ID">
                <Input value={state.cashfreeAppId} onChange={(e) => set("cashfreeAppId", e.target.value)} />
              </Field>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                For security, the secret key and webhook secret are read from
                environment variables and can&apos;t be edited here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-medium">Enable maintenance mode</p>
                  <p className="text-sm text-muted-foreground">
                    Show a maintenance notice to visitors.
                  </p>
                </div>
                <Switch
                  checked={state.maintenanceMode}
                  onCheckedChange={(v) => set("maintenanceMode", v)}
                />
              </div>
              <Field label="Maintenance message">
                <Textarea
                  value={state.maintenanceMessage}
                  onChange={(e) => set("maintenanceMessage", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle>Legal pages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Privacy policy">
                <Textarea
                  className="min-h-[160px]"
                  value={state.privacyPolicy}
                  onChange={(e) => set("privacyPolicy", e.target.value)}
                />
              </Field>
              <Field label="Terms of service">
                <Textarea
                  className="min-h-[160px]"
                  value={state.termsOfService}
                  onChange={(e) => set("termsOfService", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="gradient" onClick={save} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save settings
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
    </div>
  );
}
