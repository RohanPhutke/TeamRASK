// components/MainLayout.tsx
import React from 'react';
import Toolbar from './ToolBar';
import PDFViewerWrapper from './PDFViewerWrapper';
import ChatWrapper from './ChatWrapper';

type Tool = 'screenshot' | 'highlight' | 'text' | 'eraser' | null;

interface MainLayoutProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
  fileUrl?: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPageChange: (page: number) => void;
  onPDFClick: (e: React.MouseEvent, pageNumber: number) => void;
  registerPageRef: (pageNumber: number, element: HTMLElement | null) => void;
  renderPageAnnotations: (pageNumber: number) => JSX.Element[];
  showTextInput: boolean;
  textPosition: { x: number; y: number } | null;
  textInput: string;
  onTextInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTextSubmit: () => void;
  onCancelTextInput: () => void;
  onPdfResize: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  pdfWidth: number;
  collectionName: string | null;
  chatWidth: number;
  onChatResize: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  // New screenshot event handlers:
  onScreenshotMouseDown: (e: React.MouseEvent, pageNumber: number) => void;
  onScreenshotMouseMove: (e: React.MouseEvent, pageNumber: number) => void;
  onScreenshotMouseUp: (e: React.MouseEvent, pageNumber: number) => void;
  screenShotImage?: string | null;
  screenshotSelection: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    selecting: boolean;
  };
  currentPage: number;
  screenshotToolActive: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  selectedTool,
  onToolSelect,
  fileUrl,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPageChange,
  onPDFClick,
  registerPageRef,
  renderPageAnnotations,
  showTextInput,
  textPosition,
  textInput,
  onTextInputChange,
  onTextSubmit,
  onCancelTextInput,
  onPdfResize,
  pdfWidth,
  collectionName,
  chatWidth,
  onChatResize,
  onScreenshotMouseDown,
  onScreenshotMouseMove,
  onScreenshotMouseUp,
  screenShotImage,
  screenshotSelection,
  currentPage,
  screenshotToolActive
}) => {
  return (
    <div className="flex gap-5 h-[calc(110vh-12rem)] select-none"> 
      <Toolbar
        selectedTool={selectedTool}
        onToolSelect={onToolSelect}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      <PDFViewerWrapper
        fileUrl={fileUrl ?? undefined}
        onPageChange={onPageChange}
        onPDFClick={onPDFClick}
        registerPageRef={registerPageRef}
        renderPageAnnotations={renderPageAnnotations}
        showTextInput={showTextInput}
        textPosition={textPosition}
        textInput={textInput}
        onTextInputChange={onTextInputChange}
        onTextSubmit={onTextSubmit}
        onCancelTextInput={onCancelTextInput}
        onPdfResize={onPdfResize}
        pdfWidth={pdfWidth}
        // Pass the screenshot event handlers to PDFViewerWrapper
        onScreenshotMouseDown={onScreenshotMouseDown}
        onScreenshotMouseMove={onScreenshotMouseMove}
        onScreenshotMouseUp={onScreenshotMouseUp}
        screenshotSelection={screenshotSelection}
        currentPage={currentPage}
        screenshotToolActive={selectedTool === 'screenshot'}
      />
      <ChatWrapper
        collectionName={collectionName}
        chatWidth={chatWidth}
        onChatResize={onChatResize}
        screenshotImage={screenShotImage}
      />
    </div>
  );
};

export default MainLayout;
