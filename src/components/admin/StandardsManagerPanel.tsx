import { useState } from "react";
import { Plus, Trash2, ExternalLink, BookOpen, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useAllStandards,
  useCreateStandard,
  useDeleteStandard,
  ISSUING_BODIES,
  type CreateStandardInput,
} from "@/hooks/useKeywordStandards";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function StandardsManagerPanel() {
  const { data: standards, isLoading } = useAllStandards();
  const createStandard = useCreateStandard();
  const deleteStandard = useDeleteStandard();

  // Fetch keywords for the selector
  const { data: keywords } = useQuery({
    queryKey: ["keywords-for-standards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technology_keywords")
        .select("id, display_name")
        .eq("is_active", true)
        .order("display_name");
      if (error) throw error;
      return data || [];
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateStandardInput>({
    keyword_id: "",
    standard_code: "",
    standard_title: "",
    issuing_body: "",
    body_type: "sdo",
  });

  const handleSubmit = async () => {
    if (!form.keyword_id || !form.standard_code || !form.standard_title || !form.issuing_body) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createStandard.mutateAsync(form);
      toast.success("Standard added");
      setForm({ keyword_id: "", standard_code: "", standard_title: "", issuing_body: "", body_type: "sdo" });
      setShowForm(false);
    } catch (err: any) {
      if (err.message?.includes("duplicate")) {
        toast.error("This standard already exists for this keyword");
      } else {
        toast.error("Failed to add standard");
      }
    }
  };

  const handleDelete = async (id: string, keywordId: string) => {
    try {
      await deleteStandard.mutateAsync({ id, keywordId });
      toast.success("Standard removed");
    } catch {
      toast.error("Failed to remove standard");
    }
  };

  // Group by keyword
  const grouped = (standards || []).reduce<Record<string, typeof standards>>((acc, s) => {
    const name = s.technology_keywords?.display_name || "Unknown";
    if (!acc[name]) acc[name] = [];
    acc[name]!.push(s);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              International Standards
            </CardTitle>
            <CardDescription>
              Manage ISO, IEC, IEEE, ETSI, ITU standards and private consortia per technology keyword.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Standard
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Form */}
        {showForm && (
          <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Technology Keyword *</Label>
                <Select value={form.keyword_id} onValueChange={(v) => setForm({ ...form, keyword_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select keyword" /></SelectTrigger>
                  <SelectContent>
                    {(keywords || []).map((kw) => (
                      <SelectItem key={kw.id} value={kw.id}>{kw.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Body Type *</Label>
                <Select value={form.body_type} onValueChange={(v: "sdo" | "consortia") => setForm({ ...form, body_type: v, issuing_body: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sdo">Standards Body (SDO)</SelectItem>
                    <SelectItem value="consortia">Private Consortia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Issuing Body *</Label>
                <Select value={form.issuing_body} onValueChange={(v) => setForm({ ...form, issuing_body: v })}>
                  <SelectTrigger><SelectValue placeholder="Select body" /></SelectTrigger>
                  <SelectContent>
                    {ISSUING_BODIES[form.body_type].map((body) => (
                      <SelectItem key={body} value={body}>{body}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Standard Code *</Label>
                <Input
                  placeholder="e.g. ISO 15118"
                  value={form.standard_code}
                  onChange={(e) => setForm({ ...form, standard_code: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Standard Title *</Label>
              <Input
                placeholder="e.g. Road vehicles — Vehicle to grid communication interface"
                value={form.standard_title}
                onChange={(e) => setForm({ ...form, standard_title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>URL (optional)</Label>
                <Input
                  placeholder="https://..."
                  value={form.url || ""}
                  onChange={(e) => setForm({ ...form, url: e.target.value || undefined })}
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Brief relevance description"
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value || undefined })}
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={createStandard.isPending}>
                {createStandard.isPending ? "Adding..." : "Add Standard"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Standards List */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading standards...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No standards added yet. Click "Add Standard" to begin.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([kwName, items]) => (
              <div key={kwName} className="space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground">{kwName}</h4>
                <div className="space-y-1">
                  {items!.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-background border border-border">
                      {s.body_type === "sdo" ? (
                        <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <Badge variant="outline" className="text-xs flex-shrink-0">{s.issuing_body}</Badge>
                      <span className="text-sm font-medium text-foreground flex-shrink-0">{s.standard_code}</span>
                      <span className="text-sm text-muted-foreground truncate flex-1">{s.standard_title}</span>
                      {s.url && (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(s.id, s.keyword_id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
