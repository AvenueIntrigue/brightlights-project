// src/AdminForm.tsx
import React, { useState } from 'react';
import axios from 'axios';

// Define interfaces to match MongoDB schema
interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Lesson {
  date: string;
  book: string;
  chapter: number; // Changed to number only
  verses: string; // Comma-separated input, converted to number[] on submit
  prayer: string;
  quiz: Quiz;
}

const BibleLessonsForm: React.FC = () => {
  const [lesson, setLesson] = useState<Lesson>({
    date: '',
    book: '',
    chapter: 0, // Initialize as number
    verses: '',
    prayer: '',
    quiz: { question: '', options: ['', '', ''], correctAnswer: 0 },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Validate inputs
      if (!lesson.date || !lesson.book || !lesson.verses || !lesson.prayer || !lesson.quiz.question || lesson.quiz.options.filter(o => o).length < 3) {
        alert('Please fill in all required fields and provide at least 3 quiz options.');
        return;
      }

      // Convert verses string to array of numbers
      const versesArray = lesson.verses
        .split(',')
        .map((v) => parseInt(v.trim(), 10))
        .filter((v) => !isNaN(v));

      if (versesArray.length === 0) {
        alert('Please provide valid verse numbers.');
        return;
      }

      // Prepare payload for API
      const payload = {
        ...lesson,
        chapter: Number(lesson.chapter), // Ensure number
        verses: versesArray,
        quiz: { ...lesson.quiz, options: lesson.quiz.options.filter((o) => o.trim() !== '') },
      };

      // Post to API
      const response = await axios.post('https://brightlightscreative.com/api/lessons', payload);
      alert('Lesson saved successfully!');
      console.log('Response:', response.data);
      // Reset form
      setLesson({
        date: '',
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
    <div className='create-grandpa'>
        <form className='create-form' onSubmit={handleSubmit}>
            <div className='create-form-container'>
                <h1 className='create-form-box-text'>Create Bible Lesson</h1>
            </div>

            <div className='create-form-content'>
                <div>
                    <input type="text" />
                </div>
            </div>
        </form>
 
    </div>
  );
};

export default BibleLessonsForm;