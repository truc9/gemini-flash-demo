"use client";

import UploadPreview from "@/components/upload-preview";
import prompt from "@/prompts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useMemo, useState } from "react";
import { BeatLoader } from "react-spinners";
import { remark } from "remark";
import html from "remark-html";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const imageUrl = useMemo(() => {
    return selectedFile ? URL.createObjectURL(selectedFile) : "";
  }, [selectedFile]);
  const genAI = new GoogleGenerativeAI(
    process.env.NEXT_PUBLIC_GEMINI_FLASH_KEY!
  );
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const [htmlContent, setHtmlContent] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setHtmlContent("");
    }
  };

  const handleAnalyse = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setHtmlContent("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const image = await selectedFile.arrayBuffer();
      const res = await model.generateContentStream([
        {
          inlineData: {
            data: Buffer.from(image).toString("base64"),
            mimeType: "image/jpeg",
          },
        },
        prompt,
      ]);
      let text = "";
      setLoading(false);
      for await (const item of res.stream) {
        text += item.text();
        const processedContent = await remark().use(html).process(text);
        const contentHtml = processedContent.toString();
        setHtmlContent(contentHtml);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6">
      <div className="w-full max-w-4xl p-6">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-center">Visionary</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center w-full md:w-1/3 gap-5">
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            {selectedFile && <UploadPreview url={imageUrl} />}
            <button
              onClick={handleAnalyse}
              className="w-full px-4 py-2 text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-transform transform active:scale-95"
            >
              Analyse
            </button>
          </div>
          <div className="w-full md:w-2/3 mt-6 md:mt-0 p-4 bg-gray-50 rounded-lg shadow-inner max-h-[700px] overflow-y-auto">
            {loading && (
              <div className="flex h-full justify-center flex-col items-center">
                <BeatLoader />
              </div>
            )}
            {htmlContent && (
              <div className="prose">
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
