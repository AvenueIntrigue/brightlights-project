import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "@clerk/clerk-react";
import "./Create.css";

type TrackRow = {
  file: File;
  title: string;
  trackNumber: number;
  premiumOverride: "inherit" | "premium" | "free";
};

type AlbumOption = {
  _id: string;
  title: string;
  artist: string;
  album_is_premium: boolean;
  cover_url?: string;
  createdAt?: string;
};

type TrackListItem = {
  _id: string;
  title: string;
  track_number: number;
  track_is_premium?: boolean;
};

const MusicAlbumForm: React.FC = () => {
  const location = useLocation();
  const { session } = useSession();

  // =========================
  // Upload Album form state
  // =========================
  const [albumTitle, setAlbumTitle] = useState("");
  const [artist, setArtist] = useState("Great Light");
  const [albumIsPremium, setAlbumIsPremium] = useState(true);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [tracks, setTracks] = useState<TrackRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // =========================
  // Add Track Later state
  // =========================
  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumsError, setAlbumsError] = useState<string | null>(null);

  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [nextTrackNumber, setNextTrackNumber] = useState<number>(1);

  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackNumber, setNewTrackNumber] = useState<number>(1);
  const [newTrackPremiumOverride, setNewTrackPremiumOverride] = useState<
    "inherit" | "premium" | "free"
  >("inherit");
  const [newTrackAudio, setNewTrackAudio] = useState<File | null>(null);

  const [addTrackLoading, setAddTrackLoading] = useState(false);
  const [addTrackError, setAddTrackError] = useState<string | null>(null);
  const [addTrackSuccess, setAddTrackSuccess] = useState<string | null>(null);

  const [existingTracks, setExistingTracks] = useState<TrackListItem[]>([]);
  const [tracksListLoading, setTracksListLoading] = useState(false);

  // =========================
  // Helpers
  // =========================
  const canSubmitAlbum = useMemo(() => {
    return (
      albumTitle.trim().length > 0 &&
      !!coverFile &&
      tracks.length > 0 &&
      tracks.every((t) => t.title.trim().length > 0 && t.trackNumber >= 1)
    );
  }, [albumTitle, coverFile, tracks]);

  const canSubmitAddTrack = useMemo(() => {
    return (
      selectedAlbumId.trim().length > 0 &&
      newTrackTitle.trim().length > 0 &&
      newTrackNumber >= 1 &&
      !!newTrackAudio
    );
  }, [selectedAlbumId, newTrackTitle, newTrackNumber, newTrackAudio]);

  const stripExt = (name: string) => name.replace(/\.[^/.]+$/, "");

  const getTokenOrThrow = async () => {
    const token = await session?.getToken();
    if (!token) throw new Error("You must be signed in.");
    return token;
  };

  // =========================
  // Album upload handlers
  // =========================
  const handlePickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setCoverFile(f);
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

    // allows selecting same file set again if needed
    e.target.value = "";
  };

  const updateTrack = (idx: number, patch: Partial<TrackRow>) => {
    setTracks((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
    );
  };

  const removeTrack = (idx: number) => {
    setTracks((prev) => prev.filter((_, i) => i !== idx));
  };

  const renumber = () => {
    setTracks((prev) => prev.map((t, i) => ({ ...t, trackNumber: i + 1 })));
  };

  const handleSubmitAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmitAlbum) {
      setError("Album title, cover, and at least one track are required.");
      return;
    }

    try {
      setLoading(true);
      const token = await getTokenOrThrow();

      const payload = new FormData();
      payload.append("album_title", albumTitle.trim());
      payload.append("artist", artist.trim() || "Great Light");
      payload.append("album_is_premium", String(albumIsPremium));
      payload.append("cover", coverFile!);

      tracks.forEach((t) => payload.append("tracks", t.file));

      payload.append(
        "track_titles",
        JSON.stringify(tracks.map((t) => t.title)),
      );
      payload.append(
        "track_numbers",
        JSON.stringify(tracks.map((t) => t.trackNumber)),
      );

      const premiumArray = tracks.map((t) => {
        if (t.premiumOverride === "inherit") return null;
        return t.premiumOverride === "premium";
      });
      payload.append("track_is_premium", JSON.stringify(premiumArray));

      const res = await axios.post("/api/albums", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(
        `Album uploaded: ${res.data.album?.title ?? albumTitle} (${res.data.tracks?.length ?? tracks.length} tracks)`,
      );

      // Reset upload form
      setAlbumTitle("");
      setArtist("Great Light");
      setAlbumIsPremium(true);
      setCoverFile(null);
      setTracks([]);

      // Refresh albums list so the new album appears immediately
      await fetchAlbums();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || "Failed to upload album",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Add Track Later logic
  // =========================
  const fetchAlbums = async () => {
    setAlbumsError(null);
    setAlbumsLoading(true);
    try {
      const token = await getTokenOrThrow();
      const res = await axios.get("/api/albums", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlbums(res.data.albums || []);
    } catch (err: any) {
      console.error(err);
      setAlbumsError(err.response?.data?.message || "Failed to load albums");
    } finally {
      setAlbumsLoading(false);
    }
  };

  const fetchNextNumberAndTracks = async (albumId: string) => {
    setAddTrackError(null);
    setAddTrackSuccess(null);

    try {
      const token = await getTokenOrThrow();

      // next number
      const nextRes = await axios.get(
        `/api/albums/${albumId}/tracks/next-number`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const next = Number(nextRes.data?.nextNumber ?? 1);
      setNextTrackNumber(next);
      setNewTrackNumber(next);

      // track list (optional but very helpful)
      setTracksListLoading(true);
      const tracksRes = await axios.get(`/api/albums/${albumId}/tracks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExistingTracks(tracksRes.data?.tracks || []);
    } catch (err: any) {
      console.error(err);
      setAddTrackError(
        err.response?.data?.message || "Failed to load album track info",
      );
    } finally {
      setTracksListLoading(false);
    }
  };

  const handleSubmitAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddTrackError(null);
    setAddTrackSuccess(null);

    if (!canSubmitAddTrack) {
      setAddTrackError(
        "Album, title, track number, and audio file are required.",
      );
      return;
    }

    try {
      setAddTrackLoading(true);
      const token = await getTokenOrThrow();

      const payload = new FormData();
      payload.append("title", newTrackTitle.trim());
      payload.append("track_number", String(newTrackNumber));
      payload.append("audio", newTrackAudio!);

      // Only include track_is_premium if user is NOT inheriting
      if (newTrackPremiumOverride !== "inherit") {
        payload.append(
          "track_is_premium",
          String(newTrackPremiumOverride === "premium"),
        );
      }

      const res = await axios.post(
        `/api/albums/${selectedAlbumId}/tracks`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setAddTrackSuccess(
        `Track added: ${res.data.track?.title ?? newTrackTitle}`,
      );

      // Reset add-track inputs (but keep album selected)
      setNewTrackTitle("");
      setNewTrackAudio(null);
      setNewTrackPremiumOverride("inherit");

      // Refresh next number + track list
      await fetchNextNumberAndTracks(selectedAlbumId);
    } catch (err: any) {
      console.error(err);
      setAddTrackError(err.response?.data?.message || "Failed to add track");
    } finally {
      setAddTrackLoading(false);
    }
  };

  // Load albums when the page loads (only if signed-in)
  useEffect(() => {
    if (!session) return;
    fetchAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // When album selection changes, refresh next number and tracks
  useEffect(() => {
    if (!selectedAlbumId) {
      setExistingTracks([]);
      setNextTrackNumber(1);
      setNewTrackNumber(1);
      return;
    }
    fetchNextNumberAndTracks(selectedAlbumId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlbumId]);

  const selectedAlbum = useMemo(
    () => albums.find((a) => a._id === selectedAlbumId),
    [albums, selectedAlbumId],
  );

  return (
    <div className="create-grandpa mx-auto max-w-4xl p-6">
      {/* Admin Music Navigation */}
      <div className="mb-6 flex gap-4 border-b pb-3">
        <Link
          to="/admin/music"
          className={`px-4 py-2 rounded font-medium ${
            location.pathname === "/admin/music"
              ? "bg-blue-600 text-white"
              : "border"
          }`}
        >
          Upload Album
        </Link>

        <Link
          to="/admin/music/add-track"
          className={`px-4 py-2 rounded font-medium ${
            location.pathname === "/admin/music/add-track"
              ? "bg-blue-600 text-white"
              : "border"
          }`}
        >
          Add Track
        </Link>
      </div>
      {/* =========================
          Upload Album
         ========================= */}
      <form className="create-form space-y-6" onSubmit={handleSubmitAlbum}>
        <div className="create-form-container text-center">
          <h1 className="create-form-box-text text-3xl font-bold">
            Upload Album
          </h1>
        </div>

        {success && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
            role="alert"
          >
            {success}
          </div>
        )}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
            role="alert"
          >
            {error}
          </div>
        )}

        <div>
          <label className="create-label block text-lg font-medium mb-2">
            Album Title
          </label>
          <input
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900"
            value={albumTitle}
            onChange={(e) => setAlbumTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="create-label block text-lg font-medium mb-2">
            Artist
          </label>
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
          <label className="create-label block text-lg font-medium mb-2">
            Album Cover (required)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePickCover}
            className="create-input-field w-full"
            required
          />
          {coverFile && (
            <div className="text-sm mt-2">Selected: {coverFile.name}</div>
          )}
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
              <button
                type="button"
                onClick={renumber}
                className="px-3 py-2 border rounded"
              >
                Renumber 1..N
              </button>

              {tracks.map((t, idx) => (
                <div
                  key={`${t.file.name}-${idx}`}
                  className="p-3 border rounded bg-white"
                >
                  <div className="text-sm mb-2">
                    <strong>File:</strong> {t.file.name}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <input
                        className="create-input-field w-full h-10 px-3 border rounded bg-white"
                        value={t.title}
                        onChange={(e) =>
                          updateTrack(idx, { title: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Track #</label>
                      <input
                        type="number"
                        min={1}
                        className="create-input-field w-full h-10 px-3 border rounded bg-white"
                        value={t.trackNumber}
                        onChange={(e) =>
                          updateTrack(idx, {
                            trackNumber: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Premium Override
                      </label>
                      <select
                        className="create-input-field w-full h-10 px-3 border rounded bg-white"
                        value={t.premiumOverride}
                        onChange={(e) =>
                          updateTrack(idx, {
                            premiumOverride: e.target
                              .value as TrackRow["premiumOverride"],
                          })
                        }
                      >
                        <option value="inherit">Inherit album</option>
                        <option value="premium">Premium</option>
                        <option value="free">Free</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => removeTrack(idx)}
                      className="px-3 py-2 border rounded"
                    >
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
          disabled={loading || !canSubmitAlbum}
          className="create-submit-button w-full py-3 bg-blue-600 text-white font-bold rounded disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Album"}
        </button>
      </form>

      {/* =========================
          Add Track Later
         ========================= */}
      <div className="mt-10 p-6 border rounded bg-white">
        <h2 className="text-2xl font-bold mb-4">Add Track to Existing Album</h2>

        {albumsError && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
            role="alert"
          >
            {albumsError}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-lg font-medium mb-2">Select Album</label>
          <div className="flex gap-2">
            <select
              className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900"
              value={selectedAlbumId}
              onChange={(e) => setSelectedAlbumId(e.target.value)}
              disabled={albumsLoading}
            >
              <option value="">
                {albumsLoading ? "Loading albums..." : "-- Choose an album --"}
              </option>
              {albums.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.title} — {a.artist}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchAlbums}
              className="px-4 border rounded"
              disabled={albumsLoading}
            >
              Refresh
            </button>
          </div>

          {selectedAlbum && (
            <div className="text-sm mt-2">
              <strong>Selected:</strong> {selectedAlbum.title} —{" "}
              {selectedAlbum.artist}{" "}
              <span className="ml-2">
                (Default: {selectedAlbum.album_is_premium ? "Premium" : "Free"})
              </span>
            </div>
          )}
        </div>

        {selectedAlbumId && (
          <>
            {addTrackSuccess && (
              <div
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
                role="alert"
              >
                {addTrackSuccess}
              </div>
            )}
            {addTrackError && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
                role="alert"
              >
                {addTrackError}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmitAddTrack}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Track Title</label>
                  <input
                    className="create-input-field w-full h-10 px-3 border rounded bg-white"
                    value={newTrackTitle}
                    onChange={(e) => setNewTrackTitle(e.target.value)}
                    placeholder="e.g., Track Name"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Track # (suggested: {nextTrackNumber})
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="create-input-field w-full h-10 px-3 border rounded bg-white"
                    value={newTrackNumber}
                    onChange={(e) => setNewTrackNumber(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">
                    Premium Override
                  </label>
                  <select
                    className="create-input-field w-full h-10 px-3 border rounded bg-white"
                    value={newTrackPremiumOverride}
                    onChange={(e) =>
                      setNewTrackPremiumOverride(e.target.value as any)
                    }
                  >
                    <option value="inherit">Inherit album</option>
                    <option value="premium">Premium</option>
                    <option value="free">Free</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Audio File (required)
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    className="create-input-field w-full"
                    onChange={(e) =>
                      setNewTrackAudio(e.target.files?.[0] ?? null)
                    }
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addTrackLoading || !canSubmitAddTrack}
                className="create-submit-button w-full py-3 bg-blue-600 text-white font-bold rounded disabled:opacity-50"
              >
                {addTrackLoading ? "Adding..." : "Add Track"}
              </button>
            </form>

            <div className="mt-6">
              <h3 className="text-lg font-bold mb-2">Existing Tracks</h3>
              {tracksListLoading ? (
                <div className="text-sm">Loading tracks…</div>
              ) : existingTracks.length === 0 ? (
                <div className="text-sm">
                  No tracks found for this album yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {existingTracks.map((t) => (
                    <div key={t._id} className="p-2 border rounded text-sm">
                      <strong>{t.track_number}.</strong> {t.title}{" "}
                      <span className="ml-2">
                        {t.track_is_premium === undefined
                          ? "(inherit)"
                          : t.track_is_premium
                            ? "(premium)"
                            : "(free)"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MusicAlbumForm;
