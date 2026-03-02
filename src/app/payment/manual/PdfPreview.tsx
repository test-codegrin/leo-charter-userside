"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfPreviewProps {
  file: string;
  numPages: number;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: () => void;
  errorMessage: string;
}

export default function PdfPreview({ file, numPages, onLoadSuccess, onLoadError, errorMessage }: PdfPreviewProps) {
  return (
    <Document
      file={file}
      onLoadSuccess={({ numPages: loadedPages }: { numPages: number }) => onLoadSuccess(loadedPages)}
      onLoadError={onLoadError}
      error={<p className="text-red-400 text-sm">{errorMessage}</p>}
      className="w-full flex justify-center"
    >
      <div className="flex flex-col items-center gap-0">
        {Array.from(new Array(numPages), (_, index) => (
          <Page key={`page_${index + 1}`} pageNumber={index + 1} width={900} className="block" />
        ))}
      </div>
    </Document>
  );
}
