import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lesson } from '../shared/interfaces';

// Interface for form state
interface LessonFormData {
  fruit: string;
  order: number;
  book: string;
  chapter: number;
  prayer: string;
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

// Valid books from BibleService._abbrevToName
const validBooks = [
  { abbrev: 'gen', name: 'Genesis' },
  { abbrev: 'exo', name: 'Exodus' },
  { abbrev: 'lev', name: 'Leviticus' },
  { abbrev: 'num', name: 'Numbers' },
  { abbrev: 'deu', name: 'Deuteronomy' },
  { abbrev: 'jos', name: 'Joshua' },
  { abbrev: 'jdg', name: 'Judges' },
  { abbrev: 'rut', name: 'Ruth' },
  { abbrev: '1sa', name: '1 Samuel' },
  { abbrev: '2sa', name: '2 Samuel' },
  { abbrev: '1ki', name: '1 Kings' },
  { abbrev: '2ki', name: '2 Kings' },
  { abbrev: '1ch', name: '1 Chronicles' },
  { abbrev: '2ch', name: '2 Chronicles' },
  { abbrev: 'ezr', name: 'Ezra' },
  { abbrev: 'neh', name: 'Nehemiah' },
  { abbrev: 'est', name: 'Esther' },
  { abbrev: 'job', name: 'Job' },
  { abbrev: 'psa', name: 'Psalms' },
  { abbrev: 'pro', name: 'Proverbs' },
  { abbrev: 'ecc', name: 'Ecclesiastes' },
  { abbrev: 'sng', name: 'Song of Solomon' },
  { abbrev: 'isa', name: 'Isaiah' },
  { abbrev: 'jer', name: 'Jeremiah' },
  { abbrev: 'lam', name: 'Lamentations' },
  { abbrev: 'ezk', name: 'Ezekiel' },
  { abbrev: 'dan', name: 'Daniel' },
  { abbrev: 'hos', name: 'Hosea' },
  { abbrev: 'jol', name: 'Joel' },
  { abbrev: 'amo', name: 'Amos' },
  { abbrev: 'oba', name: 'Obadiah' },
  { abbrev: 'jon', name: 'Jonah' },
  { abbrev: 'mic', name: 'Micah' },
  { abbrev: 'nam', name: 'Nahum' },
  { abbrev: 'hab', name: 'Habakkuk' },
  { abbrev: 'zep', name: 'Zephaniah' },
  { abbrev: 'hag', name: 'Haggai' },
  { abbrev: 'zec', name: 'Zechariah' },
  { abbrev: 'mal', name: 'Malachi' },
  { abbrev: 'mat', name: 'Matthew' },
  { abbrev: 'mrk', name: 'Mark' },
  { abbrev: 'luk', name: 'Luke' },
  { abbrev: 'jhn', name: 'John' },
  { abbrev: 'act', name: 'Acts' },
  { abbrev: 'rom', name: 'Romans' },
  { abbrev: '1co', name: '1 Corinthians' },
  { abbrev: '2co', name: '2 Corinthians' },
  { abbrev: 'gal', name: 'Galatians' },
  { abbrev: 'eph', name: 'Ephesians' },
  { abbrev: 'php', name: 'Philippians' },
  { abbrev: 'col', name: 'Colossians' },
  { abbrev: '1th', name: '1 Thessalonians' },
  { abbrev: '2th', name: '2 Thessalonians' },
  { abbrev: '1ti', name: '1 Timothy' },
  { abbrev: '2ti', name: '2 Timothy' },
  { abbrev: 'tit', name: 'Titus' },
  { abbrev: 'phm', name: 'Philemon' },
  { abbrev: 'heb', name: 'Hebrews' },
  { abbrev: 'jas', name: 'James' },
  { abbrev: '1pe', name: '1 Peter' },
  { abbrev: '2pe', name: '2 Peter' },
  { abbrev: '1jn', name: '1 John' },
  { abbrev: '2jn', name: '2 John' },
  { abbrev: '3jn', name: '3 John' },
  { abbrev: 'jud', name: 'Jude' },
  { abbrev: 'rev', name: 'Revelation' },
];

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
    prayer: '',
    quiz: { question: '', options: ['', '', ''], correctAnswer: 0 },
  });
  const [verseTexts, setVerseTexts] = useState<Map<number, { text: string; modern_text?: string }>>(new Map());

  // Fetch verse texts when book and chapter change
  useEffect(() => {
    const fetchVerseTexts = async () => {
      if (lesson.book && lesson.chapter > 0) {
        try {
          const response = await axios.post('https://www.brightlightscreative.com/api/verses', {
            version: 'WEB',
            book: lesson.book,
            chapter: lesson.chapter,
          });
          const verseData = response.data as { verse: number; text: string; modern_text?: string }[];
          setVerseTexts(new Map(verseData.map((v) => [v.verse, { text: v.text, modern_text: v.modern_text }])));
        } catch (error) {
          console.error('Error fetching verse texts:', error);
          alert('Failed to fetch verse texts.');
        }
      }
    };
    fetchVerseTexts();
  }, [lesson.book, lesson.chapter]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (
        !lesson.fruit ||
        !lesson.order ||
        !lesson.book ||
        !lesson.chapter ||
        !lesson.prayer ||
        !lesson.quiz.question ||
        lesson.quiz.options.filter((o) => o.trim()).length < 3
      ) {
        alert('Please fill in all required fields and provide at least 3 quiz options.');
        return;
      }

      // Validate book
      const bookAbbrev = validBooks.find((b) => b.name.toLowerCase() === lesson.book.toLowerCase())?.abbrev || lesson.book;
      if (!validBooks.some((b) => b.abbrev === bookAbbrev)) {
        alert('Invalid book name. Please select a valid Bible book.');
        return;
      }

      // Create verses payload with all verses for the chapter
      const versesPayload = Array.from(verseTexts.entries()).map(([verseNum, data]) => ({
        verse: verseNum,
        text: data.text,
        modern_text: data.modern_text || data.text,
      }));

      if (versesPayload.length === 0) {
        alert('No verses found for the selected chapter. Please ensure the chapter is valid.');
        return;
      }

      const payload: Omit<Lesson, keyof import('mongoose').Document> = {
        fruit: lesson.fruit,
        order: Number(lesson.order),
        book: bookAbbrev,
        chapter: Number(lesson.chapter),
        verses: versesPayload,
        prayer: lesson.prayer,
        quiz: {
          ...lesson.quiz,
          options: lesson.quiz.options.filter((o) => o.trim() !== ''),
          correctAnswer: Number(lesson.quiz.correctAnswer),
        },
      };

      const response = await axios.post('https://www.brightlightscreative.com/api/lessons', payload);
      alert('Lesson saved successfully!');
      setLesson({
        fruit: 'love',
        order: lesson.order + 1,
        book: '',
        chapter: 0,
        prayer: '',
        quiz: { question: '', options: ['', '', ''], correctAnswer: 0 },
      });
      setVerseTexts(new Map());
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
            <select
              className="create-input-field relative h-10 mb-4 bg-transparent"
              value={lesson.book}
              onChange={(e) => setLesson({ ...lesson, book: e.target.value })}
              required
            >
              <option value="">Select a book</option>
              {validBooks.map((book) => (
                <option key={book.abbrev} value={book.name}>
                  {book.name}
                </option>
              ))}
            </select>
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
            <label className="create-label">Correct Answer (0-based index):</label>
            <input
              className="create-input-field relative h-10 mb-4 bg-transparent"
              type="number"
              value={lesson.quiz.correctAnswer}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 0 && value < lesson.quiz.options.length) {
                  setLesson({
                    ...lesson,
                    quiz: { ...lesson.quiz, correctAnswer: value },
                  });
                }
              }}
              onBlur={() => {
                // Ensure value is within bounds on blur
                const value = lesson.quiz.correctAnswer;
                if (isNaN(value) || value < 0 || value >= lesson.quiz.options.length) {
                  setLesson({
                    ...lesson,
                    quiz: { ...lesson.quiz, correctAnswer: 0 },
                  });
                }
              }}
              placeholder="e.g., 0"
              min="0"
              max={lesson.quiz.options.length - 1}
              step="1"
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