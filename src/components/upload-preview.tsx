import Image from "next/image";

type Props = {
  url: string;
};

export default function UploadPreview({ url }: Props) {
  return (
    <div className="w-full">
      <Image
        width={300}
        height={300}
        src={url}
        alt="Selected file preview"
        className="w-full h-auto rounded-lg shadow-md"
      />
    </div>
  );
}
