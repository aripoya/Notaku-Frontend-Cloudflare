"use client";
import { useRef, useState } from "react";
import Webcam from "react-webcam";

type Props = { onSelect: (file: File) => void };
export default function ReceiptUpload({ onSelect }: Props) {
  const [useCamera, setUseCamera] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const capture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const file = new File([blob], `receipt_${Date.now()}.jpg`, { type: "image/jpeg" });
    setPreview(imageSrc);
    onSelect(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-md border" onClick={() => setUseCamera(false)}>Upload File</button>
        <button className="px-4 py-2 rounded-md border" onClick={() => setUseCamera(true)}>Kamera</button>
      </div>
      {useCamera ? (
        <div className="space-y-3">
          <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full rounded-md" />
          <button className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={capture}>Ambil Foto</button>
        </div>
      ) : (
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (f.size > 10 * 1024 * 1024) return;
              setPreview(URL.createObjectURL(f));
              onSelect(f);
            }
          }}
        />
      )}
      {preview && (
        <img src={preview} alt="Preview" className="rounded-md border max-h-80" />
      )}
    </div>
  );
}
