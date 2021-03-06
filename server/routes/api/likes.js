let express = require('express')
let router = express.Router()
let Like = require('../../models/like')
const requireAuth = require('passport').authenticate('jwt', {session: false})
const CurrencyCtrl = require('./controllers/currencyCtrl')

/**
 * @swagger
 * definitions:
 *  Like:
 *    properties:
 *      user:
 *        type: "string"
 *      chapter:
 *         type: "string"
 *      vote:
 *        type: number
 */

/**
 * @swagger
 * definitions:
 *  LikeCount:
 *    properties:
 *      likes:
 *        type: number
 */

/**
 * @swagger
 * definitions:
 *  DislikeCount:
 *    properties:
 *      dislikes:
 *        type: number
 */

/**
 * @swagger
 * /likes/chapter/{id}:
 *   get:
 *     tags:
 *       - chapter likes
 *     description: Returns likes objects from specified chapter
 *     produces:
 *       - application/json
 *     parameters:
 *      -
 *        name: "id"
 *        in: "path"
 *        description: "Chapter id"
 *        required: true
 *        type: "string"
 *     responses:
 *       200:
 *         description: An array of like objects
 *         schema:
 *           $ref: '#/definitions/Like'
 */
router.get('/chapter/:id', (req, res) => {
  Like.find({'deleted': false, 'chapter': req.params['id']}, (err, likes) => {
    if (err) {
      res.sendStatus(500)
    } else {
      res.send(likes)
    }
  })
})

/**
 * @swagger
 * /likes/chapter/{id}/like:
 *   get:
 *     tags:
 *       - Chapter likes like
 *     description: Likes the chapter with the provided chapter id
 *     produces:
 *       - application/json
 *     parameters:
 *      -
 *        name: "id"
 *        in: "path"
 *        description: "Chapter id"
 *        required: true
 *        type: "string"
 *     responses:
 *       200:
 *         description: Returns 200 when the like is successfully created
 *
 */
router.post('/chapter/:id/like', requireAuth, (req, res) => {
  const user = req.user
  const chapterId = req.params['id']
  Like.findOneAndUpdate({
      'chapter':chapterId,
      'user': user._id,
    },
    {
      'vote': 1,
      'likedBefore': true
    },
    {
      upsert: true,
    }, (err, oldLike) => {
      if (err) {
        res.status(500).send({})
      } else {
        res.status(200).send({})
        if(!oldLike || oldLike.vote !== 1){
          CurrencyCtrl.updateLikedChapterCurrency(chapterId, 1, (err)=>{
          })
        }
      }
    })
})

/**
 * @swagger
 * /likes/chapter/{id}/dislike:
 *   post:
 *     tags:
 *       - Chapter likes like
 *     description: Likes the chapter with the provided chapter id
 *     produces:
 *       - application/json
 *     parameters:
 *      -
 *        name: "id"
 *        in: "path"
 *        description: "Chapter id"
 *        required: true
 *        type: "string"
 *     responses:
 *       200:
 *         description: Returns 200 when the dislike is successfully created
 *
 */
router.post('/chapter/:id/dislike', requireAuth, (req, res) => {
  let user = req.user
  let chapterId = req.params['id']
  Like.update({
      'chapter': chapterId,
      'user': user._id,
    },
    {
      'vote': -1,
    },
    {
      upsert: true,
    }, (err, oldLike) => {
      if (err) {
        res.status(500).send({})
      } else {
        res.status(200).send({})
        const wasLikeBefore = !oldLike.upserted && oldLike.vote !== -1
        if(wasLikeBefore){
          CurrencyCtrl.updateLikedChapterCurrency(chapterId, -1, (err)=>{
          })
        }
      }
    })
})

/**
 * @swagger
 * /likes/chapter/{id}/mylike:
 *   get:
 *     tags:
 *       - Chapter likes like
 *     description: Return the like the logged in user has given to the specified chapter
 *     produces:
 *       - application/json
 *     parameters:
 *      -
 *        name: "id"
 *        in: "path"
 *        description: "Chapter id"
 *        required: true
 *        type: "string"
 *     responses:
 *       200:
 *         description: A Like object
 *         schema:
 *           $ref: '#/definitions/Like'
 *
 */
router.get('/chapter/:id/mylike', requireAuth, (req, res) => {
  let user = req.user
  Like.findOne({
    'chapter': req.params['id'],
    'user': user._id,
  }, (err, like) => {
    if (err) {
      res.status(500).send({})
    } else if(!like){
      res.send({})
    } else {
      res.send(like)
    }
  })
})

/**
 * @swagger
 * /likes/chapter/{id}/numberOfLikes:
 *   get:
 *     tags:
 *       - Chapter likes like
 *     description: Return the number of likes on the provided chapter
 *     produces:
 *       - application/json
 *     parameters:
 *      -
 *        name: "id"
 *        in: "path"
 *        description: "Chapter id"
 *        required: true
 *        type: "string"
 *     responses:
 *       200:
 *         description: A likecount object
 *         schema:
 *           $ref: '#/definitions/LikeCount'
 *
 */
router.get('/chapter/:id/numberOfLikes', (req, res) => {
  Like.count({
      'chapter': req.params['id'],
      'vote': 1,
    },
    (err, count) => {
      if (err) {
        res.status(500).send({})
      } else {
        res.send({likes: count})
      }
    })
})

/**
 * @swagger
 * /likes/chapter/{id}/numberOfDislikes:
 *   get:
 *     tags:
 *       - Chapter likes like
 *     description: Return the number of dislikes on the provided chapter
 *     produces:
 *       - application/json
 *     parameters:
 *      -
 *        name: "id"
 *        in: "path"
 *        description: "Chapter id"
 *        required: true
 *        type: "string"
 *     responses:
 *       200:
 *         description: A dislikecount object
 *         schema:
 *           $ref: '#/definitions/DislikeCount'
 *
 */
router.get('/chapter/:id/numberOfDislikes', (req, res) => {
  Like.count({
      'chapter': req.params['id'],
      'vote': -1,
    },
    (err, count) => {
      if (err) {
        res.status(500).send({})
      } else {
        res.send({dislikes: count})
      }
    })
})

module.exports = router
