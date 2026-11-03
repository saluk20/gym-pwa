import { useState } from 'react';
import Nav from './components/Nav.jsx';
import Home from './screens/Home.jsx';
import Workouts from './screens/Workouts.jsx';
import Stats from './screens/Stats.jsx';
import Profile from './screens/Profile.jsx';
import Workout from './screens/Workout.jsx';

export default function App() {
  const [tab, setTab] = useState('home');
  const [workoutDay, setWorkoutDay] = useState(null);
  const screens = { home: Home, workouts: Workouts, stats: Stats, profile: Profile };
  const Screen = screens[tab];
  return (
    <div className="mx-auto min-h-full max-w-[430px]">
      <Screen go={setTab} openWorkout={setWorkoutDay} />
      {!workoutDay && <Nav tab={tab} onTab={setTab} />}
      {workoutDay && <Workout dayId={workoutDay} onClose={() => setWorkoutDay(null)} />}
    </div>
  );
}
