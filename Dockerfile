FROM node:10.15-alpine
MAINTAINER Duc Thanh Nguyen (ng.duc.tahn@gmail.com)

# Set environment
ENV NODE_ENV development

# Select Working Directory
WORKDIR /uwcourseapi

# Copy the app folder to the Working Directory
ADD . /uwcourseapi

RUN apk add --update \
    python \
    python-dev \
    py-pip \
    build-base \
  && pip install virtualenv \
  && rm -rf /var/cache/apk/*

# Install all node packages
RUN npm i

# Expose port 5000
EXPOSE 5000

# Start the API
CMD ["node", "server.js"]
