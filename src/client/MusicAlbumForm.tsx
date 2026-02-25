import React, { useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import "./Create.css";

type TrackRow = {
  file: File;
  title: string;
  trackNumber: number;
  premiumOverride: "inherit" | "premium" | "free";
};

const MusicAlbumForm: React.FC = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [albumTitle, setAlbumTitle] = useState("");
  const [artist, setArtist] = useState("Great Light");
  const [albumIsPremium, setAlbumIsPremium] = useState(true);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [tracks, setTracks] = useState<TrackRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      albumTitle.trim().length > 0 &&
      !!coverFile &&
      tracks.length > 0 &&
      tracks.every((t) => t.title.trim().length > 0 && t.trackNumber >= 1)
    );
  }, [albumTitle, coverFile, tracks]);

  const stripExt = (name: string) => name.replace(/\.[^/.]+$/, "");

  const handlePickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setCoverFile(f);
  };

  const handlePickTracks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.sort((a, b) => a.name.localeCompare(b.name));

    setTracks((prev) => {
      const start = prev.length + 1;
      const newRows: TrackRow[] = files.map((file, idx) => ({
        file,
        title: stripExt(file.name),
        trackNumber: start + idx,
        premiumOverride: "inherit",
      }));
      return [...prev, ...newRows];
    });

    // allow selecting the same file again later
    e.target.value = "";
  };

  const updateTrack = (idx: number, patch: Partial<TrackRow>) => {
    setTracks((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const removeTrack = (idx: number) => {
    setTracks((prev) => prev.filter((_, i) => i !== idx));
  };

  const renumber = () => {
    setTracks((prev) => prev.map((t, i) => ({ ...t, trackNumber: i + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!albumTitle.trim() || !coverFile) {
      setError("Album title and cover are required.");
      return;
    }
    if (tracks.length === 0) {
      setError("Please add at least one track file.");
      return;
    }
    if (!canSubmit) {
      setError("Please fill out all track titles and track numbers.");
      return;
    }

    if (!isLoaded) {
      setError("Auth is still loading—try again in a moment.");
      return;
    }
    if (!isSignedIn) {
      setError("You must be signed in to upload music.");
      return;
    }

    // ✅ Always get a fresh token right before the API call
    const token = await getToken({ skipCache: true });
    if (!token) {
      setError("Could not get an auth token. Please sign out/in and try again.");
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();
      payload.append("album_title", albumTitle.trim());
      payload.append("artist", artist.trim() || "Great Light");
      payload.append("album_is_premium", String(albumIsPremium));
      payload.append("cover", coverFile);

      // audio files
      tracks.forEach((t) => payload.append("tracks", t.file));

      // per-track metadata arrays
      payload.append("track_titles", JSON.stringify(tracks.map((t) => t.title)));
      payload.append("track_numbers", JSON.stringify(tracks.map((t) => t.trackNumber)));

      // null => inherit album premium
      const premiumArray = tracks.map((t) => {
        if (t.premiumOverride === "inherit") return null;
        return t.premiumOverride === "premium";
      });
      payload.append("track_is_premium", JSON.stringify(premiumArray));

      const res = await axios.post("/api/albums", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          // ✅ do NOT set Content-Type for FormData
        },
      });

      setSuccess(
        `Album uploaded: ${res.data.album?.title ?? albumTitle} (${res.data.tracks?.length ?? tracks.length} tracks)`
      );

      // reset
      setAlbumTitle("");
      setArtist("Great Light");
      setAlbumIsPremium(true);
      setCoverFile(null);
      setTracks([]);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || `Upload failed (${err.response?.status || "unknown"})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-grandpa mx-auto max-w-4xl p-6">
      <form className="create-form space-y-6" onSubmit={handleSubmit}>
        <div className="create-form-container text-center">
          <h1 className="create-form-box-text text-3xl font-bold">Upload Album</h1>
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
          <label className="create-label block text-lg font-medium mb-2">Album Title</label>
          <input
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900"
            value={albumTitle}
            onChange={(e) => setAlbumTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="create-label block text-lg font-medium mb-2">Artist</label>
          <input
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={albumIsPremium}
            onChange={(e) => setAlbumIsPremium(e.target.checked)}
            className="h-5 w-5 border-gray-300 rounded"
          />
          <label className="ml-2 block text-lg font-medium text-gray-900">
            Album is Premium (tracks inherit unless overridden)
          </label>
        </div>

        <div>
          <label className="create-label block text-lg font-medium mb-2">Album Cover (required)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePickCover}
            className="create-input-field w-full"
            required
          />
          {coverFile && <div className="text-sm mt-2">Selected: {coverFile.name}</div>}
        </div>

        <div>
          <label className="create-label block text-lg font-medium mb-2">
            Tracks (select multiple audio files)
          </label>
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handlePickTracks}
            className="create-input-field w-full"
          />

          {tracks.length > 0 && (
            <div className="mt-4 space-y-3">
              <button type="button" onClick={renumber} className="px-3 py-2 border rounded">
                Renumber 1..N
              </button>

              {tracks.map((t, idx) => (
                <div key={`${t.file.name}-${idx}`} className="p-3 border rounded bg-white">
                  <div className="text-sm mb-2">
                    <strong>File:</strong> {t.file.name}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <input
                        className="create-input-field w-full h-10 px-3 border rounded bg-white"
                        value={t.title}
                        onChange={(e) => updateTrack(idx, { title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Track #</label>
                      <input
                        type="number"
                        min={1}
                        className="create-input-field w-full h-10 px-3 border rounded bg-white"
                        value={t.trackNumber}
                        onChange={(e) => updateTrack(idx, { trackNumber: Number(e.target.value) })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Premium Override</label>
                      <select
                        className="create-input-field w-full h-10 px-3 border rounded bg-white"
                        value={t.premiumOverride}
                        onChange={(e) =>
                          updateTrack(idx, { premiumOverride: e.target.value as TrackRow["premiumOverride"] })
                        }
                      >
                        <option value="inherit">Inherit album</option>
                        <option value="premium">Premium</option>
                        <option value="free">Free</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button type="button" onClick={() => removeTrack(idx)} className="px-3 py-2 border rounded">
                      Remove Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="create-submit-button w-full py-3 bg-blue-600 text-white font-bold rounded disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Album"}
        </button>
      </form>
    </div>
  );
};

export default MusicAlbumForm;