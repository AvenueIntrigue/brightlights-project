// src/AdminForm.tsx (or wherever your form lives)
import React, { useState } from 'react';
import axios from 'axios';

// Define the interface to match the backend schema (no order!)
interface LessonFormData {
  topic: string;
  title: string;
  scripture: string; // Full chapter text
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
    topic: '',
    title: '',
    scripture: '',
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
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Basic client-side validation
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
      setError('Title is required');
      setLoading(false);
      return;
    }
    if (!formData.scripture || formData.scripture.length < 1000) {
      setError('Please paste the full chapter scripture (at least 1000 characters)');
      setLoading(false);
      return;
    }
    if (!formData.reflection) {
      setError('Reflection is required');
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

    try {
      const response = await axios.post('https://www.brightlightscreative.com/api/lessons', formData);
      const savedLesson = response.data.lesson;
      
      setSuccess(`Lesson saved successfully as #${savedLesson.order} for "${savedLesson.topic}"!`);
      console.log('Saved lesson:', response.data);

      // Reset form (keep the same topic for convenience)
      setFormData({
        topic: formData.topic,
        title: '',
        scripture: '',
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
    <div className="create-grandpa">
      <form className="create-form" onSubmit={handleSubmit}>
        <div className="create-form-container">
          <h1 className="create-form-box-text">Create Daily Bible Lesson</h1>
        </div>

        {success && <div style={{ color: 'green', marginBottom: '1rem' }}>{success}</div>}
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

        <div className="create-form-content">
          {/* Topic Dropdown */}
          <div>
            <label htmlFor="topic">Topic (Fruit/Theme):</label>
            <select
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
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
            <label htmlFor="title">Title (e.g., "John 4 – The Woman at the Well"):</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter lesson title"
            />
          </div>

          {/* Scripture (Full Chapter Text) */}
          <div>
            <label htmlFor="scripture">Full Chapter Scripture (WEB Version):</label>
            <textarea
              id="scripture"
              name="scripture"
              value={formData.scripture}
              onChange={handleChange}
              rows={20}
              required
              placeholder="Paste the full chapter text here..."
            />
          </div>

          {/* Reflection */}
          <div>
            <label htmlFor="reflection">Reflection (~300 words):</label>
            <textarea
              id="reflection"
              name="reflection"
              value={formData.reflection}
              onChange={handleChange}
              rows={10}
              required
              placeholder="Write your ~300-word reflection here..."
            />
          </div>

          {/* Action Item */}
          <div>
            <label htmlFor="action_item">Action Item:</label>
            <textarea
              id="action_item"
              name="action_item"
              value={formData.action_item}
              onChange={handleChange}
              rows={3}
              required
              placeholder="Describe the daily practical challenge..."
            />
          </div>

          {/* Prayer */}
          <div>
            <label htmlFor="prayer">Prayer:</label>
            <textarea
              id="prayer"
              name="prayer"
              value={formData.prayer}
              onChange={handleChange}
              rows={5}
              required
              placeholder="Write the closing prayer..."
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Lesson'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BibleLessonsForm;