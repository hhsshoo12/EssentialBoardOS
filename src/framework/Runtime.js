/**
 * EssentialBoardOS - Runtime Engine
 * JSON 미니앱을 로드하고 노드 로직을 실행하는 엔진
 */

import { NODE_TYPES, getNodeDef } from './nodeTypes.js'
import { ebosFetch } from '../api'

export class MiniAppRuntime {
    constructor(app, callbacks = {}) {
        this.app = app
        this.nodes = new Map()
        this.connections = []
        this.variables = new Map()
        this.timers = []
        this.logs = []

        // Callbacks for UI updates
        this.onSetText = callbacks.onSetText || (() => { })
        this.onSetStyle = callbacks.onSetStyle || (() => { })
        this.onAlert = callbacks.onAlert || ((msg) => alert(msg))
        this.onLog = callbacks.onLog || ((msg) => console.log('[MiniApp]', msg))
        this.onGetInputValue = callbacks.onGetInputValue || (() => '')
        this.onGetVariable = callbacks.onGetVariable || (() => null)
        this.onNavigatePage = callbacks.onNavigatePage || (() => { })

        // Function system
        this.functions = new Map() // funcName -> functionDefine node id
        this._functionParams = new Map() // funcName -> { param1, param2 }
        this._functionReturnValue = null

        this._init()
    }

    _init() {
        // Index nodes
        this.app.nodes.forEach(node => {
            this.nodes.set(node.id, { ...node })
        })

        // Store connections
        this.connections = this.app.connections || []

        // Register user-defined functions
        this.app.nodes.forEach(node => {
            if (node.type === 'functionDefine') {
                const funcName = node.properties?.funcName || 'myFunction'
                this.functions.set(funcName, node.id)
            }
        })
    }

    /* ── Start the runtime ── */
    start() {
        this.logs = []
        this._log('Runtime started')

        // Fire onAppStart events
        this.app.nodes.forEach(node => {
            if (node.type === 'onAppStart') {
                this._executeFromPin(node.id, 'exec')
            }
        })

        // Register timers
        this.app.nodes.forEach(node => {
            if (node.type === 'onTimer') {
                const interval = node.properties?.interval || 1000
                const repeat = node.properties?.repeat !== false

                if (repeat) {
                    const timerId = setInterval(() => {
                        this._executeFromPin(node.id, 'exec')
                    }, interval)
                    this.timers.push(timerId)
                } else {
                    const timerId = setTimeout(() => {
                        this._executeFromPin(node.id, 'exec')
                    }, interval)
                    this.timers.push(timerId)
                }
            }
        })
    }

    /* ── Stop the runtime ── */
    stop() {
        this.timers.forEach(id => {
            clearInterval(id)
            clearTimeout(id)
        })
        this.timers = []
        this._log('Runtime stopped')
    }

    /* ── Handle UI Event ── */
    handleEvent(eventType, targetId) {
        this.app.nodes.forEach(node => {
            if (node.type === eventType && node.properties?.targetId === targetId) {
                this._executeFromPin(node.id, 'exec')
            }
        })
    }

    /* ── Execute from an output pin ── */
    async _executeFromPin(nodeId, pinId) {
        // Find all connections from this pin
        const outConnections = this.connections.filter(
            c => c.from.nodeId === nodeId && c.from.pinId === pinId
        )

        for (const conn of outConnections) {
            await this._executeNode(conn.to.nodeId, conn.to.pinId)
        }
    }

