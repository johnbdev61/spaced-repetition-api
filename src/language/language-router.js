const express = require('express')
const LanguageService = require('./language-service')
const { requireAuth } = require('../middleware/jwt-auth')
const { _Node, toArray } = require('./linked-list')

const languageRouter = express.Router()
const bodyParser = express.json()

languageRouter.use(requireAuth).use(async (req, res, next) => {
  try {
    const language = await LanguageService.getUsersLanguage(
      req.app.get('db'),
      req.user.id
    )

    if (!language)
      return res.status(404).json({
        error: `You don't have any languages`,
      })

    req.language = language
    next()
  } catch (error) {
    next(error)
  }
})

languageRouter.get('/', async (req, res, next) => {
  try {
    const words = await LanguageService.getLanguageWords(
      req.app.get('db'),
      req.language.id
    )

    res.json({
      language: req.language,
      words,
    })
    next()
  } catch (error) {
    next(error)
  }
})

languageRouter.get('/head', async (req, res, next) => {
  try {
    const [nextWord] = await LanguageService.getNextWord(
      req.app.get('db'),
      req.language.id
    )
    res.json({
      nextWord: nextWord.original,
      totalScore: req.language.total_score,
      wordCorrectCount: nextWord.correct_count,
      wordIncorrectCount: nextWord.incorrect_count,
    })
    next()
  } catch (error) {
    next(error)
  }
})

languageRouter.post('/guess', bodyParser, async (req, res, next) => {
  const guess = req.body.guess
  if (!guess) {
    res.status(400).json({ error: `Missing 'guess' in request body` })
  }
  try {
    let words = await LanguageService.getLanguageWords(
      req.app.get('db'),
      req.language.id
    )
    const [{ head }] = await LanguageService.getLanguageHead(
      req.app.get('db'),
      req.language.id
    )
    let wordList = LanguageService.createLinkedList(words, head)
    let [checkNextWord] = await LanguageService.checkGuess(
      req.app.get('db'),
      req.language.id
    )

    if (checkNextWord.translation === guess) {
      let newMemValue = wordList.head.value.memory_value * 2
      wordList.head.value.memory_value = newMemValue
      wordList.head.value.correct_count++

      let curr = wordList.head
      let countDown = newMemValue
      while (countDown > 0 && curr.next !== null) {
        curr = curr.next
        countDown--
      }
      let temp = new _Node(wordList.head.value)

      if (curr.next === null) {
        temp.next = curr.next
        curr.next = temp
        wordList.head = wordList.head.next
        curr.value.next = temp.value.id
        temp.value.next = null
      } else {
        temp.next = curr.next
        curr.next = temp
        wordList.head = wordList.head.next
        curr.value.next = temp.value.id
        temp.value.next = temp.next.value.id
      }
      req.language.total_score++

      await LanguageService.updateWordsTable(
        req.app.get('db'),
        toArray(wordList),
        req.language.id,
        req.language.total_score
      )
      res.json({
        nextWord: wordList.head.value.original,
        // translation: wordList.head.value.translation,
        totalScore: req.language.total_score,
        wordCorrectCount: wordList.head.value.correct_count,
        wordIncorrectCount: wordList.head.value.incorrect_count,
        answer: temp.value.translation,
        isCorrect: true,
      })
    } else {
      wordList.head.value.memory_value = 1
      wordList.head.value.incorrect_count++

      let curr = wordList.head
      let countDown = 1
      while (countDown > 0) {
        curr = curr.next
        countDown--
      }
      let temp = new _Node(wordList.head.value)
      temp.next = curr.next
      curr.next = temp
      wordList.head = wordList.head.next
      curr.value.next = temp.value.id
      temp.value.next = temp.next.value.id

      await LanguageService.updateWordsTable(
        req.app.get('db'),
        toArray(wordList),
        req.language.id,
        req.language.total_score
      )
      res.json({
        nextWord: wordList.head.value.original,
        totalScore: req.language.total_score,
        wordCorrectCount: wordList.head.value.correct_count,
        wordIncorrectCount: wordList.head.value.incorrect_count,
        answer: temp.value.translation,
        isCorrect: false,
      })
    }
    next()
  } catch (error) {
    next(error)
  }
})

module.exports = languageRouter
