import { useState } from 'react';
import Nav from './components/Nav.jsx';
import Home from './screens/Home.jsx';
import Plan from './screens/Plan.jsx';
import Routines from './screens/Routines.jsx';
import Stats from './screens/Stats.jsx';
import Profile from './screens/Profile.jsx';
import Workout from './screens/Workout.jsx';
import { useStore, activeSession } from './lib/store.js';
import { nextDay } from './lib/program.js';

export default function App() {
  const st = useStore();
  const [tab, setTab] = useState('home');
  const [workoutDay, setWorkoutDay] = useState(null);
  const screens = { home: Home, plan: Plan, routines: Routines, stats: Stats, profile: Profile };
  const Screen = screens[tab];
  const open = activeSession(st);
  const start = () => setWorkoutDay(open ? open.dayId : nextDay(st).id);
  return (
    <div className="mx-auto min-h-full max-w-[430px]">
      <Screen go={setTab} openWorkout={setWorkoutDay} />
      {!workoutDay && <Nav tab={tab} onTab={setTab} onStart={start} resume={!!open} />}
      {workoutDay && <Workout dayId={workoutDay} onClose={() => setWorkoutDay(null)} />}
    </div>
  );
}
