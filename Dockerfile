FROM nginx:alpine

# 由 Compose 传入 MED_TIMELINE_VERSION。单独执行 docker build 且不带 --build-arg 时使用下面的默认值。
ARG VERSION=1.2.0

LABEL org.opencontainers.image.title="med-timeline" \
      org.opencontainers.image.description="中西医发展对照时间轴" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/corallibra/med-timeline" \
      org.opencontainers.image.version="${VERSION}"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY data/ /usr/share/nginx/html/data/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
