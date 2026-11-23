FROM node:24-bookworm-slim
WORKDIR /opt/runner
RUN npm init -y && npm install --save-exact playwright@1.64.1 fflate@0.8.3 && npx playwright install --with-deps chromium && chmod -R a+rX /root/.cache && mv /root/.cache/ms-playwright /opt/browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/browsers HOME=/tmp
COPY acceptance-runner.mjs container-entry.mjs ./
USER 1000:1000
ENTRYPOINT ["node", "/opt/runner/container-entry.mjs"]
