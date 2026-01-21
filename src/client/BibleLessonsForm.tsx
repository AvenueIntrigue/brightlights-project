// src/components/BibleLessonsForm.tsx (or wherever you want to put it)
import React, { useState } from 'react';
import axios from 'axios';

// Interface matching the backend schema
interface LessonFormData {
  topic: string;
  title: string;
  scripture: string;       // Full chapter text
  order: number;
  reflection: string;
  action_item: string;
  prayer: string;
}

// List of valid topics (same as backend)
const dailyTopics = [
  'love', 'joy', 'peace', 'patience', 'kindness', 'goodness', 'faithfulness',
  'gentleness', 'self-control', 'family', 'faith', 'forgiveness', 'repentance',
  'gratitude', 'hope', 'humility', 'obedience', 'called_to_create',
  'honor_god_in_your_work', 'liberty', 'bread_of_life', 'living_water',
  'provision', 'holy_spirit_guidance', 'follower_of_christ', 'salvation'
] as const;

const BibleLessonsForm: React.FC = () => {
  const [formData, setFormData] = useState<LessonFormData>({
    topic: 'love',
    title: '',
    scripture: '',
    order: 1,
    reflection: '',
    action_item: '',
    prayer: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'order' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (!formData.topic) {
      setError('Please select a topic');
      setLoading(false);
      return;
    }
    if (!dailyTopics.includes(formData.topic as any)) {
      setError('Invalid topic selected');
      setLoading(false);
      return;
    }
    if (!formData.title) {
      setError('Title is required (e.g., "John 4 – The Woman at the Well")');
      setLoading(false);
      return;
    }
    if (!formData.scripture || formData.scripture.length < 1000) {
      setError('Please paste the full chapter scripture (at least 1000 characters)');
      setLoading(false);
      return;
    }
    if (!formData.reflection) {
      setError('Reflection is required (~300 words)');
      setLoading(false);
      return;
    }
    if (!formData.action_item) {
      setError('Action Item is required');
      setLoading(false);
      return;
    }
    if (!formData.prayer) {
      setError('Prayer is required');
      setLoading(false);
      return;
    }
    if (!Number.isInteger(formData.order) || formData.order < 1) {
      setError('Order must be a positive integer');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('https://brightlightscreative.com/api/lessons', formData);
      setSuccess('Lesson saved successfully!');
      console.log('Saved lesson:', response.data);

      // Reset form, auto-increment order for next lesson
      setFormData({
        topic: formData.topic,
        title: '',
        scripture: '',
        order: formData.order + 1,
        reflection: '',
        action_item: '',
        prayer: '',
      });
    } catch (err: any) {
      console.error('Error saving lesson:', err);
      setError(err.response?.data?.message || 'Failed to save lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-grandpa mx-auto max-w-4xl p-6">
      <form className="create-form space-y-6" onSubmit={handleSubmit}>
        <div className="create-form-container text-center">
          <h1 className="create-box-text text-3xl font-bold">Create Daily Bible Lesson</h1>
        </div>

        {success && <div className="text-green-600 bg-green-100 p-4 rounded">{success}</div>}
        {error && <div className="text-red-600 bg-red-100 p-4 rounded">{error}</div>}

        {/* Topic */}
        <div>
          <label className="create-label block text-lg font-medium">Topic:</label>
          <select
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            required
            className="create-input-field w-full h-12 px-4 border rounded bg-white"
          >
            <option value="">-- Select Topic --</option>
            {dailyTopics.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="create-label block text-lg font-medium">Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., John 4 – The Woman at the Well"
            className="create-input-field w-full h-12 px-4 border rounded bg-white"
          />
        </div>

        {/* Order */}
        <div>
          <label className="create-label block text-lg font-medium">Order (Lesson Number):</label>
          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            min="1"
            required
            className="create-input-field w-full h-12 px-4 border rounded bg-white"
          />
        </div>

        {/* Scripture */}
        <div>
          <label className="create-label block text-lg font-medium">Full Chapter Scripture (WEB Version):</label>
          <textarea
            name="scripture"
            value={formData.scripture}
            onChange={handleChange}
            rows={20}
            required
            placeholder="Paste the full chapter text here..."
            className="create-input-field w-full px-4 py-3 border rounded bg-white font-mono text-sm"
          />
        </div>

        {/* Reflection */}
        <div>
          <label className="create-label block text-lg font-medium">Reflection (~300 words):</label>
          <textarea
            name="reflection"
            value={formData.reflection}
            onChange={handleChange}
            rows={10}
            required
            placeholder="Write your reflection here..."
            className="create-input-field w-full px-4 py-3 border rounded bg-white"
          />
        </div>

        {/* Action Item */}
        <div>
          <label className="create-label block text-lg font-medium">Action Item:</label>
          <textarea
            name="action_item"
            value={formData.action_item}
            onChange={handleChange}
            rows={4}
            required
            placeholder="Describe the daily challenge..."
            className="create-input-field w-full px-4 py-3 border rounded bg-white"
          />
        </div>

        {/* Prayer */}
        <div>
          <label className="create-label block text-lg font-medium">Prayer:</label>
          <textarea
            name="prayer"
            value={formData.prayer}
            onChange={handleChange}
            rows={6}
            required
            placeholder="Write the closing prayer..."
            className="create-input-field w-full px-4 py-3 border rounded bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="create-button w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Lesson'}
        </button>
      </form>
    </div>
  );
};

export default BibleLessonsForm;