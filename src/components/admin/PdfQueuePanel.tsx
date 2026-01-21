import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  SkipForward, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Play,
  Square
} from 'lucide-react';
import { usePdfQueue, usePdfQueueStats, useProcessPdf, useSkipPdf, useRetryPdf, useProcessAllPending, type PdfQueueItem } from '@/hooks/usePdfQueue';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: 'bg-yellow-500/10 text-yellow-600', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
  processing: { color: 'bg-blue-500/10 text-blue-600', icon: <Loader2 className="h-3 w-3 animate-spin" />, label: 'Processing' },
  completed: { color: 'bg-green-500/10 text-green-600', icon: <CheckCircle className="h-3 w-3" />, label: 'Completed' },
  failed: { color: 'bg-red-500/10 text-red-600', icon: <XCircle className="h-3 w-3" />, label: 'Failed' },
  skipped: { color: 'bg-muted text-muted-foreground', icon: <SkipForward className="h-3 w-3" />, label: 'Skipped' },
};

function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const filename = path.split('/').pop() || 'unknown.pdf';
    return decodeURIComponent(filename).slice(0, 50);
  } catch {
    return 'unknown.pdf';
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PdfItemProps {
  pdf: PdfQueueItem;
  onProcess: () => void;
  onSkip: () => void;
  onRetry: () => void;
  isProcessing: boolean;
}

function PdfItem({ pdf, onProcess, onSkip, onRetry, isProcessing }: PdfItemProps) {
  const config = statusConfig[pdf.status];
  const filename = pdf.filename || getFilenameFromUrl(pdf.url);

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
        <FileText className="h-4 w-4 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate" title={filename}>
            {filename}
          </span>
          <Badge variant="outline" className={`${config.color} text-xs shrink-0`}>
            {config.icon}
            <span className="ml-1">{config.label}</span>
          </Badge>
          {pdf.sourceType === 'zenodo' && (
            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600">
              Zenodo
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(pdf.fileSizeBytes)}</span>
          <span>•</span>
          <span>{format(new Date(pdf.createdAt), 'MMM d, HH:mm')}</span>
          {pdf.mentionsExtracted > 0 && (
            <>
              <span>•</span>
              <span className="text-green-600">{pdf.mentionsExtracted} mentions</span>
            </>
          )}
        </div>

        {pdf.errorMessage && (
          <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
            <AlertCircle className="h-3 w-3" />
            <span className="truncate" title={pdf.errorMessage}>{pdf.errorMessage}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => window.open(pdf.url, '_blank')}
          title="Open PDF"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            const link = document.createElement('a');
            link.href = pdf.url;
            link.download = filename;
            link.click();
          }}
          title="Download PDF"
        >
          <Download className="h-4 w-4" />
        </Button>

        {(pdf.status === 'pending' || pdf.status === 'failed') && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              onClick={pdf.status === 'failed' ? onRetry : onProcess}
              disabled={isProcessing}
              title={pdf.status === 'failed' ? 'Retry' : 'Process now'}
            >
              <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={onSkip}
              title="Skip this PDF"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function PdfQueuePanel() {
  const [activeTab, setActiveTab] = useState('all');
  const { data: allPdfs = [], isLoading } = usePdfQueue();
  const { data: stats } = usePdfQueueStats();
  const processPdf = useProcessPdf();
  const skipPdf = useSkipPdf();
  const retryPdf = useRetryPdf();
  const batch = useProcessAllPending();

  const filteredPdfs = activeTab === 'all' 
    ? allPdfs 
    : allPdfs.filter(pdf => pdf.status === activeTab);

  const pendingCount = stats?.pending || 0;
  const progressPercent = batch.total > 0 ? (batch.current / batch.total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Processing Queue
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {batch.isRunning ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={batch.stop}
                className="gap-1"
              >
                <Square className="h-3 w-3" />
                Stop
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={batch.start}
                disabled={pendingCount === 0 || processPdf.isPending}
                className="gap-1"
              >
                <Play className="h-3 w-3" />
                Process All ({pendingCount})
              </Button>
            )}
          </div>
        </div>
        
        {/* Batch progress indicator */}
        {batch.isRunning && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Processing {batch.current}/{batch.total}: {batch.currentPdfName}...
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-600">{batch.successCount} ✓</span>
                <span className="text-red-600">{batch.failCount} ✗</span>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-5 gap-2">
          <div className="text-center p-2 rounded-lg bg-yellow-500/10">
            <div className="text-lg font-bold text-yellow-600">{stats?.pending || 0}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10">
            <div className="text-lg font-bold text-blue-600">{stats?.processing || 0}</div>
            <div className="text-xs text-muted-foreground">Processing</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-500/10">
            <div className="text-lg font-bold text-green-600">{stats?.completed || 0}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10">
            <div className="text-lg font-bold text-red-600">{stats?.failed || 0}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted">
            <div className="text-lg font-bold">{stats?.skipped || 0}</div>
            <div className="text-xs text-muted-foreground">Skipped</div>
          </div>
        </div>

        {/* Tabs for filtering */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
            <TabsTrigger value="completed">Done</TabsTrigger>
            <TabsTrigger value="skipped">Skipped</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPdfs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No PDFs in this category
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                  {filteredPdfs.map(pdf => (
                    <PdfItem
                      key={pdf.id}
                      pdf={pdf}
                      onProcess={() => processPdf.mutate(pdf.id)}
                      onSkip={() => skipPdf.mutate(pdf.id)}
                      onRetry={() => retryPdf.mutate(pdf.id)}
                      isProcessing={processPdf.isPending}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
