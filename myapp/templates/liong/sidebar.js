class CustomSidebar extends HTMLElement {
  connectedCallback() {
    const currentFile = (window.location.pathname.split('/').pop() || 'overview.html').toLowerCase();

    const menu = [
      { href: 'overview.html', label: 'Overview', icon: 'home' },
      { href: 'employees.html', label: 'Employee Management', icon: 'users' },
      { href: 'requests.html', label: 'Requests', icon: 'file-text' }
    ];

    const makeIconSvg = (name) => {
      try {
        if (window.feather && window.feather.icons && window.feather.icons[name]) {
          return window.feather.icons[name].toSvg({ class: 'icon' });
        }
      } catch (e) {}
      return `<i data-feather="${name}" class="icon"></i>`;
    };

    const itemsHtml = menu.map(item => {
      const itemFile = item.href.split('/').pop().toLowerCase();
      const isActive = itemFile === currentFile;
      return `
        <li>
          <a href="${item.href}" class="menu-item ${isActive ? 'active' : ''}" aria-current="${isActive ? 'page' : 'false'}">
            ${makeIconSvg(item.icon)}
            <span class="label">${item.label}</span>
          </a>
        </li>
      `;
    }).join('');

    this.innerHTML = `
      <style>
        :root{
          --sidebar-bg: #4c1d95;       /* deep purple */
          --sidebar-bg-dark: #37106a;  /* darker purple for depth */
          --accent: #7c3aed;           /* accent violet */
          --gold: #FBBF24;             /* gold accent for hover */
          --text-on-purple: rgba(255,255,255,0.98);
          --sidebar-border: rgba(255,255,255,0.04);
        }

        .custom-sidebar{
          width: 250px;
          padding: 1rem;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          border-right: 1px solid var(--sidebar-border);
          z-index: 40;
          box-sizing: border-box;

          /* solid purple with subtle depth */
          background: linear-gradient(180deg, var(--sidebar-bg) 0%, var(--sidebar-bg-dark) 100%);
          color: var(--text-on-purple);
          background-attachment: fixed;
        }

        @media (prefers-reduced-motion: reduce) {
          .custom-sidebar { transition: none; }
        }

        .custom-sidebar .department-head {
          padding: 1rem 0;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .custom-sidebar .department-head h3 {
          font-weight: 600;
          margin: 0;
          font-size: 1rem;
          color: var(--text-on-purple);
        }
        .custom-sidebar .department-head p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.85);
          margin: 0.25rem 0 0 0;
        }

        .custom-sidebar .nav-links { list-style: none; padding: 0; margin: 1rem 0 0 0; display:block; }
        .custom-sidebar .nav-links li { margin-bottom: 0.25rem; }

        .custom-sidebar .menu-item{
          display:flex;
          align-items:center;
          gap:0.75rem;
          padding:0.6rem 0.8rem;
          color: var(--text-on-purple);
          text-decoration:none;
          border-radius:0.375rem;
          transition: background 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s;
          border-left: 3px solid transparent;
        }
        /* Hover: use gold accent (icon, label and left border) */
        .custom-sidebar .menu-item:hover{
          background-color: rgba(255,255,255,0.04);
          color: var(--gold);
          border-left-color: var(--gold);
          box-shadow: inset 0 0 0 9999px rgba(251,191,36,0.03);
        }
        .custom-sidebar .menu-item:hover .icon,
        .custom-sidebar .menu-item:hover .label{
          color: var(--gold);
        }

        /* Active keeps violet accent, remains visually distinct from hover */
        .custom-sidebar .menu-item.active{
          background-color: rgba(255,255,255,0.06);
          color: var(--text-on-purple);
          font-weight:600;
          border-left-color: var(--accent);
        }
        .custom-sidebar .icon{ width:18px; height:18px; flex-shrink:0; stroke: currentColor; color: inherit; }
        .custom-sidebar .label{ font-size:0.95rem; color: inherit; }

        @media (max-width: 768px) {
          .custom-sidebar { transform: translateX(-100%); position: fixed; transition: transform .25s ease; }
          .custom-sidebar.open { transform: translateX(0); }
        }
      </style>

      <aside class="custom-sidebar" role="navigation" aria-label="Main sidebar">
        <div class="department-head">
          <h3>Department Head</h3>
          <p>Inventory Management</p>
        </div>
        <ul class="nav-links">
          ${itemsHtml}
        </ul>
      </aside>
    `;

    const tryReplace = () => {
      if (window.feather && typeof window.feather.replace === 'function') {
        window.feather.replace();
      }
    };
    tryReplace();
    setTimeout(tryReplace, 50);
    setTimeout(tryReplace, 250);
  }
}

customElements.define('custom-sidebar', CustomSidebar);
