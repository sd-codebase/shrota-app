import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { playbackService } from './src/services/trackPlayerService';
import { setupBackgroundMessageHandler } from './src/services/notifications';

// Register the app
registerRootComponent(App);

// Register the playback service for background playback
TrackPlayer.registerPlaybackService(() => playbackService);

// Register the background message handler for FCM
setupBackgroundMessageHandler();
