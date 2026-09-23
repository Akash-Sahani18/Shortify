const { createClient } = require("redis");

const redisUrl =
  process.env.REDIS_URL ||
  "redis://127.0.0.1:6379";

const redis = createClient({
  url: redisUrl,

  socket: {
    reconnectStrategy(retries) {
      const delay = Math.min(
        retries * 500,
        5000
      );

      console.log(
        `Redis reconnect attempt ${retries} in ${delay}ms`
      );

      return delay;
    },
  },
});

redis.on("connect", () => {
  console.log("Redis connecting...");
});

redis.on("ready", () => {
  console.log("Redis ready");
});

redis.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

redis.on("end", () => {
  console.log("Redis connection closed");
});

redis.on("error", (error) => {
  console.error(
    "Redis error:",
    error.message
  );
});

let initialized = false;
let initializationPromise = null;

async function initRedis() {
  if (redis.isReady) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  if (initialized && !redis.isOpen) {
    initialized = false;
  }

  if (redis.isOpen) {
    return;
  }

  initialized = true;

  initializationPromise = (async () => {
    try {
      await redis.connect();

      console.log("Redis Connected");
    } catch (error) {
      initialized = false;

      console.error(
        "Redis connection failed:",
        error.message
      );

      throw error;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

module.exports = {
  redis,
  initRedis,
};