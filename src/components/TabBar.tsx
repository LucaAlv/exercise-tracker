type Tab = 'library' | 'categories'

type TabBarProps = {
  active: Tab
  onSelect: (tab: Tab) => void
}

export function TabBar({ active, onSelect }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label="Main">
      <button
        className={active === 'library' ? 'is-active' : undefined}
        type="button"
        onClick={() => onSelect('library')}
        aria-current={active === 'library' ? 'page' : undefined}
      >
        <span aria-hidden="true">≡</span>
        Exercises
      </button>
      <button
        className={active === 'categories' ? 'is-active' : undefined}
        type="button"
        onClick={() => onSelect('categories')}
        aria-current={active === 'categories' ? 'page' : undefined}
      >
        <span aria-hidden="true">▦</span>
        Categories
      </button>
    </nav>
  )
}
