﻿<template>
  <div>
    <BookInfo :info="info"></BookInfo>
    <CommentList :comments="comments"></CommentList>
    <div class="comment" v-if="showAdd">
      <!-- [textarea](https://developers.weixin.qq.com/miniprogram/dev/component/textarea.html) -->
      <textarea class="textarea" v-model="comment" placeholder="请输入图书短评" :maxlength="100"></textarea>
      <div class="location">地理位置：
        <!-- [switch](https://developers.weixin.qq.com/miniprogram/dev/component/switch.html) -->
        <switch color="#EA5A49" :checked="location" @change="getGeo"></switch>
        <span class="text-primary">{{location}}</span>
      </div>
      <div class="phone">手机型号：
        <switch color="#EA5A49" :checked="phone" @change="getPhone"></switch>
        <span class="text-primary">{{phone}}</span>
      </div>
      <button class="btn" @click="addComment">评论</button>
    </div>
    <div class="text-footer" v-else>未登录或者已经评论过啦</div>
    <!-- [button](https://developers.weixin.qq.com/miniprogram/dev/component/button.html) -->
    <button class="btn" open-type="share">转发给好友</button>
  </div>
</template>

<script>
import { get, post, showModal } from "@/util";
import BookInfo from "@/components/BookInfo";
import CommentList from "@/components/CommentList";
export default {
  components: {
    BookInfo,
    CommentList
  },
  data() {
    return {
      comments: [],
      userInfo: {},
      bookid: "",
      info: {},
      comment: "",
      location: "",
      phone: ""
    };
  },
  mounted() {
    /* this.$root.$mp.query: 获取小程序在 page onLoade 时候传递的 options */
    /* [this.$root.$mp.query.id](http://mpvue.com/mpvue/#_18) */
    this.bookid = this.$root.$mp.query.id;
    this.getDetail();
    this.getComments();
    /* [getStorageSync](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageSync.html) */
    const userInfo = wx.getStorageSync("userInfo");
    // console.log('userInfo', userInfo)
    if (userInfo) {
      this.userInfo = userInfo;
    }
  },
  computed: {
    /* 是否显示添加的表单 */
    showAdd() {
      /* 没登录 */
      if (!this.userInfo.openId) {
        return false;
      }
      /* 评论页面里查到有自己的 openid */
      if (this.comments.filter(v => v.openid === this.userInfo.openId).length) {
        return false;
      }
      return true;
    }
  },
  methods: {
    async addComment() {
      if (!this.comment) {
        return;
      }
      /* 评论内容 手机型号 地理位置 图书id 用户的openid */
      const data = {
        openid: this.userInfo.openId,
        bookid: this.bookid,
        comment: this.comment,
        phone: this.phone,
        location: this.location
      };
      try {
        await post("/weapp/addcomment", data);
        this.comment = "";
        this.getComments();
      } catch (e) {
        showModal("失败", e.msg);
      }
    },
    async getDetail() {
      const info = await get("/weapp/bookdetail", { id: this.bookid });
      /* [设置 title](https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.setNavigationBarTitle.html) */
      wx.setNavigationBarTitle({
        title: info.title
      });
      this.info = info;
    },
    async getComments() {
      const comments = await get("/weapp/commentlist", { bookid: this.bookid });
      /* 当 comments.list 不存在时取 [] */
      this.comments = comments.list || [];
    },
    getGeo(e) {
      /* [百度地图 api 访问应用（AK）](http://lbsyun.baidu.com/apiconsole/key) */
      const ak = "rsKejfyowllq0dD0IjLbqUaFHiqMlU4Y";
      /* [逆地理编码](http://lbsyun.baidu.com/index.php?title=webapi/guide/webservice-geocoding-abroad) */
      let url = "http://api.map.baidu.com/geocoder/v2/";
      if (e.target.value) {
        /* [getLocation](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.getLocation.html) */
        wx.getLocation({
          success: geo => {
            // console.log(geo)
            wx.request({
              url,
              data: {
                ak,
                location: `${geo.latitude},${geo.longitude}`,
                output: "json"
              },
              success: res => {
                console.log(res);
                if (res.data.status === 0) {
                  this.location = res.data.result.addressComponent.city;
                } else {
                  this.location = "未知地点";
                  // console.log('出错了')
                }
              }
            });
          }
        });
      } else {
        this.location = "";
      }
    },
    getPhone(e) {
      console.log("手机型号获取中");
      if (e.target.value) {
        /* [getSystemInfoSync](https://developers.weixin.qq.com/miniprogram/dev/api/system/system-info/wx.getSystemInfoSync.html) */
        const phoneInfo = wx.getSystemInfoSync();
        this.phone = phoneInfo.model;
      } else {
        /* 没选中 */
        this.phone = "";
      }
    }
  }
};
</script>

<style lang='scss'>
.comment {
  margin: 20rpx 0 0 0;
  .textarea {
    padding: 10rpx;
    width: 730rpx;
    height: 200rpx;
    background: #eee;
  }
  .location {
    margin: 20rpx 0 0 0;
    padding: 10rpx 20rpx;
  }
  .phone {
    margin: 20rpx 0 0 0;
    padding: 10rpx 20rpx;
  }
}
</style>
