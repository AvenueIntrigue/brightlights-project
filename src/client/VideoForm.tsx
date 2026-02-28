import React, { useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import "./Create.css";
import { v4 as uuidv4 } from "uuid";
// If you want to redirect after success:
// import { useNavigate } from "react-router-dom";

type PresignResponse = { key: string; putUrl: string };

const MAX_MB = 500; // client-side sanity (adjust)
const MAX_BYTES = MAX_MB * 1024 * 1024;

const VideoForm: React.FC = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  // const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("Great Light");
  const [isPremium, setIsPremium] = useState(true);
  const [make4k, setMake4k] = useState(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>("");
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

  // ✅ No Content-Type header for direct-to-R2 uploads (avoid preflight/CORS/signature mismatches)
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

  function isVideoFile(f: File) {
    const name = f.name.toLowerCase();
    return (
      f.type.startsWith("video/") ||
      name.endsWith(".mp4") ||
      name.endsWith(".mov") ||
      name.endsWith(".m4v")
    );
  }

  const handlePickVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!f) return;

    if (!isVideoFile(f)) {
      setError(`Please choose a video file (mp4/mov). Got: ${f.name}`);
      return;
    }

    if (f.size > MAX_BYTES) {
      setError(`Video is too large for this uploader (${(f.size / 1024 / 1024).toFixed(1)}MB). Try a smaller test file.`);
      return;
    }

    setError(null);
    setVideoFile(f);
  };

  const handlePickPoster = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    setPosterFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setStage("");

    if (!canSubmit || !videoFile) {
      setError("Title + video file required.");
      return;
    }

    try {
      setLoading(true);

      // 1) Stable id for grouping files in R2 + linking DB record (Option C)
      const videoId = uuidv4();

      // 2) Presign + upload master video (NO contentType)
      setStage("Presigning master upload...");
      const videoPs = await presign({
        kind: "video_master",
        videoId,
        filename: videoFile.name,
      });

      setStage("Uploading master to R2...");
      await putToR2(videoPs.putUrl, videoFile);

      // 3) Optional poster (NO contentType)
      let posterKey = "";
      if (posterFile) {
        setStage("Presigning poster upload...");
        const posterPs = await presign({
          kind: "video_poster",
          videoId,
          filename: posterFile.name,
        });

        setStage("Uploading poster to R2...");
        await putToR2(posterPs.putUrl, posterFile);
        posterKey = posterPs.key;
      }

      // 4) Commit metadata (this should NOT transcode on Render; it just queues as processing)
      setStage("Committing metadata...");
      const token = await getFreshTokenOrThrow();
      const commitRes = await axios.post(
        "/api/videos/commit",
        {
          videoId,
          title: title.trim(),
          artist: creator.trim() || "Great Light",
          description: "", // add field later if you want
          video_is_premium: !!isPremium,
          make_4k: !!make4k,
          master_key: videoPs.key,
          poster_key: posterKey,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStage("");
      setSuccess(`Video saved (queued): ${commitRes.data?.video?.title ?? title}`);

      // reset
      setTitle("");
      setCreator("Great Light");
      setIsPremium(true);
      setMake4k(false);
      setVideoFile(null);
      setPosterFile(null);

      // If you want to bounce to the list page:
      // navigate("/admin/videos");
    } catch (err: any) {
      console.error(err);
      setStage("");
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

        {loading && stage && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded" role="alert">
            {stage}
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

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-[#f5f5f5]">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="h-5 w-5 border-gray-300 rounded"
            />
            Premium video
          </label>

          <label className="flex items-center gap-2 text-[#f5f5f5]">
            <input
              type="checkbox"
              checked={make4k}
              onChange={(e) => setMake4k(e.target.checked)}
              className="h-5 w-5 border-gray-300 rounded"
            />
            Generate 4K (worker)
          </label>
        </div>

        <div>
          <label className="create-label block text-lg font-medium mb-2 text-[#f5f5f5]">Video file (required)</label>
          <input
            type="file"
            accept="video/*,.mp4,.mov,.m4v"
            onChange={handlePickVideo}
            className="create-input-field w-full"
          />
          {videoFile && (
            <div className="text-sm mt-2 text-[#f5f5f5]">
              Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
            </div>
          )}
        </div>

        <div>
          <label className="create-label block text-lg font-medium mb-2 text-[#f5f5f5]">Poster image (optional)</label>
          <input type="file" accept="image/*" onChange={handlePickPoster} className="create-input-field w-full" />
          {posterFile && <div className="text-sm mt-2 text-[#f5f5f5]">Selected: {posterFile.name}</div>}
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