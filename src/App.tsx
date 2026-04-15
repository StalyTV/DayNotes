import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import DayDetail from './pages/DayDetail';
import CategoryList from './pages/CategoryList';
import ChildrenManager from './pages/ChildrenManager';
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
            element={<CategoryList category="todo" title="ToDo's" />}
          />
          <Route
            path="/ideas"
            element={<CategoryList category="idea" title="Ideas" />}
          />
          <Route
            path="/observations"
            element={
              <CategoryList category="observation" title="Observations" />
            }
          />
          <Route
            path="/talks"
            element={<CategoryList category="talk" title="Talks" />}
          />
          <Route path="/children" element={<ChildrenManager />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
