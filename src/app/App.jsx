import { AppErrorBoundary } from './AppErrorBoundary.jsx';
import { AppProviders } from './providers.jsx';

export function App() {
  return (
    <AppErrorBoundary>
      <AppProviders />
    </AppErrorBoundary>
  );
}
