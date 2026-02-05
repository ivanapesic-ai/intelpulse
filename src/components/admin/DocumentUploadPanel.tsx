 import { useState, useRef } from "react";
 import { Upload, FileText, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { useDocuments, useDocumentStats, useCreateDocument, useParseDocument } from "@/hooks/useDocuments";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 const statusColors = {
   completed: "bg-success/20 text-success border-success/30",
   failed: "bg-destructive/20 text-destructive border-destructive/30",
   running: "bg-blue-500/20 text-blue-500 border-blue-500/30",
   pending: "bg-muted text-muted-foreground border-border",
   parsing: "bg-blue-500/20 text-blue-500 border-blue-500/30",
 };
 
 export function DocumentUploadPanel() {
   const [isUploading, setIsUploading] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
   
   const { data: documents, isLoading: documentsLoading } = useDocuments();
   const { data: documentStats } = useDocumentStats();
   const createDocument = useCreateDocument();
   const parseDocument = useParseDocument();
 
   const handleUploadClick = () => {
     fileInputRef.current?.click();
   };
 
   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const files = e.target.files;
     if (!files || files.length === 0) return;
 
     const file = files[0];
     const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
     const validExtensions = ['.pdf', '.docx', '.pptx'];
     
     const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
     if (!validExtensions.includes(extension)) {
       toast.error("Invalid file type. Please upload PDF, DOCX, or PPTX files.");
       return;
     }
 
     setIsUploading(true);
     
     try {
       // Generate unique filename
       const timestamp = Date.now();
       const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
       const storagePath = `uploads/${timestamp}_${sanitizedName}`;
       
       // Upload to Supabase Storage
       const { data: uploadData, error: uploadError } = await supabase.storage
         .from('cei-documents')
         .upload(storagePath, file, {
           cacheControl: '3600',
           upsert: false,
         });
 
       if (uploadError) {
         throw new Error(`Upload failed: ${uploadError.message}`);
       }
 
       // Determine file type
       let fileType: 'pdf' | 'docx' | 'pptx' = 'pdf';
       if (extension === '.docx') fileType = 'docx';
       if (extension === '.pptx') fileType = 'pptx';
 
       // Create document record
       const docRecord = await createDocument.mutateAsync({
         filename: file.name,
         fileType,
         storagePath,
         source: 'manual',
         fileSizeBytes: file.size,
       });
 
       toast.success(`Document "${file.name}" uploaded successfully!`);
       
       // Optional: trigger parsing immediately
       // parseDocument.mutate({ documentId: docRecord.id, content: '' });
       
     } catch (error) {
       console.error('Upload error:', error);
       toast.error(error instanceof Error ? error.message : 'Upload failed');
     } finally {
       setIsUploading(false);
       // Reset input
       if (fileInputRef.current) {
         fileInputRef.current.value = '';
       }
     }
   };
 
   const handleParse = async (documentId: string) => {
     toast.info("Starting document parsing...");
     parseDocument.mutate({ documentId, content: '' });
   };
 
   return (
     <Card>
       <CardHeader className="flex flex-row items-center justify-between">
         <div>
           <CardTitle className="text-foreground">CEI Documents</CardTitle>
           <CardDescription>Upload and parse CEI-SPHERE documents for technology mentions</CardDescription>
         </div>
         <div>
           <input
             type="file"
             ref={fileInputRef}
             onChange={handleFileChange}
             accept=".pdf,.docx,.pptx"
             className="hidden"
           />
           <Button size="sm" onClick={handleUploadClick} disabled={isUploading}>
             {isUploading ? (
               <Loader2 className="h-4 w-4 mr-2 animate-spin" />
             ) : (
               <Upload className="h-4 w-4 mr-2" />
             )}
             {isUploading ? "Uploading..." : "Upload Document"}
           </Button>
         </div>
       </CardHeader>
       <CardContent>
         {/* Stats */}
         <div className="grid sm:grid-cols-4 gap-4 mb-6">
           <div className="p-3 rounded-lg bg-muted/50">
             <p className="text-xs text-muted-foreground">Total</p>
             <p className="text-xl font-bold text-foreground">{documentStats?.totalDocuments || 0}</p>
           </div>
           <div className="p-3 rounded-lg bg-success/10">
             <p className="text-xs text-success">Completed</p>
             <p className="text-xl font-bold text-success">{documentStats?.completedCount || 0}</p>
           </div>
           <div className="p-3 rounded-lg bg-blue-500/10">
             <p className="text-xs text-blue-500">Parsing</p>
             <p className="text-xl font-bold text-blue-500">{documentStats?.parsingCount || 0}</p>
           </div>
           <div className="p-3 rounded-lg bg-destructive/10">
             <p className="text-xs text-destructive">Failed</p>
             <p className="text-xl font-bold text-destructive">{documentStats?.failedCount || 0}</p>
           </div>
         </div>
 
         {documentsLoading ? (
           <p className="text-sm text-muted-foreground">Loading...</p>
         ) : documents?.length === 0 ? (
           <div className="text-center py-8">
             <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
             <p className="text-muted-foreground">No documents uploaded yet</p>
             <p className="text-sm text-muted-foreground">Upload CEI PDFs, PPTs, or DOCs to extract technology mentions</p>
           </div>
         ) : (
           <div className="space-y-2">
             {documents?.map((doc) => (
               <div 
                 key={doc.id}
                 className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
               >
                 <div className="flex items-center gap-4">
                   <div className="p-2 rounded-lg bg-muted">
                     <FileText className="h-5 w-5 text-muted-foreground" />
                   </div>
                   <div>
                     <p className="font-medium text-foreground">{doc.filename}</p>
                     <p className="text-sm text-muted-foreground">
                       {doc.fileType.toUpperCase()} • {doc.source}
                       {doc.parsedContent?.mentionsCount !== undefined && (
                         <> • {doc.parsedContent.mentionsCount} mentions</>
                       )}
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <Badge variant="outline" className={statusColors[doc.parseStatus] || statusColors.pending}>
                     {doc.parseStatus}
                   </Badge>
                   {doc.parseStatus === 'pending' && (
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => handleParse(doc.id)}
                       disabled={parseDocument.isPending}
                     >
                       {parseDocument.isPending ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                       ) : (
                         "Parse"
                       )}
                     </Button>
                   )}
                   {doc.parseStatus === 'completed' && (
                     <Button variant="ghost" size="sm">
                       View
                     </Button>
                   )}
                 </div>
               </div>
             ))}
           </div>
         )}
       </CardContent>
     </Card>
   );
 }