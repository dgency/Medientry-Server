import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eye,
  Fullscreen,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  RotateCcw,
  SeparatorHorizontal,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  WrapText,
} from 'lucide-react';

import type { RichContentStorageMode } from '../../lib/rich-content';
import {
  parseSourceInput,
  parseStoredContent,
  sanitizeRichContentHtml,
  serializeEditorContent,
} from '../../lib/rich-content';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

type ContentJsonEditorFieldProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
  rows?: number;
  storageMode: RichContentStorageMode;
};

type EditorMode = 'visual' | 'source' | 'preview';

const editorModes: Array<{ id: EditorMode; label: string; icon: typeof WrapText }> = [
  { id: 'visual', label: 'Visual', icon: WrapText },
  { id: 'source', label: 'HTML Source', icon: Code2 },
  { id: 'preview', label: 'Preview', icon: Eye },
];

const headingOptions: Array<{ level: 1 | 2 | 3 | 4 | 5; label: string; icon: typeof Heading1 }> = [
  { level: 1, label: 'H1', icon: Heading1 },
  { level: 2, label: 'H2', icon: Heading2 },
  { level: 3, label: 'H3', icon: Heading3 },
  { level: 4, label: 'H4', icon: Heading4 },
  { level: 5, label: 'H5', icon: Heading5 },
];

const ToolbarButton = ({
  active,
  children,
  className,
  ...props
}: ComponentProps<typeof Button> & { active?: boolean }) => (
  <Button
    type="button"
    variant={active ? 'default' : 'outline'}
    size="sm"
    className={cn('h-9 px-3', className)}
    {...props}
  >
    {children}
  </Button>
);

export function ContentJsonEditorField({
  value,
  onChange,
  placeholder,
  rows = 12,
  storageMode,
}: ContentJsonEditorFieldProps) {
  const parsedContent = useMemo(
    () => parseStoredContent(value, storageMode),
    [storageMode, value],
  );
  const [mode, setMode] = useState<EditorMode>('visual');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sourceText, setSourceText] = useState(parsedContent.sourceText);
  const [sourceError, setSourceError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder:
          placeholder ??
          'Write the content here. You can switch to HTML Source if you need raw control.',
      }),
    ],
    content: parsedContent.html || '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'rich-editor-prose min-h-[280px] focus:outline-none',
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      const nextValue = serializeEditorContent({
        html: activeEditor.getHTML(),
        currentValue: value,
        storageMode,
      });
      setSourceError(null);
      setSourceText(parseStoredContent(nextValue, storageMode).sourceText);
      onChange(nextValue);
    },
  });

  useEffect(() => {
    setSourceText(parsedContent.sourceText);
    setSourceError(null);
  }, [parsedContent.sourceText]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = sanitizeRichContentHtml(editor.getHTML());
    const nextHtml = sanitizeRichContentHtml(parsedContent.html || '<p></p>');

    if (currentHtml !== nextHtml) {
      editor.commands.setContent(parsedContent.html || '<p></p>', {
        emitUpdate: false,
      });
    }
  }, [editor, parsedContent.html]);

  const previewHtml = useMemo(
    () => sanitizeRichContentHtml(parsedContent.html),
    [parsedContent.html],
  );

  const applySourceText = (nextSourceText: string) => {
    setSourceText(nextSourceText);
    const result = parseSourceInput(nextSourceText, storageMode);
    setSourceError(result.parseError);

    if (result.parseError || result.normalizedValue === null) {
      return;
    }

    onChange(result.normalizedValue);
  };

  const promptForLink = () => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const nextUrl = window.prompt('Enter the link URL', previousUrl ?? '');

    if (nextUrl === null) {
      return;
    }

    const trimmedUrl = nextUrl.trim();

    if (!trimmedUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: trimmedUrl,
      })
      .run();
  };

  return (
    <div
      className={cn(
        'space-y-3 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm',
        isFullscreen ? 'fixed inset-5 z-50 overflow-auto bg-background p-5 shadow-2xl' : '',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {editorModes.map((editorMode) => {
            const Icon = editorMode.icon;

            return (
              <Button
                key={editorMode.id}
                type="button"
                variant={mode === editorMode.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode(editorMode.id)}
              >
                <Icon className="h-4 w-4" />
                {editorMode.label}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            Format:{' '}
            <span className="font-semibold text-foreground">
              {parsedContent.format}
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen((current) => !current)}
          >
            <Fullscreen className="h-4 w-4" />
            {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </div>

      {mode === 'visual' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-muted/30 p-3">
            <ToolbarButton onClick={() => editor?.chain().focus().setParagraph().run()} active={editor?.isActive('paragraph')}>
              <Pilcrow className="h-4 w-4" />
              P
            </ToolbarButton>

            {headingOptions.map((heading) => {
              const Icon = heading.icon;

              return (
                <ToolbarButton
                  key={heading.level}
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: heading.level }).run()
                  }
                  active={editor?.isActive('heading', { level: heading.level })}
                >
                  <Icon className="h-4 w-4" />
                  {heading.label}
                </ToolbarButton>
              );
            })}

            <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}>
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}>
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')}>
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')}>
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')}>
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')}>
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')}>
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={promptForLink} active={editor?.isActive('link')}>
              <Link2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().unsetLink().run()}>
              <RotateCcw className="h-4 w-4" />
              Link
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('left').run()} active={editor?.isActive({ textAlign: 'left' })}>
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('center').run()} active={editor?.isActive({ textAlign: 'center' })}>
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('right').run()} active={editor?.isActive({ textAlign: 'right' })}>
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')}>
              <Code2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
              <SeparatorHorizontal className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>
              <RemoveFormatting className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().undo().run()}>
              <Undo2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().redo().run()}>
              <Redo2 className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <div className="rich-editor-surface">
            <EditorContent editor={editor} />
          </div>
        </div>
      ) : null}

      {mode === 'source' ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Paste raw HTML for quick edits, or paste JSON if this content was previously stored as blocks or a wrapped object.
          </div>

          <Textarea
            value={sourceText}
            onChange={(event) => applySourceText(event.target.value)}
            rows={rows}
            className="min-h-[320px] font-mono text-[13px] leading-6"
            placeholder='<h2>Introduction</h2>'
          />

          {sourceError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {sourceError}
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === 'preview' ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Preview uses the same sanitizing renderer as the public website path.
          </div>

          <div className="rich-editor-surface">
            {previewHtml ? (
              <div
                className="rich-editor-prose min-h-[280px]"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
                No visible content yet.
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {parsedContent.isEmpty ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
            <Highlighter className="h-3.5 w-3.5" />
            Visually empty content will be treated as empty.
          </span>
        ) : null}
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
          <WrapText className="h-3.5 w-3.5" />
          Legacy structured data stays in source mode and is preserved when possible.
        </span>
      </div>
    </div>
  );
}
