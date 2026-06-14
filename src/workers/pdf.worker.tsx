// Establish the window global and React Refresh HMR mocks before any other imports load
(self as any).window = self;
(self as any).$RefreshReg$ = () => {};
(self as any).$RefreshSig$ = () => (type: any) => type;

self.onmessage = async (e: MessageEvent) => {
  try {
    const { pages, pageSize, includeSolutions, isSinglePage, solutionsPerPage, globalTheme, pageBorderUrl, isLargePrint } = e.data;

    // Dynamically import libraries to ensure self.window is established
    const { pdf } = await import('@react-pdf/renderer');
    const { PdfDocument } = await import('../features/pdf/components/PdfDocument');

    const blob = await pdf(
      <PdfDocument
        pages={pages}
        pageSize={pageSize}
        includeSolutions={includeSolutions}
        isSinglePage={isSinglePage}
        solutionsPerPage={solutionsPerPage}
        globalTheme={globalTheme}
        pageBorderUrl={pageBorderUrl}
        isLargePrint={isLargePrint}
      />
    ).toBlob();

    const blobUrl = URL.createObjectURL(blob);
    self.postMessage({ success: true, blobUrl });
  } catch (error) {
    console.error("PDF generation worker error:", error);
    self.postMessage({ success: false, error: String(error) });
  }
};

