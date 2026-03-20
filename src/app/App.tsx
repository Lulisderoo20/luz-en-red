import { AppProvider } from '@/app/AppContext';
import { AppRouter } from '@/app/AppRouter';

export function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
