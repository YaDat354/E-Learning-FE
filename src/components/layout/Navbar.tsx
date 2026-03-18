function Navbar() {
  return (
    <header className="navbar" role="banner">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          EL
        </span>
        <div>
          <p className="brand-title">E-Learning FE</p>
          <p className="brand-subtitle">Design System Starter</p>
        </div>
      </div>

      <nav className="nav-links" aria-label="Main navigation">
        <a href="#">Dashboard</a>
        <a href="#">Courses</a>
        <a href="#">Analytics</a>
      </nav>
    </header>
  )
}

export default Navbar
