import { useState, useCallback } from 'react'
import {
    MdArrowBack,
    MdArrowForward,
    MdRefresh,
    MdHome,
    MdClose,
    MdAdd,
    MdPublic,
    MdSearch,
    MdErrorOutline,
    MdOpenInNew,
} from 'react-icons/md'
import './MiniBrowser.css'

const SHORTCUTS = [
    { label: 'Google', url: 'https://www.google.com', emoji: '🔍' },
    { label: 'YouTube', url: 'https://www.youtube.com', emoji: '▶️' },
    { label: 'GitHub', url: 'https://github.com', emoji: '🐙' },
    { label: 'Wikipedia', url: 'https://ko.wikipedia.org', emoji: '📖' },
    { label: 'Naver', url: 'https://www.naver.com', emoji: '🟢' },
    { label: 'MDN', url: 'https://developer.mozilla.org', emoji: '📘' },
]

function createTab(url = '') {
    return {
        id: Date.now() + Math.random(),
        url,
        title: url ? new URL(url).hostname : '새 탭',
        loading: false,
        error: false,
    }
}

function MiniBrowser() {
    const [tabs, setTabs] = useState([createTab()])
    const [activeTabId, setActiveTabId] = useState(tabs[0].id)
    const [urlInput, setUrlInput] = useState('')
    const [browserHistory, setBrowserHistory] = useState([])
    const [historyIndex, setHistoryIndex] = useState(-1)

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

    /* ── URL Handling ── */
    const normalizeUrl = (input) => {
        let url = input.trim()
        if (!url) return ''
        // Search query
        if (!url.includes('.') || url.includes(' ')) {
            return `https://www.google.com/search?igu=1&q=${encodeURIComponent(url)}`
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url
        }
        return url
    }

    const navigate = useCallback((url) => {
        const normalized = normalizeUrl(url)
        if (!normalized) return

        setTabs(prev => prev.map(t =>
            t.id === activeTabId
                ? { ...t, url: normalized, title: extractTitle(normalized), loading: true, error: false }
                : t
        ))
        setUrlInput(normalized)

        // Update history
        const newHistory = browserHistory.slice(0, historyIndex + 1)
        newHistory.push(normalized)
        setBrowserHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
    }, [activeTabId, browserHistory, historyIndex])

    const extractTitle = (url) => {
        try { return new URL(url).hostname.replace('www.', '') }
        catch { return url.slice(0, 30) }
    }

    const handleUrlSubmit = useCallback((e) => {
        e.preventDefault()
        navigate(urlInput)
    }, [urlInput, navigate])

    const handleIframeLoad = useCallback(() => {
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, loading: false } : t
        ))
    }, [activeTabId])

    const handleIframeError = useCallback(() => {
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, loading: false, error: true } : t
        ))
    }, [activeTabId])

    /* ── Navigation ── */
    const goBack = useCallback(() => {
        if (historyIndex <= 0) return
        const newIdx = historyIndex - 1
        setHistoryIndex(newIdx)
        const url = browserHistory[newIdx]
        setTabs(prev => prev.map(t =>
            t.id === activeTabId
                ? { ...t, url, title: extractTitle(url), loading: true, error: false }
                : t
        ))
        setUrlInput(url)
    }, [historyIndex, browserHistory, activeTabId])

    const goForward = useCallback(() => {
        if (historyIndex >= browserHistory.length - 1) return
        const newIdx = historyIndex + 1
        setHistoryIndex(newIdx)
        const url = browserHistory[newIdx]
        setTabs(prev => prev.map(t =>
            t.id === activeTabId
                ? { ...t, url, title: extractTitle(url), loading: true, error: false }
                : t
        ))
        setUrlInput(url)
    }, [historyIndex, browserHistory, activeTabId])

    const goHome = useCallback(() => {
        setTabs(prev => prev.map(t =>
            t.id === activeTabId
                ? { ...t, url: '', title: '새 탭', loading: false, error: false }
                : t
        ))
        setUrlInput('')
    }, [activeTabId])

    const refresh = useCallback(() => {
        if (!activeTab.url) return
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, loading: true, error: false } : t
        ))
        // Force iframe reload by briefly clearing URL
        const url = activeTab.url
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, url: '' } : t
        ))
        setTimeout(() => {
            setTabs(prev => prev.map(t =>
                t.id === activeTabId ? { ...t, url, loading: true } : t
            ))
        }, 50)
    }, [activeTab, activeTabId])

    /* ── Tabs ── */
    const addTab = useCallback(() => {
        const newTab = createTab()
        setTabs(prev => [...prev, newTab])
        setActiveTabId(newTab.id)
        setUrlInput('')
    }, [])

    const closeTab = useCallback((e, tabId) => {
        e.stopPropagation()
        setTabs(prev => {
            if (prev.length <= 1) return [createTab()]
            const filtered = prev.filter(t => t.id !== tabId)
            if (activeTabId === tabId) {
                setActiveTabId(filtered[filtered.length - 1].id)
                setUrlInput(filtered[filtered.length - 1].url)
            }
            return filtered
        })
    }, [activeTabId])

    const switchTab = useCallback((tabId) => {
        setActiveTabId(tabId)
        const tab = tabs.find(t => t.id === tabId)
        setUrlInput(tab?.url || '')
    }, [tabs])

    return (
        <div className="mini-browser">
            {/* Tabs */}
            <div className="mb-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`mb-tab ${tab.id === activeTabId ? 'active' : ''}`}
                        onClick={() => switchTab(tab.id)}
                    >
                        <MdPublic size={12} />
                        <span>{tab.title}</span>
                        <span className="mb-tab-close" onClick={(e) => closeTab(e, tab.id)}>
                            <MdClose />
                        </span>
                    </button>
                ))}
                <button className="mb-new-tab" onClick={addTab}>
                    <MdAdd />
                </button>
            </div>

            {/* Address Bar */}
            <div className="mb-address-bar">
                <div className="mb-nav-btns">
                    <button className="mb-nav-btn" onClick={goBack} disabled={historyIndex <= 0}>
                        <MdArrowBack />
                    </button>
                    <button className="mb-nav-btn" onClick={goForward} disabled={historyIndex >= browserHistory.length - 1}>
                        <MdArrowForward />
                    </button>
                    <button className="mb-nav-btn" onClick={refresh}>
                        <MdRefresh />
                    </button>
                    <button className="mb-nav-btn" onClick={goHome}>
                        <MdHome />
                    </button>
                </div>
                <form onSubmit={handleUrlSubmit} style={{ flex: 1, display: 'flex', gap: 8 }}>
                    <input
                        className="mb-url-input"
                        type="text"
                        placeholder="URL을 입력하거나 검색하세요"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <button
                        type="button"
                        className="mb-new-window-btn"
                        onClick={() => activeTab.url && window.open(activeTab.url, '_blank')}
                        disabled={!activeTab.url}
                        title="새 창에서 열기"
                    >
                        <MdOpenInNew />
                    </button>
                    <button type="submit" className="mb-go-btn">이동</button>
                </form>
            </div>

            {/* Content */}
            <div className="mb-content">
                {activeTab.loading && (
                    <div className="mb-loading">
                        <div className="mb-loading-bar" />
                    </div>
                )}

                {!activeTab.url ? (
                    /* Home Page */
                    <div className="mb-home">
                        <div className="mb-home-logo">미니브라우저</div>
                        <form className="mb-home-search" onSubmit={handleUrlSubmit}>
                            <input
                                type="text"
                                placeholder="검색 또는 URL 입력..."
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                            />
                        </form>
                        <div className="mb-shortcuts">
                            {SHORTCUTS.map(s => (
                                <div key={s.label} className="mb-shortcut" onClick={() => navigate(s.url)}>
                                    <div className="mb-shortcut-icon">{s.emoji}</div>
                                    <span className="mb-shortcut-label">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : activeTab.error ? (
                    /* Error Page */
                    <div className="mb-error">
                        <MdErrorOutline className="mb-error-icon" />
                        <h3>페이지를 표시할 수 없습니다</h3>
                        <p>
                            이 웹사이트는 iframe 내에서의 로딩을 차단하고 있습니다.
                            일부 사이트는 보안 정책(X-Frame-Options)으로 인해 미니브라우저에서
                            표시되지 않을 수 있습니다.
                        </p>
                        <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                            💡 주소창의 📂 버튼을 눌러 새 창에서 여세요.
                        </p>
                    </div>
                ) : (
                    /* iframe */
                    <iframe
                        className="mb-iframe"
                        src={activeTab.url}
                        title="browser"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                    />
                )}
            </div>
        </div>
    )
}

export default MiniBrowser
