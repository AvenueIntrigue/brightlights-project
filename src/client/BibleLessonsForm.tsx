// src/BibleLessonForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { Lesson } from '../shared/interfaces';

// Interface for form state (omits Mongoose Document properties)
interface LessonFormData {
  fruit: string;
  order: number;
  book: string;
  chapter: number;
  verses: string; // String input, converted to number[] on submit
  prayer: string;
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

const fruitsOfTheSpirit = [
  'love',
  'joy',
  'peace',
  'patience',
  'kindness',
  'goodness',
  'faithfulness',
  'gentleness',
  'self-control',
];

const BibleLessonForm: React.FC = () => {
  const [lesson, setLesson] = useState<LessonFormData>({
    fruit: 'love',
    order: 1,
    book: '',
    chapter: 0,
    verses: '', // Changed to string for input
    prayer: '',
    quiz: { question: '', options: ['', '', ''], correctAnswer: 0 },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (
        !lesson.fruit ||
        !lesson.order ||
        !lesson.book ||
        !lesson.verses ||
        !lesson.prayer ||
        !lesson.quiz.question ||
        lesson.quiz.options.filter((o) => o.trim()).length < 3
      ) {
        alert('Please fill in all required fields and provide at least 3 quiz options.');
        return;
      }

      const versesArray = lesson.verses
        .split(',')
        .map((v) => parseInt(v.trim(), 10))
        .filter((v) => !isNaN(v));

      if (versesArray.length === 0) {
        alert('Please provide valid verse numbers.');
        return;
      }

      const payload: Omit<Lesson, keyof import('mongoose').Document> = {
        fruit: lesson.fruit,
        order: Number(lesson.order),
        book: lesson.book,
        chapter: Number(lesson.chapter),
        verses: versesArray,
        prayer: lesson.prayer,
        quiz: {
          ...lesson.quiz,
          options: lesson.quiz.options.filter((o) => o.trim() !== ''),
          correctAnswer: Number(lesson.quiz.correctAnswer),
        },
      };

      const response = await axios.post('https://brightlightscreative.com/api/lessons', payload);
      alert('Lesson saved successfully!');
      setLesson({
        fruit: 'love',
        order: lesson.order + 1,
        book: '',
        chapter: 0,
        verses: '',
        prayer: '',
        quiz: { question: '', options: ['', '', ''], correctAnswer: 0 },
      });
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Failed to save lesson.');
    }
  };

  return (
    <div className="create-grandpa mx-auto">
      <form className="create-form" onSubmit={handleSubmit}>
        <div className="create-form-container">
          <h1 className="create-box-text">Create Bible Lessons</h1>
        </div>
        <div className="create-form-content">
          <div>
            <label className="create-label">Fruit of the Spirit:</label>
            <select
              className="create-input-field relative h-10 mb-4 bg-transparent"
              value={lesson.fruit}
              onChange={(e) => setLesson({ ...lesson, fruit: e.target.value })}
              required
            >
              {fruitsOfTheSpirit.map((fruit) => (
                <option key={fruit} value={fruit}>
                  {fruit.charAt(0).toUpperCase() + fruit.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="create-label">Lesson Order:</label>
            <input
              className="create-input-field relative h-10 mb-4 bg-transparent"
              type="number"
              value={lesson.order || ''}
              onChange={(e) => setLesson({ ...lesson, order: parseInt(e.target.value, 10) || 1 })}
              placeholder="e.g., 1"
              min="1"
              required
            />
          </div>
          <div>
            <label className="create-label">Book:</label>
            <input
              className="create-input-field relative h-10 mb-4 bg-transparent"
              type="text"
              value={lesson.book}
              onChange={(e) => setLesson({ ...lesson, book: e.target.value })}
              placeholder="e.g., John"
              required
            />
          </div>
          <div>
            <label className="create-label">Chapter:</label>
            <input
              className="create-input-field relative h-10 mb-4 bg-transparent"
              type="number"
              value={lesson.chapter || ''}
              onChange={(e) => setLesson({ ...lesson, chapter: parseInt(e.target.value, 10) || 0 })}
              placeholder="e.g., 1"
              min="1"
              required
            />
          </div>
          <div>
            <label className="create-label">Verses (comma-separated):</label>
            <input
              className="create-input-field relative h-10 mb-4 bg-transparent"
              type="text"
              value={lesson.verses}
              onChange={(e) => setLesson({ ...lesson, verses: e.target.value })}
              placeholder="e.g., 1,2,3"
              required
            />
          </div>
          <div>
            <label className="create-label">Prayer:</label>
            <textarea
              className="create-input-field relative mb-4 bg-transparent"
              value={lesson.prayer}
              onChange={(e) => setLesson({ ...lesson, prayer: e.target.value })}
              placeholder="e.g., Lord, fill me with Your love."
              required
            />
          </div>
          <div>
            <label className="create-label">Quiz Question:</label>
            <input
              className="create-input-field relative h-10 mb-4 bg-transparent"
              type="text"
              value={lesson.quiz.question}
              onChange={(e) => setLesson({ ...lesson, quiz: { ...lesson.quiz, question: e.target.value } })}
              placeholder="e.g., What does John 3:16 show about love?"
              required
            />
          </div>
          <div>
            <label className="create-label">Quiz Options (at least 3):</label>
            {lesson.quiz.options.map((option, index) => (
              <input
                key={index}
                className="create-input-field relative h-10 mb-4 bg-transparent"
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...lesson.quiz.options];
                  newOptions[index] = e.target.value;
                  setLesson({ ...lesson, quiz: { ...lesson.quiz, options: newOptions } });
                }}
                placeholder={`Option ${index + 1}`}
                required={index < 3}
              />
            ))}
          </div>
          <div>
            <label className="create-label">Correct Answer (index, 0-based):</label>
            <input
              className="create-input-field relative h-10 mb-4 bg-transparent"
              type="number"
              value={lesson.quiz.correctAnswer || ''}
              onChange={(e) =>
                setLesson({
                  ...lesson,
                  quiz: { ...lesson.quiz, correctAnswer: parseInt(e.target.value, 10) || 0 },
                })
              }
              placeholder="e.g., 1"
              min="0"
              max={lesson.quiz.options.length - 1}
              required
            />
          </div>
          <button className="create-button" type="submit">
            Save Lesson
          </button>
        </div>
      </form>
    </div>
  );
};

export default BibleLessonForm;