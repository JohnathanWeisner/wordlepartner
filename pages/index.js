import React, { useState, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { words as allWords } from '../constants/words';

const LetterState = {
  FOUND: 'FOUND',
  LOCATION_UNKNOWN: 'LOCATION_UNKNOWN',
  NOT_FOUND: 'NOT_FOUND',
};

const getDefaultWord = () => [
  { value: '', letterState: LetterState.NOT_FOUND },
  { value: '', letterState: LetterState.NOT_FOUND },
  { value: '', letterState: LetterState.NOT_FOUND },
  { value: '', letterState: LetterState.NOT_FOUND },
  { value: '', letterState: LetterState.NOT_FOUND },
];

const classNameByLetterState = {
  [LetterState.FOUND]: styles.letterInputFound,
  [LetterState.LOCATION_UNKNOWN]: styles.letterInputLocationUnknown,
  [LetterState.NOT_FOUND]: styles.letterInputNotFound, // meh
};

const getNextIndexes = (wordIndex, letterIndex) => {
  if (letterIndex >= 4) {
    if (wordIndex >= 5) {
      return { nextWordIndex: 0, nextLetterIndex: 0 };
    }
    return { nextWordIndex: wordIndex + 1, nextLetterIndex: 0 };
  }

  return { nextWordIndex: wordIndex, nextLetterIndex: letterIndex + 1 };
};

const getPreviousIndexes = (wordIndex, letterIndex) => {
  if (letterIndex === 0) {
    if (wordIndex === 0) {
      return { previousWordIndex: 0, previousLetterIndex: 0 };
    }
    return { previousWordIndex: wordIndex - 1, previousLetterIndex: 4 };
  }

  return { previousWordIndex: wordIndex, previousLetterIndex: letterIndex - 1 };
};

export default function Home() {
  const inputRefs = useRef([[], [], [], [], [], []]);
  const [words, setWords] = useState([
    getDefaultWord(),
    getDefaultWord(),
    getDefaultWord(),
    getDefaultWord(),
    getDefaultWord(),
    getDefaultWord(),
  ]);

  const foundLetters = [];
  const letterLocationsFoundLookup = {};

  const unknownLocationLetters = [];
  const letterLocationsUnknownLookup = {};

  const lettersNotFound = [];
  const letterNotFoundLookup = {};

  for (const word of words) {
    for (const [index, letter] of word.entries()) {
      switch (letter.letterState) {
        case LetterState.FOUND: {
          if (!letterLocationsFoundLookup[index]) {
            letterLocationsFoundLookup[index] = true;
            foundLetters.push({ index, letter });
          }
          break;
        }
        case LetterState.LOCATION_UNKNOWN: {
          if (
            !letterLocationsUnknownLookup[
              `${index}-${letter.value.toLowerCase()}`
            ]
          ) {
            letterLocationsUnknownLookup[
              `${index}-${letter.value.toLowerCase()}`
            ] = true;
            unknownLocationLetters.push({ index, letter });
          }
          break;
        }
        case LetterState.NOT_FOUND: {
          if (
            !letterNotFoundLookup[letter.value.toLowerCase()] &&
            letter.value.trim()
          ) {
            console.log({ letter });
            lettersNotFound.push(letter);
          }
        }
      }
    }
  }
  foundLetters.sort((a, b) => a.index - b.index);
  const unknownLocationLettersRegexes = [];

  for (const { index, letter } of unknownLocationLetters) {
    unknownLocationLettersRegexes.push(
      RegExp(`^.{${index}}[^${letter.value}]`, 'i')
    );
    unknownLocationLettersRegexes.push(RegExp(letter.value, 'i'));
  }
  const foundLettersRegexes = foundLetters.map(({ index, letter }) =>
    RegExp(`^.{${index}}[${letter.value}]`, 'i')
  );

  const lettersNotFoundRegex = RegExp(
    `^[^${lettersNotFound.map(({ value }) => value).join('|')}]+$`,
    'i'
  );
  const possibleWords = allWords.filter((word) => {
    return (
      foundLettersRegexes.every((regex) => word.match(regex)) &&
      unknownLocationLettersRegexes.every((regex) => word.match(regex)) &&
      (lettersNotFound.length === 0 || word.match(lettersNotFoundRegex))
    );
  });

  const onLetterValueChange = (wordIndex, letterIndex, value) => {
    let nextValue = value.toUpperCase();
    if (value.length >= 1) {
      nextValue = nextValue.slice(nextValue.length - 1);
      const { nextWordIndex, nextLetterIndex } = getNextIndexes(
        wordIndex,
        letterIndex
      );
      inputRefs.current[nextWordIndex][nextLetterIndex].focus();
    }
    const newWords = [...words];
    const newWord = [...words[wordIndex]];
    const newLetter = { ...newWord[letterIndex], value: nextValue };
    const newLetters = [...newWord];

    newLetters[letterIndex] = newLetter;
    newWords[wordIndex] = newLetters;

    setWords(newWords);
  };

  const onLetterStateChange = (wordIndex, letterIndex, letterState) => {
    const newWords = [...words];
    const newWord = [...words[wordIndex]];
    const newLetter = { ...newWord[letterIndex], letterState };
    const newLetters = [...newWord];

    newLetters[letterIndex] = newLetter;
    newWords[wordIndex] = newLetters;

    setWords(newWords);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Wordle Partner</title>
        <meta
          name="description"
          content="Partner for wordle to narrow in on words"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1>Wordle Partner</h1>
        <div className={styles.mainWrapper}>
          <div className={styles.wordsWrapper}>
            {words.map((word, wordIndex) => (
              <div key={`${wordIndex}`} className={styles.wordWrapper}>
                {word.map(({ value, letterState }, letterIndex) => (
                  <div
                    key={`${wordIndex}-${letterIndex}`}
                    className={styles.letterWrapper}
                  >
                    <input
                      ref={(el) =>
                        (inputRefs.current[wordIndex][letterIndex] = el)
                      }
                      className={classNameByLetterState[letterState]}
                      value={value}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Backspace' &&
                          event.target.value === ''
                        ) {
                          const { previousWordIndex, previousLetterIndex } =
                            getPreviousIndexes(wordIndex, letterIndex);
                          inputRefs.current[previousWordIndex][
                            previousLetterIndex
                          ].focus();
                        }
                      }}
                      onChange={(event) => {
                        onLetterValueChange(
                          wordIndex,
                          letterIndex,
                          event.target.value
                        );
                      }}
                    />
                    <div className={styles.letterStateButtons}>
                      <button
                        className={styles.correctButton}
                        onClick={() =>
                          onLetterStateChange(
                            wordIndex,
                            letterIndex,
                            LetterState.FOUND
                          )
                        }
                      >
                        ✓
                      </button>
                      <button
                        className={styles.presentButton}
                        onClick={() =>
                          onLetterStateChange(
                            wordIndex,
                            letterIndex,
                            LetterState.LOCATION_UNKNOWN
                          )
                        }
                      >
                        ?
                      </button>
                      <button
                        className={styles.incorrectButton}
                        onClick={() =>
                          onLetterStateChange(
                            wordIndex,
                            letterIndex,
                            LetterState.NOT_FOUND
                          )
                        }
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.possibilitiesWrapper}>
            <ul className={styles.possibilitiesList}>
              {possibleWords.map((word) => (
                <li key={word} className={styles.possibility}>
                  {word}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
