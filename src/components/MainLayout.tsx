// components/MainLayout.tsx
import React from 'react';
import Toolbar from './ToolBar';
import PDFViewerWrapper from './PDFViewerWrapper';
import ChatWrapper from './ChatWrapper';

type Tool = 'highlight' | 'text' | 'eraser' | null;

interface MainLayoutProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
  onRemoveFile: () => void;
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
}

const MainLayout: React.FC<MainLayoutProps> = ({
  selectedTool,
  onToolSelect,
  onFileUpload,
  selectedFile,
  onRemoveFile,
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
}) => {
  return (
    <div className="flex gap-5 h-[calc(110vh-12rem)]">
      <Toolbar
        selectedTool={selectedTool}
        onToolSelect={onToolSelect}
        onFileUpload={onFileUpload}
        selectedFile={selectedFile}
        onRemoveFile={onRemoveFile}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      <PDFViewerWrapper
        selectedFile={selectedFile}
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
      />
      <ChatWrapper
        collectionName={collectionName}
        chatWidth={chatWidth}
        onChatResize={onChatResize}
      />
    </div>
  );
};

export default MainLayout;