const express = require("express");
const router = express.Router();
const auth = require("../utils/auth");
const itemController = require("../controllers/itemController");

// アイテム読み込み
// Read All Items
router.get("/", itemController.readAllItem);

// Read Single Item
router.get("/item/:id", itemController.readSingleItem);



//アイテムに対する操作
//いいね
router.post("/item/:id/like", auth, itemController.like);

//いいね取り消し
router.post("/item/:id/unlike", auth, itemController.unLike);

//コメント送信
router.post("/item/:id/comment", auth, itemController.comment);

//コメントいいね
router.post("/comment/:commentId/:action", auth, itemController.likeComment);

//サブコメント送信
router.post("/comment/:comment", auth, itemController.subComment);

//サブコメントいいね
router.post("/comment/:commentId/:subCommentId/:action", auth, itemController.likeSubComment);

//コメント削除
router.delete("/item/:id/comment/:commentId/delete", auth, itemController.deleteComment);

//サブコメント削除
router.delete("/comment/:commentId/:subCommentId/delete", auth, itemController.deleteSubComment);

//コレクト
router.post("/item/:id/collect", auth, itemController.collect);

//コレクト取り消し
router.post("/item/:id/deCollect", auth, itemController.deCollect);



//アイテム管理
// Create Item
router.post("/item/create", auth, itemController.createItem);

// Update Item
router.put("/item/update/:id", auth, itemController.updateItem);

// Delete Item
router.delete("/item/delete/:id", auth, itemController.deleteItem);

module.exports = router;