import React, { useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import "./Create.css";
import { v4 as uuidv4 } from "uuid";

type PresignResponse = { key: string; putUrl: string };

const VideoForm: React.FC = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("Great Light");
  const [isPremium, setIsPremium] = useState(true);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && !!videoFile;
  }, [title, videoFile]);

  async function getFreshTokenOrThrow() {
    if (!isLoaded) throw new Error("Auth is still loading.");
    if (!isSignedIn) throw new Error("You must be signed in.");
    const token = await getToken({ skipCache: true });
    if (!token) throw new Error("Could not get auth token. Sign out/in and try again.");
    return token;
  }

  async function presign(body: any): Promise<PresignResponse> {
    const token = await getFreshTokenOrThrow();
    const res = await axios.post("/api/r2/presign", body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data as PresignResponse;
  }

  // ✅ No Content-Type header for video uploads (avoid preflight/signature issues)
  async function putToR2(putUrl: string, file: File) {
    const resp = await fetch(putUrl, {
      method: "PUT",
      mode: "cors",
      credentials: "omit",
      body: file,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`R2 upload failed (${resp.status}): ${text.slice(0, 300)}`);
    }
  }

  const handlePickVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    const ok =
      f.type.startsWith("video/") ||
      f.name.toLowerCase().endsWith(".mp4") ||
      f.name.toLowerCase().endsWith(".mov") ||
      f.name.toLowerCase().endsWith(".m4v");

    if (!ok) {
      setError(`Please choose a video file (mp4/mov). Got: ${f.name}`);
      e.target.value = "";
      return;
    }

    setVideoFile(f);
    e.target.value = "";
  };

  const handlePickPoster = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setPosterFile(f);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmit || !videoFile) {
      setError("Title + video file required.");
      return;
    }

    try {
      setLoading(true);

      // 1) Stable id for grouping files in R2 + linking DB record (Option C)
      const videoId = uuidv4();

      // 2) Presign + upload master video (NO contentType)
      const videoPs = await presign({
        kind: "video_master",
        videoId,
        filename: videoFile.name,
      });
      await putToR2(videoPs.putUrl, videoFile);

      // 3) Optional poster (NO contentType)
      let posterKey = "";
      if (posterFile) {
        const posterPs = await presign({
          kind: "video_poster",
          videoId,
          filename: posterFile.name,
        });
        await putToR2(posterPs.putUrl, posterFile);
        posterKey = posterPs.key;
      }

      // 4) Commit metadata
      const token = await getFreshTokenOrThrow();
      const commitRes = await axios.post(
        "/api/videos/commit",
        {
          videoId,
          title: title.trim(),
          artist: creator.trim() || "Great Light",
          video_is_premium: !!isPremium,
          master_key: videoPs.key,
          poster_key: posterKey,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Video saved: ${commitRes.data?.video?.title ?? title}`);
      setTitle("");
      setCreator("Great Light");
      setIsPremium(true);
      setVideoFile(null);
      setPosterFile(null);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Upload failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-grandpa mx-auto max-w-3xl p-6">
      <form className="create-form space-y-6" onSubmit={handleSubmit}>
        <div className="create-form-container text-center">
          <h1 className="create-form-box-text text-3xl font-bold">Upload Video (Master)</h1>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
            {error}
          </div>
        )}

        <div>
          <label className="create-label block text-lg font-medium mb-2 text-[#f5f5f5]">Title</label>
          <input
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="create-label block text-lg font-medium mb-2 text-[#f5f5f5]">Creator</label>
          <input
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isPremium}
            onChange={(e) => setIsPremium(e.target.checked)}
            className="h-5 w-5 border-gray-300 rounded"
          />
          <label className="ml-2 block text-lg font-medium text-[#f5f5f5]">Premium video</label>
        </div>

        <div>
          <label className="create-label block text-lg font-medium mb-2 text-[#f5f5f5]">Video file (required)</label>
          <input
            type="file"
            accept="video/*,.mp4,.mov,.m4v"
            onChange={handlePickVideo}
            className="create-input-field w-full"
          />
          {videoFile && <div className="text-sm mt-2">Selected: {videoFile.name}</div>}
        </div>

        <div>
          <label className="create-label block text-lg font-medium mb-2 text-[#f5f5f5]">Poster image (optional)</label>
          <input type="file" accept="image/*" onChange={handlePickPoster} className="create-input-field w-full" />
          {posterFile && <div className="text-sm mt-2">Selected: {posterFile.name}</div>}
        </div>

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className={`create-submit-button border-none h-10 rounded w-full mt-4 mx-auto disabled:opacity-50 ${
            success ? "bg-green-700 text-[#f5f5f5]" : "bg-green-200 text-slate-700"
          }`}
        >
          {loading ? "Uploading..." : success ? "Upload Complete ✓" : "Upload Video"}
        </button>
      </form>
    </div>
  );
};

export default VideoForm;