import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ReceiptScanner() {
  const [, setLocation] = useLocation();
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.receipts.upload.useMutation();
  const processMutation = trpc.receipts.processWithVision.useMutation();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (file: File) => {
    try {
      setIsProcessing(true);

      // In a real app, you'd upload to S3 first
      // For now, we'll use a data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;

        // Create receipt
        const receiptResult = await uploadMutation.mutateAsync({
          imageUrl: dataUrl,
          imageKey: `receipt-${Date.now()}`,
        });

        // Process with LLM vision
        const processResult = await processMutation.mutateAsync({
          receiptId: receiptResult.insertId as number,
          imageUrl: dataUrl,
        });

        toast.success("Receipt scanned successfully!");
        setPreview(null);
        setUploadedFile(null);
        setLocation(`/receipt/${receiptResult.insertId}`);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to process receipt");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan Receipt</h1>
        <p className="text-muted-foreground mt-2">
          Upload a receipt image and we'll extract the details automatically
        </p>
      </div>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
        <CardContent className="pt-8">
          {preview ? (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="w-full h-auto rounded-lg border border-border/50"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleUpload(uploadedFile!)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Process Receipt
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreview(null);
                    setUploadedFile(null);
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">Upload Receipt Image</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Drag and drop or click to select an image
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </Button>
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-0 shadow-sm bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Make sure the receipt is well-lit and clearly visible</p>
          <p>• Include the entire receipt in the frame</p>
          <p>• Avoid shadows or glare on the receipt</p>
          <p>• Supported formats: JPG, PNG, WebP</p>
        </CardContent>
      </Card>
    </div>
  );
}
