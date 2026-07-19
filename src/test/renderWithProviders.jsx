import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../shared/components/ToastContext.jsx';

export function renderWithProviders(ui, {
  route = '/',
  path = route,
  additionalRoutes = [],
} = {}) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
          {additionalRoutes.map(({ path: additionalPath, element }) => (
            <Route path={additionalPath} element={element} key={additionalPath} />
          ))}
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}
