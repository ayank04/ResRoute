import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { expect, test } from 'vitest';

test('Sidebar renders successfully', () => {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  );
  
  // Check for the main logo text
  expect(screen.getByText('ResRoute')).toBeInTheDocument();
  
  // Check for some navigation links
  expect(screen.getByText('Live Dashboard')).toBeInTheDocument();
  expect(screen.getByText('AI Decisions')).toBeInTheDocument();
  
  // Check for system status
  expect(screen.getByText('System Online')).toBeInTheDocument();
});
