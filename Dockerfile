# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package json and lock files
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Bundle app source
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define environment variable
ENV PORT 3000

# Run server.js when the container launches
CMD ["node", "server.js"]
