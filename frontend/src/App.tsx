import Router from 'preact-router';
import Home from './pages/Home';
import Room from './pages/Room';

export default function App() {
  return (
    <Router>
      <Home path="/" />
      <Room path="/rooms/:name" />
    </Router>
  );
}
