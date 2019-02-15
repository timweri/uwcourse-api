FROM python:3-alpine
MAINTAINER Duc Thanh Nguyen (ng.duc.tahn@gmail.com)

# Select Working Directory
WORKDIR /uwcourse-api

# Copy the app folder to the Working Directory
ADD . /uwcourse-api

# Install pipenv
RUN pip install pipenv

# Install all dependencies in Pipfile
RUN pipenv install

# Choose a port
EXPOSE 5000

# Start the Server
CMD ["pipenv", "run", "python", "src/server.py"]
