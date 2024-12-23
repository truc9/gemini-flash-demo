"use client";

import { GoogleGenerativeAI } from "@google/generative-ai";
import Image from "next/image";
import { useState } from "react";
import { BeatLoader } from "react-spinners";
import { remark } from "remark";
import html from "remark-html";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        "You are a detailed image analyst. Given the image, provide a comprehensive and thorough description of its contents, including any notable features, objects, and context. Make it in Vietnamese.",
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold text-center mb-6">Visionary</h2>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center w-full md:w-1/3 gap-5">
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            {selectedFile && (
              <div className="w-full">
                <Image
                  width={300}
                  height={300}
                  src={URL.createObjectURL(selectedFile)}
                  alt="Selected file preview"
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>
            )}
            <button
              onClick={handleAnalyse}
              className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-transform transform active:scale-95"
            >
              Analyse
            </button>
          </div>
          <div className="w-full md:w-2/3">
            {loading && (
              <div className="flex justify-center items-center">
                <BeatLoader />
              </div>
            )}
            {htmlContent && (
              <div className="mt-6 md:mt-0 p-4 bg-gray-50 rounded-lg shadow-inner">
                <div className="prose">
                  <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
