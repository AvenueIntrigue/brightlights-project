import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import "./Create.css";

type VideoRow = {
  _id: string;
  videoId: string;
  title: string;
  artist: string;
  video_is_premium: boolean;
  make_4k?: boolean;
  master_mp4_path?: string;

  poster_url?: string;
  mp4_720_url?: string;
  mp4_1080_url?: string;
  mp4_2160_url?: string;

  status: "processing" | "active" | "failed" | "archived";
  processing_started_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const VideoAdmin: React.FC = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [rows, setRows] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function getFreshTokenOrThrow() {
    if (!isLoaded) throw new Error("Auth is still loading.");
    if (!isSignedIn) throw new Error("You must be signed in.");
    const token = await getToken({ skipCache: true });
    if (!token) throw new Error("Could not get auth token. Sign out/in and try again.");
    return token;
  }

  async function load() {
    try {
      setErr(null);
      setLoading(true);
      const token = await getFreshTokenOrThrow();

      const res = await axios.get("/api/videos", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRows(res.data?.videos ?? []);
    } catch (e: any) {
      console.error(e);
      setErr(e?.response?.data?.message || e?.message || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }

  async function retry(videoId: string) {
    try {
      setErr(null);
      const token = await getFreshTokenOrThrow();

      await axios.post(
        `/api/videos/${encodeURIComponent(videoId)}/retry`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // refresh list
      await load();
    } catch (e: any) {
      console.error(e);
      setErr(e?.response?.data?.message || e?.message || "Failed to retry video");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bd - ad;
    });
  }, [rows]);

  function statusBadge(status: VideoRow["status"]) {
    const base = "px-2 py-1 rounded text-xs font-semibold";
    if (status === "active") return `${base} bg-green-200 text-green-900`;
    if (status === "processing") return `${base} bg-yellow-200 text-yellow-900`;
    if (status === "failed") return `${base} bg-red-200 text-red-900`;
    return `${base} bg-gray-200 text-gray-900`;
  }

  return (
    <div className="create-grandpa mx-auto max-w-5xl p-6">
      <div className="create-form-container text-center mb-6">
        <h1 className="create-form-box-text text-3xl font-bold">Videos</h1>

        <div className="mt-3 flex items-center justify-center gap-3">
          <Link to="/admin/videos/upload" className="px-4 py-2 rounded bg-green-200 text-slate-700 border-none">
            Upload New Video
          </Link>

          <button
            type="button"
            onClick={load}
            className="px-4 py-2 rounded border bg-white text-gray-900"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {err}
        </div>
      )}

      {sorted.length === 0 && !loading && (
        <div className="text-[#f5f5f5] text-center">No videos yet. Click “Upload New Video”.</div>
      )}

      <div className="space-y-3">
        {sorted.map((v) => (
          <div key={v._id} className="p-4 rounded border bg-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                {v.poster_url ? (
                  <img src={v.poster_url} alt={v.title} className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-200" />
                )}

                <div>
                  <div className="text-gray-900 font-semibold">{v.title}</div>
                  <div className="text-sm text-gray-700">{v.artist}</div>

                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className={statusBadge(v.status)}>{v.status}</span>
                    <span className="text-xs text-gray-600">{v.video_is_premium ? "Premium" : "Free"}</span>
                    {v.make_4k ? <span className="text-xs text-gray-600">4K enabled</span> : null}
                    <span className="text-xs text-gray-500">videoId: {v.videoId}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {v.mp4_720_url && (
                  <a className="px-3 py-2 border rounded text-sm" href={v.mp4_720_url} target="_blank" rel="noreferrer">
                    Open 720p
                  </a>
                )}
                {v.mp4_1080_url && (
                  <a className="px-3 py-2 border rounded text-sm" href={v.mp4_1080_url} target="_blank" rel="noreferrer">
                    Open 1080p
                  </a>
                )}
                {v.mp4_2160_url && (
                  <a className="px-3 py-2 border rounded text-sm" href={v.mp4_2160_url} target="_blank" rel="noreferrer">
                    Open 4K
                  </a>
                )}

                {v.status === "failed" && (
                  <button
                    type="button"
                    onClick={() => retry(v.videoId)}
                    className="px-3 py-2 rounded text-sm bg-red-200 text-red-900 border-none"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>

            {v.status === "processing" && (
              <div className="mt-3 text-sm text-gray-700">
                Processing on your Mac worker… click Refresh after it finishes.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoAdmin;