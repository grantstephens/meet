import { render } from 'preact';
import App from './App';
import './styles/globals.css';
import '@livekit/components-styles';

render(<App />, document.getElementById('app')!);
