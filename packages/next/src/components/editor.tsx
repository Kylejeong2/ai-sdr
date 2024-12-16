"use client"

import { useEffect, useRef } from "react"
import { Editor as TinyMCEEditor } from "@tinymce/tinymce-react"

interface EditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function Editor({ value, onChange, placeholder }: EditorProps) {
  const editorRef = useRef<any>(null)

  return (
    <TinyMCEEditor
      onInit={(evt: any, editor: any) => (editorRef.current = editor)}
      value={value}
      onEditorChange={onChange}
      init={{
        height: 400,
        menubar: false,
        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "charmap",
          "preview",
          "anchor",
          "searchreplace",
          "visualblocks",
          "code",
          "fullscreen",
          "insertdatetime",
          "media",
          "table",
          "help",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks | " +
          "bold italic forecolor | alignleft aligncenter " +
          "alignright alignjustify | bullist numlist outdent indent | " +
          "removeformat | help",
        content_style:
          "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; }",
        placeholder,
        branding: false,
        promotion: false,
      }}
    />
  )
} 