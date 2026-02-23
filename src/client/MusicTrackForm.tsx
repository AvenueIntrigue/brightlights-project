import React, { useState } from 'react';
import axios from 'axios';
import "./Create.css"; // Reuse your existing styles

const MusicTrackForm: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    artist: 'Great Light',
    album: '',
    track_number: '1',
    is_premium: true,
  });

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, is_premium: e.target.checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'cover') => {
    if (e.target.files?.[0]) {
      if (type === 'audio') setAudioFile(e.target.files[0]);
      if (type === 'cover') setCoverFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!formData.title || !formData.album || !audioFile) {
      setError('Title, album, and audio file are required');
      setLoading(false);
      return;
    }

    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('artist', formData.artist);
    payload.append('album', formData.album);
    payload.append('track_number', formData.track_number);
    payload.append('is_premium', formData.is_premium.toString());
    payload.append('audio', audioFile);
    if (coverFile) payload.append('cover', coverFile);

    try {
      const response = await axios.post('https://www.brightlightscreative.com/api/music', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(`Track saved: ${response.data.track.title}`);
      
      // Reset form
      setFormData({
        title: '',
        artist: 'Great Light',
        album: '',
        track_number: '1',
        is_premium: true,
      });
      setAudioFile(null);
      setCoverFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save track');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-grandpa mx-auto max-w-4xl p-6">
      <form className="create-form space-y-6" onSubmit={handleSubmit}>
        <div className="create-form-container text-center">
          <h1 className="create-form-box-text text-3xl font-bold">Add Music Track</h1>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="create-label block text-lg font-medium mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleTextChange}
            required
            placeholder="e.g., In That Day"
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Artist */}
        <div>
          <label htmlFor="artist" className="create-label block text-lg font-medium mb-2">
            Artist
          </label>
          <input
            type="text"
            id="artist"
            name="artist"
            value={formData.artist}
            onChange={handleTextChange}
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Album */}
        <div>
          <label htmlFor="album" className="create-label block text-lg font-medium mb-2">
            Album
          </label>
          <input
            type="text"
            id="album"
            name="album"
            value={formData.album}
            onChange={handleTextChange}
            required
            placeholder="e.g., Silent Sparks"
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Track Number */}
        <div>
          <label htmlFor="track_number" className="create-label block text-lg font-medium mb-2">
            Track Number
          </label>
          <input
            type="number"
            id="track_number"
            name="track_number"
            value={formData.track_number}
            onChange={handleTextChange}
            min="1"
            className="create-input-field w-full h-12 px-4 border rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Premium Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_premium"
            name="is_premium"
            checked={formData.is_premium}
            onChange={handleCheckboxChange}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_premium" className="ml-2 block text-lg font-medium text-gray-900">
            Premium Track (requires subscription)
          </label>
        </div>

        {/* Cover Art */}
        <div>
          <label htmlFor="cover" className="create-label block text-lg font-medium mb-2">
            Cover Art (optional, JPG/PNG)
          </label>
          <input
            type="file"
            id="cover"
            name="cover"
            accept="image/*"
            onChange={(e) => e.target.files && setCoverFile(e.target.files[0])}
            className="create-input-field w-full"
          />
        </div>

        {/* Audio File */}
        <div>
          <label htmlFor="audio" className="create-label block text-lg font-medium mb-2">
            Audio File (MP3 or M4A) - Required
          </label>
          <input
            type="file"
            id="audio"
            name="audio"
            accept="audio/*"
            onChange={(e) => e.target.files && setAudioFile(e.target.files[0])}
            required
            className="create-input-field w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="create-submit-button w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Uploading...' : 'Save Track'}
        </button>
      </form>
    </div>
  );
};

export default MusicTrackForm;