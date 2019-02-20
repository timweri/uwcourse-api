FROM node:10.15-alpine
MAINTAINER Duc Thanh Nguyen (ng.duc.tahn@gmail.com)

# Set environment
ENV NODE_ENV development

# Select Working Directory
WORKDIR /uwcourseapi

# Copy the app folder to the Working Directory
ADD . /uwcourseapi

# Install all node packages
RUN npm i

# Start the API
CMD ["node", "server.js"]
