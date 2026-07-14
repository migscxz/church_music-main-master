import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Songs from './pages/Songs';
import SongDetails from './pages/SongDetails';
import SongLeaders from './pages/SongLeaders';
import Setlists from './pages/Setlists';
import Tags from './pages/Tags';
import Schedule from './pages/Schedule';
import Users from './pages/Users';
import PitchDetector from './pages/PitchDetector';
import Preloader from './components/Preloader';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Preloader text="Authenticating..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="songs" element={<Songs />} />
            <Route path="songs/:id" element={<SongDetails />} />
            <Route path="leaders" element={<SongLeaders />} />
            <Route path="setlists" element={<Setlists />} />
            <Route path="tags" element={<Tags />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="pitch" element={<PitchDetector />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