    /* ── Execute a single node ── */
    async _executeNode(nodeId, triggerPinId) {
        const node = this.nodes.get(nodeId)
        if (!node) return

        const def = getNodeDef(node.type)
        if (!def) return

        try {
            switch (node.type) {
                // ── Actions ──
                case 'setText': {
                    const value = await this._resolveInputValue(nodeId, 'value')
                    const targetId = node.properties?.targetId || ''
                    this.onSetText(targetId, String(value ?? ''))
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                case 'setStyle': {
                    const value = await this._resolveInputValue(nodeId, 'value')
                    const targetId = node.properties?.targetId || ''
                    const property = node.properties?.property || 'color'
                    this.onSetStyle(targetId, property, String(value ?? ''))
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                case 'showAlert': {
                    const message = await this._resolveInputValue(nodeId, 'message')
                    this.onAlert(String(message ?? '알림'))
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                case 'log': {
                    const message = await this._resolveInputValue(nodeId, 'message')
                    this._log(String(message ?? ''))
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                case 'setVariable': {
                    const value = await this._resolveInputValue(nodeId, 'value')
                    const varName = node.properties?.varName || 'myVar'
                    this.variables.set(varName, value)
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                // ── Logic ──
                case 'ifCondition': {
                    const condition = await this._resolveInputValue(nodeId, 'condition')
                    if (condition) {
                        await this._executeFromPin(nodeId, 'true')
                    } else {
                        await this._executeFromPin(nodeId, 'false')
                    }
                    break
                }

                case 'forLoop': {
                    const start = Number(await this._resolveInputValue(nodeId, 'start') ?? 0)
                    const end = Number(await this._resolveInputValue(nodeId, 'end') ?? 0)
                    for (let i = start; i < end; i++) {
                        node._currentIndex = i
                        await this._executeFromPin(nodeId, 'loop')
                    }
                    await this._executeFromPin(nodeId, 'done')
                    break
                }

                case 'whileLoop': {
                    const maxIter = node.properties?.maxIterations || 1000
                    let count = 0
                    while (count < maxIter) {
                        const cond = await this._resolveInputValue(nodeId, 'condition')
                        if (!cond) break
                        await this._executeFromPin(nodeId, 'loop')
                        count++
                    }
                    if (count >= maxIter) {
                        this._log(`⚠️ While 루프 최대 반복(${maxIter}) 도달`)
                    }
                    await this._executeFromPin(nodeId, 'done')
                    break
                }

                // ── List Actions ──
                case 'listAdd': {
                    const list = await this._resolveInputValue(nodeId, 'list') || []
                    const item = await this._resolveInputValue(nodeId, 'item')
                    const newList = [...(Array.isArray(list) ? list : []), item]
                    node._lastResult = newList
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                case 'listRemove': {
                    const list = await this._resolveInputValue(nodeId, 'list') || []
                    const index = Number(await this._resolveInputValue(nodeId, 'index') ?? 0)
                    const arr = Array.isArray(list) ? [...list] : []
                    if (index >= 0 && index < arr.length) arr.splice(index, 1)
                    node._lastResult = arr
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                // ── Storage ──
                case 'saveData': {
                    const value = await this._resolveInputValue(nodeId, 'value')
                    const key = `ebos-miniapp-${node.properties?.key || 'myKey'}`
                    try {
                        localStorage.setItem(key, JSON.stringify(value))
                        this._log(`💾 저장: ${key}`)
                    } catch (err) {
                        this._log(`💾 저장 실패: ${err.message}`)
                    }
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                case 'deleteData': {
                    const key = `ebos-miniapp-${node.properties?.key || 'myKey'}`
                    localStorage.removeItem(key)
                    this._log(`🗑️ 삭제: ${key}`)
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                // ── Hardware ──
                case 'getClipboard': {
                    try {
                        const text = await navigator.clipboard.readText()
                        node._lastResult = text
                        this._log(`📋 클립보드 읽기 완료`)
                    } catch {
                        node._lastResult = ''
                        this._log(`📋 클립보드 접근 실패`)
                    }
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                case 'setClipboard': {
                    const value = await this._resolveInputValue(nodeId, 'value')
                    try {
                        await navigator.clipboard.writeText(String(value ?? ''))
                        this._log(`📋 클립보드 복사 완료`)
                    } catch {
                        this._log(`📋 클립보드 쓰기 실패`)
                    }
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                case 'getLocation': {
                    try {
                        const pos = await new Promise((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
                        })
                        node._lastLat = pos.coords.latitude
                        node._lastLon = pos.coords.longitude
                        this._log(`📍 위치: ${node._lastLat.toFixed(4)}, ${node._lastLon.toFixed(4)}`)
                    } catch {
                        node._lastLat = 0
                        node._lastLon = 0
                        this._log(`📍 GPS 접근 실패`)
                    }
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                case 'getBattery': {
                    try {
                        const battery = await navigator.getBattery()
                        node._lastLevel = Math.round(battery.level * 100)
                        node._lastCharging = battery.charging
                        this._log(`🔋 배터리: ${node._lastLevel}% (${battery.charging ? '충전중' : '방전중'})`)
                    } catch {
                        node._lastLevel = 0
                        node._lastCharging = false
                        this._log(`🔋 배터리 정보 불가`)
                    }
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                case 'sendNotification': {
                    const body = await this._resolveInputValue(nodeId, 'body')
                    const title = node.properties?.title || 'EssentialBoardOS'
                    try {
                        if (Notification.permission === 'granted') {
                            new Notification(title, { body: String(body ?? '') })
                        } else if (Notification.permission !== 'denied') {
                            const perm = await Notification.requestPermission()
                            if (perm === 'granted') {
                                new Notification(title, { body: String(body ?? '') })
                            }
                        }
                        this._log(`🔔 알림 전송: ${title}`)
                    } catch {
                        this._log(`🔔 알림 실패`)
                    }
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                // ── API ──
                case 'httpRequest': {
                    const url = await this._resolveInputValue(nodeId, 'url') || node.properties?.url || ''
                    const bodyInput = await this._resolveInputValue(nodeId, 'body')
                    const method = node.properties?.method || 'GET'
                    const jsonPath = node.properties?.jsonPath || ''
                    let headers = {}
                    try { headers = JSON.parse(node.properties?.headers || '{}') } catch { }

                    this._log(`HTTP ${method} → ${url}`)

                    try {
                        const proxyBody = { url, method, headers, jsonPath }
                        if (bodyInput && method !== 'GET') {
                            try { proxyBody.body = JSON.parse(bodyInput) } catch { proxyBody.body = bodyInput }
                        }

                        const res = await ebosFetch('/api/proxy', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(proxyBody),
                        })
                        const result = await res.json()

                        // Store result in node for data output resolution
                        node._lastResult = result.data
                        node._lastStatus = result.status

                        this._log(`HTTP ${result.status} ${result.statusText || ''}`)
                        await this._executeFromPin(nodeId, 'exec')
                    } catch (err) {
                        this._log(`HTTP Error: ${err.message}`)
                        node._lastResult = null
                        node._lastStatus = 0
                        await this._executeFromPin(nodeId, 'execError')
                    }
                    break
                }

                // ── Functions ──
                case 'functionDefine': {
                    // Entry point – pass through exec
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                case 'functionReturn': {
                    const value = await this._resolveInputValue(nodeId, 'value')
                    this._functionReturnValue = value
                    // Return does NOT continue exec chain
                    break
                }

                case 'functionCall': {
                    const funcName = node.properties?.funcName || 'myFunction'
                    const funcNodeId = this.functions.get(funcName)
                    if (!funcNodeId) {
                        this._log(`❌ 함수 '${funcName}' 을 찾을 수 없습니다`)
                        break
                    }
                    // Set function parameters
                    const p1 = await this._resolveInputValue(nodeId, 'param1')
                    const p2 = await this._resolveInputValue(nodeId, 'param2')
                    this._functionParams.set(funcName, { param1: p1, param2: p2 })

                    // Execute the function body
                    this._functionReturnValue = null
                    await this._executeNode(funcNodeId)

                    // Store return value
                    node._lastResult = this._functionReturnValue
                    this._log(`🔧 함수 '${funcName}' 실행 완료`)
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                // ── Navigation ──
                case 'navigatePage': {
                    const pageId = node.properties?.pageId || 'page_0'
                    this._log(`📄 페이지 이동: ${pageId}`)
                    this.onNavigatePage(pageId)
                    await this._executeFromPin(nodeId, 'exec')
                    break
                }

                default:
                    // For nodes without exec handling, do nothing
                    break
            }
        } catch (err) {
            this._log(`Error in node ${node.type} (${nodeId}): ${err.message}`)
        }
    }

    /* ── Resolve an input pin's value ── */
    async _resolveInputValue(nodeId, pinId) {
        // Find connections going INTO this pin
        const conn = this.connections.find(
            c => c.to.nodeId === nodeId && c.to.pinId === pinId
        )

        if (!conn) return undefined

        const sourceNode = this.nodes.get(conn.from.nodeId)
        if (!sourceNode) return undefined

        return await this._evaluateNode(sourceNode, conn.from.pinId)
    }

    /* ── Evaluate a data/logic node's output value ── */
    async _evaluateNode(node, outputPinId = 'value') {
        try {
            switch (node.type) {
                case 'stringLiteral':
                    return node.properties?.value ?? ''

                case 'numberLiteral':
                    return Number(node.properties?.value ?? 0)

                case 'getVariable':
                    return this.variables.get(node.properties?.varName) ?? null

                case 'getInputValue': {
                    const targetId = node.properties?.targetId || ''
                    return this.onGetInputValue(targetId)
                }

                case 'concat': {
                    const a = (await this._resolveInputValue(node.id, 'a')) ?? ''
                    const b = (await this._resolveInputValue(node.id, 'b')) ?? ''
                    return String(a) + String(b)
                }

                case 'mathOp': {
                    const a = Number((await this._resolveInputValue(node.id, 'a')) ?? 0)
                    const b = Number((await this._resolveInputValue(node.id, 'b')) ?? 0)
                    const op = node.properties?.operator || '+'
                    switch (op) {
                        case '+': return a + b
                        case '-': return a - b
                        case '*': return a * b
                        case '/': return b !== 0 ? a / b : 0
                        default: return 0
                    }
                }

                case 'compare': {
                    const a = await this._resolveInputValue(node.id, 'a')
                    const b = await this._resolveInputValue(node.id, 'b')
                    const op = node.properties?.operator || '=='
                    switch (op) {
                        case '==': return a == b
                        case '!=': return a != b
                        case '>': return a > b
                        case '<': return a < b
                        case '>=': return a >= b
                        case '<=': return a <= b
                        default: return false
                    }
                }

                case 'not': {
                    const value = await this._resolveInputValue(node.id, 'value')
                    return !value
                }

                case 'andOr': {
                    const a = await this._resolveInputValue(node.id, 'a')
                    const b = await this._resolveInputValue(node.id, 'b')
                    const op = node.properties?.operator || 'AND'
                    return op === 'AND' ? (a && b) : (a || b)
                }

                // ── List Data ──
                case 'createList':
                    return []

                case 'listAdd':
                case 'listRemove':
                    return node._lastResult ?? []

                case 'listGet': {
                    const list = await this._resolveInputValue(node.id, 'list')
                    const index = Number(await this._resolveInputValue(node.id, 'index') ?? 0)
                    return Array.isArray(list) ? list[index] : undefined
                }

                case 'listLength': {
                    const list = await this._resolveInputValue(node.id, 'list')
                    return Array.isArray(list) ? list.length : 0
                }

                // ── Type Conversion ──
                case 'toNumber': {
                    const val = await this._resolveInputValue(node.id, 'value')
                    return Number(val) || 0
                }

                case 'toString': {
                    const val = await this._resolveInputValue(node.id, 'value')
                    return String(val ?? '')
                }

                // ── Random ──
                case 'randomNumber': {
                    const min = Number(node.properties?.min ?? 0)
                    const max = Number(node.properties?.max ?? 100)
                    const isInt = node.properties?.integer !== false
                    const rand = Math.random() * (max - min) + min
                    return isInt ? Math.floor(rand) : rand
                }

                // ── Loop index ──
                case 'forLoop':
                    return node._currentIndex ?? 0

                // ── Storage ──
                case 'loadData': {
                    const key = `ebos-miniapp-${node.properties?.key || 'myKey'}`
                    try {
                        const raw = localStorage.getItem(key)
                        return raw ? JSON.parse(raw) : null
                    } catch {
                        return null
                    }
                }

                // ── Hardware Data ──
                case 'getClipboard':
                    return node._lastResult ?? ''

                case 'getLocation':
                    if (outputPinId === 'lon') return node._lastLon ?? 0
                    return node._lastLat ?? 0

                case 'getBattery':
                    if (outputPinId === 'charging') return node._lastCharging ?? false
                    return node._lastLevel ?? 0

                case 'geminiChat': {
                    // Actually call the backend Gemini API
                    const prompt = await this._resolveInputValue(node.id, 'prompt')
                    const template = node.properties?.template || ''
                    const fullPrompt = template ? `${template}\n\n${prompt || ''}` : (prompt || '')
                    try {
                        const res = await ebosFetch('/api/gemini/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prompt: fullPrompt }),
                        })
                        const data = await res.json()
                        return data.response || '[응답 없음]'
                    } catch {
                        return '[Gemini API 연결 실패]'
                    }
                }

                case 'httpRequest':
                    if (outputPinId === 'status') return node._lastStatus ?? 0
                    return node._lastResult ?? null

                // ── Function Data ──
                case 'functionDefine': {
                    // Resolve parameter outputs
                    const funcName = node.properties?.funcName || 'myFunction'
                    const params = this._functionParams.get(funcName) || {}
                    if (outputPinId === 'param1') return params.param1 ?? null
                    if (outputPinId === 'param2') return params.param2 ?? null
                    return null
                }

                case 'functionCall':
                    return node._lastResult ?? null

                default:
                    return undefined
            }
        } catch (err) {
            this._log(`Evaluation error: ${err.message}`)
            return undefined
        }
    }

    _log(message) {
        const entry = { time: new Date().toLocaleTimeString(), message }
        this.logs.push(entry)
        this.onLog(message)
    }

    getLogs() {
        return [...this.logs]
    }
}
