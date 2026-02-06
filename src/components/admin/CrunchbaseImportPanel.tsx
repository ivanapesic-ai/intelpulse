import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, TrendingUp, Users, Building2, Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { parseCSV, useCrunchbaseImport, useCrunchbaseStats, useCrunchbaseImportLogs, ImportProgress, ImportSummary } from "@/hooks/useCrunchbase";
import { useCrunchbaseReprocess, ReprocessProgress, ReprocessSummary } from "@/hooks/useCrunchbaseReprocess";
import { formatFundingEur } from "@/types/database";
import { useAdminDataSync } from "@/hooks/useDataSync";

export function CrunchbaseImportPanel() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<{ rows: any[]; errors: any[]; headers: string[] } | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [reprocessProgress, setReprocessProgress] = useState<ReprocessProgress | null>(null);
  const [reprocessSummary, setReprocessSummary] = useState<ReprocessSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: stats, isLoading: statsLoading } = useCrunchbaseStats();
  const { data: importLogs } = useCrunchbaseImportLogs(5);
  const importMutation = useCrunchbaseImport();
  const reprocessMutation = useCrunchbaseReprocess();
  
  const { afterCrunchbaseImport } = useAdminDataSync();
  
  const handleReprocessKeywords = async () => {
    setReprocessProgress({ current: 0, total: 0, currentCompany: '', updated: 0, unchanged: 0 });
    setReprocessSummary(null);
    
    try {
      const summary = await reprocessMutation.mutateAsync({
        onProgress: setReprocessProgress,
      });
      
      setReprocessSummary(summary);
      setReprocessProgress(null);
      // Unified sync - updates radars, dashboards, cards
      await afterCrunchbaseImport();
      toast.success(`Updated ${summary.updated} companies with new keywords! All views synced.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reprocess failed');
      setReprocessProgress(null);
    }
  };
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.csv')) {
      handleFileSelect(files[0]);
    } else {
      toast.error('Please upload a CSV file');
    }
  }, []);
  
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setImportSummary(null);
    setImportProgress(null);
    
    try {
      const content = await file.text();
      const result = parseCSV(content, file.name);
      setParseResult(result);
      
      if (result.errors.length > 0) {
        toast.warning(`Parsed ${result.rows.length} companies with ${result.errors.length} warnings`);
      } else {
        toast.success(`Ready to import ${result.rows.length} companies`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse CSV');
      setParseResult(null);
    }
  };
  
  const handleImport = async () => {
    if (!parseResult || !selectedFile) return;
    
    setImportProgress({ current: 0, total: parseResult.rows.length, currentCompany: '', imported: 0, skipped: 0, errors: 0 });
    
    try {
      const summary = await importMutation.mutateAsync({
        rows: parseResult.rows,
        filename: selectedFile.name,
        onProgress: setImportProgress,
      });
      
      setImportSummary(summary);
      setImportProgress(null);
      // Unified sync - updates radars, dashboards, cards
      await afterCrunchbaseImport();
      toast.success(`Successfully imported ${summary.importedRows} companies! All views synced.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
      setImportProgress(null);
    }
  };
  
  const resetImport = () => {
    setSelectedFile(null);
    setParseResult(null);
    setImportProgress(null);
    setImportSummary(null);
  };
  
  // Stats overview cards
  const renderStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Companies</p>
              <p className="text-2xl font-bold text-foreground">{stats?.totalCompanies || 0}</p>
            </div>
            <Building2 className="h-8 w-8 text-primary/30" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Funding</p>
              <p className="text-2xl font-bold text-foreground">
                ${formatFundingEur(stats?.totalFunding || 0).replace('€', '')}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-success/30" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">With Keywords</p>
              <p className="text-2xl font-bold text-foreground">{stats?.companiesWithKeywords || 0}</p>
            </div>
            <Database className="h-8 w-8 text-blue-500/30" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Quality</p>
              <p className="text-2xl font-bold text-foreground">{stats?.avgDataQuality || 0}%</p>
            </div>
            <Users className="h-8 w-8 text-purple-500/30" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  // Import dropzone
  const renderDropzone = () => (
    <Card>
      <CardHeader>
        <CardTitle>Import Crunchbase CSV</CardTitle>
        <CardDescription>Upload a Crunchbase export file to import companies and auto-match technology keywords</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-1">
            {isDragging ? 'Drop CSV file here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-sm text-muted-foreground">Supports Crunchbase export format (.csv)</p>
        </div>
      </CardContent>
    </Card>
  );
  
  // Preview before import
  const renderPreview = () => {
    if (!parseResult || !selectedFile) return null;
    
    const topKeywords = Object.entries(
      parseResult.rows.reduce((acc, row) => {
        for (const kw of row.technology_keywords) {
          acc[kw] = (acc[kw] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8) as [string, number][];
    
    const companiesWithKeywords = parseResult.rows.filter(r => r.technology_keywords.length > 0).length;
    const companiesWithoutKeywords = parseResult.rows.length - companiesWithKeywords;
    
    return (
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-lg">{selectedFile.name}</CardTitle>
                <CardDescription>{parseResult.rows.length} companies parsed</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetImport}>Cancel</Button>
              <Button onClick={handleImport} disabled={importMutation.isPending}>
                {importMutation.isPending ? 'Importing...' : 'Import Companies'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Keyword preview */}
            <div>
              <h4 className="text-sm font-medium mb-2">Technology Keywords Detected</h4>
              <div className="flex flex-wrap gap-2">
                {topKeywords.map(([keyword, count]) => (
                  <Badge key={keyword} variant="secondary">
                    {keyword}: {count}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="text-success">{companiesWithKeywords}</span> companies matched ({Math.round(companiesWithKeywords / parseResult.rows.length * 100)}%)
                {companiesWithoutKeywords > 0 && (
                  <span className="text-warning ml-2">• {companiesWithoutKeywords} with no matches</span>
                )}
              </p>
            </div>
            
            {/* Parse errors */}
            {parseResult.errors.length > 0 && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">{parseResult.errors.length} parse warnings</span>
                </div>
                <ScrollArea className="h-20">
                  <ul className="text-sm text-muted-foreground">
                    {parseResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>Row {err.row}: {err.error}</li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>...and {parseResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Import progress
  const renderProgress = () => {
    if (!importProgress) return null;
    
    const percent = Math.round((importProgress.current / importProgress.total) * 100);
    
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Importing...</span>
              <span className="font-medium">{importProgress.current} / {importProgress.total}</span>
            </div>
            <Progress value={percent} className="h-2" />
            <p className="text-sm text-muted-foreground truncate">
              Current: {importProgress.currentCompany}
            </p>
            <div className="flex gap-4 text-sm">
              <span className="text-success">✓ {importProgress.imported} imported</span>
              <span className="text-warning">⊘ {importProgress.skipped} skipped</span>
              <span className="text-destructive">✕ {importProgress.errors} errors</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Import summary
  const renderSummary = () => {
    if (!importSummary) return null;
    
    const topKeywords = Object.entries(importSummary.keywordDistribution)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 10) as [string, number][];
    
    return (
      <Card className="mt-4 border-success/30 bg-success/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <CardTitle className="text-lg">Import Complete!</CardTitle>
              <CardDescription>{importSummary.importedRows} companies imported</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Summary stats */}
            <div className="space-y-3">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Total rows processed</span>
                <span className="font-medium">{importSummary.totalRows}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Successfully imported</span>
                <span className="font-medium text-success">{importSummary.importedRows}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">With SDV keywords</span>
                <span className="font-medium">{importSummary.companiesWithKeywords} ({Math.round(importSummary.companiesWithKeywords / importSummary.totalRows * 100)}%)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Total funding tracked</span>
                <span className="font-medium">${formatFundingEur(importSummary.totalFunding).replace('€', '')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Unique investors</span>
                <span className="font-medium">{importSummary.uniqueInvestors.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Top keywords */}
            <div>
              <h4 className="text-sm font-medium mb-3">Top Technologies Found</h4>
              <div className="space-y-2">
                {topKeywords.map(([keyword, count]) => (
                  <div key={keyword} className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(count / (topKeywords[0]?.[1] || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-32 truncate">{keyword}</span>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Data quality summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Data Quality</h4>
            <div className="flex gap-4">
              <Badge variant="outline" className="text-success border-success/30">
                High (80-100): {importSummary.dataQualitySummary.high}
              </Badge>
              <Badge variant="outline" className="text-warning border-warning/30">
                Medium (50-79): {importSummary.dataQualitySummary.medium}
              </Badge>
              <Badge variant="outline" className="text-destructive border-destructive/30">
                Low (0-49): {importSummary.dataQualitySummary.low}
              </Badge>
            </div>
          </div>
          
          {/* Errors */}
          {importSummary.errorRows > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">{importSummary.errorRows} rows with errors</span>
              </div>
              <ScrollArea className="h-20">
                <ul className="text-sm text-muted-foreground">
                  {importSummary.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>Row {err.row}: {err.error}</li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
          
          <Button variant="outline" className="mt-4" onClick={resetImport}>
            Import Another File
          </Button>
        </CardContent>
      </Card>
    );
  };
  
  // Recent imports
  const renderImportHistory = () => {
    if (!importLogs || importLogs.length === 0) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Recent Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {importLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  {log.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : log.status === 'running' ? (
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{log.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.started_at).toLocaleDateString()} • {log.imported_rows}/{log.total_rows} imported
                    </p>
                  </div>
                </div>
                <Badge variant={log.status === 'completed' ? 'default' : 'secondary'}>
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Reprocess keywords section
  const renderReprocessSection = () => (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Reprocess Keywords</CardTitle>
            <CardDescription>Re-run keyword matching on all existing companies with updated rules</CardDescription>
          </div>
          <Button 
            onClick={handleReprocessKeywords}
            disabled={reprocessMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
            {reprocessMutation.isPending ? 'Processing...' : 'Reprocess All'}
          </Button>
        </div>
      </CardHeader>
      
      {reprocessProgress && (
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Processing...</span>
              <span className="font-medium">{reprocessProgress.current} / {reprocessProgress.total}</span>
            </div>
            <Progress value={reprocessProgress.total > 0 ? (reprocessProgress.current / reprocessProgress.total) * 100 : 0} className="h-2" />
            <p className="text-sm text-muted-foreground truncate">
              Current: {reprocessProgress.currentCompany}
            </p>
            <div className="flex gap-4 text-sm">
              <span className="text-success">✓ {reprocessProgress.updated} updated</span>
              <span className="text-muted-foreground">⊘ {reprocessProgress.unchanged} unchanged</span>
            </div>
          </div>
        </CardContent>
      )}
      
      {reprocessSummary && (
        <CardContent className="pt-0">
          <div className="p-4 rounded-lg border border-success/30 bg-success/5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-medium">Reprocessing Complete</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <p className="text-muted-foreground">Total Processed</p>
                <p className="font-medium">{reprocessSummary.totalProcessed}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated</p>
                <p className="font-medium text-success">{reprocessSummary.updated}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unchanged</p>
                <p className="font-medium">{reprocessSummary.unchanged}</p>
              </div>
            </div>
            
            {Object.keys(reprocessSummary.keywordChanges).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Keyword Changes</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(reprocessSummary.keywordChanges)
                    .sort((a, b) => (b[1].after - b[1].before) - (a[1].after - a[1].before))
                    .slice(0, 10)
                    .map(([keyword, { before, after }]) => (
                      <div key={keyword} className="flex items-center gap-2">
                        <span className="text-muted-foreground">{keyword}:</span>
                        <span>{before}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className={after > before ? 'text-success' : after < before ? 'text-warning' : ''}>
                          {after}
                        </span>
                        {after > before && <span className="text-success text-xs">(+{after - before})</span>}
                        {after < before && <span className="text-warning text-xs">({after - before})</span>}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="space-y-4">
      {renderStats()}
      
      {!selectedFile && !importSummary && renderDropzone()}
      {selectedFile && !importProgress && !importSummary && renderPreview()}
      {importProgress && renderProgress()}
      {importSummary && renderSummary()}
      
      {renderReprocessSection()}
      {renderImportHistory()}
    </div>
  );
}
