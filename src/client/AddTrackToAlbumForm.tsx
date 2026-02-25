import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import "./Create.css";

type AlbumOption = {
  _id: string;
  title: string;
  artist: string;
  album_is_premium: boolean;
  cover_url?: string;
};

const AddTrackToAlbumForm: React.FC = () => {
  const location = useLocation();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");

  const [title, setTitle] = useState("");
  const [trackNumber, setTrackNumber] = useState<number>(1);
  const [premiumOverride, setPremiumOverride] = useState<
    "inherit" | "premium" | "free"
  >("inherit");

  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedAlbum = useMemo(
    () => albums.find((a) => a._id === selectedAlbumId),
    [albums, selectedAlbumId],
  );

  const canSubmit = useMemo(() => {
    return (
      !!selectedAlbumId &&
      title.trim().length > 0 &&
      trackNumber >= 1 &&
      !!audioFile
    );
  }, [selectedAlbumId, title, trackNumber, audioFile]);

  // Load albums
  useEffect(() => {
    const fetchAlbums = async () => {
      setError(null);
      setSuccess(null);

      if (!isLoaded) return;
      if (!isSignedIn) {
        setError("You must be signed in to load albums.");
        return;
      }

      try {
        setLoadingAlbums(true);

        const token = await getToken({ skipCache: true });
        if (!token) {
          setError("Could not get auth token. Try signing out/in.");
          return;
        }

        const res = await axios.get("/api/albums", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const list: AlbumOption[] = res.data?.albums || [];
        setAlbums(list);

        // Auto-select first album if none selected
        if (!selectedAlbumId && list.length > 0) {
          setSelectedAlbumId(list[0]._id);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load albums");
      } finally {
        setLoadingAlbums(false);
      }
    };

    fetchAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, isLoaded, isSignedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError("Pick an album, title, track number, and audio file.");
      return;
    }

    if (!isLoaded) return;
    if (!isSignedIn) {
      setError("You must be signed in to upload a track.");
      return;
    }

    try {
      setSubmitting(true);

      if (!isLoaded) {
        setError("Auth still loading.");
        return;
      }

      const token = await getToken({ skipCache: true });

      if (!token) {
        setError("You must be signed in.");
        return;
      }
      if (!token) {
        setError("Could not get auth token. Try signing out/in.");
        return;
      }

      const payload = new FormData();
      payload.append("title", title.trim());
      payload.append("track_number", String(trackNumber));

      // Only send track_is_premium if overriding
      if (premiumOverride !== "inherit") {
        payload.append(
          "track_is_premium",
          String(premiumOverride === "premium"),
        );
      }

      payload.append("audio", audioFile!);

      const res = await axios.post(
        `/api/albums/${selectedAlbumId}/tracks`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // don't set Content-Type; axios will set the boundary correctly
          },
        },
      );

      setSuccess(`Track added: ${res.data?.track?.title ?? title.trim()}`);

      // Reset for next add
      setTitle("");
      setTrackNumber((n) => n + 1);
      setPremiumOverride("inherit");
      setAudioFile(null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to add track");
    } finally {
      setSubmitting(false);
    }
  };

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

      <form className="create-form space-y-6" onSubmit={handleSubmit}>
        <div className="create-form-container text-center">
          <h1 className="create-form-box-text text-3xl font-bold">
            Add Track to Album
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

        {/* Album dropdown */}
        <div>
          <label className="create-label block text-lg font-medium mb-2">
            Choose Album
          </label>
          <select
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900"
            value={selectedAlbumId}
            onChange={(e) => setSelectedAlbumId(e.target.value)}
            disabled={loadingAlbums || albums.length === 0}
          >
            {albums.length === 0 ? (
              <option value="">
                {loadingAlbums ? "Loading albums..." : "No albums found"}
              </option>
            ) : (
              albums.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.title} — {a.artist}{" "}
                  {a.album_is_premium ? "(Premium default)" : "(Free default)"}
                </option>
              ))
            )}
          </select>

          {selectedAlbum?.cover_url ? (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={selectedAlbum.cover_url}
                alt={`${selectedAlbum.title} cover`}
                style={{
                  width: 64,
                  height: 64,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
              <div className="text-sm">
                <div>
                  <strong>{selectedAlbum.title}</strong>
                </div>
                <div>{selectedAlbum.artist}</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Track title */}
        <div>
          <label className="create-label block text-lg font-medium mb-2">
            Track Title
          </label>
          <input
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Bonus Track"
            required
          />
        </div>

        {/* Track number */}
        <div>
          <label className="create-label block text-lg font-medium mb-2">
            Track Number
          </label>
          <input
            type="number"
            min={1}
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900"
            value={trackNumber}
            onChange={(e) => setTrackNumber(Number(e.target.value))}
            required
          />
        </div>

        {/* Premium override */}
        <div>
          <label className="create-label block text-lg font-medium mb-2">
            Premium Override
          </label>
          <select
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900"
            value={premiumOverride}
            onChange={(e) => setPremiumOverride(e.target.value as any)}
          >
            <option value="inherit">Inherit album setting</option>
            <option value="premium">Premium</option>
            <option value="free">Free</option>
          </select>

          {selectedAlbum ? (
            <div className="text-sm mt-2 text-gray-600">
              Album default is{" "}
              <strong>
                {selectedAlbum.album_is_premium ? "Premium" : "Free"}
              </strong>
              . This override only applies to this track.
            </div>
          ) : null}
        </div>

        {/* Audio file */}
        <div>
          <label className="create-label block text-lg font-medium mb-2">
            Audio File (required)
          </label>
          <input
            type="file"
            accept="audio/*"
            className="create-input-field w-full"
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="create-submit-button w-full py-3 bg-blue-600 text-white font-bold rounded disabled:opacity-50"
        >
          {submitting ? "Uploading..." : "Add Track"}
        </button>
      </form>
    </div>
  );
};

export default AddTrackToAlbumForm;
