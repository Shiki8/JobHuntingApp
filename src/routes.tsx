import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import JobList from './pages/JobList';
import JobForm from './pages/JobForm';
import JobDetail from './pages/JobDetail';
import CriteriaSettings from './pages/CriteriaSettings';
import Compare from './pages/Compare';
import Settings from './pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true,            element: <JobList /> },
      { path: 'jobs/new',       element: <JobForm /> },
      { path: 'jobs/:id',       element: <JobDetail /> },
      { path: 'jobs/:id/edit',  element: <JobForm /> },
      { path: 'criteria',       element: <CriteriaSettings /> },
      { path: 'compare',        element: <Compare /> },
      { path: 'settings',       element: <Settings /> },
    ],
  },
]);
