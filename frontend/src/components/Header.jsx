import { NavLink } from 'react-router-dom'

export default function Header() {
  return <header className="app-header"><strong>EVMS</strong><nav>
    <NavLink to="/weak-vocabulary">Từ yếu</NavLink>
    <NavLink to="/weak-vocabulary/practice">Ôn luyện</NavLink>
  </nav></header>
}
