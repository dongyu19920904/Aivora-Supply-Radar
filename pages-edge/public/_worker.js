const edge = {
  async fetch(request, env) {
    if (!env.RADAR_SERVICE || typeof env.RADAR_SERVICE.fetch !== "function") {
      return new Response("Supply Radar upstream is unavailable", {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    return env.RADAR_SERVICE.fetch(request);
  },
};

export default edge;
