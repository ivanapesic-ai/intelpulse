import { useState, useMemo } from "react";
import { X, Check, Tag, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKeywords, useUpdateKeywordTags } from "@/hooks/useTechnologies";
import type { TechnologyKeyword } from "@/types/database";

type FilterStatus = "all" | "missing" | "mapped";

export function TagMappingEditor() {
  const { data: keywords, isLoading } = useKeywords("cei_sphere");
  const updateTags = useUpdateKeywordTags();
  
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Calculate stats
  const stats = useMemo(() => {
    if (!keywords) return { total: 0, mapped: 0, missing: 0 };
    const mapped = keywords.filter(k => k.dealroomTags && k.dealroomTags.length > 0).length;
    return {
      total: keywords.length,
      mapped,
      missing: keywords.length - mapped,
    };
  }, [keywords]);

  // Filter keywords
  const filteredKeywords = useMemo(() => {
    if (!keywords) return [];
    
    let result = keywords;
    
    // Apply status filter
    if (filter === "mapped") {
      result = result.filter(k => k.dealroomTags && k.dealroomTags.length > 0);
    } else if (filter === "missing") {
      result = result.filter(k => !k.dealroomTags || k.dealroomTags.length === 0);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(k => 
        k.displayName.toLowerCase().includes(query) ||
        k.keyword.toLowerCase().includes(query) ||
        k.dealroomTags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [keywords, filter, searchQuery]);

  const handleStartEdit = (keyword: TechnologyKeyword) => {
    setEditingId(keyword.id);
    setEditValue(keyword.dealroomTags?.join(", ") || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSave = (keywordId: string) => {
    const tags = editValue
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    updateTags.mutate(
      { keywordId, tags },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditValue("");
        },
      }
    );
  };

  const handleRemoveTag = (keyword: TechnologyKeyword, tagToRemove: string) => {
    const newTags = (keyword.dealroomTags || []).filter(t => t !== tagToRemove);
    updateTags.mutate({ keywordId: keyword.id, tags: newTags });
  };

  const isMapped = (keyword: TechnologyKeyword) => 
    keyword.dealroomTags && keyword.dealroomTags.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading keywords...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Tag className="h-5 w-5" />
                Tag Mapping Editor
              </CardTitle>
              <CardDescription>
                Map CEI-SPHERE keywords to Dealroom tags for better search results
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{stats.mapped}/{stats.total}</p>
                <p className="text-xs text-muted-foreground">keywords mapped</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats badges */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="text-sm font-semibold text-foreground">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm text-success">{stats.mapped} mapped</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning">{stats.missing} missing</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["all", "missing", "mapped"] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    filter === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {status === "all" ? "All" : status === "missing" ? "Missing" : "Mapped"}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search keywords or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords list */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredKeywords.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                {searchQuery ? "No keywords match your search" : "No keywords found"}
              </div>
            ) : (
              filteredKeywords.map((keyword) => (
                <div
                  key={keyword.id}
                  className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Status indicator */}
                  <div className="pt-1">
                    {isMapped(keyword) ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-warning" />
                    )}
                  </div>

                  {/* Keyword info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{keyword.displayName}</h4>
                      <Badge 
                        variant="outline" 
                        className={isMapped(keyword) 
                          ? "bg-success/10 text-success border-success/30" 
                          : "bg-warning/10 text-warning border-warning/30"
                        }
                      >
                        {isMapped(keyword) ? "Mapped" : "Missing"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Keyword: <code className="px-1 py-0.5 rounded bg-muted text-xs">{keyword.keyword}</code>
                    </p>

                    {/* Tags display or edit mode */}
                    {editingId === keyword.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Enter tags separated by commas..."
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSave(keyword.id);
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSave(keyword.id)}
                          disabled={updateTags.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {keyword.dealroomTags && keyword.dealroomTags.length > 0 ? (
                          keyword.dealroomTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="group flex items-center gap-1 bg-purple-500/10 text-purple-400 border border-purple-500/30"
                            >
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(keyword, tag)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            No Dealroom tags configured
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Edit button */}
                  {editingId !== keyword.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit(keyword)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
