import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import DayDetail from './pages/DayDetail';
import CategoryList from './pages/CategoryList';
import ChildrenManager from './pages/ChildrenManager';
import ChildDetail from './pages/ChildDetail';
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<CalendarView />} />
          <Route path="/day/:date" element={<DayDetail />} />
          <Route
            path="/todos"
            element={<CategoryList category="todo" title="Aufgaben" />}
          />
          <Route
            path="/ideas"
            element={<CategoryList category="idea" title="Ideen" />}
          />
          <Route
            path="/observations"
            element={
              <CategoryList category="observation" title="Beobachtungen" />
            }
          />
          <Route
            path="/talks"
            element={<CategoryList category="talk" title="Gespräche" />}
          />
          <Route path="/children" element={<ChildrenManager />} />
          <Route path="/children/:name" element={<ChildDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
