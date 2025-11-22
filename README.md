# Track Arcade

Track Arcade is a simple game that users can play on their spotify playlists. The game challenges the users to guess if the current song was released before or after the previous song.

## Features

- Connects to your Spotify.
- Load any playlist by its URI.
- Guess if the next song was released before or after the current song.
- Keep track of your score.

## Requirements

- Node.js
- npm
- [A Spotify Developer Application](https://developer.spotify.com/documentation/web-api/tutorials/getting-started)

## Setup

### 1. Clone the repository:

```bash
git clone git@github.com:twanman1412/track-arcade.git
```

### 2. Navigate to the project directory:

```bash
cd track-arcade
```

### 3. Install the dependencies:

```bash
npm Install
```

### 4. Create a `.env` file in the root directory and add your Spotify API credentials:

```
cp .env.dist .env
```

Then, edit the `.env` file to include your `SPOTIFY_CLIENT_ID`

## Running the Application

To run the application using local files for development, use the following command:
```bash
npm start
```

## Building for Production

To build the application for production, use the following command:
```bash
npm run package
```

This will create a distributable package in the `out` folder.
**!!NOTE**: This package will include your Spotify API credentials from the .env file. Be cautious when sharing this package.

