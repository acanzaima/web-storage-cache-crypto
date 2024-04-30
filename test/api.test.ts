import { describe, it, expect, beforeEach } from "vitest";
import WebStorageCacheCrypto from "../src/main";
const storage = window.localStorage;

const wsCache = new WebStorageCacheCrypto({
  storage: storage,
});

function clearStorage() {
  storage.clear();
}

describe("WebStorageCacheCrypto", () => {
  describe("#Constructor", () => {
    it("Constructor should be a function", () => {
      expect(WebStorageCacheCrypto).to.be.a("function");
    });
    it("has the WebStorageCache API", () => {
      expect(wsCache.isSupported).to.be.a("function");
      expect(wsCache.set).to.be.a("function");
      expect(wsCache.get).to.be.a("function");
      expect(wsCache.delete).to.be.a("function");
      expect(wsCache.deleteAllExpires).to.be.a("function");
      expect(wsCache.clear).to.be.a("function");
      expect(wsCache.touch).to.be.a("function");
      expect(wsCache.add).to.be.a("function");
      expect(wsCache.replace).to.be.a("function");
      expect(wsCache.encrypt).to.be.a("function");
      expect(wsCache.decrypt).to.be.a("function");
    });
    it("should set default expires success with number", () => {
      const cache = new WebStorageCacheCrypto({
        exp: 3,
      });
      cache.set("testDefaultExpires", "1");
      expect(cache.get("testDefaultExpires")).to.equal("1");
      setTimeout(() => {
        expect(cache.get("testDefaultExpires")).to.be.a("null");
      }, 3000);
    });
    it("should set default expires success with an outdate date", () => {
      const cache = new WebStorageCacheCrypto({
        exp: new Date(),
      });
      cache.set("testDefaultExpires", "3");
      expect(cache.get("testDefaultExpires")).to.be.a("null");
    });
    it("should set default expires success with an future date", () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      const cache = new WebStorageCacheCrypto({
        exp: date,
      });
      cache.set("testDefaultExpires", 1111);
      expect(cache.get("testDefaultExpires")).to.equal(1111);
    });
    it("should set default storage to `localStorage` success", () => {
      const localCache = new WebStorageCacheCrypto({
        storage: "localStorage",
        crypt: false,
      });
      localCache.set("testDefaultStorge", "asdfw2");
      expect(localStorage.getItem("testDefaultStorge")).not.to.be.a("null");
      expect(sessionStorage.getItem("testDefaultStorge")).to.be.a("null");
    });
    it("should set default storage to `sessionStorage` success", () => {
      const localCache = new WebStorageCacheCrypto({
        storage: "sessionStorage",
        crypt: false,
      });
      localCache.set("testDefaultStorage", "sadfsadf");
      expect(sessionStorage.getItem("testDefaultStorage")).not.to.be.a("null");
      expect(localStorage.getItem("testDefaultStorage")).to.be.a("null");
    });
  });
  describe("#isSupported", () => {
    it("should be true", () => {
      expect(wsCache.isSupported()).to.equal(true);
    });
  });
  describe("#set,#get", () => {
    describe("expires", () => {
      beforeEach(() => {
        clearStorage();
      });
      it("should be get null when invoke #set{exp: 3} after 3 seconds", () => {
        const value = "test";
        wsCache.set("testExpires", value, { exp: 3 });
        expect(wsCache.get("testExpires")).to.be.deep.equal(value);
        const _this = this;
        setTimeout(() => {
          console.log(wsCache.get("testExpires"));
          expect(wsCache.get("testExpires")).to.be.a("null");
        }, 3000);
      });
      it("should be null if set deadline is now", () => {
        const now = new Date();
        wsCache.set("testExpires", "now", { exp: now });
        expect(wsCache.get("testExpires")).to.be.a("null");
      });
      it("should return value if set deadline is after one hour", () => {
        const now = new Date();
        const afterOneHour = new Date(now.getTime() + 1 * 60 * 60 * 1000);
        wsCache.set("testExpires", "afterOneHour", { exp: afterOneHour });
        expect(wsCache.get("testExpires")).to.equal("afterOneHour");
      });
    });
  });
  describe("#delete", () => {
    it("should be null when invoke #delete", () => {
      const key = "testDelete";
      wsCache.set(key, "testDeleteValue", { exp: 1 });
      wsCache.delete(key);
      expect(wsCache.get(key)).to.be.a("null");
    });
  });
  describe("#deleteAllExpires", () => {
    it("should be a null if items has been expired after delete all expires items", () => {
      const expiresKey = "expiresKey";
      const notExpiresKey = "notExpiresKey";
      const now = new Date();
      wsCache.set(expiresKey, "expiresValue", { exp: now });
      wsCache.set(notExpiresKey, "notExpiresValue");
      wsCache.deleteAllExpires();
      expect(wsCache.get(expiresKey)).to.be.a("null");
      expect(wsCache.get(notExpiresKey)).not.to.be.a("null");
    });
  });
  describe("#clear", () => {
    it("should clear all items not only created by WebStorageCache", () => {
      const WebStorageCachekey = "WebStorageCachekey";
      const normalKey = "normalKey";
      storage.setItem(normalKey, "normalValue");
      wsCache.set(WebStorageCachekey, "WebStorageCacheValue");
      wsCache.clear();
      expect(storage.getItem(normalKey)).to.be.a("null");
      expect(wsCache.get(WebStorageCachekey)).to.be.a("null");
    });
  });
  describe("#touch", () => {
    it("should has a new expires time after `touch`", () => {
      const touchKey = "touchKey";
      const touchKey2 = "touchKey2";
      const touchKey3 = "touchKey3";
      wsCache.set(touchKey, "touchValue", { exp: 1 });
      wsCache.set(touchKey2, "touchValue2", { exp: 1 });
      wsCache.set(touchKey3, "touchValue2");
      wsCache.touch(touchKey, 5);
      wsCache.touch(touchKey3, 2);
      const _this = this;
      setTimeout(() => {
        expect(wsCache.get(touchKey)).not.to.be.a("null");
        expect(wsCache.get(touchKey2)).to.be.a("null");
        expect(wsCache.get(touchKey3)).to.be.a("null");
      }, 3000);
    });
  });
  describe("#add", () => {
    it("should add item to storage ,success when the key is not exists", () => {
      const addKey = "addKey";
      const value1 = "1";
      const value2 = "2";
      wsCache.add(addKey, value1);
      expect(wsCache.get(addKey)).to.equal(value1);
      wsCache.add(addKey, value2);
      expect(wsCache.get(addKey)).to.equal(value1);
    });
    it("should add item to storage ,success when the key is expires", () => {
      const addKey = "addKey";
      const value1 = "1";
      const value2 = "2";
      wsCache.set(addKey, value1, { exp: 1 });
      const _this = this;
      setTimeout(() => {
        wsCache.add(addKey, value2);
        expect(wsCache.get(addKey)).to.equal(value2);
      }, 2000);
    });
  });
  describe("#replace", () => {
    beforeEach(() => {
      clearStorage();
    });
    it("should replace the key's data item in storage,success only when the key's data item is exists in storage.", () => {
      const replaceKey = "replaceKey";
      const value1 = "1";
      const value2 = "2";
      wsCache.replace(replaceKey, value1);
      expect(wsCache.get(replaceKey)).to.be.a("null");
      wsCache.add(replaceKey, value1);
      wsCache.replace(replaceKey, value2);
      expect(wsCache.get(replaceKey)).to.equal(value2);
    });
    it("should reflash item's expires with new options", () => {
      const replaceKey = "replaceKey";
      const value1 = "1";
      wsCache.add(replaceKey, value1);
      wsCache.replace(replaceKey, value1, { exp: 1 });
      const _this = this;
      setTimeout(() => {
        expect(wsCache.get(replaceKey)).to.be.a("null");
      }, 2000);
    });
  });
  describe("#encrypt,#encrypt", () => {
    it("should decrypted encryptStr is equal to cryptStr", () => {
      const cryptStr = "Hello World!";
      const encryptStr = wsCache.encrypt(cryptStr);
      expect(wsCache.decrypt(encryptStr)).to.equal(cryptStr);
    });
  });
});
