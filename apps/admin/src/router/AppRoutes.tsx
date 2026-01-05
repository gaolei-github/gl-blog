import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from '../pages/home/HomePage'
import LoginPage from '../pages/login/LoginPage'
import PostsPage from '../pages/posts/PostsPage'
import TagsPage from '../pages/tags/TagsPage'
import { hasAuthToken } from '../utils/auth'

type RequireAuthProps = {
  children: ReactElement
}

function RequireAuth({ children }: RequireAuthProps) {
  if (!hasAuthToken()) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  const isAuthed = hasAuthToken()

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={isAuthed ? '/home' : '/login'} replace />
        }
      />
      <Route
        path="/login"
        element={
          isAuthed ? <Navigate to="/home" replace /> : <LoginPage />
        }
      />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/posts"
        element={
          <RequireAuth>
            <PostsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/tags"
        element={
          <RequireAuth>
            <TagsPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
