import { pdf } from '@react-pdf/renderer';
import { PdfDocument } from '../features/pdf/components/PdfDocument';

self.onmessage = async (e: MessageEvent) => {
  try {
    const { pages, pageSize, includeSolutions, isSinglePage } = e.data;

    const blob = await pdf(
      <PdfDocument
        pages={pages}
        pageSize={pageSize}
        includeSolutions={includeSolutions}
        isSinglePage={isSinglePage}
      />
    ).toBlob();

    const blobUrl = URL.createObjectURL(blob);
    self.postMessage({ success: true, blobUrl });
  } catch (error) {
    console.error("PDF generation worker error:", error);
    self.postMessage({ success: false, error: String(error) });
  }
};
