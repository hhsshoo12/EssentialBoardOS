/**
 * EssentialBoardOS - Mini App JSON Schema & Serialization
 * 미니앱 JSON 직렬화/역직렬화
 */

/* ── UI Component Types ── */
export const UI_COMPONENT_TYPES = {
    button: {
        type: 'button',
        label: '버튼',
        icon: '🔲',
        defaultProps: { text: '버튼' },
        defaultStyle: {
            width: 120,
            height: 40,
            backgroundColor: '#7c6ff7',
            color: '#ffffff',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
        },
    },
    text: {
        type: 'text',
        label: '텍스트',
        icon: '📝',
        defaultProps: { text: '텍스트' },
        defaultStyle: {
            width: 200,
            height: 30,
            color: '#e8e6f0',
            fontSize: 16,
            fontWeight: '400',
        },
    },
    input: {
        type: 'input',
        label: '입력창',
        icon: '✏️',
        defaultProps: { placeholder: '입력하세요...', value: '' },
        defaultStyle: {
            width: 200,
            height: 36,
            backgroundColor: '#252536',
            color: '#e8e6f0',
            borderRadius: 8,
            fontSize: 14,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0 10px',
        },
    },
    image: {
        type: 'image',
        label: '이미지',
        icon: '🖼️',
        defaultProps: { src: '', alt: '이미지' },
        defaultStyle: {
            width: 150,
            height: 150,
            borderRadius: 8,
            objectFit: 'cover',
        },
    },
    container: {
        type: 'container',
        label: '컨테이너',
        icon: '📦',
        defaultProps: {},
        defaultStyle: {
            width: 200,
            height: 150,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
        },
    },
}

/* ── Create UI Component Instance ── */
let uiIdCounter = 0
export function createUIComponent(type, x = 50, y = 50) {
    const def = UI_COMPONENT_TYPES[type]
    if (!def) return null

    return {
        id: `ui_${Date.now()}_${uiIdCounter++}`,
        type: def.type,
        props: { ...def.defaultProps },
        style: { ...def.defaultStyle },
        x,
        y,
    }
}

/* ── Empty Mini App ── */
export function createEmptyApp(name = '새 미니앱') {
    return {
        id: `app_${Date.now()}`,
        name,
        version: '1.0',
        displayMode: 'fullscreen', // 'fullscreen' | 'floating'
        floatingSize: { width: 400, height: 300 }, // resizable floating window size
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canvas: {
            width: 400,
            height: 300,
            backgroundColor: '#2d2d3f',
        },
        pages: [
            { id: 'page_0', name: '메인 페이지' },
        ],
        uiComponents: [], // each component has optional pageId ('page_0' default)
        nodes: [],
        connections: [],
        layers: [
            { id: 'default', name: '기본 레이어', visible: true },
        ],
    }
}

/* ── Serialize / Deserialize ── */
export function serializeApp(app) {
    return JSON.stringify(app, null, 2)
}

export function deserializeApp(json) {
    try {
        const app = JSON.parse(json)
        if (!app.name || !app.uiComponents || !app.nodes || !app.connections) {
            throw new Error('Invalid app format')
        }
        // Ensure displayMode exists for older apps
        if (!app.displayMode) app.displayMode = 'fullscreen'
        return app
    } catch (e) {
        console.error('Failed to deserialize app:', e)
        return null
    }
}

/* ── App Storage ── */
const APPS_KEY = 'ebos-miniapps'

export function getSavedApps() {
    try {
        return JSON.parse(localStorage.getItem(APPS_KEY)) || []
    } catch { return [] }
}

export function saveApp(app) {
    app.updatedAt = new Date().toISOString()
    const apps = getSavedApps()
    const idx = apps.findIndex(a => a.id === app.id)
    if (idx !== -1) {
        apps[idx] = app
    } else {
        apps.push(app)
    }
    localStorage.setItem(APPS_KEY, JSON.stringify(apps))
    return app
}

export function deleteApp(appId) {
    const apps = getSavedApps().filter(a => a.id !== appId)
    localStorage.setItem(APPS_KEY, JSON.stringify(apps))
}

export function loadApp(appId) {
    const apps = getSavedApps()
    return apps.find(a => a.id === appId) || null
}
