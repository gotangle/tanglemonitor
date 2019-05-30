FROM node:11-alpine
LABEL maintainer="unio <info@tangleview.io>"
WORKDIR /root/

# Copy backend folder into docker image
COPY . .

WORKDIR /root/backend/

RUN apk update && apk add --no-cache --virtual .build-deps \
  build-base \
  gcc \
  libunwind-dev \
  python2 \
  # Install tanglemonitor modules
  && npm install --no-optional --only=prod \
  # Install pm2
  && npm install pm2 -g \
  # Clean up
  && apk del .build-deps

# Expose ports needed to use Keymetrics.io
EXPOSE 80 443 4433 4434 43554

# Start pm2.json process file
ENTRYPOINT ["pm2-runtime", "start", "pm2.json"]

# sudo docker build --rm -t tanglemonitor -f Dockerfile .
# sudo docker run -p 4000:4000 -v `pwd`/backend/config:/root/backend/config tanglemonitor
