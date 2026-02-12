import {
    MdDashboard,
    MdEditNote,
    MdCalendarMonth,
    MdCalculate,
    MdLanguage,
    MdStickyNote2,
    MdSmartToy,
    MdApps,
    MdTimeline,
    MdEvent,
} from 'react-icons/md'
import { HiPaintBrush } from 'react-icons/hi2'
import './ProgramBar.css'

function ProgramBar({ activeApp, calcOpen, userApps, allApps, onAppOpen, onAddQuickNote }) {
    return (
        <nav className="programbar">
            <div className="programbar-logo">EB</div>
            <div className="programbar-divider" />

            {userApps.map(appId => {
                const app = allApps.find(a => a.id === appId)
                if (!app) return null
                return (
                    <button
                        key={app.id}
                        className={`programbar-btn ${app.id === 'calculator' ? (calcOpen ? 'active' : '') : (activeApp === app.id ? 'active' : '')}`}
                        onClick={() => onAppOpen(app.id)}
                        title={app.label}
                    >
                        <app.icon />
                        <span className="tooltip">{app.label}</span>
                    </button>
                )
            })}

            <div className="programbar-divider" />

            <button
                className="programbar-btn"
                onClick={onAddQuickNote}
            >
                <MdStickyNote2 />
                <span className="tooltip">퀵노트</span>
            </button>

            <div className="programbar-spacer" />

            <button
                className={`programbar-btn ${activeApp === 'apps' ? 'active' : ''}`}
                onClick={() => onAppOpen('apps')}
            >
                <MdApps />
                <span className="tooltip">앱스</span>
            </button>

            <button className="programbar-btn" style={{ opacity: 0.35, cursor: 'not-allowed' }}>
                <MdSmartToy />
                <span className="tooltip">제미나이 챗 (Phase 4)</span>
            </button>
        </nav>
    )
}

export default ProgramBar
